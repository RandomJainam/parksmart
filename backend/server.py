from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-this-in-production-12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Security
security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============= Authentication Models =============
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    email: EmailStr
    name: str
    phone: Optional[str] = None
    vehiclePlate: Optional[str] = None
    createdAt: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    vehiclePlate: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# ============= Auth Helper Functions =============
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

# ============= Parking Models =============

class ParkingSite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    latitude: float
    longitude: float
    address: str
    totalSlots: int
    availableSlots: int
    bookedSlots: int
    hourlyRate: int
    amenities: List[str]
    createdAt: str

class ParkingSlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    parkingId: str
    slotId: str
    occupied: bool
    updatedAt: str

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    parkingId: str
    parkingName: str
    slotId: str
    duration: int
    pricePerHour: int
    totalPrice: int
    bookingTime: str
    status: str
    address: str
    bookingType: Optional[str] = "now"
    scheduledTime: Optional[str] = None

class BookingCreate(BaseModel):
    parkingId: str
    parkingName: str
    slotId: str
    duration: int
    pricePerHour: int
    totalPrice: int
    status: str
    address: str
    bookingType: Optional[str] = "now"
    scheduledTime: Optional[str] = None

@api_router.get("/")
async def root():
    return {"message": "ParkSmart API"}

# ============= Authentication Endpoints =============
@api_router.post("/auth/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user.password)
    
    user_data = {
        "id": user_id,
        "email": user.email,
        "password": hashed_password,
        "name": user.name,
        "phone": user.phone,
        "vehiclePlate": user.vehiclePlate,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_data)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    # Return token and user info (without password)
    user_data.pop("password")
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(**user_data)
    )

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    # Return token and user info (without password)
    user.pop("password")
    user.pop("_id")
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=User(**user)
    )

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/profile", response_model=User)
async def update_profile(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    vehiclePlate: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    update_data = {}
    if name: update_data["name"] = name
    if phone: update_data["phone"] = phone
    if vehiclePlate: update_data["vehiclePlate"] = vehiclePlate
    
    if update_data:
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password": 0})
    return User(**updated_user)

# ============= Parking Endpoints =============

@api_router.get("/parking-sites", response_model=List[ParkingSite])
async def get_parking_sites():
    sites = await db.parkingSites.find({}, {"_id": 0}).to_list(1000)
    return sites

@api_router.get("/parking-slots/{parking_id}", response_model=List[ParkingSlot])
async def get_parking_slots(parking_id: str):
    slots = await db.parkingSlots.find({"parkingId": parking_id}, {"_id": 0}).to_list(1000)
    return slots

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking: BookingCreate):
    booking_id = str(uuid.uuid4())
    booking_data = {
        "id": booking_id,
        **booking.model_dump(),
        "bookingTime": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bookings.insert_one(booking_data)
    
    slot_result = await db.parkingSlots.update_one(
        {"parkingId": booking.parkingId, "slotId": booking.slotId},
        {"$set": {"occupied": True, "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    site = await db.parkingSites.find_one({"id": booking.parkingId})
    if site:
        new_available = max(0, site['availableSlots'] - 1)
        await db.parkingSites.update_one(
            {"id": booking.parkingId},
            {"$set": {
                "availableSlots": new_available,
                "bookedSlots": site['totalSlots'] - new_available
            }}
        )
    
    return Booking(**booking_data)

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).sort("bookingTime", -1).to_list(1000)
    return bookings

@api_router.post("/seed-data")
async def seed_data():
    existing = await db.parkingSites.count_documents({})
    if existing >= 100:
        return {"message": "Data already seeded", "count": existing}
    
    MUMBAI_LOCATIONS = [
        {"name": "Andheri Mall", "area": "Andheri West", "lat": 19.1197, "lng": 72.8468},
        {"name": "BKC Business Park", "area": "Bandra Kurla Complex", "lat": 19.0688, "lng": 72.8685},
        {"name": "Phoenix Palladium", "area": "Lower Parel", "lat": 19.0061, "lng": 72.8310},
        {"name": "Powai Central", "area": "Powai", "lat": 19.1176, "lng": 72.9060},
        {"name": "Juhu Beach Plaza", "area": "Juhu", "lat": 19.1075, "lng": 72.8263},
        {"name": "Worli Sea Link Tower", "area": "Worli", "lat": 19.0176, "lng": 72.8175},
        {"name": "Colaba Causeway Hub", "area": "Colaba", "lat": 18.9067, "lng": 72.8147},
        {"name": "Dadar Market Center", "area": "Dadar", "lat": 19.0176, "lng": 72.8479},
        {"name": "Bandra West Station", "area": "Bandra West", "lat": 19.0544, "lng": 72.8409},
        {"name": "Borivali National Park", "area": "Borivali", "lat": 19.2303, "lng": 72.8567},
    ]
    
    AMENITIES_OPTIONS = [
        ["CCTV", "Covered", "Security"],
        ["CCTV", "Open", "Security", "EV Charging"],
        ["Covered", "Security", "Washroom"],
        ["CCTV", "Covered", "Security", "EV Charging", "Valet"],
        ["CCTV", "Open", "Security"],
        ["Covered", "Security", "Valet"],
        ["CCTV", "Security"],
    ]
    
    sites = []
    for i in range(100):
        base_location = MUMBAI_LOCATIONS[i % len(MUMBAI_LOCATIONS)]
        lat = base_location["lat"] + (random.random() - 0.5) * 0.05
        lng = base_location["lng"] + (random.random() - 0.5) * 0.05
        
        total_slots = random.randint(20, 120)
        available_slots = random.randint(5, total_slots)
        
        site_data = {
            "id": f"lot_{str(i+1).zfill(3)}",
            "name": base_location["name"] if i < len(MUMBAI_LOCATIONS) else f"Parking Hub {i+1}",
            "latitude": lat,
            "longitude": lng,
            "address": f"{base_location['area']}, Mumbai",
            "totalSlots": total_slots,
            "availableSlots": available_slots,
            "bookedSlots": total_slots - available_slots,
            "hourlyRate": random.randint(20, 100),
            "amenities": random.choice(AMENITIES_OPTIONS),
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        sites.append(site_data)
    
    await db.parkingSites.insert_many(sites)
    
    # Seed slots for ALL parking locations
    for site in sites:
        rows = ["A", "B", "C", "D", "E", "F"]
        slots_per_row = (site["totalSlots"] + len(rows) - 1) // len(rows)
        
        slots = []
        slot_index = 0
        for row in rows:
            for col in range(1, slots_per_row + 1):
                if slot_index >= site["totalSlots"]:
                    break
                is_occupied = random.random() > (site["availableSlots"] / site["totalSlots"])
                slots.append({
                    "parkingId": site["id"],
                    "slotId": f"{row}{col}",
                    "occupied": is_occupied,
                    "updatedAt": datetime.now(timezone.utc).isoformat()
                })
                slot_index += 1
            if slot_index >= site["totalSlots"]:
                break
        
        if slots:
            await db.parkingSlots.insert_many(slots)
    
    return {"message": "Successfully seeded data", "sites": len(sites), "slotsSeeded": "all locations"}

@api_router.post("/simulate-esp32")
async def simulate_esp32():
    slots = await db.parkingSlots.find({}).to_list(1000)
    if not slots:
        return {"message": "No slots to simulate"}
    
    random_slot = random.choice(slots)
    new_occupied = not random_slot["occupied"]
    
    await db.parkingSlots.update_one(
        {"parkingId": random_slot["parkingId"], "slotId": random_slot["slotId"]},
        {"$set": {"occupied": new_occupied, "updatedAt": datetime.now(timezone.utc).isoformat()}}
    )
    
    site = await db.parkingSites.find_one({"id": random_slot["parkingId"]})
    if site:
        adjustment = -1 if new_occupied else 1
        new_available = max(0, min(site["totalSlots"], site["availableSlots"] + adjustment))
        await db.parkingSites.update_one(
            {"id": random_slot["parkingId"]},
            {"$set": {
                "availableSlots": new_available,
                "bookedSlots": site["totalSlots"] - new_available
            }}
        )
    
    return {"message": "ESP32 simulation completed", "slot": random_slot["slotId"], "occupied": new_occupied}

class ESP32Update(BaseModel):
    isOccupied: bool
    distance: Optional[float] = None
    status: Optional[str] = None

@api_router.post("/esp32-update-a1")
async def esp32_update_slot_a1(update: ESP32Update):
    """Update slot A1 for all parking locations based on ESP32 sensor data"""
    result = await db.parkingSlots.update_many(
        {"slotId": "A1"},
        {"$set": {
            "occupied": update.isOccupied,
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "esp32Controlled": True
        }}
    )
    
    # Update available slot counts for all affected parking sites
    all_sites = await db.parkingSites.find({}).to_list(1000)
    for site in all_sites:
        slot_a1 = await db.parkingSlots.find_one({"parkingId": site["id"], "slotId": "A1"})
        if slot_a1:
            occupied_count = await db.parkingSlots.count_documents({
                "parkingId": site["id"],
                "occupied": True
            })
            available = site["totalSlots"] - occupied_count
            await db.parkingSites.update_one(
                {"id": site["id"]},
                {"$set": {
                    "availableSlots": available,
                    "bookedSlots": occupied_count
                }}
            )
    
    return {
        "message": "ESP32 update applied to all A1 slots",
        "updated": result.modified_count,
        "isOccupied": update.isOccupied,
        "status": update.status
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
