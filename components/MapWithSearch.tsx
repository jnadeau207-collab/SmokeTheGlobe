import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';

const containerStyle = {
  width: '100%',
  height: '400px',
};

export default function MapWithSearch() {
  const [center, setCenter] = useState({ lat: 39.5, lng: -98.35 });

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  function useMyLocation() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setCenter({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }

  return (
    <div className="bg-emerald-400 p-3 rounded shadow">
      <button
        className="mb-3 px-3 py-1 bg-sky-500 text-white rounded"
        onClick={useMyLocation}
      >
        Use my location
      </button>

      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={8}>
        <Marker position={center} />
      </GoogleMap>
    </div>
  );
}
