import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Mail, Shield, LogOut, Award, ChevronRight } from 'lucide-react';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch user data from Supabase Auth on component mount.
   */
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    getProfile();
  }, []);

  /**
   * Handle user logout.
   */
  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) alert(error.message);
    else window.location.reload(); // Refresh to clear state
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-space-navy-900 flex items-center justify-center">
        <div className="text-neon-cyan-500 animate-pulse font-bold uppercase tracking-widest">
          Loading Profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-navy-900 text-white p-6 pb-24">
      {/* Profile Header */}
      <header className="flex flex-col items-center mt-8 mb-10">
        <div className="w-24 h-24 rounded-full bg-space-navy-800 border-2 border-neon-cyan-500 flex items-center justify-center shadow-neon-cyan mb-4">
          <User size={48} className="text-neon-cyan-500" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          {user?.email?.split('@')[0].toUpperCase() || 'GUARDIAN'}
        </h1>
        <p className="text-neon-cyan-500 text-xs font-bold uppercase tracking-widest mt-1">
          Verified Sakhi User
        </p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-space-navy-800 border border-space-navy-700 p-4 rounded-2xl flex flex-col items-center">
          <Award className="text-soft-lavender-400 mb-2" />
          <span className="text-xl font-black">120</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Safety Credits</span>
        </div>
        <div className="bg-space-navy-800 border border-space-navy-700 p-4 rounded-2xl flex flex-col items-center">
          <Shield className="text-green-500 mb-2" />
          <span className="text-xl font-black">8</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase">Safe Walks</span>
        </div>
      </div>

      {/* Account Settings List */}
      <div className="space-y-3">
        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest px-2 mb-4">
          Account Settings
        </h2>

        <div className="w-full flex items-center justify-between p-5 rounded-2xl bg-space-navy-800 border border-space-navy-700">
          <div className="flex items-center gap-4">
            <Mail className="text-gray-400" size={20} />
            <div className="text-left">
              <p className="text-xs text-gray-500 font-bold uppercase">Email Address</p>
              <p className="font-medium text-sm">{user?.email || 'Not available'}</p>
            </div>
          </div>
        </div>

        <button className="w-full flex items-center justify-between p-5 rounded-2xl bg-space-navy-800 border border-space-navy-700 active:bg-space-navy-700 transition-colors">
          <div className="flex items-center gap-4">
            <Shield className="text-gray-400" size={20} />
            <p className="font-bold">Privacy Settings</p>
          </div>
          <ChevronRight size={18} className="text-gray-600" />
        </button>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 p-5 rounded-2xl bg-red-900/20 border border-red-900/50 text-red-500 font-bold mt-8 active:bg-red-900/40 transition-colors"
        >
          <LogOut size={20} />
          <span>Sign Out of Sakhi</span>
        </button>
      </div>
    </div>
  );
}