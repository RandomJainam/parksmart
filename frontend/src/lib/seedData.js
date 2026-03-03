import { db } from './firebase';
import { collection, doc, setDoc, writeBatch, getDocs } from 'firebase/firestore';

const MUMBAI_CENTER = { lat: 19.0760, lng: 72.8777 };

const MUMBAI_LOCATIONS = [
  { name: 'Andheri Mall', area: 'Andheri West', lat: 19.1197, lng: 72.8468 },
  { name: 'BKC Business Park', area: 'Bandra Kurla Complex', lat: 19.0688, lng: 72.8685 },
  { name: 'Phoenix Palladium', area: 'Lower Parel', lat: 19.0061, lng: 72.8310 },
  { name: 'Powai Central', area: 'Powai', lat: 19.1176, lng: 72.9060 },
  { name: 'Juhu Beach Plaza', area: 'Juhu', lat: 19.1075, lng: 72.8263 },
  { name: 'Worli Sea Link Tower', area: 'Worli', lat: 19.0176, lng: 72.8175 },
  { name: 'Colaba Causeway Hub', area: 'Colaba', lat: 18.9067, lng: 72.8147 },
  { name: 'Dadar Market Center', area: 'Dadar', lat: 19.0176, lng: 72.8479 },
  { name: 'Bandra West Station', area: 'Bandra West', lat: 19.0544, lng: 72.8409 },
  { name: 'Borivali National Park', area: 'Borivali', lat: 19.2303, lng: 72.8567 },
];

const AMENITIES_OPTIONS = [
  ['CCTV', 'Covered', 'Security'],
  ['CCTV', 'Open', 'Security', 'EV Charging'],
  ['Covered', 'Security', 'Washroom'],
  ['CCTV', 'Covered', 'Security', 'EV Charging', 'Valet'],
  ['CCTV', 'Open', 'Security'],
  ['Covered', 'Security', 'Valet'],
  ['CCTV', 'Security'],
];

function generateRandomOffset(baseCoord, maxOffsetKm = 5) {
  const offset = (Math.random() - 0.5) * (maxOffsetKm / 111);
  return baseCoord + offset;
}

function generateParkingName(index) {
  const types = ['Mall', 'Tower', 'Plaza', 'Hub', 'Center', 'Complex', 'Park', 'Station'];
  const areas = ['Business', 'Shopping', 'Metro', 'Commercial', 'Corporate', 'Residential'];
  const type = types[Math.floor(Math.random() * types.length)];
  const area = areas[Math.floor(Math.random() * areas.length)];
  return `${area} ${type} P${index + 1}`;
}

function generateAddress(lat, lng) {
  const areas = ['Andheri', 'Bandra', 'Worli', 'Lower Parel', 'Powai', 'Juhu', 'Colaba', 'Dadar', 'Borivali', 'Malad', 'Goregaon', 'Vile Parle'];
  const suffixes = ['East', 'West'];
  const area = areas[Math.floor(Math.random() * areas.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${area} ${suffix}, Mumbai, Maharashtra`;
}

export async function seedParkingData() {
  try {
    const parkingSitesRef = collection(db, 'parkingSites');
    const existingDocs = await getDocs(parkingSitesRef);
    
    if (existingDocs.size >= 100) {
      console.log('Parking data already seeded');
      return;
    }

    console.log('Seeding 100 parking locations...');
    const batch = writeBatch(db);
    const locations = [];

    for (let i = 0; i < 100; i++) {
      const baseLocation = i < MUMBAI_LOCATIONS.length ? MUMBAI_LOCATIONS[i] : MUMBAI_LOCATIONS[i % MUMBAI_LOCATIONS.length];
      const lat = generateRandomOffset(baseLocation.lat, 3);
      const lng = generateRandomOffset(baseLocation.lng, 3);
      
      const totalSlots = Math.floor(Math.random() * 100) + 20;
      const availableSlots = Math.floor(Math.random() * totalSlots);
      const bookedSlots = totalSlots - availableSlots;
      
      const parkingData = {
        id: `lot_${String(i + 1).padStart(3, '0')}`,
        name: i < MUMBAI_LOCATIONS.length ? MUMBAI_LOCATIONS[i].name : generateParkingName(i),
        latitude: lat,
        longitude: lng,
        address: i < MUMBAI_LOCATIONS.length && MUMBAI_LOCATIONS[i].area ? `${MUMBAI_LOCATIONS[i].area}, Mumbai` : generateAddress(lat, lng),
        totalSlots,
        availableSlots,
        bookedSlots,
        hourlyRate: Math.floor(Math.random() * 80) + 20,
        amenities: AMENITIES_OPTIONS[Math.floor(Math.random() * AMENITIES_OPTIONS.length)],
        createdAt: new Date().toISOString()
      };
      
      locations.push(parkingData);
      const docRef = doc(parkingSitesRef, parkingData.id);
      batch.set(docRef, parkingData);
    }

    await batch.commit();
    console.log('Successfully seeded 100 parking locations');

    await seedParkingSlots(locations);
    
  } catch (error) {
    console.error('Error seeding parking data:', error);
  }
}

async function seedParkingSlots(locations) {
  try {
    console.log('Seeding parking slots...');
    
    for (let i = 0; i < Math.min(10, locations.length); i++) {
      const location = locations[i];
      const parkingSlotsRef = collection(db, 'parkingSlots');
      const batch = writeBatch(db);
      
      const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
      const slotsPerRow = Math.ceil(location.totalSlots / rows.length);
      
      let slotIndex = 0;
      for (const row of rows) {
        for (let col = 1; col <= slotsPerRow && slotIndex < location.totalSlots; col++, slotIndex++) {
          const slotId = `${row}${col}`;
          const isOccupied = Math.random() > (location.availableSlots / location.totalSlots);
          
          const slotData = {
            parkingId: location.id,
            slotId: slotId,
            occupied: isOccupied,
            updatedAt: new Date().toISOString()
          };
          
          const docRef = doc(parkingSlotsRef, `${location.id}_${slotId}`);
          batch.set(docRef, slotData);
        }
      }
      
      await batch.commit();
    }
    
    console.log('Successfully seeded parking slots for first 10 locations');
  } catch (error) {
    console.error('Error seeding parking slots:', error);
  }
}

export function simulateESP32Updates() {
  setInterval(async () => {
    try {
      const parkingSlotsRef = collection(db, 'parkingSlots');
      const slotsSnapshot = await getDocs(parkingSlotsRef);
      
      if (slotsSnapshot.empty) return;
      
      const randomSlot = slotsSnapshot.docs[Math.floor(Math.random() * slotsSnapshot.docs.length)];
      const slotData = randomSlot.data();
      
      await setDoc(randomSlot.ref, {
        ...slotData,
        occupied: !slotData.occupied,
        updatedAt: new Date().toISOString()
      });
      
      const parkingSitesRef = doc(db, 'parkingSites', slotData.parkingId);
      const parkingDoc = await getDocs(collection(db, 'parkingSites'));
      const parkingData = parkingDoc.docs.find(d => d.id === slotData.parkingId)?.data();
      
      if (parkingData) {
        const newAvailable = slotData.occupied ? parkingData.availableSlots + 1 : parkingData.availableSlots - 1;
        await setDoc(parkingSitesRef, {
          ...parkingData,
          availableSlots: Math.max(0, Math.min(parkingData.totalSlots, newAvailable)),
          bookedSlots: parkingData.totalSlots - newAvailable
        });
      }
    } catch (error) {
      console.error('ESP32 simulation error:', error);
    }
  }, 5000);
}
