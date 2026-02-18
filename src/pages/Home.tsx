import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle, Shield, Navigation, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
 

export default function Home() {
  const [isGuardianActive, setIsGuardianActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  async function handleSOS() {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('safety_reports').insert({
        user_id: user?.id,
        type: 'SOS_ALERT',
        description: 'Emergency SOS triggered by user from Dashboard',
        severity: 5,
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

  const handleStartPath = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        // Add artificial delay for UX (pulse animation visibility)
        setTimeout(() => {
          setIsLocating(false);
          navigate('/map', {
            state: {
              startCoords: [latitude, longitude],
              transition: true
            }
          });
        }, 800);
      }, (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        // Fallback to default navigating without precise coords if error (or handle UI error)
        navigate('/map');
      });
    } else {
      setIsLocating(false);
      alert("Geolocation is not supported by this browser.");
      navigate('/map');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-space-navy-900 text-white pb-24 relative overflow-hidden"
    >
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-space-navy-800 to-space-navy-900 z-0"></div>
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-neon-cyan-500/20 blur-[80px] rounded-full z-0"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-64 h-64 bg-soft-lavender-500/10 blur-[80px] rounded-full z-0"></div>

      {/* Guardian Heartbeat Line */}
      <div className="fixed top-0 left-0 w-full h-1 bg-space-navy-700 z-50">
        {isGuardianActive && (
          <div className="h-full bg-gradient-to-r from-transparent via-neon-mint-400 to-transparent w-full animate-heartbeat shadow-[0_0_10px_#3eb489]"></div>
        )}
      </div>

      <div className="relative z-10 px-6 pt-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan-400 to-soft-lavender-400 tracking-tighter">SAKHI</h1>
            <p className="text-gray-400 text-sm font-medium tracking-wide">Your Cyber-Guardian</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-space-navy-800 border border-neon-cyan-500/30 flex items-center justify-center shadow-neon-cyan">
            <Shield size={18} className="text-neon-cyan-400" />
          </div>
        </header>

        {/* Hero Section - Animated & Interactive */}
        <div className="mb-8 relative flex flex-col items-center">
          <motion.div
            layoutId="hero-guardian"
            className="relative w-80 h-80 mb-6"
          >
            {/* Glowing Platform */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-neon-cyan-500/30 blur-xl rounded-[100%] animate-pulse-slow"></div>

            {/* High-Fidelity SVG Illustration - Indian Cyber-Femme */}
            <svg viewBox="0 0 200 300" className="w-full h-full drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <defs>
                <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00e1ff" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <pattern id="circuit-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M1 1h8M1 1v8" fill="none" stroke="#00e1ff" strokeWidth="0.5" opacity="0.3" />
                  <rect x="2" y="2" width="1" height="1" fill="#00e1ff" opacity="0.5" />
                </pattern>
              </defs>

              <g className="animate-float">
                {/* Digital Aura / Saree Drape */}
                <path
                  d="M60,80 C40,110 30,160 35,220 C40,260 50,290 80,290 L130,290 C150,290 160,260 165,220 C170,160 160,110 140,80"
                  fill="url(#cyber-grad)"
                  opacity="0.1"
                  className="animate-pulse-slow"
                />

                {/* Head & Bun */}
                <circle cx="100" cy="50" r="18" fill="rgba(10, 25, 41, 0.9)" stroke="url(#cyber-grad)" strokeWidth="1" />
                <circle cx="100" cy="45" r="18" fill="rgba(10, 25, 41, 0.9)" />
                <path d="M82,50 Q100,20 118,50" fill="rgba(10, 25, 41, 0.9)" /> {/* Hairline */}
                <circle cx="100" cy="42" r="2" fill="#d946ef" /> {/* Bindi */}
                <circle cx="82" cy="55" r="2.5" fill="#ffd700" /> {/* Earring L */}
                <circle cx="118" cy="55" r="2.5" fill="#ffd700" /> {/* Earring R */}

                {/* Neck */}
                <rect x="92" y="68" width="16" height="10" fill="#d4a373" />

                {/* Kurti / Suit Body */}
                <path
                  d="M75,80 C65,85 55,100 50,130 L55,200 C58,220 142,220 145,200 L150,130 C145,100 135,85 125,80 L100,85 L75,80 Z"
                  fill="rgba(10, 25, 41, 0.95)"
                  stroke="url(#cyber-grad)"
                  strokeWidth="1.5"
                />
                {/* Circuit Pattern Overlay on Kurti */}
                <path
                  d="M75,80 C65,85 55,100 50,130 L55,200 C58,220 142,220 145,200 L150,130 C145,100 135,85 125,80 L100,85 L75,80 Z"
                  fill="url(#circuit-pattern)"
                  opacity="0.6"
                />

                {/* Dupatta Flow */}
                <path
                  d="M130,80 C150,80 160,100 155,140 C150,180 120,220 80,240"
                  stroke="url(#cyber-grad)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                />
                <path
                  d="M70,80 C50,80 40,100 45,140 C50,180 80,220 120,240"
                  stroke="url(#cyber-grad)"
                  strokeWidth="1"
                  fill="none"
                  opacity="0.5"
                />

                {/* Legs / Churidar */}
                <path d="M80,200 L75,280 L95,280 L90,200 Z" fill="rgba(10, 25, 41, 0.9)" />
                <path d="M120,200 L125,280 L105,280 L110,200 Z" fill="rgba(10, 25, 41, 0.9)" />

                {/* Hands in 'Namaste' / Shield Pose */}
                <path d="M70,130 L90,150 L100,140 L110,150 L130,130" fill="none" stroke="#d4a373" strokeWidth="8" strokeLinecap="round" />

                {/* Holographic Shield generated from hands */}
                <g transform="translate(100, 150)">
                  <path
                    d="M0,-30 L25,-10 L20,30 C15,45 0,55 0,55 C0,55 -15,45 -20,30 L-25,-10 Z"
                    fill="rgba(0, 225, 255, 0.15)"
                    stroke="#00e1ff"
                    strokeWidth="2"
                    className="animate-pulse-slow"
                  />
                  <circle cx="0" cy="0" r="40" stroke="#8b5cf6" strokeWidth="0.5" fill="none" className="animate-spin-slow" strokeDasharray="10,5" />
                  <path d="M-10,10 L0,20 L10,0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>

                {/* Data Particles */}
                <circle cx="40" cy="250" r="1.5" fill="#00e1ff" className="animate-float" style={{ animationDelay: '1.5s' }} />
                <circle cx="160" cy="260" r="2" fill="#d946ef" className="animate-float" style={{ animationDelay: '0.5s' }} />
              </g>
            </svg>
            {/* Optional: Fallback Image if user uploads one (hidden if SVG is preferred, or toggle logic can be added) */}
            {/* <img src={heroImage} className="hidden" alt="hidden-preload" /> */}
          </motion.div>

          {/* Primary Action Button */}
          <button
            onClick={handleStartPath}
            disabled={isLocating}
            className={`
                relative w-full max-w-xs bg-neon-cyan-500 text-space-navy-900 px-8 py-4 rounded-2xl font-black text-lg 
                shadow-[0_0_20px_rgba(0,225,255,0.4)] hover:scale-105 transition-transform flex items-center justify-center gap-3 overflow-hidden
                ${isLocating ? 'opacity-90 cursor-wait' : ''}
            `}
          >
            {isLocating && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
            <Navigation size={24} className={isLocating ? 'animate-spin' : ''} />
            {isLocating ? 'LOCATING...' : 'START SECURE PATH'}
          </button>
        </div>

        {/* SOS Button */}
        <div className="flex flex-col items-center justify-center mb-10">
          <button
            onClick={handleSOS}
            disabled={isSubmitting}
            className={`
              relative w-24 h-24 rounded-full flex flex-col items-center justify-center
              bg-gradient-to-br from-red-600 to-red-800 border-4 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.6)]
              transition-all duration-300 active:scale-95 group
              ${isSubmitting ? 'animate-pulse opacity-80' : ''}
            `}
          >
            {/* Ripple Effect Ring */}
            <div className="absolute inset-0 rounded-full border border-red-500 animate-ripple opacity-50"></div>

            <AlertTriangle size={32} className="text-white drop-shadow-lg z-10" strokeWidth={2.5} />
            <span className="font-black text-xs mt-1 tracking-widest text-white z-10">SOS</span>
          </button>
        </div>

        {/* Status Cards */}
        <div className="space-y-4">
          <div
            onClick={() => setIsGuardianActive(!isGuardianActive)}
            className={`
              glass-panel p-5 flex items-center justify-between cursor-pointer
              transition-all duration-300 border-l-4
              ${isGuardianActive ? 'border-l-neon-mint-400 bg-neon-mint-500/10' : 'border-l-space-navy-600'}
            `}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isGuardianActive ? 'bg-neon-mint-500/20 text-neon-mint-400' : 'bg-space-navy-700 text-gray-400'}`}>
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Guardian Shield</h3>
                <p className="text-xs text-gray-400 mt-1">{isGuardianActive ? 'Active Monitoring On' : 'Tap to Activate'}</p>
              </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isGuardianActive ? 'bg-neon-mint-500 animate-pulse' : 'bg-gray-600'}`}></div>
          </div>

          <div
            onClick={() => navigate('/map')}
            className="glass-panel p-5 flex items-center justify-between border-l-4 border-l-neon-cyan-500 cursor-pointer hover:bg-space-navy-800/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-neon-cyan-500/20 text-neon-cyan-400">
                <Navigation size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Safe Route</h3>
                <p className="text-xs text-gray-400 mt-1">Navigate via Safe Havens</p>
              </div>
            </div>
            <ChevronRight className="text-space-navy-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}