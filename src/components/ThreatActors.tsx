import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Activity, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { ThreatActor } from '../types/attack';

interface ThreatActorsProps {
  threatActors: ThreatActor[];
}

const ThreatActors: React.FC<ThreatActorsProps> = ({ threatActors }) => {
  const [sortBy, setSortBy] = useState<'activeAttacks' | 'totalAttacks' | 'riskLevel'>('activeAttacks');
  const [filterType, setFilterType] = useState<'all' | 'nation-state' | 'cybercriminal' | 'hacktivist' | 'insider'>('all');

  const sortedActors = [...threatActors]
    .filter(actor => filterType === 'all' || actor.type === filterType)
    .sort((a, b) => {
      if (sortBy === 'riskLevel') {
        const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      }
      return b[sortBy] - a[sortBy];
    });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'high': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'low': return 'text-green-400 bg-green-400/20 border-green-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nation-state': return '🏛️';
      case 'cybercriminal': return '💰';
      case 'hacktivist': return '✊';
      case 'insider': return '👤';
      default: return '❓';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'nation-state': return 'text-purple-400 bg-purple-400/20';
      case 'cybercriminal': return 'text-red-400 bg-red-400/20';
      case 'hacktivist': return 'text-blue-400 bg-blue-400/20';
      case 'insider': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 h-full p-6 shadow-2xl border-l border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Threat Actors
          </h2>
          <p className="text-gray-400 text-sm mt-1">Known cybersecurity threat groups</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-gray-700 text-white px-2 py-1 rounded-lg text-xs border border-gray-600 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="nation-state">Nation State</option>
            <option value="cybercriminal">Cybercriminal</option>
            <option value="hacktivist">Hacktivist</option>
            <option value="insider">Insider</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-700 text-white px-2 py-1 rounded-lg text-xs border border-gray-600 focus:border-cyan-500 focus:outline-none"
          >
            <option value="activeAttacks">Active Attacks</option>
            <option value="totalAttacks">Total Attacks</option>
            <option value="riskLevel">Risk Level</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 h-[calc(100%-120px)] overflow-y-auto custom-scrollbar">
        {sortedActors.map((actor, index) => (
          <motion.div
            key={actor.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700 hover:border-gray-600 hover:bg-gray-700/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getTypeIcon(actor.type)}</span>
                <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {actor.name}
                </h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(actor.riskLevel)}`}>
                {actor.riskLevel.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(actor.type)}`}>
                  {actor.type.replace('-', ' ').toUpperCase()}
                </span>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />
                  <span>{actor.country}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <div className="flex items-center space-x-1 text-gray-400 mb-1">
                    <Activity className="w-3 h-3" />
                    <span className="text-xs">Active</span>
                  </div>
                  <div className="text-lg font-bold text-red-400">{actor.activeAttacks}</div>
                </div>
                
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <div className="flex items-center space-x-1 text-gray-400 mb-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-xs">Total</span>
                  </div>
                  <div className="text-lg font-bold text-gray-300">{actor.totalAttacks.toLocaleString()}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Last seen</span>
                </div>
                <span className="font-medium">{formatLastSeen(actor.lastSeen)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </motion.div>
  );
};

export default ThreatActors;