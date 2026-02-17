import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/BottomNav';

const Home = lazy(() => import('./pages/Home'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const MapNavigation = lazy(() => import('./pages/MapNavigation'));

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/map" element={<MapNavigation />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-space-navy-900 overflow-x-hidden">
        <main className="pb-24">
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-neon-cyan-500 animate-pulse">Loading Sakhi...</div>}>
            <AnimatedRoutes />
          </Suspense>
        </main>

        <BottomNav />
      </div>
    </BrowserRouter>
  );
}