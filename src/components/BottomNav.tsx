import React from 'react';
import { Shield, Map, AlertCircle, User } from 'lucide-react';

// Defining the types for our props for clear, un-minified code
interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  // Configuration for each button
  const tabs = [
    { id: 'home', icon: Shield, label: 'Guardian' },
    { id: 'map', icon: Map, label: 'Navigation' },
    { id: 'reports', icon: AlertCircle, label: 'Reports' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-space-navy-900/90 backdrop-blur-lg border-t border-space-navy-800 px-6 py-3 pb-8 flex justify-around items-center z-50">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            // THE FIX: This onClick updates the 'App' state, triggering the page swap
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex flex-col items-center gap-1 transition-all duration-300 relative
              ${isActive ? 'text-neon-cyan-500 scale-110' : 'text-gray-500 hover:text-gray-300'}
            `}
          >
            {/* Icon visual */}
            <tab.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            
            {/* Label text */}
            <span className="text-[10px] font-black uppercase tracking-tighter">
              {tab.label}
            </span>

            {/* Active Indicator Dot */}
            {isActive && (
              <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-neon-cyan-500 shadow-[0_0_8px_rgba(0,225,255,0.8)]" />
            )}
          </button>
        );
      })}
    </nav>
  );
}