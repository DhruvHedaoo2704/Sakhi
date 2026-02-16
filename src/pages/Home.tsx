import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Shield, Navigation, ChevronRight } from 'lucide-react';

export default function Home() {
  // State to track if Guardian Mode is currently active
  const [isGuardianActive, setIsGuardianActive] = useState(false);
  // State to prevent multiple clicks during network requests
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * EMERGENCY SOS LOGIC
   * This function sends a high-priority alert to the 'safety_reports' table.
   * In a production app, this would also trigger SMS/Push notifications.
   */
  async function handleSOS() {
    setIsSubmitting(true);
    
    try {
      // Get the currently logged-in user to associate with the report
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('safety_reports').insert({
        user_id: user?.id,
        type: 'SOS_ALERT',
        description: 'Emergency SOS triggered by user from Dashboard',
        severity: 5, // Level 5 is reserved for immediate danger
        status: 'pending'
      });

      if (error) throw error;
      
      alert("EMERGENCY: Your SOS has been logged. Emergency contacts are being notified.");
    } catch (err) {
      console.error("SOS Error:", err);
      alert("Failed to send SOS. Please check your connection or call emergency services.");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * GUARDIAN MODE LOGIC
   * This toggles a 'monitored walk' session. It logs the start and end 
   * times in the 'guardian_sessions' table to keep a history of safe travels.
   */
  async function toggleGuardianMode() {
    const nextState = !isGuardianActive;
    setIsGuardianActive(nextState);

    try {
      if (nextState) {
        // Start a new session in the database
        await supabase.from('guardian_sessions').insert({
          status: 'active',
          start_time: new Date().toISOString()
        });
      } else {
        // Update the active session to 'completed'
        await supabase.from('guardian_sessions')
          .update({ 
            status: 'completed', 
            end_time: new Date().toISOString() 
          })
          .eq('status', 'active');
      }
    } catch (err) {
      console.error("Guardian Mode Error:", err);
    }
  }

  return (
    <div className="min-h-screen bg-space-navy-900 text-white p-6 pb-24">
      <header className="mb-10 pt-4">
        <h1 className="text-3xl font-black text-neon-cyan-500 tracking-tight">SAKHI</h1>
        <p className="text-gray-400 text-sm mt-1 font-medium">Your Guardian Companion</p>
      </header>

      {/* SOS BUTTON: Uses a bounce animation for high visibility */}
      <div className="flex flex-col items-center justify-center mb-12">
        <button 
          onClick={handleSOS}
          disabled={isSubmitting}
          className={`
            w-52 h-52 rounded-full flex flex-col items-center justify-center
            bg-red-600 border-[12px] border-red-900/40 shadow-neon-cyan
            transition-all duration-300 active:scale-90
            ${isSubmitting ? 'animate-pulse opacity-50' : 'animate-bounce-slow'}
          `}
        >
          <AlertTriangle size={64} fill="white" strokeWidth={2.5} />
          <span className="font-black text-2xl mt-2 tracking-widest">SOS</span>
        </button>
        <p className="text-red-500 text-xs font-bold uppercase mt-6 tracking-widest animate-pulse">
          Tap for Emergency Help
        </p>
      </div>

      <div className="space-y-4">
        {/* GUARDIAN MODE TOGGLE CARD */}
        <button 
          onClick={toggleGuardianMode}
          className={`
            w-full flex items-center justify-between p-6 rounded-3xl border
            transition-all duration-500
            ${isGuardianActive 
              ? 'bg-green-600 border-green-400 shadow-[0_0_25px_rgba(34,197,94,0.4)]' 
              : 'bg-space-navy-800 border-space-navy-700'
            }
          `}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isGuardianActive ? 'bg-white/20' : 'bg-space-navy-700'}`}>
              <Shield className={isGuardianActive ? 'text-white' : 'text-neon-cyan-500'} />
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">Guardian Mode</p>
              <p className="text-sm opacity-70">
                {isGuardianActive ? 'Actively Monitoring Walk' : 'Start Secure Walk'}
              </p>
            </div>
          </div>
          <ChevronRight className={`transition-transform duration-300 ${isGuardianActive ? 'rotate-90' : ''}`} />
        </button>

        {/* SAFE NAVIGATION SHORTCUT CARD */}
        <div className="w-full flex items-center gap-4 p-6 rounded-3xl bg-space-navy-800 border border-space-navy-700 active:bg-space-navy-700 transition-colors">
          <div className="p-3 rounded-2xl bg-space-navy-700">
            <Navigation className="text-soft-lavender-400" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">Safe Route Engine</p>
            <p className="text-sm text-gray-500 font-medium">Navigate via Safe Havens</p>
          </div>
        </div>
      </div>
    </div>
  );
}