import React from 'react';
import { ThreatActor } from '../types/attack';

interface ThreatActorsProps {
  threatActors: ThreatActor[];
}

const ThreatActors: React.FC<ThreatActorsProps> = ({ threatActors }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Threat Actors</h2>
      <div className="h-96 bg-gray-700 rounded flex items-center justify-center">
        <p className="text-gray-400">Threat Actors Component - {threatActors.length} actors tracked</p>
      </div>
    </div>
  );
};

export default ThreatActors;