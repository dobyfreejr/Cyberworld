import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Shield, AlertTriangle, Activity, Users, Target, Play, Pause, Eye, Zap } from 'lucide-react';
import WorldMap from './components/WorldMap';
import AttackFeed from './components/AttackFeed';
import ThreatActors from './components/ThreatActors';
import AttackStats from './components/AttackStats';
import { Attack, ThreatActor } from './types/attack';
import { realAttackDataService } from './data/realAttackData';

function App() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [threatActors, setThreatActors] = useState<ThreatActor[]>([]);
  const [activeView, setActiveView] = useState<'map' | 'feed' | 'actors' | 'stats'>('map');
  const [isLive, setIsLive] = useState(true);
  const [globalStats, setGlobalStats] = useState({
    totalAttacks: 0,
    activeAttacks: 0,
    blockedAttacks: 0,
    resolvedAttacks: 0,
    criticalAttacks: 0,
    highAttacks: 0,
    mediumAttacks: 0,
    lowAttacks: 0,
    uniqueCountries: 0,
    topThreatActors: [] as { name: string; attacks: number; country: string; riskLevel: string }[],
    topSourceCountries: [] as { country: string; attacks: number }[],
    topTargetCountries: [] as { country: string; attacks: number }[],
    topAttackTypes: [] as { type: string; count: number }[]
  });

  useEffect(() => {
    // Start real-time data collection
    console.log('🚀 Starting real OTX + AbuseIPDB threat intelligence data...');
    realAttackDataService.startRealTimeCollection();

    return () => {
      realAttackDataService.stopRealTimeCollection();
    };
  }, []);

  useEffect(() => {
    // Set up live attack generation/collection
    const interval = setInterval(() => {
      if (isLive) {
        // Get real-time attacks from queue
        const newAttacks = realAttackDataService.getQueuedAttacks();
        if (newAttacks.length > 0) {
          setAttacks(prev => [...newAttacks, ...prev.slice(0, 100 - newAttacks.length)]);
        }
      }
    }, 1000); // Real data updates every second

    return () => clearInterval(interval);
  }, [isLive]);

  // Calculate comprehensive global statistics
  useEffect(() => {
    const stats = {
      totalAttacks: attacks.length,
      activeAttacks: attacks.filter(a => a.status === 'active').length,
      blockedAttacks: attacks.filter(a => a.status === 'blocked').length,
      resolvedAttacks: attacks.filter(a => a.status === 'resolved').length,
      criticalAttacks: attacks.filter(a => a.severity === 'critical').length,
      highAttacks: attacks.filter(a => a.severity === 'high').length,
      mediumAttacks: attacks.filter(a => a.severity === 'medium').length,
      lowAttacks: attacks.filter(a => a.severity === 'low').length,
      uniqueCountries: 0,
      topThreatActors: [] as { name: string; attacks: number; country: string; riskLevel: string }[],
      topSourceCountries: [] as { country: string; attacks: number }[],
      topTargetCountries: [] as { country: string; attacks: number }[],
      topAttackTypes: [] as { type: string; count: number }[]
    };

    // Calculate unique countries
    const countries = new Set([
      ...attacks.map(a => a.sourceCountry),
      ...attacks.map(a => a.targetCountry)
    ]);
    stats.uniqueCountries = countries.size;

    // Calculate top threat actors
    const threatActorStats: Record<string, { attacks: number; country: string; riskLevel: string }> = {};
    attacks.forEach(attack => {
      if (attack.threatActor) {
        if (!threatActorStats[attack.threatActor]) {
          threatActorStats[attack.threatActor] = {
            attacks: 0,
            country: attack.sourceCountry,
            riskLevel: attack.severity === 'critical' ? 'critical' : 
                      attack.severity === 'high' ? 'high' : 
                      attack.severity === 'medium' ? 'medium' : 'low'
          };
        }
        threatActorStats[attack.threatActor].attacks++;
        // Update risk level to highest seen
        const currentRisk = threatActorStats[attack.threatActor].riskLevel;
        const newRisk = attack.severity;
        if ((newRisk === 'critical') || 
            (newRisk === 'high' && currentRisk !== 'critical') ||
            (newRisk === 'medium' && !['critical', 'high'].includes(currentRisk))) {
          threatActorStats[attack.threatActor].riskLevel = newRisk;
        }
      }
    });

    stats.topThreatActors = Object.entries(threatActorStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.attacks - a.attacks)
      .slice(0, 10);

    // Calculate top source countries
    const sourceCountryStats: Record<string, number> = {};
    attacks.forEach(attack => {
      sourceCountryStats[attack.sourceCountry] = (sourceCountryStats[attack.sourceCountry] || 0) + 1;
    });
    stats.topSourceCountries = Object.entries(sourceCountryStats)
      .map(([country, attacks]) => ({ country, attacks }))
      .sort((a, b) => b.attacks - a.attacks)
      .slice(0, 10);

    // Calculate top target countries
    const targetCountryStats: Record<string, number> = {};
    attacks.forEach(attack => {
      targetCountryStats[attack.targetCountry] = (targetCountryStats[attack.targetCountry] || 0) + 1;
    });
    stats.topTargetCountries = Object.entries(targetCountryStats)
      .map(([country, attacks]) => ({ country, attacks }))
      .sort((a, b) => b.attacks - a.attacks)
      .slice(0, 10);

    // Calculate top attack types
    const attackTypeStats: Record<string, number> = {};
    attacks.forEach(attack => {
      attackTypeStats[attack.attackType] = (attackTypeStats[attack.attackType] || 0) + 1;
    });
    stats.topAttackTypes = Object.entries(attackTypeStats)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    setGlobalStats(stats);
  }, [attacks]);

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
                <div className="px-3 py-1 rounded-lg text-xs font-medium bg-red-600 text-white shadow-lg animate-pulse">
                  🔴 LIVE OTX DATA
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-red-400"></div>
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
                <Activity className="w-4 h-4 text-red-400" />
                <span>{globalStats.activeAttacks} Active</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>{globalStats.blockedAttacks} Blocked</span>
              </div>
              <div className="flex items-center space-x-1">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                <span>{globalStats.criticalAttacks} Critical</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{globalStats.topThreatActors.length} Threat Actors</span>
              </div>
              <div className="flex items-center space-x-1">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>{globalStats.uniqueCountries} Countries</span>
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
          <WorldMap attacks={attacks} globalStats={globalStats} />
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
                {activeView === 'actors' && <ThreatActors threatActors={threatActors} globalStats={globalStats} />}
                {activeView === 'stats' && <AttackStats attacks={attacks} globalStats={globalStats} />}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;