import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Clock, Car, X, ChevronUp } from 'lucide-react';

const BottomSheet = ({ parking, onClose, onBookSpot, onNavigate }) => {
  const [snapPoint, setSnapPoint] = useState('peek');

  if (!parking) return null;

  const snapPoints = {
    peek: '15%',
    half: '45%',
    full: '90%'
  };

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity < -500 || offset < -100) {
      if (snapPoint === 'peek') setSnapPoint('half');
      else if (snapPoint === 'half') setSnapPoint('full');
    } else if (velocity > 500 || offset > 100) {
      if (snapPoint === 'full') setSnapPoint('half');
      else if (snapPoint === 'half') setSnapPoint('peek');
      else onClose();
    }
  };

  const percentage = Math.round((parking.availableSlots / parking.totalSlots) * 100);
  let statusColor = 'text-red-500';
  let statusBg = 'bg-red-50';
  if (percentage > 50) {
    statusColor = 'text-emerald-500';
    statusBg = 'bg-emerald-50';
  } else if (percentage > 20) {
    statusColor = 'text-amber-500';
    statusBg = 'bg-amber-50';
  }

  const distance = (Math.random() * 5 + 0.5).toFixed(1);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-20"
        initial={{ y: '100%' }}
        animate={{ y: `calc(100% - ${snapPoints[snapPoint]})` }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <div className="p-5">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 cursor-grab active:cursor-grabbing" />
          
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 font-manrope tracking-tight mb-1">
                {parking.name}
              </h2>
              <div className="flex items-center text-sm text-slate-500 mb-2">
                <MapPin size={14} className="mr-1" />
                {parking.address}
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <Navigation size={14} className="mr-1" />
                {distance} km away
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              data-testid="close-bottom-sheet-btn"
            >
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`${statusBg} ${statusColor} rounded-xl p-4`}>
              <div className="flex items-center justify-between">
                <Car size={20} />
                <ChevronUp size={16} />
              </div>
              <div className="mt-2 font-bold text-2xl font-manrope">
                {parking.availableSlots}
              </div>
              <div className="text-xs font-medium mt-1">Available</div>
            </div>
            
            <div className="bg-indigo-50 text-indigo-600 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <Clock size={20} />
              </div>
              <div className="mt-2 font-bold text-2xl font-manrope">
                ₹{parking.hourlyRate}
              </div>
              <div className="text-xs font-medium mt-1">Per Hour</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Amenities</div>
            <div className="flex flex-wrap gap-2">
              {parking.amenities?.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => onNavigate(parking)}
              className="flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-all active:scale-95"
              data-testid="navigate-btn"
            >
              <Navigation size={18} />
              Navigate
            </button>
            <button
              onClick={() => onBookSpot(parking)}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/30"
              data-testid="book-spot-btn"
            >
              <Car size={18} />
              Book Spot
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BottomSheet;
