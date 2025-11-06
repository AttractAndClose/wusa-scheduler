'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Address } from '@/types';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface AddressMapProps {
  address: Address;
}

// Component to update map view when address changes
function MapUpdater({ address }: { address: Address }) {
  const map = useMap();

  useEffect(() => {
    map.setView([address.lat, address.lng], 10);
  }, [address.lat, address.lng, map]);

  return null;
}

export function AddressMap({ address }: AddressMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Determine zoom level based on state (zoom to state level)
  const getZoomLevel = (state: string): number => {
    // Larger states get lower zoom (more zoomed out)
    const largeStates = ['TX', 'CA', 'AK', 'MT', 'NM', 'AZ', 'NV', 'CO', 'OR', 'WY', 'MI', 'MN', 'UT', 'ID', 'KS', 'NE', 'SD', 'ND', 'MO', 'OK', 'WA', 'GA', 'NC', 'SC', 'TN', 'AL', 'MS', 'AR', 'LA', 'IA', 'IL', 'WI', 'FL', 'NY', 'PA', 'OH', 'KY', 'VA', 'IN', 'NC', 'MO', 'TN', 'AL', 'SC', 'LA', 'MS', 'AR', 'GA'];
    if (largeStates.includes(state)) {
      return 7;
    }
    return 8;
  };

  const zoom = getZoomLevel(address.state);

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-gray-300">
      <MapContainer
        center={[address.lat, address.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater address={address} />
        
        <Marker
          position={[address.lat, address.lng]}
          icon={L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: #E11B37; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
        </Marker>
      </MapContainer>
    </div>
  );
}

