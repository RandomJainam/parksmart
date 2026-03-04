import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MapPin, Clock, User, Menu, X, Radio } from 'lucide-react';
import { Toaster, toast } from './components/ui/sonner';
import ParkingMap from './components/ParkingMap';
import BottomSheet from './components/BottomSheet';
import SlotPicker from './components/SlotPicker';
import BookingConfirmation from './components/BookingConfirmation';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import { api } from './lib/api';
import { listenToESP32SlotA1 } from './lib/firebase';
import './App.css';

function FloatingNav({ onMenuClick }) {
  const location = useLocation();
  const isMapPage = location.pathname === '/';

  if (!isMapPage) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-10 flex items-center justify-between">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl px-4 py-3 shadow-lg border border-slate-200">
        <h1 className="text-lg font-bold text-indigo-600 font-manrope tracking-tight">ParkSmart</h1>
      </div>
      <button
        onClick={onMenuClick}
        className="bg-white/90 backdrop-blur-md rounded-full p-3 shadow-lg border border-slate-200 hover:bg-white transition-colors"
        data-testid="menu-btn"
      >
        <Menu size={20} className="text-slate-700" />
      </button>
    </div>
  );
}

function SideMenu({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 font-manrope">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              data-testid="close-menu-btn"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <nav className="space-y-2">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors font-medium"
              data-testid="nav-map-link"
            >
              <MapPin size={20} />
              <span>Find Parking</span>
            </Link>
            <Link
              to="/history"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors font-medium"
              data-testid="nav-history-link"
            >
              <Clock size={20} />
              <span>My Bookings</span>
            </Link>
            <Link
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-colors font-medium"
              data-testid="nav-profile-link"
            >
              <User size={20} />
              <span>Profile</span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}

function MapPageContent() {
  const [selectedParking, setSelectedParking] = useState(null);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingType, setBookingType] = useState('now');

  const handleMarkerClick = (parking) => {
    setSelectedParking(parking);
  };

  const handleBookSpot = (parking) => {
    setShowSlotPicker(true);
  };

  const handleNavigate = (parking) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${parking.latitude},${parking.longitude}`;
    window.open(url, '_blank');
  };

  const handleConfirmBooking = (slot, type) => {
    setSelectedSlot(slot);
    setBookingType(type);
    setShowSlotPicker(false);
    setShowBookingConfirmation(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingConfirmation(false);
    setSelectedParking(null);
    setSelectedSlot(null);
    setBookingType('now');
  };

  return (
    <div className="h-screen w-full relative">
      <ParkingMap onMarkerClick={handleMarkerClick} selectedParking={selectedParking} />
      
      {selectedParking && (
        <BottomSheet
          parking={selectedParking}
          onClose={() => setSelectedParking(null)}
          onBookSpot={handleBookSpot}
          onNavigate={handleNavigate}
        />
      )}

      {showSlotPicker && selectedParking && (
        <SlotPicker
          parking={selectedParking}
          onClose={() => setShowSlotPicker(false)}
          onConfirmBooking={handleConfirmBooking}
        />
      )}

      {showBookingConfirmation && selectedParking && selectedSlot && (
        <BookingConfirmation
          parking={selectedParking}
          slot={selectedSlot}
          bookingType={bookingType}
          onClose={() => setShowBookingConfirmation(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dataSeeded, setDataSeeded] = useState(false);
  const [esp32Status, setEsp32Status] = useState({ connected: false, lastUpdate: null });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await api.seedData();
        setDataSeeded(true);
        
        // Simulate other slots (not A1)
        setInterval(async () => {
          try {
            await api.simulateESP32();
          } catch (error) {
            console.error('ESP32 simulation error:', error);
          }
        }, 5000);
      } catch (error) {
        console.error('Failed to seed data:', error);
      }
    };

    initializeApp();

    // Listen to real ESP32 sensor data for slot A1
    const unsubscribe = listenToESP32SlotA1(async (data) => {
      console.log('ESP32 Update:', data);
      try {
        await api.updateESP32SlotA1(data.isOccupied, data.status, data.distance);
        setEsp32Status({
          connected: true,
          lastUpdate: new Date().toLocaleTimeString(),
          status: data.status,
          distance: data.distance
        });
        
        toast.info('ESP32 Sensor Update', {
          description: `Slot A1: ${data.status} (${data.distance?.toFixed(1)}cm)`,
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to update ESP32 slot:', error);
        setEsp32Status({ connected: false, lastUpdate: null });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <Router>
      <div className="app-container">
        <FloatingNav onMenuClick={() => setMenuOpen(true)} />
        
        {/* ESP32 Status Indicator */}
        {esp32Status.connected && (
          <div className="fixed top-20 left-4 z-10 bg-emerald-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-semibold">
            <Radio size={16} className="animate-pulse" />
            <div>
              <div>ESP32 Live</div>
              <div className="text-xs opacity-90">{esp32Status.lastUpdate}</div>
            </div>
          </div>
        )}
        
        <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        
        <Routes>
          <Route path="/" element={<MapPageContent />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
        
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}

export default App;
