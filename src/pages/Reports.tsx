import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Camera, MapPin, Send } from 'lucide-react';

export default function Reports() {
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * COMMUNITY REPORT SUBMISSION
   * This sends the user's observation to the database.
   * Severity levels help the 'Safe Route Engine' weigh the risk of a path.
   */
  async function handleReportSubmit(event: React.FormEvent) {
    event.preventDefault();
    
    // Simple validation: Ensure there is a description
    if (!description.trim()) {
      return alert("Please enter a description of the hazard.");
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('safety_reports').insert({
        type: 'COMMUNITY_REPORT',
        description: description,
        severity: severity,
        status: 'pending'
      });

      if (error) throw error;

      alert("Thank you! Your report has been submitted for community verification.");
      // Reset form on success
      setDescription('');
      setSeverity(3);
    } catch (err) {
      console.error("Report Error:", err);
      alert("Something went wrong. Please check your network and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-space-navy-900 text-white p-6 pb-24">
      <header className="mb-10">
        <h1 className="text-2xl font-bold text-soft-lavender-400 flex items-center gap-2">
          <AlertCircle size={28} /> Community Report
        </h1>
        <p className="text-gray-400 text-sm mt-2 font-medium">
          Report hazards to help others stay safe.
        </p>
      </header>

      <form onSubmit={handleReportSubmit} className="space-y-8">
        {/* TEXT DESCRIPTION INPUT */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">
            Hazard Description
          </label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Broken street lights on 5th Ave, suspicious vehicle near the park..."
            className="
              w-full h-44 p-5 rounded-3xl bg-space-navy-800 border border-space-navy-700
              focus:border-neon-cyan-500 focus:ring-2 focus:ring-neon-cyan-500/20
              outline-none transition-all resize-none text-white placeholder:text-gray-600
            "
          />
        </div>

        {/* SEVERITY SLIDER */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-gray-300 uppercase tracking-widest">
              Severity Level
            </label>
            <span className={`px-4 py-1 rounded-full text-xs font-black border ${
              severity > 3 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-neon-cyan-500/10 border-neon-cyan-500 text-neon-cyan-500'
            }`}>
              LEVEL {severity}
            </span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={severity}
            onChange={(e) => setSeverity(parseInt(e.target.value))}
            className="w-full h-2 bg-space-navy-700 rounded-full appearance-none cursor-pointer accent-neon-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 font-black uppercase tracking-widest">
            <span>Minor Concern</span>
            <span>Moderate</span>
            <span>High Danger</span>
          </div>
        </div>

        {/* ACTION BUTTONS: Add Photo and Location */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            type="button" 
            className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-space-navy-800 border border-space-navy-700 active:bg-space-navy-700 transition-colors"
          >
            <Camera size={20} className="text-neon-cyan-500" />
            <span className="text-sm font-bold">Add Photo</span>
          </button>
          <button 
            type="button" 
            className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-space-navy-800 border border-space-navy-700 active:bg-space-navy-700 transition-colors"
          >
            <MapPin size={20} className="text-neon-cyan-500" />
            <span className="text-sm font-bold">Auto Locate</span>
          </button>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`
            w-full py-5 rounded-3xl font-black text-space-navy-900 bg-neon-cyan-500
            flex items-center justify-center gap-3 transition-transform active:scale-95
            shadow-[0_10px_30px_rgba(0,225,255,0.25)]
            ${isSubmitting ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}
          `}
        >
          <Send size={20} />
          {isSubmitting ? 'UPLOADING...' : 'SUBMIT SAFETY REPORT'}
        </button>
      </form>
    </div>
  );
}