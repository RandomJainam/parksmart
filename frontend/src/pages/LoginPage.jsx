import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
            <MapPin size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white font-manrope mb-2">ParkSmart</h1>
          <p className="text-indigo-100">Smart Parking for Mumbai</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 font-manrope mb-6">Demo Login</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Email
              </label>
              <input
                type="email"
                defaultValue="demo@parksmart.com"
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                data-testid="demo-email-input"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Password
              </label>
              <input
                type="password"
                defaultValue="demo123"
                disabled
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500"
                data-testid="demo-password-input"
              />
            </div>
          </div>

          <Link
            to="/"
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            data-testid="demo-login-btn"
          >
            Continue to App
            <ArrowRight size={18} />
          </Link>

          <p className="text-xs text-center text-slate-500 mt-4">
            This is a demo mode. No authentication required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
