import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { api } from '../lib/api';

const SlotPicker = ({ parking, onClose, onConfirmBooking }) => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!parking) return;
      try {
        const slotsData = await api.getParkingSlots(parking.id);
        setSlots(slotsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching slots:', error);
        setLoading(false);
      }
    };

    fetchSlots();
    const interval = setInterval(fetchSlots, 3000);
    return () => clearInterval(interval);
  }, [parking]);

  const getSlotColor = (slot) => {
    if (selectedSlot?.slotId === slot.slotId) return 'bg-indigo-600 text-white border-indigo-600';
    if (slot.occupied) return 'bg-red-500 text-white border-red-500 cursor-not-allowed';
    return 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 cursor-pointer';
  };

  const [bookingType, setBookingType] = useState('now');

  const handleSlotClick = (slot) => {
    if (slot.occupied) return;
    setSelectedSlot(slot.slotId === selectedSlot?.slotId ? null : slot);
  };

  const rows = {};
  slots.forEach(slot => {
    const row = slot.slotId[0];
    if (!rows[row]) rows[row] = [];
    rows[row].push(slot);
  });

  Object.keys(rows).forEach(row => {
    rows[row].sort((a, b) => {
      const numA = parseInt(a.slotId.slice(1));
      const numB = parseInt(b.slotId.slice(1));
      return numA - numB;
    });
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-slate-200 p-5 z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-manrope">
                  Select Your Spot
                </h2>
                <p className="text-sm text-slate-500 mt-1">{parking.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                data-testid="close-slot-picker-btn"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded" />
                <span className="text-slate-600 font-medium">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span className="text-slate-600 font-medium">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-indigo-600 rounded" />
                <span className="text-slate-600 font-medium">Selected</span>
              </div>
            </div>
          </div>

          <div className="p-5 overflow-y-auto max-h-[calc(85vh-180px)]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-slate-500">Loading slots...</div>
              </div>
            ) : Object.keys(rows).length === 0 ? (
              <div className="text-center py-20">
                <div className="text-slate-500 mb-2">No slots available</div>
                <p className="text-sm text-slate-400">Please try another parking location</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-100 text-slate-600 text-center py-3 rounded-xl text-sm font-semibold">
                  ← ENTRANCE →
                </div>
                
                {Object.keys(rows).sort().map(row => (
                  <div key={row} className="flex items-center gap-2">
                    <div className="w-8 font-mono font-bold text-slate-700">{row}</div>
                    <div className="flex-1 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {rows[row].map(slot => (
                        <motion.button
                          key={slot.slotId}
                          whileHover={!slot.occupied ? { scale: 1.05 } : {}}
                          whileTap={!slot.occupied ? { scale: 0.95 } : {}}
                          onClick={() => handleSlotClick(slot)}
                          className={`aspect-square rounded-lg border-2 font-mono text-xs font-bold transition-all ${getSlotColor(slot)}`}
                          disabled={slot.occupied}
                          data-testid={`slot-${slot.slotId}`}
                        >
                          {slot.slotId}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedSlot && (
            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5">
              <div className="mb-4">
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Booking Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBookingType('now')}
                    className={`py-2.5 rounded-lg font-semibold transition-all ${
                      bookingType === 'now'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    data-testid="booking-type-now-btn"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => setBookingType('later')}
                    className={`py-2.5 rounded-lg font-semibold transition-all ${
                      bookingType === 'later'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    data-testid="booking-type-later-btn"
                  >
                    Book for Later
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm text-slate-500">Selected Slot</div>
                  <div className="text-xl font-bold text-slate-900 font-mono">{selectedSlot.slotId}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Rate</div>
                  <div className="text-xl font-bold text-indigo-600 font-manrope">₹{parking.hourlyRate}/hr</div>
                </div>
              </div>
              <button
                onClick={() => onConfirmBooking(selectedSlot, bookingType)}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
                data-testid="confirm-booking-btn"
              >
                Continue
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SlotPicker;
