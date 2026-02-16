import React, { useState, Suspense, lazy } from 'react';
import BottomNav from './components/BottomNav';

const Home = lazy(() => import('./pages/Home'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const MapNavigation = lazy(() => import('./pages/MapNavigation')); // NEW IMPORT

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="relative min-h-screen bg-space-navy-900 overflow-x-hidden">
      <main className="pb-24">
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-neon-cyan-500 animate-pulse">Loading Sakhi...</div>}>
          {activeTab === 'home' && <Home />}
          {activeTab === 'reports' && <Reports />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'map' && <MapNavigation />} 
        </Suspense>
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}