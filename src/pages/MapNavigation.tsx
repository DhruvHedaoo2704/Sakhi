import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
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
const stepIcon = createGlowIcon('#34d399'); // Neon Mint

type GeoSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
};

async function fetchGeocode(query: string, signal?: AbortSignal): Promise<GeoSuggestion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error('Failed to fetch geocoding results');
  return res.json();
}

// Routing Component
const RoutingEngine = ({ start, end, show, onRouteFound }: any) => {
  const map = useMap();
  useEffect(() => {
    if (!map || !show || !start || !end) return;

    const routingControl = (L as any).Routing.control({
      waypoints: [start, end],
      lineOptions: { styles: [{ color: '#00e1ff', weight: 6, opacity: 0.8, className: 'animate-pulse' }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: false,
      createMarker: (i: number, wp: any) => {
        return L.marker(wp.latLng, {
          icon: i === 0 ? createGlowIcon('#ffffff') : destinationIcon
        });
      }
    }).addTo(map);

    routingControl.on('routesfound', (e: any) => {
      onRouteFound(e.routes[0]);
    });

    return () => { if (map && routingControl) map.removeControl(routingControl); };
  }, [map, start, end, show]);
  return null;
};

const MapRecenter = ({ center, follow }: { center: L.LatLng; follow: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (!follow) return;
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, follow, map]);
  return null;
};

function computeRemainingDistance(route: L.LatLng[], current: L.LatLng): number | null {
  if (route.length < 2) return null;
  let nearestIndex = 0;
  let nearestDist = Infinity;
  route.forEach((pt, idx) => {
    const d = current.distanceTo(pt);
    if (d < nearestDist) {
      nearestDist = d;
      nearestIndex = idx;
    }
  });

  let remaining = 0;
  for (let i = nearestIndex; i < route.length - 1; i++) {
    remaining += route[i].distanceTo(route[i + 1]);
  }
  return remaining;
}

function toMetersXY(point: L.LatLng, origin: L.LatLng) {
  const latFactor = 110540;
  const lngFactor = 111320 * Math.cos((origin.lat * Math.PI) / 180);
  return {
    x: (point.lng - origin.lng) * lngFactor,
    y: (point.lat - origin.lat) * latFactor
  };
}

function pointToSegmentDistanceMeters(point: L.LatLng, a: L.LatLng, b: L.LatLng): number {
  const p = toMetersXY(point, point);
  const aM = toMetersXY(a, point);
  const bM = toMetersXY(b, point);
  const dx = bM.x - aM.x;
  const dy = bM.y - aM.y;
  if (dx === 0 && dy === 0) {
    const distX = p.x - aM.x;
    const distY = p.y - aM.y;
    return Math.sqrt(distX * distX + distY * distY);
  }
  const t = Math.max(0, Math.min(1, ((p.x - aM.x) * dx + (p.y - aM.y) * dy) / (dx * dx + dy * dy)));
  const projX = aM.x + t * dx;
  const projY = aM.y + t * dy;
  const distX = p.x - projX;
  const distY = p.y - projY;
  return Math.sqrt(distX * distX + distY * distY);
}

function computeMinDistanceToRouteMeters(route: L.LatLng[], current: L.LatLng): number {
  if (route.length === 0) return Infinity;
  if (route.length === 1) return current.distanceTo(route[0]);
  let minDistance = Infinity;
  for (let i = 0; i < route.length - 1; i++) {
    const distance = pointToSegmentDistanceMeters(current, route[i], route[i + 1]);
    if (distance < minDistance) minDistance = distance;
  }
  return minDistance;
}

export default function MapNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTravelling, setIsTravelling] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [panelSize, setPanelSize] = useState('medium');
  const [safeHavens, setSafeHavens] = useState<any[]>([]);
  const [dangerZones, setDangerZones] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<L.LatLng[]>([]);
  const [routeSummary, setRouteSummary] = useState<{ distance: number; time: number } | null>(null);
  const [routeSteps, setRouteSteps] = useState<any[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(() => {
    const stored = localStorage.getItem('sakhi_voice_muted');
    return stored === 'true';
  });
  const [isDeviated, setIsDeviated] = useState(false);
  const [stationaryAlerted, setStationaryAlerted] = useState(false);
  const [hasLiveFix, setHasLiveFix] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  // State for Navigation Inputs
  const [startLocation, setStartLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<GeoSuggestion[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<GeoSuggestion[]>([]);
  const [isStartSearching, setIsStartSearching] = useState(false);
  const [isDropSearching, setIsDropSearching] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [currentPos, setCurrentPos] = useState<L.LatLng>(new L.LatLng(19.0760, 72.8777));
  const [startCoords, setStartCoords] = useState<L.LatLng | null>(null);
  const [dropCoords, setDropCoords] = useState<L.LatLng | null>(null);
  const [routeStart, setRouteStart] = useState<L.LatLng | null>(null);
  const [routeEnd, setRouteEnd] = useState<L.LatLng | null>(null);
  const [travelStartedAt, setTravelStartedAt] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastMoveAtRef = useRef<number | null>(null);
  const lastPosRef = useRef<L.LatLng | null>(null);
  const lastSpokenStepRef = useRef<number | null>(null);
  const stepsListRef = useRef<HTMLDivElement | null>(null);

  // Initialize from Home Page State
  useEffect(() => {
    if (location.state?.startCoords) {
      const [lat, lng] = location.state.startCoords;
      setCurrentPos(new L.LatLng(lat, lng));
      setStartCoords(new L.LatLng(lat, lng));
      setStartLocation('Current Location (Live GPS)');
      setIsSearching(true);
    }
  }, [location.state]);

  // Deviation Logic: 50m Safety Buffer
  useEffect(() => {
    if (!isTravelling || isPaused || routeCoords.length === 0 || !hasLiveFix || !routeStart) return;
    if (travelStartedAt && Date.now() - travelStartedAt < 15000) return;
    if (currentPos.distanceTo(routeStart) < 80) return;
    if (accuracy !== null && accuracy > 120) return;

    const minDistance = computeMinDistanceToRouteMeters(routeCoords, currentPos);
    const adaptiveThreshold = Math.max(50, Math.min(120, (accuracy ?? 0) * 1.5));
    setIsDeviated(minDistance > adaptiveThreshold);
  }, [currentPos, routeCoords, isTravelling, isPaused, hasLiveFix, routeStart, travelStartedAt, accuracy]);

  useEffect(() => {
    if (!isTravelling || isPaused || routeSteps.length === 0 || routeCoords.length === 0) return;
    const totalStepsDistance = routeSteps.reduce((sum, step) => {
      return sum + (typeof step.distance === 'number' ? step.distance : 0);
    }, 0);
    const remaining = computeRemainingDistance(routeCoords, currentPos);
    if (totalStepsDistance > 0 && remaining !== null) {
      const traveled = Math.max(0, totalStepsDistance - remaining);
      let cumulative = 0;
      let nextIndex = 0;
      for (let i = 0; i < routeSteps.length; i++) {
        cumulative += typeof routeSteps[i].distance === 'number' ? routeSteps[i].distance : 0;
        if (traveled <= cumulative) {
          nextIndex = i;
          break;
        }
        nextIndex = i;
      }
      setCurrentStepIndex(nextIndex);
    } else {
      setCurrentStepIndex(0);
    }
  }, [isTravelling, isPaused, routeSteps, routeCoords, currentPos]);

  useEffect(() => {
    localStorage.setItem('sakhi_voice_muted', String(voiceMuted));
  }, [voiceMuted]);

  useEffect(() => {
    if (!isTravelling || isPaused || voiceMuted || routeSteps.length === 0) return;
    if (currentStepIndex === lastSpokenStepRef.current) return;
    const step = routeSteps[currentStepIndex];
    if (!step) return;
    const text = step.text || step.type || 'Continue';
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn('Speech synthesis failed', err);
      }
    }
    lastSpokenStepRef.current = currentStepIndex;
  }, [isTravelling, isPaused, currentStepIndex, routeSteps, voiceMuted]);

  useEffect(() => {
    if (!stepsListRef.current) return;
    const container = stepsListRef.current;
    const active = container.querySelector('[data-active="true"]') as HTMLElement | null;
    if (active) {
      container.scrollTo({ top: Math.max(0, active.offsetTop - 32), behavior: 'smooth' });
    }
  }, [currentStepIndex, showAllSteps]);

  useEffect(() => {
    if (!startLocation || startCoords) {
      setStartSuggestions([]);
      return;
    }
    if (startLocation.trim().length < 3) {
      setStartSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setIsStartSearching(true);
      try {
        const data = await fetchGeocode(startLocation, controller.signal);
        setStartSuggestions(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err);
      } finally {
        setIsStartSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [startLocation, startCoords]);

  useEffect(() => {
    if (!dropLocation || dropCoords) {
      setDropSuggestions([]);
      return;
    }
    if (dropLocation.trim().length < 3) {
      setDropSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setIsDropSearching(true);
      try {
        const data = await fetchGeocode(dropLocation, controller.signal);
        setDropSuggestions(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err);
      } finally {
        setIsDropSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [dropLocation, dropCoords]);

  useEffect(() => {
    if (!isTravelling || isPaused) {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
      setIsTracking(false);
      return;
    }

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    if (watchIdRef.current !== null) return;

    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nextPos = new L.LatLng(latitude, longitude);
        setCurrentPos(nextPos);
        setAccuracy(typeof position.coords.accuracy === 'number' ? position.coords.accuracy : null);
        setHasLiveFix(true);

        if (!lastPosRef.current) {
          lastPosRef.current = nextPos;
          lastMoveAtRef.current = Date.now();
          return;
        }

        const moved = lastPosRef.current.distanceTo(nextPos) > 5;
        if (moved) {
          lastPosRef.current = nextPos;
          lastMoveAtRef.current = Date.now();
        }
      },
      (error) => {
        console.error('Live tracking error', error);
        setLocationError(error.message || 'Failed to read location.');
        setAccuracy(null);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
      setIsTracking(false);
    };
  }, [isTravelling, isPaused]);

  useEffect(() => {
    if (!isTravelling) {
      setStationaryAlerted(false);
      setHasLiveFix(false);
      setAccuracy(null);
      lastMoveAtRef.current = Date.now();
      lastPosRef.current = currentPos;
      return;
    }

    if (panelSize !== 'large') return;
    if (isPaused) return;
    if (stationaryAlerted) return;

    const interval = setInterval(() => {
      const lastMove = lastMoveAtRef.current;
      if (!lastMove) return;
      if (Date.now() - lastMove > 3 * 60 * 1000) {
        setStationaryAlerted(true);
        alert('Stationary Alert: You have not moved for 3 minutes. Guardians are being notified.');
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isTravelling, panelSize, stationaryAlerted, currentPos, isPaused]);

  useEffect(() => {
    async function loadData() {
      const { data: havens } = await supabase.from('safe_places').select('*');
      const { data: zones } = await supabase.from('danger_zones').select('*');
      if (havens) setSafeHavens(havens);
      if (zones) setDangerZones(zones);
    }
    loadData();
  }, []);

  async function handleUseCurrentLocation() {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const next = new L.LatLng(latitude, longitude);
        setCurrentPos(next);
        setStartCoords(next);
        setStartLocation('Current Location (Live GPS)');
        setStartSuggestions([]);
      },
      (error) => {
        console.error('Location error', error);
        alert(error.message || 'Failed to access location.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }

  function handleStartTravel() {
    if (!startCoords) {
      alert('Please select a Boarding location or use your current location.');
      return;
    }
    if (!dropCoords) {
      alert('Please select a Drop location.');
      return;
    }

    setRouteStart(startCoords);
    setRouteEnd(dropCoords);
    setIsTravelling(true);
    setIsSearching(false);
    setStationaryAlerted(false);
    setIsDeviated(false);
    setHasLiveFix(false);
    setIsPaused(false);
    setTravelStartedAt(Date.now());
    setCurrentPos(startCoords);
    lastMoveAtRef.current = Date.now();
    lastPosRef.current = startCoords;
  }

  function handlePauseToggle() {
    setIsPaused((prev) => !prev);
  }

  function handleStopTravel() {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setIsTracking(false);
    setIsTravelling(false);
    setIsPaused(false);
    setVoiceMuted(false);
    setIsDeviated(false);
    setRouteCoords([]);
  }

  function handleReroute() {
    if (!dropCoords) {
      alert('Please select a Drop location.');
      return;
    }
    setRouteCoords([]);
    setIsDeviated(false);
    setRouteStart(currentPos);
    setRouteEnd(dropCoords);
    setRouteSummary(null);
    setRouteSteps([]);
    setCurrentStepIndex(0);
    setTravelStartedAt(Date.now());
  }

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
                  <label className="text-[10px] text-neon-cyan-400 font-bold tracking-wider uppercase block mb-1">Boarding</label>
                  <input
                    type="text"
                    value={startLocation}
                    onChange={(e) => {
                      setStartLocation(e.target.value);
                      setStartCoords(null);
                    }}
                    placeholder="Boarding location"
                    className="w-full bg-space-navy-800/50 border-b border-gray-600 focus:border-neon-cyan-500 text-sm py-1 outline-none text-white placeholder-gray-500 transition-colors"
                  />
                  {/* Start Suggestions */}
                  {startLocation.length > 1 && !startCoords && (
                    <div className="absolute top-full left-0 w-full bg-space-navy-900/95 border border-neon-cyan-500/30 rounded-b-xl shadow-xl max-h-40 overflow-y-auto z-[100]">
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        className="w-full px-4 py-2 text-left hover:bg-neon-cyan-500/20 text-xs flex justify-between items-center border-b border-white/5"
                      >
                        <span>Use Current Location</span>
                        <span className="text-[10px] text-gray-400 uppercase">GPS</span>
                      </button>
                      {isStartSearching && (
                        <div className="px-4 py-2 text-xs text-gray-400">Searching...</div>
                      )}
                      {startSuggestions.map((place, idx) => (
                        <div
                          key={`${place.lat}-${place.lon}-${idx}`}
                          onClick={() => {
                            const next = new L.LatLng(parseFloat(place.lat), parseFloat(place.lon));
                            setStartLocation(place.display_name);
                            setStartCoords(next);
                            setCurrentPos(next);
                            setStartSuggestions([]);
                          }}
                          className="px-4 py-2 hover:bg-neon-cyan-500/20 cursor-pointer text-xs flex justify-between items-center border-b border-white/5 last:border-0"
                        >
                          <span className="line-clamp-1">{place.display_name}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{place.type || 'Place'}</span>
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
                  <label className="text-[10px] text-soft-lavender-400 font-bold tracking-wider uppercase block mb-1">Drop</label>
                  <input
                    type="text"
                    value={dropLocation}
                    onChange={(e) => {
                      setDropLocation(e.target.value);
                      setDropCoords(null);
                    }}
                    placeholder="Drop location"
                    autoFocus={!!location.state?.startCoords}
                    className="w-full bg-space-navy-800/50 border-b border-gray-600 focus:border-soft-lavender-500 text-sm py-1 outline-none text-white placeholder-gray-500 transition-colors"
                  />
                  {/* Drop Suggestions */}
                  {dropLocation.length > 1 && !dropCoords && (
                    <div className="absolute top-full left-0 w-full bg-space-navy-900/95 border border-soft-lavender-500/30 rounded-b-xl shadow-xl max-h-40 overflow-y-auto z-[100]">
                      {isDropSearching && (
                        <div className="px-4 py-2 text-xs text-gray-400">Searching...</div>
                      )}
                      {dropSuggestions.map((place, idx) => (
                        <div
                          key={`${place.lat}-${place.lon}-${idx}`}
                          onClick={() => {
                            setDropLocation(place.display_name);
                            setDropCoords(new L.LatLng(parseFloat(place.lat), parseFloat(place.lon)));
                            setDropSuggestions([]);
                          }}
                          className="px-4 py-2 hover:bg-soft-lavender-500/20 cursor-pointer text-xs flex justify-between items-center border-b border-white/5 last:border-0"
                        >
                          <span className="line-clamp-1">{place.display_name}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{place.type || 'Place'}</span>
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

          <MapRecenter center={currentPos} follow={isTravelling && !isPaused} />

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

          {routeStart && routeEnd && (
            <RoutingEngine
              start={routeStart}
              end={routeEnd}
              show={isTravelling}
              onRouteFound={(route: any) => {
                setRouteCoords(route.coordinates || []);
                if (route?.summary) {
                  setRouteSummary({
                    distance: route.summary.totalDistance,
                    time: route.summary.totalTime
                  });
                } else {
                  setRouteSummary(null);
                }
                const steps = route?.instructions || route?.instructions?.length ? route.instructions : [];
                setRouteSteps(Array.isArray(steps) ? steps : []);
                setCurrentStepIndex(0);
                lastSpokenStepRef.current = null;
              }}
            />
          )}

          {isTravelling && routeSteps[currentStepIndex]?.latLng && (
            <Marker position={routeSteps[currentStepIndex].latLng} icon={stepIcon}>
              <Popup className="glass-popup">
                <div className="font-bold text-space-navy-900">Next Step</div>
                <div className="text-xs text-space-navy-700">
                  {routeSteps[currentStepIndex]?.text || 'Continue'}
                </div>
              </Popup>
            </Marker>
          )}

          {!isTravelling && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xs px-4">
              <button
                onClick={handleStartTravel}
                className="w-full bg-neon-cyan-500 text-space-navy-900 px-8 py-4 rounded-2xl font-black text-lg shadow-neon-cyan hover:scale-105 transition-transform flex items-center justify-center gap-2 group"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 w-full h-full skew-x-12"></div>
                <Navigation size={20} className="relative z-10" />
                <span className="relative z-10">START SAFE TRAVEL</span>
              </button>
            </div>
          )}

          {isDeviated && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-red-600 text-white px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-bounce flex items-center gap-2">
              <AlertOctagon size={20} /> OFF ROUTE DETECTED
            </div>
          )}

          {isDeviated && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000]">
              <button
                onClick={handleReroute}
                className="bg-neon-cyan-500 text-space-navy-900 px-4 py-2 rounded-full font-bold text-xs shadow-neon-cyan hover:scale-105 transition-transform"
              >
                RE-ROUTE FROM CURRENT POSITION
              </button>
            </div>
          )}

          {stationaryAlerted && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-space-navy-900 px-6 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(245,158,11,0.8)] flex items-center gap-2">
              <AlertOctagon size={20} /> STATIONARY ALERT SENT
            </div>
          )}

          {isTravelling && (
            <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
              <button
                onClick={handlePauseToggle}
                className="bg-space-navy-900/80 border border-space-navy-600 text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-space-navy-800/80 transition-colors"
              >
                {isPaused ? 'RESUME' : 'PAUSE'}
              </button>
              <button
                onClick={() => setVoiceMuted((prev) => !prev)}
                className="bg-space-navy-900/80 border border-space-navy-600 text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-space-navy-800/80 transition-colors"
              >
                {voiceMuted ? 'VOICE OFF' : 'VOICE ON'}
              </button>
              <button
                onClick={handleStopTravel}
                className="bg-red-600/90 text-white px-3 py-2 rounded-full text-xs font-bold hover:bg-red-500 transition-colors"
              >
                STOP
              </button>
            </div>
          )}
        </MapContainer>
      </motion.div>

      {locationError && (
        <div className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2">
          {locationError}
        </div>
      )}

      {isTravelling && (
        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-gray-400 gap-2">
          <span>{isTracking ? 'Live tracking active' : 'Live tracking paused'}</span>
          {routeSummary && (
            <span>
              {Math.round(routeSummary.distance / 100) / 10} km - {Math.round(routeSummary.time / 60)} min
            </span>
          )}
          {accuracy !== null && (
            <span>GPS +/-{Math.round(accuracy)} m</span>
          )}
          <span>{panelSize === 'large' ? 'Guardian Mode enabled' : 'Guardian Mode off'}</span>
        </div>
      )}

      {isTravelling && routeSteps.length > 0 && (
        <div className="mt-4 glass-panel border border-space-navy-700 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Turn by Turn</h3>
            {routeSummary && (
              <span className="text-[11px] text-gray-500">
                {Math.round(routeSummary.distance / 100) / 10} km - {Math.round(routeSummary.time / 60)} min
              </span>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto space-y-2" ref={stepsListRef}>
            {(showAllSteps ? routeSteps : routeSteps.slice(0, 8)).map((step: any, idx: number) => {
              const absoluteIndex = showAllSteps ? idx : idx;
              const isActive = absoluteIndex === currentStepIndex;
              return (
                <div
                  key={idx}
                  data-active={isActive ? 'true' : 'false'}
                  className={`flex items-center justify-between text-xs ${isActive ? 'text-neon-cyan-300' : 'text-gray-300'}`}
                >
                  <span className="line-clamp-1">
                    {step.text || step.type || 'Continue'}
                  </span>
                  {typeof step.distance === 'number' && (
                    <span className="text-[10px] text-gray-500">{Math.round(step.distance)} m</span>
                  )}
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setShowAllSteps((prev) => !prev)}
            className="mt-3 text-[11px] font-bold uppercase tracking-widest text-neon-cyan-400 hover:text-neon-cyan-300"
          >
            {showAllSteps ? 'Show Less' : 'Show All Steps'}
          </button>
        </div>
      )}

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


