import React from 'react';
import { Attack } from '../types/attack';

interface WorldMapProps {
  attacks: Attack[];
}

const WorldMap: React.FC<WorldMapProps> = ({ attacks }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">World Map</h2>
      <div className="h-96 bg-gray-700 rounded flex items-center justify-center">
        <p className="text-gray-400">World Map Component - {attacks.length} attacks tracked</p>
      </div>
    </div>
  );
};

export default WorldMap;