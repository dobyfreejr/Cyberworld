import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Shield, AlertTriangle, Activity, Globe, Target } from 'lucide-react';
import { Attack } from '../types/attack';

interface AttackStatsProps {
  attacks: Attack[];
  globalStats: {
    totalAttacks: number;
    activeAttacks: number;
    blockedAttacks: number;
    resolvedAttacks: number;
    criticalAttacks: number;
    highAttacks: number;
    mediumAttacks: number;
    lowAttacks: number;
    uniqueCountries: number;
    topThreatActors: { name: string; attacks: number; country: string; riskLevel: string }[];
    topSourceCountries: { country: string; attacks: number }[];
    topTargetCountries: { country: string; attacks: number }[];
    topAttackTypes: { type: string; count: number }[];
  };
}

const AttackStats: React.FC<AttackStatsProps> = ({ attacks, globalStats }) => {
  const stats = useMemo(() => {
    const now = new Date();
    const last24Hours = attacks.filter(attack => 
      (now.getTime() - attack.timestamp.getTime()) < 24 * 60 * 60 * 1000
    );

    // Attack types distribution
    const attackTypeStats = attacks.reduce((acc, attack) => {
      acc[attack.attackType] = (acc[attack.attackType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const attackTypeData = Object.entries(attackTypeStats)
      .map(([type, count]) => ({ name: type, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Severity distribution
    const severityStats = attacks.reduce((acc, attack) => {
      acc[attack.severity] = (acc[attack.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const severityData = [
      { name: 'Critical', value: severityStats.critical || 0, color: '#dc2626' },
      { name: 'High', value: severityStats.high || 0, color: '#ea580c' },
      { name: 'Medium', value: severityStats.medium || 0, color: '#d97706' },
      { name: 'Low', value: severityStats.low || 0, color: '#65a30d' }
    ];

    // Country stats
    const countryStats = attacks.reduce((acc, attack) => {
      acc[attack.sourceCountry] = (acc[attack.sourceCountry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCountries = Object.entries(countryStats)
      .map(([country, count]) => ({ country, attacks: count }))
      .sort((a, b) => b.attacks - a.attacks)
      .slice(0, 10);

    // Timeline data (last 24 hours)
    const timelineData = [];
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourAttacks = attacks.filter(attack => {
        const attackHour = new Date(attack.timestamp);
        return attackHour.getHours() === hour.getHours() && 
               Math.abs(attackHour.getTime() - hour.getTime()) < 60 * 60 * 1000;
      });

      timelineData.push({
        time: hour.getHours().toString().padStart(2, '0') + ':00',
        attacks: hourAttacks.length,
        critical: hourAttacks.filter(a => a.severity === 'critical').length,
        blocked: hourAttacks.filter(a => a.status === 'blocked').length
      });
    }

    return {
      total: attacks.length,
      last24Hours: last24Hours.length,
      active: attacks.filter(a => a.status === 'active').length,
      blocked: attacks.filter(a => a.status === 'blocked').length,
      critical: attacks.filter(a => a.severity === 'critical').length,
      attackTypeData,
      severityData,
      topCountries,
      timelineData
    };
  }, [attacks]);

  const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#f97316', '#84cc16'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-l border-gray-700 overflow-y-auto"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Attack Analytics
            </h2>
            <p className="text-gray-400 text-sm mt-1">Comprehensive threat intelligence dashboard</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Total Attacks', value: globalStats.totalAttacks, icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-400/20' },
          { label: 'Active', value: globalStats.activeAttacks, icon: Activity, color: 'text-red-400', bg: 'bg-red-400/20' },
          { label: 'Critical', value: globalStats.criticalAttacks, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/20' },
          { label: 'Blocked', value: globalStats.blockedAttacks, icon: Shield, color: 'text-green-400', bg: 'bg-green-400/20' },
          { label: 'Countries', value: globalStats.uniqueCountries, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-400/20' },
          { label: 'Threat Actors', value: globalStats.topThreatActors.length, icon: TrendingUp, color: 'text-yellow-400', bg: 'bg-yellow-400/20' }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">{metric.label}</p>
                <p className="text-lg font-bold text-white mt-1">{metric.value.toLocaleString()}</p>
              </div>
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Analytics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Top Attack Types */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <Target className="w-4 h-4 mr-2 text-red-400" />
            Top Attack Types
          </h3>
          <div className="space-y-2">
            {globalStats.topAttackTypes.slice(0, 5).map((attackType, index) => (
              <div key={attackType.type} className="flex items-center justify-between">
                <span className="text-xs text-gray-300 truncate">{attackType.type}</span>
                <span className="text-xs font-bold text-red-400">{attackType.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Target Countries */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-blue-400" />
            Most Targeted
          </h3>
          <div className="space-y-2">
            {globalStats.topTargetCountries.slice(0, 5).map((country, index) => (
              <div key={country.country} className="flex items-center justify-between">
                <span className="text-xs text-gray-300 truncate">{country.country}</span>
                <span className="text-xs font-bold text-blue-400">{country.attacks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="space-y-4">
        {/* Attack Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
            Attack Timeline (24h)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Area type="monotone" dataKey="attacks" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
              <Area type="monotone" dataKey="critical" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Source Countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
        >
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center">
            <Globe className="w-4 h-4 mr-2 text-green-400" />
            Top Source Countries
          </h3>
          <div className="space-y-2">
            {globalStats.topSourceCountries.slice(0, 6).map((country, index) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-medium text-gray-400 w-4">#{index + 1}</span>
                  <span className="text-sm text-white font-medium">{country.country}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-16 bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${(country.attacks / globalStats.topSourceCountries[0].attacks) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-cyan-400 w-8 text-right">
                    {country.attacks}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AttackStats;