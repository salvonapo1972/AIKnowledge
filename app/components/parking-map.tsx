'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet difettose in Next.js
const parkingIcon = new L.Icon({
  iconUrl: 'https://flaticon.com', // Icona "P" Parcheggio
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35] 
});

interface ParkingMapProps {
  center: [number, number];
  locations: Array<{ id: number; lat: number; lon: number; name: string; type: string }>;
}

export default function ParkingMap({ center, locations }: ParkingMapProps) {
  return (
    <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200 my-2">
      <MapContainer center={center} zoom={15} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lon]} icon={parkingIcon}>
            <Popup>
              <strong>{loc.name}</strong> <br />
              Tipo: {loc.type}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
