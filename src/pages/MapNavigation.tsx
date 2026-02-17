import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine'; // Import purely for side-effects
import { ShieldCheck, Navigation, AlertOctagon, MapPin, Flag, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Custom "Soft Glow" Marker
const createGlowIcon = (color: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; box-shadow: 0 0 15px ${color}, 0 0 30px ${color}; border: 2px solid white;"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const safeHavenIcon = createGlowIcon('#00e1ff'); // Neon Cyan
const destinationIcon = createGlowIcon('#8b5cf6'); // Soft Lavender

const mockPlaces = [
  { name: "Chhatrapati Shivaji Terminus", lat: 18.9400, lng: 72.8353, type: "Landmark" },
  { name: "Marine Drive", lat: 18.944, lng: 72.823, type: "Popular" },
  { name: "Siddhivinayak Temple", lat: 19.017, lng: 72.830, type: "Landmark" },
  { name: "Bandra-Worli Sea Link", lat: 19.036, lng: 72.817, type: "Bridge" },
  { name: "Juhu Beach", lat: 19.098, lng: 72.826, type: "Public" },
  { name: "Phoenix Marketcity", lat: 19.086, lng: 72.888, type: "Mall" },
  { name: "Powai Lake", lat: 19.123, lng: 72.905, type: "Nature" },
  { name: "Andheri Metro Station", lat: 19.119, lng: 72.846, type: "Transport" },
  { name: "Safe Haven - Bandra", lat: 19.054, lng: 72.840, type: "Safe Zone" },
  { name: "Safe Haven - Colaba", lat: 18.910, lng: 72.820, type: "Safe Zone" },
  { name: "Mumbai University", lat: 19.073, lng: 72.856, type: "Education" },
];

// Routing Component
const RoutingEngine = ({ start, end, show, onRouteFound }: any) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !show || !start || !end) return;

    // Type assertion to bypass missing type definition for leaflet-routing-machine
    const routingControl = (L as any).Routing.control({
      waypoints: [start, end],
      lineOptions: { styles: [{ color: '#00e1ff', weight: 6, opacity: 0.8, className: 'animate-pulse' }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false, // Hide default container
      createMarker: (i: number, wp: any) => {
        return L.marker(wp.latLng, {
          icon: i === 0 ? createGlowIcon('#ffffff') : destinationIcon
        });
      }
    }).addTo(map);

    routingControl.on('routesfound', (e: any) => {
      onRouteFound(e.routes[0].coordinates);
    });

    return () => { if (map && routingControl) map.removeControl(routingControl); };
  }, [map, start, end, show]);
  return null;
};

export default function MapNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTravelling, setIsTravelling] = useState(false);
  const [panelSize, setPanelSize] = useState('medium');
  const [safeHavens, setSafeHavens] = useState<any[]>([]);
  const [dangerZones, setDangerZones] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<L.LatLng[]>([]);
  const [isDeviated, setIsDeviated] = useState(false);

  // State for Navigation Inputs
  const [startLocation, setStartLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [currentPos, setCurrentPos] = useState<L.LatLng>(new L.LatLng(19.0760, 72.8777));
  const [destination] = useState<L.LatLng>(new L.LatLng(19.1136, 72.8697));

  // Initialize from Home Page State
  useEffect(() => {
    if (location.state?.startCoords) {
      const [lat, lng] = location.state.startCoords;
      setCurrentPos(new L.LatLng(lat, lng));
      setStartLocation('Current Location (Live GPS)');
      setIsSearching(true); // Auto-open search if transitioned from "Start Secure Path"
    }
  }, [location.state]);

  // Deviation Logic: 50m Safety Buffer
  useEffect(() => {
    if (!isTravelling || routeCoords.length === 0) return;
    let minDistance = Infinity;
    routeCoords.forEach((coord: any) => {
      const dist = currentPos.distanceTo(coord);
      if (dist < minDistance) minDistance = dist;
    });
    setIsDeviated(minDistance > 50);
  }, [currentPos, routeCoords, isTravelling]);

  useEffect(() => {
    async function loadData() {
      const { data: havens } = await supabase.from('safe_places').select('*');
      const { data: zones } = await supabase.from('danger_zones').select('*');
      if (havens) setSafeHavens(havens);
      if (zones) setDangerZones(zones);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-space-navy-900 text-white p-4 pb-24 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-neon-cyan-500/10 blur-[100px] rounded-full z-0"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-soft-lavender-500/10 blur-[80px] rounded-full z-0"></div>

      <header className="mb-6 flex justify-between items-center relative z-10">
        <div onClick={() => navigate('/')} className="cursor-pointer">
          <h1 className="text-2xl font-black text-neon-cyan-500 uppercase flex items-center gap-2 tracking-tighter">
            <ShieldCheck size={28} /> SAKHI NAV
          </h1>
          <p className="text-xs text-soft-lavender-400 font-bold tracking-widest ml-9">SECURE PATHFINDER</p>
        </div>

        <select value={panelSize} onChange={(e) => setPanelSize(e.target.value)} className="glass-panel text-xs p-2 px-4 focus:outline-none focus:border-neon-cyan-500">
          <option value="small" className="bg-space-navy-900">Compact</option>
          <option value="medium" className="bg-space-navy-900">Standard</option>
          <option value="large" className="bg-space-navy-900">Guardian</option>
        </select>
      </header>

      {/* Navigation Input Panel - Floating Glass */}
      <AnimatePresence>
        {(isSearching || !isTravelling) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-30 mb-4"
          >
            <div className="glass-panel p-4 border border-neon-cyan-500/50 shadow-[0_0_20px_rgba(0,225,255,0.2)]">
              {/* Start Input */}
              <div className="flex items-center gap-3 mb-3 relative z-50">
                <MapPin size={18} className="text-neon-cyan-400" />
                <div className="flex-1 relative">
                  <label className="text-[10px] text-neon-cyan-400 font-bold tracking-wider uppercase block mb-1">Start Point</label>
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="Choose start location"
                    className="w-full bg-space-navy-800/50 border-b border-gray-600 focus:border-neon-cyan-500 text-sm py-1 outline-none text-white placeholder-gray-500 transition-colors"
                  />
                  {/* Start Suggestions */}
                  {startLocation.length > 1 && !startLocation.includes('(') && (
                    <div className="absolute top-full left-0 w-full bg-space-navy-900/95 border border-neon-cyan-500/30 rounded-b-xl shadow-xl max-h-40 overflow-y-auto z-[100]">
                      {mockPlaces.filter(p => p.name.toLowerCase().includes(startLocation.toLowerCase())).map((place, idx) => (
                        <div
                          key={idx}
                          onClick={() => { setStartLocation(place.name); setCurrentPos(new L.LatLng(place.lat, place.lng)); }}
                          className="px-4 py-2 hover:bg-neon-cyan-500/20 cursor-pointer text-xs flex justify-between items-center border-b border-white/5 last:border-0"
                        >
                          <span>{place.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{place.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Drop Input */}
              <div className="flex items-center gap-3 relative z-40">
                <Flag size={18} className="text-soft-lavender-400" />
                <div className="flex-1 relative">
                  <label className="text-[10px] text-soft-lavender-400 font-bold tracking-wider uppercase block mb-1">Destination</label>
                  <input
                    type="text"
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    placeholder="Where to?"
                    autoFocus={!!location.state?.startCoords}
                    className="w-full bg-space-navy-800/50 border-b border-gray-600 focus:border-soft-lavender-500 text-sm py-1 outline-none text-white placeholder-gray-500 transition-colors"
                  />
                  {/* Drop Suggestions */}
                  {dropLocation.length > 1 && (
                    <div className="absolute top-full left-0 w-full bg-space-navy-900/95 border border-soft-lavender-500/30 rounded-b-xl shadow-xl max-h-40 overflow-y-auto z-[100]">
                      {mockPlaces.filter(p => p.name.toLowerCase().includes(dropLocation.toLowerCase())).map((place, idx) => (
                        <div
                          key={idx}
                          onClick={() => setDropLocation(place.name)}
                          className="px-4 py-2 hover:bg-soft-lavender-500/20 cursor-pointer text-xs flex justify-between items-center border-b border-white/5 last:border-0"
                        >
                          <span>{place.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{place.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Pulse Search Icon */}
                <div className="p-2 bg-neon-cyan-500/20 rounded-full animate-pulse">
                  <Search size={16} className="text-neon-cyan-400" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container */}
      <motion.div
        layoutId="hero-guardian"
        className={`
        w-full h-[55vh] rounded-[2.5rem] overflow-hidden relative z-10 transition-all duration-1000
        ${isTravelling ? 'border-4 border-neon-cyan-500 shadow-neon-cyan animate-breathe-cyan h-[65vh]' : 'border border-space-navy-600 shadow-lg'}
        ${isDeviated ? 'border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse' : ''}
      `}>
        <MapContainer center={[currentPos.lat, currentPos.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            className="map-tiles"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Safe Havens */}
          {safeHavens.map(h => (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={safeHavenIcon}>
              <Popup className="glass-popup">
                <div className="font-bold text-space-navy-900">{h.name}</div>
                <div className="text-xs text-space-navy-700">Safe Haven</div>
              </Popup>
            </Marker>
          ))}

          {/* Danger Zones */}
          {dangerZones.map(z => (
            <Circle key={z.id} center={[z.lat, z.lng]} radius={300} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.2, weight: 1, dashArray: '5, 10' }} />
          ))}

          <RoutingEngine start={currentPos} end={destination} show={isTravelling} onRouteFound={setRouteCoords} />

          {!isTravelling && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xs px-4">
              <button
                onClick={() => {
                  setIsTravelling(true);
                  setIsSearching(false);
                }}
                className="w-full bg-neon-cyan-500 text-space-navy-900 px-8 py-4 rounded-2xl font-black text-lg shadow-neon-cyan hover:scale-105 transition-transform flex items-center justify-center gap-2 group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 w-full h-full skew-x-12"></div>
                <Navigation size={20} className="relative z-10" />
                <span className="relative z-10">START WARP</span>
              </button>
            </div>

          )}

          {isDeviated && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-bounce flex items-center gap-2">
              <AlertOctagon size={20} /> OFF ROUTE DETECTED
            </div>
          )}
        </MapContainer>
      </motion.div>

      {/* Footer Info */}
      <div className="mt-4 flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-cyan-500 shadow-[0_0_10px_#00e1ff]"></div>
          <span className="text-xs text-gray-400">Safe Havens</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500"></div>
          <span className="text-xs text-gray-400">High Risk Zones</span>
        </div>
      </div>
    </div>
  );
}