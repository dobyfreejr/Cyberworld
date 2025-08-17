import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import { Attack } from '../types/attack';
import { AlertTriangle, Shield, Activity, TrendingUp, MapPin, Zap, Target, Wifi } from 'lucide-react';

interface WorldMapProps {
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

interface CountryStats {
  totalAttacks: number;
  activeAttacks: number;
  criticalAttacks: number;
  blockedAttacks: number;
  topAttackTypes: { type: string; count: number }[];
  recentAttacks: Attack[];
}

const WorldMap: React.FC<WorldMapProps> = ({ attacks, globalStats }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number>();
  const [worldData, setWorldData] = useState<any>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [countryStats, setCountryStats] = useState<Record<string, CountryStats>>({});
  const [activeAnimations, setActiveAnimations] = useState<any[]>([]);
  const [totalTrackedAttacks, setTotalTrackedAttacks] = useState(0);
  const [isLoadingRealData, setIsLoadingRealData] = useState(false);
  const [dataSource, setDataSource] = useState<'mock' | 'real'>('mock');

  // Load world topology data
  useEffect(() => {
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

  // Calculate country statistics
  useEffect(() => {
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
      
      // Recent attacks (last 5)
      stats[country].recentAttacks = countryAttacks
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    });
    
    setCountryStats(stats);
  }, [attacks]);

  // Main map rendering and animation loop
  useEffect(() => {
    if (!worldData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 1400;
    const height = 700;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create projection
    const projection = geoNaturalEarth1()
      .scale(200)
      .translate([width / 2, height / 2]);

    const path = geoPath().projection(projection);

    // Create gradient definitions
    const defs = svg.append('defs');
    
    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Attack beam gradient
    const beamGradient = defs.append('linearGradient')
      .attr('id', 'beamGradient')
      .attr('gradientUnits', 'userSpaceOnUse');
    
    beamGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff0040')
      .attr('stop-opacity', 0);
    
    beamGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#ff0040')
      .attr('stop-opacity', 1);
    
    beamGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ff0040')
      .attr('stop-opacity', 0);

    // Pulse gradient for active countries
    const pulseGradient = defs.append('radialGradient')
      .attr('id', 'pulseGradient');
    
    pulseGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#ff4444')
      .attr('stop-opacity', 0.8);
    
    pulseGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#ff4444')
      .attr('stop-opacity', 0);

    // Get country intensity for coloring
    const getCountryIntensity = (countryName: string) => {
      const stats = countryStats[countryName];
      if (!stats) return 0;
      return Math.min(stats.totalAttacks / 20, 1);
    };

    const getCountryColor = (countryName: string) => {
      const intensity = getCountryIntensity(countryName);
      const stats = countryStats[countryName];
      
      if (intensity === 0) return '#0a0a0a';
      
      // Different colors for source vs target countries
      const isActiveSource = stats && stats.activeAttacks > 0;
      const isHighThreat = stats && stats.criticalAttacks > 0;
      
      if (isActiveSource && isHighThreat) {
        return `rgba(255, 0, 64, ${0.3 + intensity * 0.7})`;
      } else if (isActiveSource) {
        return `rgba(255, 100, 0, ${0.2 + intensity * 0.5})`;
      } else if (intensity > 0.1) {
        return `rgba(0, 150, 255, ${0.1 + intensity * 0.3})`;
      }
      
      return '#0a0a0a';
    };

    // Draw ocean background
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#000510');

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
      .attr('stroke', (d: any) => {
        const stats = countryStats[d.properties?.NAME || ''];
        if (stats && stats.activeAttacks > 0) return '#ff4444';
        if (stats && stats.totalAttacks > 0) return '#333';
        return '#111';
      })
      .attr('stroke-width', (d: any) => {
        const stats = countryStats[d.properties?.NAME || ''];
        if (stats && stats.activeAttacks > 0) return 1.5;
        if (stats && stats.totalAttacks > 0) return 0.8;
        return 0.3;
      })
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        const countryName = d.properties?.NAME || 'Unknown';
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#00d4ff')
          .attr('stroke', '#00d4ff')
          .attr('stroke-width', 2)
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
          .attr('stroke', countryStats[countryName] && countryStats[countryName].activeAttacks > 0 ? '#ff4444' : '#333')
          .attr('stroke-width', countryStats[countryName] && countryStats[countryName].totalAttacks > 0 ? 0.8 : 0.3)
          .attr('filter', 'none');
        setHoveredCountry(null);
      });

    // Add pulsing effects for active attack countries
    Object.keys(countryStats).forEach(countryName => {
      const stats = countryStats[countryName];
      if (stats.activeAttacks > 0) {
        const coords = getCountryCoordinates(countryName);
        if (coords) {
          const point = projection(coords);
          if (point) {
            // Add pulsing circle
            svg.append('circle')
              .attr('cx', point[0])
              .attr('cy', point[1])
              .attr('r', 0)
              .attr('fill', 'url(#pulseGradient)')
              .attr('opacity', 0.6)
              .transition()
              .duration(2000)
              .ease(d3.easeSinInOut)
              .attr('r', 30)
              .attr('opacity', 0)
              .on('end', function repeat() {
                d3.select(this)
                  .attr('r', 0)
                  .attr('opacity', 0.6)
                  .transition()
                  .duration(2000)
                  .ease(d3.easeSinInOut)
                  .attr('r', 30)
                  .attr('opacity', 0)
                  .on('end', repeat);
              });
          }
        }
      }
    });

    // Animation loop for live attacks
    let animationCount = 0;
    const animate = () => {
      // Generate attack animations
      if (Math.random() < 0.4 && attacks.length > 0) {
        const recentAttacks = attacks.filter(a => a.status === 'active').slice(0, 20);
        if (recentAttacks.length > 0) {
          const randomAttack = recentAttacks[Math.floor(Math.random() * recentAttacks.length)];
          animateAttackBeam(svg, randomAttack, projection);
          setTotalTrackedAttacks(prev => prev + 1);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [worldData, attacks, countryStats]);

  const animateAttackBeam = (svg: any, attack: Attack, projection: any) => {
    const sourceCoords = getCountryCoordinates(attack.sourceCountry);
    const targetCoords = getCountryCoordinates(attack.targetCountry);
    
    if (!sourceCoords || !targetCoords) return;
    
    const sourcePoint = projection(sourceCoords);
    const targetPoint = projection(targetCoords);
    
    if (!sourcePoint || !targetPoint) return;

    // Add country labels for the attack
    const midPoint = [
      (sourcePoint[0] + targetPoint[0]) / 2,
      (sourcePoint[1] + targetPoint[1]) / 2
    ];

    // Create attack label showing source → target
    const attackLabel = svg.append('text')
      .attr('x', midPoint[0])
      .attr('y', midPoint[1] - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', getSeverityColor(attack.severity))
      .attr('opacity', 0)
      .text(`${attack.sourceCountry} → ${attack.targetCountry}`)
      .style('pointer-events', 'none')
      .attr('filter', 'url(#glow)');

    // Animate label appearance
    attackLabel.transition()
      .duration(500)
      .attr('opacity', 0.9)
      .transition()
      .delay(1500)
      .duration(1000)
      .attr('opacity', 0)
      .remove();

    // Create attack beam line
    const line = svg.append('line')
      .attr('x1', sourcePoint[0])
      .attr('y1', sourcePoint[1])
      .attr('x2', sourcePoint[0])
      .attr('y2', sourcePoint[1])
      .attr('stroke', getSeverityColor(attack.severity))
      .attr('stroke-width', getSeverityWidth(attack.severity))
      .attr('opacity', 0.9)
      .attr('filter', 'url(#glow)');

    // Animate the beam
    line.transition()
      .duration(1200)
      .ease(d3.easeQuadOut)
      .attr('x2', targetPoint[0])
      .attr('y2', targetPoint[1])
      .transition()
      .duration(800)
      .attr('opacity', 0)
      .remove();

    // Source pulse
    svg.append('circle')
      .attr('cx', sourcePoint[0])
      .attr('cy', sourcePoint[1])
      .attr('r', 0)
      .attr('fill', getSeverityColor(attack.severity))
      .attr('opacity', 0.8)
      .transition()
      .duration(600)
      .attr('r', 12)
      .attr('opacity', 0)
      .remove();

    // Target impact
    setTimeout(() => {
      svg.append('circle')
        .attr('cx', targetPoint[0])
        .attr('cy', targetPoint[1])
        .attr('r', 0)
        .attr('fill', getSeverityColor(attack.severity))
        .attr('opacity', 0.9)
        .transition()
        .duration(500)
        .attr('r', 20)
        .attr('opacity', 0)
        .remove();

      // Impact rings
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          svg.append('circle')
            .attr('cx', targetPoint[0])
            .attr('cy', targetPoint[1])
            .attr('r', 8)
            .attr('stroke', getSeverityColor(attack.severity))
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('opacity', 0.7)
            .transition()
            .duration(1000)
            .attr('r', 40 + i * 15)
            .attr('opacity', 0)
            .remove();
        }, i * 150);
      }
    }, 1000);
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
      case 'critical': return '#ff0040';
      case 'high': return '#ff4400';
      case 'medium': return '#ffaa00';
      case 'low': return '#00ff88';
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
      className="bg-black rounded-xl shadow-2xl border border-gray-800 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Live Cyber Attack Map
            </h2>
            <p className="text-gray-400 text-sm mt-1">Real-time global threat intelligence</p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 font-semibold">{activeAttacks} Live Attacks</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-orange-400 font-semibold">{criticalAttacks} Critical</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-cyan-400 font-semibold">{totalTrackedAttacks} Tracked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-black">
        <svg
          ref={svgRef}
          width="100%"
          height="700"
          viewBox="0 0 1400 700"
          className="w-full h-auto"
        />
        
        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400 mb-3 font-semibold">THREAT LEVELS</div>
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span className="text-xs text-red-400 font-medium">Critical</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-0.5 bg-orange-500"></div>
              <span className="text-xs text-orange-400 font-medium">High</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-0.5 bg-yellow-500"></div>
              <span className="text-xs text-yellow-400 font-medium">Medium</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span className="text-xs text-green-400 font-medium">Low</span>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-2 font-semibold">ACTIVITY</div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Live Attack</span>
            </div>
          </div>
        </div>

        {/* Stats Panel */}
        <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-700">
          <div className="text-xs text-gray-400 mb-3 font-semibold">GLOBAL INTELLIGENCE</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Attacks:</span>
              <span className="text-white font-bold">{globalStats.totalAttacks.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Active:</span>
              <span className="text-red-400 font-bold animate-pulse">{globalStats.activeAttacks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Critical:</span>
              <span className="text-orange-400 font-bold">{globalStats.criticalAttacks}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Countries:</span>
              <span className="text-cyan-400 font-bold">{globalStats.uniqueCountries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Threat Actors:</span>
              <span className="text-purple-400 font-bold">{globalStats.topThreatActors.length}</span>
            </div>
          </div>
          
          {globalStats.topThreatActors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-2 font-semibold">TOP THREATS</div>
              <div className="space-y-1">
                {globalStats.topThreatActors.slice(0, 3).map((actor, index) => (
                  <div key={actor.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        actor.riskLevel === 'critical' ? 'bg-red-500' :
                        actor.riskLevel === 'high' ? 'bg-orange-500' :
                        actor.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></span>
                      <span className="text-gray-300 truncate max-w-20">{actor.name}</span>
                    </div>
                    <span className="text-red-400 font-bold">{actor.attacks}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            className="bg-black/95 backdrop-blur-sm border border-red-500/30 rounded-lg p-4 shadow-2xl max-w-sm"
          >
            <div className="flex items-center space-x-2 mb-3">
              <MapPin className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-bold text-lg">{hoveredCountry}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <Activity className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400">TOTAL</span>
                </div>
                <div className="text-lg font-bold text-white">{hoveredStats.totalAttacks}</div>
              </div>
              
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-orange-400">ACTIVE</span>
                </div>
                <div className="text-lg font-bold text-orange-400 animate-pulse">{hoveredStats.activeAttacks}</div>
              </div>
              
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-500">CRITICAL</span>
                </div>
                <div className="text-lg font-bold text-red-500">{hoveredStats.criticalAttacks}</div>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2">
                <div className="flex items-center space-x-1 mb-1">
                  <Shield className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">BLOCKED</span>
                </div>
                <div className="text-lg font-bold text-green-400">{hoveredStats.blockedAttacks}</div>
              </div>
            </div>
            
            {hoveredStats.activeAttacks > 0 && (
              <div className="mb-4 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-sm font-semibold text-red-400">UNDER ATTACK!</span>
                </div>
                <p className="text-xs text-red-300 mt-1">Live cyber attacks detected</p>
              </div>
            )}
            
            {hoveredStats.topAttackTypes.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  TOP THREATS
                </h4>
                <div className="space-y-1">
                  {hoveredStats.topAttackTypes.map((attackType, index) => (
                    <div key={attackType.type} className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{attackType.type}</span>
                      <span className="text-red-400 font-bold">{attackType.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {hoveredStats.recentAttacks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-2">RECENT ACTIVITY</h4>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {hoveredStats.recentAttacks.slice(0, 3).map((attack, index) => (
                    <div key={attack.id} className="text-xs text-gray-400 flex items-center justify-between">
                      <span className="truncate">{attack.attackType}</span>
                      <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                        attack.severity === 'critical' ? 'bg-red-500/30 text-red-400' :
                        attack.severity === 'high' ? 'bg-orange-500/30 text-orange-400' :
                        attack.severity === 'medium' ? 'bg-yellow-500/30 text-yellow-400' :
                        'bg-green-500/30 text-green-400'
                      }`}>
                        {attack.severity.toUpperCase()}
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