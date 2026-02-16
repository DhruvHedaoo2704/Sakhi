import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Leaflet Marker Fix
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
      lineOptions: { styles: [{ color: '#00e1ff', weight: 6, opacity: 0.8 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true,
      collapsible: false,
      itinerary: { collapseOnStart: false, collapsible: false },
      createMarker: () => null 
    }).addTo(map);

    routingControl.on('routesfound', (e: any) => {
      onRouteFound(e.routes[0].coordinates);
    });

    return () => { if (map && routingControl) map.removeControl(routingControl); };
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
  const [currentPos] = useState<L.LatLng>(new L.LatLng(19.0760, 72.8777));
  const [destination] = useState<L.LatLng>(new L.LatLng(19.1136, 72.8697));

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

  const sizeStyles = {
    small: { width: '280px', maxHeight: '30vh' },
    medium: { width: '380px', maxHeight: '50vh' },
    large: { width: '92vw', maxHeight: '70vh' }
  };

  return (
    <div className="min-h-screen bg-space-navy-900 text-white p-6 pb-24">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-black text-neon-cyan-500 uppercase flex items-center gap-2">
          <ShieldCheck size={28} /> SAKHI NAV
        </h1>
        <select value={panelSize} onChange={(e) => setPanelSize(e.target.value)} className="bg-space-navy-800 p-2 rounded-xl text-xs">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Guardian</option>
        </select>
      </header>

      <div className={`w-full h-[60vh] rounded-[2.5rem] overflow-hidden border-2 relative ${isDeviated ? 'border-red-600' : 'border-space-navy-700'}`}>
        <MapContainer center={[currentPos.lat, currentPos.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {safeHavens.map(h => <Marker key={h.id} position={[h.lat, h.lng]}><Popup>{h.name}</Popup></Marker>)}
          {dangerZones.map(z => <Circle key={z.id} center={[z.lat, z.lng]} radius={200} pathOptions={{ color: 'red', fillOpacity: 0.2 }} />)}
          <RoutingEngine start={currentPos} end={destination} show={isTravelling} onRouteFound={setRouteCoords} />
          {!isTravelling && (
            <button onClick={() => setIsTravelling(true)} className="leaflet-bottom leaflet-right z-[1000] m-6 bg-neon-cyan-500 text-black px-8 py-4 rounded-full font-bold">START TRAVELLING</button>
          )}
        </MapContainer>
      </div>
    </div>
  );
}