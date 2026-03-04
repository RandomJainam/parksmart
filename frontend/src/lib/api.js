import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export const api = {
  // Auth endpoints
  async register(userData) {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  },

  async login(email, password) {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  },

  async getMe(token) {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  async updateProfile(token, userData) {
    const response = await axios.put(`${API_URL}/auth/profile`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Parking endpoints
  async getParkingSites() {
    const response = await axios.get(`${API_URL}/parking-sites`);
    return response.data;
  },

  async getParkingSlots(parkingId) {
    const response = await axios.get(`${API_URL}/parking-slots/${parkingId}`);
    return response.data;
  },

  async createBooking(bookingData) {
    const response = await axios.post(`${API_URL}/bookings`, bookingData);
    return response.data;
  },

  async getBookings() {
    const response = await axios.get(`${API_URL}/bookings`);
    return response.data;
  },

  async seedData() {
    const response = await axios.post(`${API_URL}/seed-data`);
    return response.data;
  },

  async simulateESP32() {
    const response = await axios.post(`${API_URL}/simulate-esp32`);
    return response.data;
  },

  async updateESP32SlotA1(isOccupied, status, distance) {
    const response = await axios.post(`${API_URL}/esp32-update-a1`, {
      isOccupied,
      status,
      distance
    });
    return response.data;
  }
};

export const startPolling = (callback, interval = 5000) => {
  const intervalId = setInterval(callback, interval);
  return () => clearInterval(intervalId);
};
