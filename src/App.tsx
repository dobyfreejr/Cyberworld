import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, AlertTriangle, Activity, Users, Target, Play, Pause } from 'lucide-react';
import WorldMap from './components/WorldMap';
import AttackFeed from './components/AttackFeed';
import ThreatActors from './components/ThreatActors';
import AttackStats from './components/AttackStats';
import { Attack, ThreatActor } from './types/attack';
import { generateMockAttack, mockThreatActors } from './data/mockData';
import { realAttackDataService } from './data/realAttackData';

function App() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [threatActors, setThreatActors] = useState<ThreatActor[]>(mockThreatActors);
  const [activeView, setActiveView] = useState<'map' | 'feed' | 'actors' | 'stats'>('map');
  const [isLive, setIsLive] = useState(true);
  const [dataSource, setDataSource] = useState<'mock' | 'real'>('mock');
  const [isLoadingRealData, setIsLoadingRealData] = useState(false);

  useEffect(() => {
    if (dataSource === 'mock') {
      // Generate initial mock attacks
      const initialAttacks = Array.from({ length: 50 }, () => generateMockAttack());
      setAttacks(initialAttacks);
    } else {
      // Start real-time data collection
      console.log('🚀 Switching to real OTX + AbuseIPDB threat intelligence data...');
      realAttackDataService.startRealTimeCollection();
    }

    return () => {
      if (dataSource === 'real') {
        realAttackDataService.stopRealTimeCollection();
      }
    };
  }, [dataSource]);

  useEffect(() => {
    // Set up live attack generation/collection
    const interval = setInterval(() => {
      if (isLive) {
        if (dataSource === 'mock') {
          const newAttack = generateMockAttack();
          setAttacks(prev => [newAttack, ...prev.slice(0, 99)]); // Keep last 100 attacks
        } else {
          // Get real-time attacks from queue
          const newAttacks = realAttackDataService.getQueuedAttacks();
          if (newAttacks.length > 0) {
            setAttacks(prev => [...newAttacks, ...prev.slice(0, 100 - newAttacks.length)]);
          }
        }
      }
    }, dataSource === 'mock' ? 2000 : 1000); // Real data updates faster

    return () => clearInterval(interval);
  }, [isLive, dataSource]);

  const toggleDataSource = async () => {
    if (dataSource === 'mock') {
      setIsLoadingRealData(true);
      console.log('🔄 Loading real threat intelligence from OTX + AbuseIPDB...');
      setDataSource('real');
      // Clear existing mock data
      setAttacks([]);
      // Start real data collection
      realAttackDataService.startRealTimeCollection();
      setTimeout(() => setIsLoadingRealData(false), 3000);
    } else {
      realAttackDataService.stopRealTimeCollection();
      console.log('🔄 Switching back to mock data...');
      setDataSource('mock');
      // Generate initial mock attacks
      const initialAttacks = Array.from({ length: 50 }, () => generateMockAttack());
      setAttacks(initialAttacks);
    }
  };

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
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleDataSource}
                  disabled={isLoadingRealData}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    dataSource === 'real'
                      ? 'bg-red-600 text-white shadow-lg animate-pulse'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  } ${isLoadingRealData ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoadingRealData ? 'Loading OTX...' : dataSource === 'real' ? '🔴 LIVE OTX DATA' : 'MOCK DATA'}
                </button>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${
                    dataSource === 'real' ? 'bg-red-400' : 'bg-green-400'
                  }`}></div>
                  <span>{isLive ? 'Live' : 'Paused'}</span>
                </div>
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
      <main className="flex h-[calc(100vh-140px)]">
        {/* Always visible map */}
        <div className="flex-1">
          <WorldMap attacks={attacks} />
        </div>
        
        {/* Side panel for other views */}
        {activeView !== 'map' && (
          <div className="w-1/3 min-w-[400px] border-l border-gray-700">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-hidden"
              >
                {activeView === 'feed' && <AttackFeed attacks={attacks} />}
                {activeView === 'actors' && <ThreatActors threatActors={threatActors} />}
                {activeView === 'stats' && <AttackStats attacks={attacks} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;