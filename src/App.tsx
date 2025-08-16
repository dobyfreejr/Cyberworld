import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, AlertTriangle, Activity, Users, Target, Play, Pause } from 'lucide-react';
import WorldMap from './components/WorldMap';
import AttackFeed from './components/AttackFeed';
import ThreatActors from './components/ThreatActors';
import AttackStats from './components/AttackStats';
import { Attack, ThreatActor } from './types/attack';
import { generateMockAttack, mockThreatActors } from './data/mockData';

function App() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [threatActors, setThreatActors] = useState<ThreatActor[]>(mockThreatActors);
  const [activeView, setActiveView] = useState<'map' | 'feed' | 'actors' | 'stats'>('map');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Generate initial attacks
    const initialAttacks = Array.from({ length: 50 }, () => generateMockAttack());
    setAttacks(initialAttacks);

    // Set up live attack generation
    const interval = setInterval(() => {
      if (isLive) {
        const newAttack = generateMockAttack();
        setAttacks(prev => [newAttack, ...prev.slice(0, 99)]); // Keep last 100 attacks
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const activeAttacks = attacks.filter(attack => attack.status === 'active').length;
  const blockedAttacks = attacks.filter(attack => attack.status === 'blocked').length;
  const criticalAttacks = attacks.filter(attack => attack.severity === 'critical').length;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Cyberworld
            </h1>
            <span className="text-sm text-gray-400">Global Cyber Attack Monitor</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <button
                onClick={() => setIsLive(!isLive)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Activity className="w-4 h-4 text-green-400" />
                <span>{activeAttacks} Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>{blockedAttacks} Blocked</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>{criticalAttacks} Critical</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex space-x-1 mt-4">
          {[
            { id: 'map', label: 'World Map', icon: Globe },
            { id: 'feed', label: 'Attack Feed', icon: Activity },
            { id: 'actors', label: 'Threat Actors', icon: Users },
            { id: 'stats', label: 'Analytics', icon: Target }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === id
                  ? 'bg-cyan-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'map' && <WorldMap attacks={attacks} />}
            {activeView === 'feed' && <AttackFeed attacks={attacks} />}
            {activeView === 'actors' && <ThreatActors threatActors={threatActors} />}
            {activeView === 'stats' && <AttackStats attacks={attacks} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;