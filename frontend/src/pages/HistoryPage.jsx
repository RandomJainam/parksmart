import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Calendar, Car, Navigation } from 'lucide-react';
import { api } from '../lib/api';

const HistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await api.getBookings();
        setBookings(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              data-testid="back-to-map-btn"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-manrope">My Bookings</h1>
              <p className="text-sm text-slate-500 mt-0.5">View your parking history</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-500">Loading bookings...</div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Car size={48} className="text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No bookings yet</p>
            <p className="text-sm text-slate-400">Your parking history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                data-testid={`booking-card-${booking.id}`}
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 font-manrope mb-1">
                        {booking.parkingName}
                      </h3>
                      <div className="flex items-center text-sm text-slate-500 gap-1">
                        <MapPin size={14} />
                        {booking.address}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      booking.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                      booking.status === 'scheduled' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {booking.status === 'scheduled' ? 'Scheduled' : booking.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Car size={16} className="text-indigo-600" />
                      <div>
                        <div className="text-xs text-slate-500">Slot</div>
                        <div className="font-semibold font-mono text-slate-900">{booking.slotId}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-indigo-600" />
                      <div>
                        <div className="text-xs text-slate-500">Duration</div>
                        <div className="font-semibold text-slate-900">{booking.duration} hours</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={14} />
                      {booking.bookingType === 'later' && booking.scheduledTime ? 
                        `Scheduled: ${formatDate(booking.scheduledTime)} at ${formatTime(booking.scheduledTime)}` :
                        `${formatDate(booking.bookingTime)} at ${formatTime(booking.bookingTime)}`
                      }
                    </div>
                    <div className="text-xl font-bold text-indigo-600 font-manrope">
                      ₹{booking.totalPrice}
                    </div>
                  </div>
                </div>

                {expandedId === booking.id && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-500 mb-1">Rate</div>
                        <div className="font-semibold text-slate-900">₹{booking.pricePerHour}/hr</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Booking ID</div>
                        <div className="font-mono text-xs text-slate-900">{booking.id.slice(0, 8)}</div>
                      </div>
                    </div>
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                      data-testid={`navigate-booking-${booking.id}`}
                    >
                      <Navigation size={16} />
                      Navigate to Location
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
