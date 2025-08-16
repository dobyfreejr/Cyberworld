import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import { Attack } from '../types/attack';
import { AlertTriangle, Shield, Activity, TrendingUp, MapPin, Zap, Target } from 'lucide-react';

interface WorldMapProps {
  attacks: Attack[];
}

interface CountryStats {
  totalAttacks: number;
  activeAttacks: number;
  criticalAttacks: number;
  blockedAttacks: number;
  topAttackTypes: { type: string; count: number }[];
  recentAttacks: Attack[];
}
const WorldMap: React.FC<WorldMapProps> = ({ attacks }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();
  const [worldData, setWorldData] = useState<any>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [countryStats, setCountryStats] = useState<Record<string, CountryStats>>({});
  const [activeAnimations, setActiveAnimations] = useState<any[]>([]);
  const [pulsingCountries, setPulsingCountries] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load world topology data
    const loadWorldData = async () => {
      try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const world = await response.json();
        const countries = feature(world, world.objects.countries);
        setWorldData(countries);
      } catch (error) {
        console.error('Failed to load world data:', error);
      }
    };

    loadWorldData();
  }, []);

  useEffect(() => {
    // Calculate country statistics
    const stats: Record<string, CountryStats> = {};
    
    attacks.forEach(attack => {
      // Stats for source country
      if (!stats[attack.sourceCountry]) {
        stats[attack.sourceCountry] = {
          totalAttacks: 0,
          activeAttacks: 0,
          criticalAttacks: 0,
          blockedAttacks: 0,
          topAttackTypes: [],
          recentAttacks: []
        };
      }
      
      // Stats for target country
      if (!stats[attack.targetCountry]) {
        stats[attack.targetCountry] = {
          totalAttacks: 0,
          activeAttacks: 0,
          criticalAttacks: 0,
          blockedAttacks: 0,
          topAttackTypes: [],
          recentAttacks: []
        };
      }
      
      // Update source country stats
      stats[attack.sourceCountry].totalAttacks++;
      if (attack.status === 'active') stats[attack.sourceCountry].activeAttacks++;
      if (attack.severity === 'critical') stats[attack.sourceCountry].criticalAttacks++;
      if (attack.status === 'blocked') stats[attack.sourceCountry].blockedAttacks++;
      
      // Update target country stats
      stats[attack.targetCountry].totalAttacks++;
      if (attack.status === 'active') stats[attack.targetCountry].activeAttacks++;
      if (attack.severity === 'critical') stats[attack.targetCountry].criticalAttacks++;
      if (attack.status === 'blocked') stats[attack.targetCountry].blockedAttacks++;
    });
    
    // Calculate top attack types and recent attacks for each country
    Object.keys(stats).forEach(country => {
      const countryAttacks = attacks.filter(a => 
        a.sourceCountry === country || a.targetCountry === country
      );
      
      // Top attack types
      const attackTypes: Record<string, number> = {};
      countryAttacks.forEach(attack => {
        attackTypes[attack.attackType] = (attackTypes[attack.attackType] || 0) + 1;
      });
      
      stats[country].topAttackTypes = Object.entries(attackTypes)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Recent attacks (last 10)
      stats[country].recentAttacks = countryAttacks
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    });
    
    setCountryStats(stats);
  }, [attacks]);
  useEffect(() => {
  // Dynamic animation loop
  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const animate = () => {
      const svg = d3.select(svgRef.current);
      
      // Add random attack animations
      if (Math.random() < 0.3) { // 30% chance each frame
        const recentAttacks = attacks.slice(0, 10);
        const randomAttack = recentAttacks[Math.floor(Math.random() * recentAttacks.length)];
        
        if (randomAttack) {
          animateAttack(svg, randomAttack);
        }
      }

      // Update pulsing countries
      const activeCountries = new Set<string>();
      attacks.filter(a => a.status === 'active').forEach(attack => {
        activeCountries.add(attack.sourceCountry);
        activeCountries.add(attack.targetCountry);
      });
      setPulsingCountries(activeCountries);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [worldData, attacks]);

    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 600;

    svg.selectAll('*').remove();

    const projection = geoNaturalEarth1()
      .scale(180)
      .translate([width / 2, height / 2]);

    const path = geoPath().projection(projection);

    // Get country attack intensity for coloring
    const getCountryIntensity = (countryName: string) => {
      const stats = countryStats[countryName];
      if (!stats) return 0;
      return Math.min(stats.totalAttacks / 10, 1); // Normalize to 0-1
    };

    const getCountryColor = (countryName: string) => {
      const intensity = getCountryIntensity(countryName);
      if (intensity === 0) return '#1f2937';
      
      // Dynamic color based on attack intensity and activity
      const isPulsing = pulsingCountries.has(countryName);
      const baseIntensity = isPulsing ? Math.min(intensity * 1.5, 1) : intensity;
      
      const red = Math.floor(255 * baseIntensity);
      const green = Math.floor(50 * (1 - baseIntensity));
      const blue = Math.floor(50 * (1 - baseIntensity));
      
      return `rgb(${red}, ${green}, ${blue})`;
    };

    // Create gradient definitions
    const defs = svg.append('defs');
    
    const attackGradient = defs.append('radialGradient')
      .attr('id', 'attackGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    
    attackGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff4444')
      .attr('stop-opacity', 0.8);
    
    attackGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ff4444')
      .attr('stop-opacity', 0);

    // Create pulsing gradient for active countries
    const pulseGradient = defs.append('radialGradient')
      .attr('id', 'pulseGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    
    pulseGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00ffff')
      .attr('stop-opacity', 0.6);
    
    pulseGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0080ff')
      .attr('stop-opacity', 0);

    // Draw countries
    const countries = svg.selectAll('.country')
      .data(worldData.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', (d: any) => {
        const countryName = d.properties?.NAME || '';
        return getCountryColor(countryName);
      })
      .attr('stroke', '#374151')
      .attr('stroke-width', (d: any) => {
        const stats = countryStats[d.properties?.NAME || ''];
        return stats && stats.totalAttacks > 0 ? 1 : 0.5;
      })
      .attr('filter', (d: any) => {
        const countryName = d.properties?.NAME || '';
        return pulsingCountries.has(countryName) ? 'url(#glow)' : 'none';
      })
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        const countryName = d.properties?.NAME || 'Unknown';
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#00d4ff')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 3)
          .attr('filter', 'url(#glow)');
        
        setHoveredCountry(countryName);
        setMousePosition({ x: event.pageX, y: event.pageY });
      })
      .on('mousemove', function(event) {
        setMousePosition({ x: event.pageX, y: event.pageY });
      })
      .on('mouseleave', function(event, d) {
        const countryName = d.properties?.NAME || '';
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', getCountryColor(countryName))
          .attr('stroke', '#374151')
          .attr('stroke-width', countryStats[countryName] && countryStats[countryName].totalAttacks > 0 ? 1 : 0.5)
          .attr('filter', pulsingCountries.has(countryName) ? 'url(#glow)' : 'none');
        setHoveredCountry(null);
      });

    // Add glow filter for active countries
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Add continuous country pulsing for active attacks
    countries.each(function(d: any) {
      const countryName = d.properties?.NAME || '';
      if (pulsingCountries.has(countryName)) {
        d3.select(this)
          .transition()
          .duration(2000)
          .ease(d3.easeSinInOut)
          .attr('opacity', 0.7)
          .transition()
          .duration(2000)
          .ease(d3.easeSinInOut)
          .attr('opacity', 1)
          .on('end', function repeat() {
            if (pulsingCountries.has(countryName)) {
              d3.select(this)
                .transition()
                .duration(2000)
                .ease(d3.easeSinInOut)
                .attr('opacity', 0.7)
                .transition()
                .duration(2000)
                .ease(d3.easeSinInOut)
                .attr('opacity', 1)
                .on('end', repeat);
            }
          });
      }
    });

  }, [worldData, attacks]);

  const animateAttack = (svg: any, attack: Attack) => {
    const sourceCoords = getCountryCoordinates(attack.sourceCountry);
    const targetCoords = getCountryCoordinates(attack.targetCountry);
    
    if (!sourceCoords || !targetCoords) return;
    
    const projection = geoNaturalEarth1()
      .scale(180)
      .translate([600, 300]);
    
    const sourcePoint = projection(sourceCoords);
    const targetPoint = projection(targetCoords);
    
    if (!sourcePoint || !targetPoint) return;

    // Create animated attack path
    const path = svg.append('path')
      .attr('d', `M${sourcePoint[0]},${sourcePoint[1]} Q${(sourcePoint[0] + targetPoint[0]) / 2},${(sourcePoint[1] + targetPoint[1]) / 2 - 50} ${targetPoint[0]},${targetPoint[1]}`)
      .attr('stroke', getSeverityColor(attack.severity))
      .attr('stroke-width', getSeverityWidth(attack.severity))
      .attr('fill', 'none')
      .attr('opacity', 0)
      .attr('stroke-dasharray', '5,5');

    // Animate the path
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(1500)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0)
      .attr('opacity', 0.8)
      .transition()
      .duration(1000)
      .attr('opacity', 0)
      .remove();

    // Source explosion effect
    svg.append('circle')
      .attr('cx', sourcePoint[0])
      .attr('cy', sourcePoint[1])
      .attr('r', 0)
      .attr('fill', getSeverityColor(attack.severity))
      .attr('opacity', 0.8)
      .transition()
      .duration(800)
      .attr('r', 20)
      .attr('opacity', 0)
      .remove();

    // Target impact effect
    setTimeout(() => {
      svg.append('circle')
        .attr('cx', targetPoint[0])
        .attr('cy', targetPoint[1])
        .attr('r', 0)
        .attr('fill', getSeverityColor(attack.severity))
        .attr('opacity', 0.9)
        .transition()
        .duration(600)
        .attr('r', 15)
        .attr('opacity', 0)
        .remove();

      // Add impact rings
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          svg.append('circle')
            .attr('cx', targetPoint[0])
            .attr('cy', targetPoint[1])
            .attr('r', 5)
            .attr('stroke', getSeverityColor(attack.severity))
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('opacity', 0.6)
            .transition()
            .duration(1000)
            .attr('r', 30 + i * 10)
            .attr('opacity', 0)
            .remove();
        }, i * 200);
      }
    }, 1200);
  };

  const getCountryCoordinates = (countryName: string): [number, number] | null => {
    const coordinates: { [key: string]: [number, number] } = {
      'United States': [-95.7129, 37.0902],
      'China': [104.1954, 35.8617],
      'Russia': [105.3188, 61.5240],
      'Germany': [10.4515, 51.1657],
      'United Kingdom': [-3.4360, 55.3781],
      'France': [2.2137, 46.2276],
      'Japan': [138.2529, 36.2048],
      'South Korea': [127.7669, 35.9078],
      'India': [78.9629, 20.5937],
      'Brazil': [-51.9253, -14.2350],
      'Canada': [-106.3468, 56.1304],
      'Australia': [133.7751, -25.2744],
      'Netherlands': [5.2913, 52.1326],
      'Sweden': [18.6435, 60.1282],
      'Israel': [34.8516, 32.7940],
      'Iran': [53.6880, 32.4279],
      'North Korea': [127.5101, 40.3399]
    };
    return coordinates[countryName] || null;
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getSeverityWidth = (severity: string): number => {
    switch (severity) {
      case 'critical': return 3;
      case 'high': return 2.5;
      case 'medium': return 2;
      case 'low': return 1.5;
      default: return 1;
    }
  };

  const activeAttacks = attacks.filter(a => a.status === 'active').length;
  const criticalAttacks = attacks.filter(a => a.severity === 'critical').length;
  const hoveredStats = hoveredCountry ? countryStats[hoveredCountry] : null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl border border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Global Threat Map
          </h2>
          <p className="text-gray-400 text-sm mt-1">Real-time cyber attack visualization</p>
        </div>
        
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-300">{activeAttacks} Active Attacks</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-300">{criticalAttacks} Critical</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-gray-300">Live Tracking</span>
          </div>
        </div>
      </div>

      <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        <svg
          ref={svgRef}
          width="100%"
          height="600"
          viewBox="0 0 1200 600"
          className="w-full h-auto"
        />
        

        <div className="absolute bottom-4 right-4 bg-gray-800 px-4 py-3 rounded-lg border border-gray-600">
          <div className="text-xs text-gray-400 mb-2">Attack Severity</div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span className="text-xs text-gray-300">Critical</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span className="text-xs text-gray-300">High</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
              <span className="text-xs text-gray-300">Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              <span className="text-xs text-gray-300">Low</span>
            </div>
          </div>
          
          <div className="mt-4 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400 mb-1">Live Activity</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Real-time Attacks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Country Tooltip */}
      {hoveredCountry && hoveredStats && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: mousePosition.x + 15,
            top: mousePosition.y - 10,
            transform: mousePosition.x > window.innerWidth - 400 ? 'translateX(-100%)' : 'none'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg p-4 shadow-2xl max-w-sm"
          >
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-bold text-lg">{hoveredCountry}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-700/50 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <div className="text-lg font-bold text-white">{hoveredStats.totalAttacks}</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-gray-400">Active</span>
                </div>
                <div className="text-lg font-bold text-red-400 animate-pulse">{hoveredStats.activeAttacks}</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-gray-400">Critical</span>
                </div>
                <div className="text-lg font-bold text-orange-400 animate-pulse">{hoveredStats.criticalAttacks}</div>
              </div>
              
              <div className="bg-gray-700/50 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-gray-400">Blocked</span>
                </div>
                <div className="text-lg font-bold text-green-400">{hoveredStats.blockedAttacks}</div>
              </div>
            </div>
            
            {hoveredStats.activeAttacks > 0 && (
              <div className="mb-4 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-sm font-semibold text-red-400">Under Active Attack!</span>
                </div>
                <p className="text-xs text-red-300 mt-1">This country is currently experiencing live cyber attacks</p>
              </div>
            )}
            
            {hoveredStats.topAttackTypes.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Top Attack Types
                </h4>
                <div className="space-y-1">
                  {hoveredStats.topAttackTypes.map((attackType, index) => (
                    <div key={attackType.type} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{attackType.type}</span>
                      <span className="text-cyan-400 font-medium">{attackType.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {hoveredStats.recentAttacks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Recent Attacks</h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {hoveredStats.recentAttacks.map((attack, index) => (
                    <div key={attack.id} className="text-xs text-gray-400 flex items-center justify-between">
                      <span className="truncate">{attack.attackType}</span>
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        attack.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        attack.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        attack.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {attack.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default WorldMap;