import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Car, MapPin, CreditCard, Check, Calendar as CalendarIcon } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';

const BookingConfirmation = ({ parking, slot, bookingType, onClose, onSuccess }) => {
  const [duration, setDuration] = useState(2);
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    if (bookingType === 'later') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setScheduledDate(tomorrow.toISOString().split('T')[0]);
      setScheduledTime('09:00');
    }
  }, [bookingType]);

  const totalPrice = parking.hourlyRate * duration;

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      let bookingTime = new Date().toISOString();
      
      if (bookingType === 'later') {
        if (!scheduledDate || !scheduledTime) {
          toast.error('Please select date and time');
          setLoading(false);
          return;
        }
        bookingTime = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const bookingData = {
        parkingId: parking.id,
        parkingName: parking.name,
        slotId: slot.slotId,
        duration: duration,
        pricePerHour: parking.hourlyRate,
        totalPrice: totalPrice,
        status: bookingType === 'now' ? 'active' : 'scheduled',
        address: parking.address,
        bookingType: bookingType,
        scheduledTime: bookingType === 'later' ? bookingTime : null
      };

      await api.createBooking(bookingData);
      
      toast.success(bookingType === 'now' ? 'Booking Confirmed!' : 'Booking Scheduled!', {
        description: `${parking.name} - Slot ${slot.slotId}${bookingType === 'later' ? ` on ${scheduledDate}` : ''}`,
        duration: 4000,
      });

      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Booking failed', {
        description: 'Please try again',
      });
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
              data-testid="close-booking-confirmation-btn"
            >
              <X size={20} />
            </button>
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold font-manrope mb-1">Confirm Booking</h2>
            <p className="text-indigo-100 text-sm">Review your parking details</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
              <MapPin size={20} className="text-indigo-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-slate-900">{parking.name}</div>
                <div className="text-sm text-slate-500 mt-0.5">{parking.address}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-emerald-50 rounded-xl">
                <Car size={20} className="text-emerald-600 mb-2" />
                <div className="text-xs text-emerald-700 font-medium">Slot Number</div>
                <div className="text-xl font-bold text-emerald-900 font-mono">{slot.slotId}</div>
              </div>
              
              <div className="p-4 bg-indigo-50 rounded-xl">
                <Clock size={20} className="text-indigo-600 mb-2" />
                <div className="text-xs text-indigo-700 font-medium">Rate</div>
                <div className="text-xl font-bold text-indigo-900 font-manrope">₹{parking.hourlyRate}/hr</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Duration (hours)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 6, 8].map((hrs) => (
                  <button
                    key={hrs}
                    onClick={() => setDuration(hrs)}
                    className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                      duration === hrs
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    data-testid={`duration-${hrs}hr-btn`}
                  >
                    {hrs}h
                  </button>
                ))}
              </div>
            </div>

            {bookingType === 'later' && (
              <div className="space-y-3 p-4 bg-indigo-50 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm mb-2">
                  <CalendarIcon size={16} />
                  <span>Schedule Booking</span>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    data-testid="scheduled-date-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Time</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    data-testid="scheduled-time-input"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Duration</span>
                <span className="font-semibold text-slate-900">{duration} hours</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600">Rate</span>
                <span className="font-semibold text-slate-900">₹{parking.hourlyRate}/hr</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Total Amount</span>
                <span className="text-2xl font-bold text-indigo-600 font-manrope">₹{totalPrice}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="final-confirm-booking-btn"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard size={18} />
                  {bookingType === 'now' ? 'Confirm Booking' : 'Schedule Booking'} - ₹{totalPrice}
                </>
              )}
            </button>
            
            <p className="text-xs text-center text-slate-500">
              Demo mode - No actual payment will be charged
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingConfirmation;
