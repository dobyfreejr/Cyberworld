import React from 'react';
import { Attack } from '../types/attack';

interface AttackStatsProps {
  attacks: Attack[];
}

const AttackStats: React.FC<AttackStatsProps> = ({ attacks }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Attack Statistics</h2>
      <div className="h-96 bg-gray-700 rounded flex items-center justify-center">
        <p className="text-gray-400">Attack Stats Component - {attacks.length} attacks analyzed</p>
      </div>
    </div>
  );
};

export default AttackStats;