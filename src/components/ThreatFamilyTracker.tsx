import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, AlertTriangle, Calendar, MapPin, Target, Database, Clock } from 'lucide-react';
import { threatDatabase, ThreatFamily, ThreatEvolution, HistoricalStats } from '../database/threatDatabase';

interface ThreatFamilyTrackerProps {
  className?: string;
}

const ThreatFamilyTracker: React.FC<ThreatFamilyTrackerProps> = ({ className }) => {
  const [threatFamilies, setThreatFamilies] = useState<ThreatFamily[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [familyEvolution, setFamilyEvolution] = useState<ThreatEvolution[]>([]);
  const [historicalStats, setHistoricalStats] = useState<HistoricalStats[]>([]);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    loadThreatFamilies();
    loadHistoricalStats();
    loadDatabaseStats();
  }, [timeRange]);

  useEffect(() => {
    if (selectedFamily) {
      loadFamilyEvolution(selectedFamily);
    }
  }, [selectedFamily, timeRange]);

  const loadThreatFamilies = async () => {
    try {
      const families = threatDatabase.getTopThreatFamilies(timeRange);
      setThreatFamilies(families);
      
      if (families.length > 0 && !selectedFamily) {
        setSelectedFamily(families[0].name);
      }
    } catch (error) {
      console.error('Failed to load threat families:', error);
    }
  };

  const loadFamilyEvolution = async (familyName: string) => {
    try {
      const evolution = threatDatabase.getThreatFamilyEvolution(familyName, timeRange);
      setFamilyEvolution(evolution);
    } catch (error) {
      console.error('Failed to load family evolution:', error);
    }
  };

  const loadHistoricalStats = async () => {
    try {
      const stats = threatDatabase.getHistoricalStats(timeRange);
      setHistoricalStats(stats);
    } catch (error) {
      console.error('Failed to load historical stats:', error);
    }
  };

  const loadDatabaseStats = async () => {
    try {
      const stats = threatDatabase.getStats();
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Malware': '#ef4444',
      'Ransomware': '#dc2626',
      'Trojan': '#f97316',
      'Backdoor': '#f59e0b',
      'Botnet': '#eab308',
      'Spyware': '#84cc16',
      'Adware': '#22c55e',
      'Rootkit': '#10b981'
    };
    return colors[category] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Prepare chart data
  const evolutionChartData = familyEvolution.map(item => ({
    date: formatDate(item.timeframe),
    attacks: item.attackCount,
    countries: item.newCountries.length
  }));

  const familyDistributionData = threatFamilies.slice(0, 8).map(family => ({
    name: family.name,
    value: family.totalAttacks,
    color: getCategoryColor(family.category)
  }));

  const timelineData = historicalStats
    .reduce((acc, stat) => {
      const existing = acc.find(item => item.date === stat.date);
      if (existing) {
        existing.attacks += stat.attackCount;
      } else {
        acc.push({
          date: formatDate(stat.date),
          attacks: stat.attackCount
        });
      }
      return acc;
    }, [] as any[])
    .slice(-14); // Last 14 days

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 h-full p-6 shadow-2xl border-l border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Threat Family Tracker
          </h2>
          <p className="text-gray-400 text-sm mt-1">Long-term malware family evolution and statistics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="bg-gray-700 text-white px-3 py-1 rounded-lg text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none"
          >
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
            <option value={90}>90 Days</option>
            <option value={365}>1 Year</option>
          </select>
        </div>
      </div>

      {/* Database Statistics */}
      {dbStats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Attacks', value: dbStats.totalAttacks, icon: Target, color: 'text-cyan-400' },
            { label: 'Threat Families', value: dbStats.totalFamilies, icon: Activity, color: 'text-red-400' },
            { label: 'Threat Actors', value: dbStats.totalActors, icon: AlertTriangle, color: 'text-orange-400' },
            { label: 'MISP Events', value: dbStats.totalMispEvents, icon: Database, color: 'text-green-400' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs font-medium">{stat.label}</p>
                  <p className="text-lg font-bold text-white mt-1">{stat.value.toLocaleString()}</p>
                </div>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 h-[calc(100%-200px)] overflow-y-auto">
        {/* Threat Family List */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
            Active Threat Families
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {threatFamilies.map((family, index) => (
              <motion.div
                key={family.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => setSelectedFamily(family.name)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedFamily === family.name
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white text-sm truncate">{family.name}</h4>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      backgroundColor: `${getCategoryColor(family.category)}20`,
                      color: getCategoryColor(family.category)
                    }}
                  >
                    {family.category}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{family.totalAttacks} attacks</span>
                  <span>{family.countries.length} countries</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Family Evolution Chart */}
        {selectedFamily && evolutionChartData.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-red-400" />
              {selectedFamily} Evolution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolutionChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="attacks" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="countries" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Family Distribution */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-400" />
              Family Distribution
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={familyDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {familyDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-yellow-400" />
              Attack Timeline
            </h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Bar dataKey="attacks" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Selected Family Details */}
        {selectedFamily && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-400" />
              {selectedFamily} Details
            </h3>
            {threatFamilies.find(f => f.name === selectedFamily) && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">First Seen:</span>
                    <span className="text-white ml-2">
                      {threatFamilies.find(f => f.name === selectedFamily)?.firstSeen.toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Seen:</span>
                    <span className="text-white ml-2">
                      {threatFamilies.find(f => f.name === selectedFamily)?.lastSeen.toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {threatFamilies.find(f => f.name === selectedFamily)?.description && (
                  <div>
                    <span className="text-gray-400 text-sm">Description:</span>
                    <p className="text-white text-sm mt-1">
                      {threatFamilies.find(f => f.name === selectedFamily)?.description}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {threatFamilies.find(f => f.name === selectedFamily)?.countries.map(country => (
                    <span 
                      key={country}
                      className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ThreatFamilyTracker;