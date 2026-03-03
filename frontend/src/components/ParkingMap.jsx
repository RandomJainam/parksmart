import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api, startPolling } from '../lib/api';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

function createCustomMarker(availableSlots, totalSlots) {
  const percentage = (availableSlots / totalSlots) * 100;
  let color = '#EF4444';
  if (percentage > 50) color = '#10B981';
  else if (percentage > 20) color = '#F59E0B';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 700;
        font-size: 14px;
        font-family: 'Manrope', sans-serif;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: pointer;
      ">
        ${availableSlots}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

const ParkingMap = ({ onMarkerClick, selectedParking }) => {
  const [parkingData, setParkingData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParkingData = async () => {
      try {
        const sites = await api.getParkingSites();
        setParkingData(sites);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching parking sites:', error);
        setLoading(false);
      }
    };

    fetchParkingData();
    const stopPolling = startPolling(fetchParkingData, 5000);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setUserLocation({ lat: 19.0760, lng: 72.8777 });
        }
      );
    } else {
      setUserLocation({ lat: 19.0760, lng: 72.8777 });
    }

    return () => stopPolling();
  }, []);

  const MapController = () => {
    const map = useMap();
    useEffect(() => {
      if (selectedParking) {
        map.flyTo([selectedParking.latitude, selectedParking.longitude], 16, {
          duration: 1.5
        });
      }
    }, [selectedParking, map]);
    return null;
  };

  if (!userLocation || loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[userLocation.lat, userLocation.lng]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapController />
      {parkingData.map((parking) => (
        <Marker
          key={parking.id}
          position={[parking.latitude, parking.longitude]}
          icon={createCustomMarker(parking.availableSlots, parking.totalSlots)}
          eventHandlers={{
            click: () => onMarkerClick(parking)
          }}
        >
          <Popup>
            <div className="font-manrope">
              <h3 className="font-bold text-sm">{parking.name}</h3>
              <p className="text-xs text-slate-600">{parking.availableSlots} slots available</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default ParkingMap;
