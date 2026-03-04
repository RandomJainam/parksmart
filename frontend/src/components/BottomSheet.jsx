import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Clock, Car, X, ChevronUp } from 'lucide-react';

const BottomSheet = ({ parking, onClose, onBookSpot, onNavigate }) => {
  const [snapPoint, setSnapPoint] = useState('expanded');

  if (!parking) return null;

  const snapPoints = {
    collapsed: '25%',
    expanded: '55%',
    full: '90%'
  };

  const handleDragEnd = (event, info) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity < -500 || offset < -100) {
      if (snapPoint === 'collapsed') setSnapPoint('expanded');
      else if (snapPoint === 'expanded') setSnapPoint('full');
    } else if (velocity > 500 || offset > 100) {
      if (snapPoint === 'full') setSnapPoint('expanded');
      else if (snapPoint === 'expanded') setSnapPoint('collapsed');
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
        {/* Drag Handle */}
        <div className="p-3 flex justify-center cursor-grab active:cursor-grabbing" onClick={() => setSnapPoint(snapPoint === 'full' ? 'expanded' : 'full')}>
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>
        
        <div className="px-5 pb-5 overflow-y-auto" style={{ maxHeight: snapPoint === 'full' ? '85vh' : '50vh' }}>
          
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold text-slate-900 font-manrope tracking-tight mb-2">
                {parking.name}
              </h2>
              <div className="flex items-center text-sm text-slate-600 mb-1">
                <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                <span className="line-clamp-1">{parking.address}</span>
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <Navigation size={14} className="mr-1.5 flex-shrink-0" />
                <span>{distance} km away</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
              data-testid="close-bottom-sheet-btn"
            >
              <X size={22} className="text-slate-500" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className={`${statusBg} ${statusColor} rounded-2xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <Car size={22} className="opacity-80" />
                <ChevronUp size={18} className="opacity-60" />
              </div>
              <div className="font-bold text-3xl font-manrope mb-1">
                {parking.availableSlots}
              </div>
              <div className="text-sm font-semibold opacity-90">Available Now</div>
            </div>
            
            <div className="bg-indigo-50 text-indigo-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock size={22} className="opacity-80" />
              </div>
              <div className="font-bold text-3xl font-manrope mb-1">
                ₹{parking.hourlyRate}
              </div>
              <div className="text-sm font-semibold opacity-90">Per Hour</div>
            </div>
          </div>

          {/* Amenities */}
          {snapPoint !== 'collapsed' && (
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-700 mb-2.5 uppercase tracking-wider">Amenities</div>
              <div className="flex flex-wrap gap-2">
                {parking.amenities?.map((amenity, index) => (
                  <span
                    key={index}
                    className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 sticky bottom-0 bg-white pt-2">
            <button
              onClick={() => onNavigate(parking)}
              className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all active:scale-95 text-base"
              data-testid="navigate-btn"
            >
              <Navigation size={20} />
              Navigate
            </button>
            <button
              onClick={() => onBookSpot(parking)}
              className="flex items-center justify-center gap-2 px-4 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/30 text-base"
              data-testid="book-spot-btn"
            >
              <Car size={20} />
              Book Spot
            </button>
          </div>

          {/* Swipe hint */}
          {snapPoint === 'collapsed' && (
            <div className="text-center mt-4 text-xs text-slate-400 font-medium">
              Swipe up for more details
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BottomSheet;
