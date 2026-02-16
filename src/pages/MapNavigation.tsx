import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { Play, Maximize2, ShieldCheck, AlertTriangle, Home as HomeIcon, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Fix for Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RoutingEngine = ({ start, end, show, onRouteFound }: any) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !show) return;

    const routingControl = (L as any).Routing.control({
      waypoints: [start, end],
      lineOptions: {
        styles: [{ color: '#00e1ff', weight: 6, opacity: 0.8 }]
      },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true,
      collapsible: false,
      itinerary: { collapseOnStart: false, collapsible: false },
      createMarker: () => null 
    }).addTo(map);

    // Capture the route coordinates for deviation checking
    routingControl.on('routesfound', (e: any) => {
      const routes = e.routes;
      const coordinates = routes[0].coordinates;
      onRouteFound(coordinates);
    });

    return () => {
      if (map && routingControl) {
        try { map.removeControl(routingControl); } catch (e) { console.debug(e); }
      }
    };
  }, [map, start, end, show]);

  return null;
};

export default function MapNavigation() {
  const [isTravelling, setIsTravelling] = useState(false);
  const [panelSize, setPanelSize] = useState('medium');
  const [safeHavens, setSafeHavens] = useState<any[]>([]);
  const [dangerZones, setDangerZones] = useState<any[]>([]);
  const [routeCoords, setRouteCoords] = useState<L.LatLng[]>([]);
  const [isDeviated, setIsDeviated] = useState(false);
  
  const [currentPos, setCurrentPos] = useState<L.LatLng>(new L.LatLng(19.0760, 72.8777));
  const [destination] = useState<L.LatLng>(new L.LatLng(19.1136, 72.8697));

  /**
   * DEVIATION CHECKER (Guardian Mode Logic)
   * Compares current GPS to the nearest point on the safe route.
   */
  useEffect(() => {
    if (!isTravelling || routeCoords.length === 0) return;

    const checkDeviation = () => {
      let minDistance = Infinity;
      
      routeCoords.forEach((coord: any) => {
        const dist = currentPos.distanceTo(coord);
        if (dist < minDistance) minDistance = dist;
      });

      // If user is > 50 meters away, trigger Guardian Alert
      if (minDistance > 50) {
        setIsDeviated(true);
        console.warn("Guardian Alert: User deviated from safe path!");
      } else {
        setIsDeviated(false);
      }
    };

    checkDeviation();
  }, [currentPos, routeCoords, isTravelling]);

  useEffect(() => {
    async function loadSafetyData() {
      const { data: havens } = await supabase.from('safe_places').select('*');
      if (havens) setSafeHavens(havens);

      const { data: zones } = await supabase.from('danger_zones').select('*');
      if (zones) setDangerZones(zones);
    }
    loadSafetyData();
  }, []);

  const sizeStyles = {
    small: { width: '280px', maxHeight: '30vh' },
    medium: { width: '380px', maxHeight: '50vh' },
    large: { width: '92vw', maxHeight: '70vh' }
  };

  return (
    <div className="min-h-screen bg-space-navy-900 text-white p-6 pb-24 font-sans">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-neon-cyan-500 uppercase flex items-center gap-2">
            <ShieldCheck size={28} /> SAKHI NAV
          </h1>
          {isDeviated && (
            <div className="flex items-center gap-1 text-red-500 animate-pulse mt-1">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-black uppercase tracking-tighter">Route Deviation Detected</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 bg-space-navy-800 border border-space-navy-700 p-2 rounded-xl">
          <Maximize2 size={16} className="text-neon-cyan-500" />
          <select 
            value={panelSize}
            onChange={(e) => setPanelSize(e.target.value)}
            className="bg-transparent text-xs font-bold uppercase outline-none"
          >
            <option value="small">Compact</option>
            <option value="medium">Standard</option>
            <option value="large">Guardian View</option>
          </select>
        </div>
      </header>

      <div className={`w-full h-[60vh] rounded-[2.5rem] overflow-hidden border-2 transition-colors duration-500 relative shadow-2xl ${isDeviated ? 'border-red-600' : 'border-space-navy-700'}`}>
        <style>
          {`.leaflet-routing-container { 
            width: ${sizeStyles[panelSize as keyof typeof sizeStyles].width} !important; 
            max-height: ${sizeStyles[panelSize as keyof typeof sizeStyles].maxHeight} !important; 
          }`}
        </style>

        <MapContainer center={currentPos} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="map-tiles-grayscale" />
          
          {/* Render Safe Havens */}
          {safeHavens.map((place) => (
            <Marker key={place.id} position={[place.lat, place.lng]}>
              <Popup>{place.name} (Verified Safe)</Popup>
            </Marker>
          ))}

          {/* Render Danger Zones */}
          {dangerZones.map((zone) => (
            <Circle 
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius || 200}
              pathOptions={{ fillColor: 'red', color: 'red', fillOpacity: 0.2 }}
            />
          ))}

          <RoutingEngine 
            start={currentPos} 
            end={destination} 
            show={isTravelling} 
            onRouteFound={(coords: L.LatLng[]) => setRouteCoords(coords)}
          />
          
          {!isTravelling && (
            <div className="leaflet-bottom leaflet-right z-[1000] m-6">
              <button 
                onClick={() => setIsTravelling(true)}
                className="flex items-center gap-3 bg-neon-cyan-500 text-space-navy-900 px-10 py-5 rounded-full font-black shadow-neon-cyan active:scale-95 transition-all"
              >
                <Play size={22} fill="currentColor" />
                START SAFE TRAVEL
              </button>
            </div>
          )}
        </MapContainer>
      </div>

      {/* GUARDIAN STATUS BAR */}
      <div className="mt-6 space-y-4">
        <div className={`p-5 rounded-3xl border flex items-center justify-between transition-all ${isDeviated ? 'bg-red-900/20 border-red-500 animate-bounce-slow' : 'bg-space-navy-800 border-space-navy-700'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isDeviated ? 'bg-red-500' : 'bg-neon-cyan-500/20'}`}>
              <Bell className={isDeviated ? 'text-white' : 'text-neon-cyan-500'} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Virtual Companion Status</p>
              <p className="font-black text-lg">{isDeviated ? 'DEVIATION ALERT' : 'SECURE ON PATH'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}