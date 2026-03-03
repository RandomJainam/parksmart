import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Car, Edit2, Save } from 'lucide-react';
import { toast } from 'sonner';

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Demo User',
    email: 'demo@parksmart.com',
    phone: '+91 98765 43210',
    vehiclePlate: 'MH 02 AB 1234'
  });
  const [tempProfile, setTempProfile] = useState(profile);

  const handleEdit = () => {
    setTempProfile(profile);
    setIsEditing(true);
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
    toast.success('Profile updated successfully');
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              data-testid="back-to-map-from-profile-btn"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-manrope">Profile</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage your account</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white">
            <div className="flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur rounded-full mx-auto mb-4">
              <User size={40} />
            </div>
            <h2 className="text-center text-xl font-bold font-manrope">{profile.name}</h2>
            <p className="text-center text-indigo-100 text-sm mt-1">ParkSmart Member</p>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <User size={16} className="text-indigo-600" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={isEditing ? tempProfile.name : profile.name}
                  onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500"
                  data-testid="profile-name-input"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Mail size={16} className="text-indigo-600" />
                  Email
                </label>
                <input
                  type="email"
                  value={isEditing ? tempProfile.email : profile.email}
                  onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500"
                  data-testid="profile-email-input"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Phone size={16} className="text-indigo-600" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={isEditing ? tempProfile.phone : profile.phone}
                  onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500"
                  data-testid="profile-phone-input"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Car size={16} className="text-indigo-600" />
                  Vehicle Plate
                </label>
                <input
                  type="text"
                  value={isEditing ? tempProfile.vehiclePlate : profile.vehiclePlate}
                  onChange={(e) => setTempProfile({ ...tempProfile, vehiclePlate: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 font-mono"
                  data-testid="profile-vehicle-input"
                />
              </div>
            </div>

            <div className="pt-4">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCancel}
                    className="py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                    data-testid="cancel-edit-btn"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    data-testid="save-profile-btn"
                  >
                    <Save size={18} />
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEdit}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  data-testid="edit-profile-btn"
                >
                  <Edit2 size={18} />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            className="text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
            data-testid="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
