import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Activity, Clock, MapPin, Zap } from 'lucide-react';
import { Attack } from '../types/attack';

interface AttackFeedProps {
  attacks: Attack[];
}

const AttackFeed: React.FC<AttackFeedProps> = ({ attacks }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'critical'>('all');
  const [visibleAttacks, setVisibleAttacks] = useState<Attack[]>([]);

  useEffect(() => {
    let filtered = attacks;
    
    switch (filter) {
      case 'active':
        filtered = attacks.filter(attack => attack.status === 'active');
        break;
      case 'critical':
        filtered = attacks.filter(attack => attack.severity === 'critical');
        break;
      default:
        filtered = attacks;
    }
    
    setVisibleAttacks(filtered.slice(0, 50));
  }, [attacks, filter]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Shield className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-400 bg-red-400/20';
      case 'blocked': return 'text-blue-400 bg-blue-400/20';
      case 'resolved': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
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
            Live Attack Feed
          </h2>
          <p className="text-gray-400 text-sm mt-1">Real-time cyber security incidents</p>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All', count: attacks.length },
            { key: 'active', label: 'Active', count: attacks.filter(a => a.status === 'active').length },
            { key: 'critical', label: 'Critical', count: attacks.filter(a => a.severity === 'critical').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filter === key
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 h-[calc(100%-120px)] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {visibleAttacks.map((attack, index) => (
            <motion.div
              key={attack.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className={`p-4 rounded-lg border-l-4 ${getSeverityColor(attack.severity)} backdrop-blur-sm hover:bg-gray-700/50 transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getSeverityIcon(attack.severity)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                        {attack.attackType}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(attack.status)}`}>
                        {attack.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span>{attack.sourceCountry} → {attack.targetCountry}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-3 h-3 text-gray-500" />
                        <span>{attack.protocol}:{attack.port}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                      <div className="flex items-center space-x-4">
                        <span>Source: {attack.sourceIP}</span>
                        <span>Target: {attack.targetIP}</span>
                      </div>
                      {attack.threatActor && (
                        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                          {attack.threatActor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-gray-400 ml-4">
                  <Clock className="w-3 h-3" />
                  <span>{formatTime(attack.timestamp)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
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

export default AttackFeed;