// src/components/galaxy/HUD.tsx
import React from 'react';
import { useGalaxyStore } from '../../store/galaxyStore';

const HUD: React.FC = () => {
  const selectedLicense = useGalaxyStore(state => state.selectedLicense);

  if (!selectedLicense) {
    return null;
  }

  const { id, name, type, region, status } = selectedLicense;

  return (
    <div
      className="fixed bottom-8 right-8 w-64 p-4 rounded-xl bg-white/30 backdrop-blur-xl text-white shadow-xl pointer-events-none 
                 transform [perspective:800px] rotate-y-3"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <h3 className="text-lg font-semibold mb-2">{name || `License ${id}`}</h3>
      <ul className="text-sm space-y-1">
        <li><span className="font-medium">ID:</span> {id}</li>
        <li><span className="font-medium">Type:</span> {type}</li>
        <li><span className="font-medium">Region:</span> {region}</li>
        {status && <li><span className="font-medium">Status:</span> {status}</li>}
      </ul>
    </div>
  );
};

export default HUD;
