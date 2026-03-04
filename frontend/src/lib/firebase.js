import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyB_OtU4E0giWeR-BND3QjbaBD8HJVVeYrY",
  databaseURL: "https://spark-6a409-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "spark-6a409"
};

const app = initializeApp(firebaseConfig);
export const realtimeDb = getDatabase(app);

// Listen to ESP32 sensor data for slot A1
export const listenToESP32SlotA1 = (callback) => {
  const slot1Ref = ref(realtimeDb, 'parking/slot1');
  
  return onValue(slot1Ref, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const isOccupied = data.status === "OCCUPIED" || data.status === "occupied";
      callback({
        distance: data.distance,
        status: data.status,
        isOccupied: isOccupied,
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Listen to parking slots (alternative structure)
export const listenToParkingSlots = (callback) => {
  const slotsRef = ref(realtimeDb, 'parking_slots/Slot_001');
  
  return onValue(slotsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({
        isOccupied: data.is_occupied,
        isOffline: data.is_offline,
        isReserved: data.is_reserved,
        reservedBy: data.reserved_by,
        reservedUntil: data.reserved_until,
        timestamp: new Date().toISOString()
      });
    }
  });
};
