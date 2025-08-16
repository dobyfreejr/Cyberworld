import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, Shield, AlertTriangle, Activity, Globe, Target } from 'lucide-react';
import { Attack } from '../types/attack';

interface AttackStatsProps {
  attacks: Attack[];
}

const AttackStats: React.FC<AttackStatsProps> = ({ attacks }) => {
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
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl border border-gray-700">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Attacks', value: stats.total, icon: Target, color: 'text-cyan-400', bg: 'bg-cyan-400/20' },
          { label: '24h Attacks', value: stats.last24Hours, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-400/20' },
          { label: 'Active', value: stats.active, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/20' },
          { label: 'Blocked', value: stats.blocked, icon: Shield, color: 'text-green-400', bg: 'bg-green-400/20' },
          { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/20' },
          { label: 'Countries', value: stats.topCountries.length, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-400/20' }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">{metric.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{metric.value.toLocaleString()}</p>
              </div>
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attack Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
            Attack Timeline (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
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

        {/* Severity Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
            Severity Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.severityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.severityData.map((entry, index) => (
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
        </motion.div>

        {/* Attack Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-400" />
            Attack Types
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.attackTypeData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} width={100} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Source Countries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-green-400" />
            Top Source Countries
          </h3>
          <div className="space-y-3">
            {stats.topCountries.slice(0, 8).map((country, index) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-400 w-6">#{index + 1}</span>
                  <span className="text-white font-medium">{country.country}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${(country.attacks / stats.topCountries[0].attacks) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-cyan-400 w-12 text-right">
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