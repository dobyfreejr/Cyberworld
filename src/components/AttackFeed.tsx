import React from 'react';
import { Attack } from '../types/attack';

interface AttackFeedProps {
  attacks: Attack[];
}

const AttackFeed: React.FC<AttackFeedProps> = ({ attacks }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Attack Feed</h2>
      <div className="h-96 bg-gray-700 rounded flex items-center justify-center">
        <p className="text-gray-400">Attack Feed Component - {attacks.length} attacks tracked</p>
      </div>
    </div>
  );
};

export default AttackFeed;