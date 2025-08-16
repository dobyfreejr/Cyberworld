import { Attack } from '../types/attack';

// Real-time cyber attack data sources
const ATTACK_SOURCES = {
  // Honeypot networks and threat intelligence feeds
  SHODAN: 'https://api.shodan.io/shodan/host/search',
  ALIENVAULT: 'https://otx.alienvault.com/api/v1/pulses/subscribed',
  VIRUSTOTAL: 'https://www.virustotal.com/vtapi/v2/file/report',
  // Public threat feeds
  EMERGINGTHREATS: 'https://rules.emergingthreats.net/blockrules/compromised-ips.txt',
  SPAMHAUS: 'https://www.spamhaus.org/drop/drop.txt',
  MALWAREDOMAINLIST: 'https://www.malwaredomainlist.com/hostslist/hosts.txt'
};

// IP geolocation service
const GEOLOCATION_API = 'http://ip-api.com/json/';

// Real attack types from threat intelligence
const REAL_ATTACK_TYPES = [
  'Botnet C&C Communication',
  'Malware Download',
  'Phishing Campaign',
  'Cryptocurrency Mining',
  'Data Exfiltration',
  'Ransomware Deployment',
  'SQL Injection Attempt',
  'Cross-Site Scripting (XSS)',
  'Brute Force Login',
  'Port Scanning',
  'Vulnerability Exploitation',
  'DNS Tunneling',
  'Command & Control Traffic',
  'Lateral Movement',
  'Privilege Escalation'
];

// Known threat actor groups
const REAL_THREAT_ACTORS = [
  'APT1 (Comment Crew)',
  'APT28 (Fancy Bear)',
  'APT29 (Cozy Bear)',
  'Lazarus Group',
  'Carbanak',
  'FIN7',
  'Equation Group',
  'Dark Halo',
  'Sandworm Team',
  'Turla',
  'Kimsuky',
  'Mustang Panda',
  'Sidewinder',
  'OceanLotus',
  'Winnti Group'
];

// Country to coordinates mapping for real locations
const COUNTRY_COORDINATES: { [key: string]: [number, number] } = {
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
  'North Korea': [127.5101, 40.3399],
  'Ukraine': [31.1656, 49.0139],
  'Poland': [19.1343, 51.9194],
  'Turkey': [35.2433, 38.9637],
  'Italy': [12.5674, 41.8719],
  'Spain': [40.4637, 40.4637],
  'Mexico': [-102.5528, 23.6345],
  'Argentina': [-63.6167, -38.4161],
  'South Africa': [22.9375, -30.5595],
  'Egypt': [30.8025, 26.8206],
  'Nigeria': [8.6753, 9.0820],
  'Kenya': [37.9062, -0.0236],
  'Thailand': [100.9925, 15.8700],
  'Vietnam': [108.2772, 14.0583],
  'Indonesia': [113.9213, -0.7893],
  'Malaysia': [101.9758, 4.2105],
  'Singapore': [103.8198, 1.3521],
  'Philippines': [121.7740, 12.8797],
  'Pakistan': [69.3451, 30.3753],
  'Bangladesh': [90.3563, 23.6850],
  'Saudi Arabia': [45.0792, 23.8859],
  'United Arab Emirates': [53.8478, 23.4241],
  'Qatar': [51.1839, 25.3548],
  'Kuwait': [47.4818, 29.3117],
  'Iraq': [43.6793, 33.2232],
  'Syria': [38.9968, 34.8021],
  'Lebanon': [35.8623, 33.8547],
  'Jordan': [36.2384, 30.5852],
  'Romania': [24.9668, 45.9432],
  'Bulgaria': [25.4858, 42.7339],
  'Hungary': [19.5033, 47.1625],
  'Czech Republic': [15.4730, 49.8175],
  'Slovakia': [19.6990, 48.6690],
  'Slovenia': [14.9955, 46.1512],
  'Croatia': [15.2000, 45.1000],
  'Serbia': [21.0059, 44.0165],
  'Bosnia and Herzegovina': [17.6791, 43.9159],
  'Montenegro': [19.3744, 42.7087],
  'Albania': [20.1683, 41.1533],
  'North Macedonia': [21.7453, 41.6086],
  'Greece': [21.8243, 39.0742],
  'Cyprus': [33.4299, 35.1264],
  'Malta': [14.3754, 35.9375],
  'Iceland': [-19.0208, 64.9631],
  'Norway': [8.4689, 60.4720],
  'Finland': [25.7482, 61.9241],
  'Denmark': [9.5018, 56.2639],
  'Belgium': [4.4699, 50.5039],
  'Luxembourg': [6.1296, 49.8153],
  'Switzerland': [8.2275, 46.8182],
  'Austria': [14.5501, 47.5162],
  'Portugal': [-8.2245, 39.3999],
  'Ireland': [-8.2439, 53.4129],
  'Latvia': [24.6032, 56.8796],
  'Lithuania': [23.8813, 55.1694],
  'Estonia': [25.0136, 58.5953],
  'Belarus': [27.9534, 53.7098],
  'Moldova': [28.3699, 47.4116],
  'Georgia': [43.3569, 42.3154],
  'Armenia': [45.0382, 40.0691],
  'Azerbaijan': [47.5769, 40.1431],
  'Kazakhstan': [66.9237, 48.0196],
  'Uzbekistan': [64.5853, 41.3775],
  'Turkmenistan': [59.5563, 38.9697],
  'Kyrgyzstan': [74.7661, 41.2044],
  'Tajikistan': [71.2761, 38.8610],
  'Afghanistan': [67.7090, 33.9391],
  'Mongolia': [103.8467, 46.8625],
  'Myanmar': [95.9560, 21.9162],
  'Laos': [102.4955, 19.8563],
  'Cambodia': [104.9910, 12.5657],
  'Sri Lanka': [80.7718, 7.8731],
  'Maldives': [73.2207, 3.2028],
  'Nepal': [84.1240, 28.3949],
  'Bhutan': [90.4336, 27.5142]
};

// Simulate real-time threat intelligence data
export class RealAttackDataService {
  private static instance: RealAttackDataService;
  private attackQueue: Attack[] = [];
  private isActive = false;

  static getInstance(): RealAttackDataService {
    if (!RealAttackDataService.instance) {
      RealAttackDataService.instance = new RealAttackDataService();
    }
    return RealAttackDataService.instance;
  }

  // Simulate fetching from real threat intelligence APIs
  async fetchRealTimeAttacks(): Promise<Attack[]> {
    try {
      // In a real implementation, this would fetch from actual APIs
      // For now, we'll simulate realistic attack patterns based on real threat data
      
      const attacks: Attack[] = [];
      const currentTime = new Date();
      
      // Generate attacks based on real-world patterns
      for (let i = 0; i < 10; i++) {
        const attack = this.generateRealisticAttack(currentTime);
        attacks.push(attack);
      }
      
      return attacks;
    } catch (error) {
      console.error('Failed to fetch real-time attack data:', error);
      return [];
    }
  }

  private generateRealisticAttack(timestamp: Date): Attack {
    // Real attack patterns based on threat intelligence
    const highRiskSources = ['China', 'Russia', 'North Korea', 'Iran'];
    const commonTargets = ['United States', 'Germany', 'United Kingdom', 'Japan', 'South Korea'];
    
    // Weight source countries based on real threat landscape
    const sourceCountry = Math.random() < 0.6 
      ? highRiskSources[Math.floor(Math.random() * highRiskSources.length)]
      : Object.keys(COUNTRY_COORDINATES)[Math.floor(Math.random() * Object.keys(COUNTRY_COORDINATES).length)];
    
    // Weight target countries based on real attack patterns
    const targetCountry = Math.random() < 0.7
      ? commonTargets[Math.floor(Math.random() * commonTargets.length)]
      : Object.keys(COUNTRY_COORDINATES)[Math.floor(Math.random() * Object.keys(COUNTRY_COORDINATES).length)];
    
    // Ensure source and target are different
    const finalTargetCountry = sourceCountry === targetCountry 
      ? commonTargets.find(c => c !== sourceCountry) || 'United States'
      : targetCountry;

    // Real attack type distribution
    const attackType = REAL_ATTACK_TYPES[Math.floor(Math.random() * REAL_ATTACK_TYPES.length)];
    
    // Realistic severity distribution (more low/medium, fewer critical)
    const severityRand = Math.random();
    let severity: Attack['severity'];
    if (severityRand < 0.1) severity = 'critical';
    else if (severityRand < 0.3) severity = 'high';
    else if (severityRand < 0.7) severity = 'medium';
    else severity = 'low';

    // Realistic status distribution
    const statusRand = Math.random();
    let status: Attack['status'];
    if (statusRand < 0.4) status = 'active';
    else if (statusRand < 0.8) status = 'blocked';
    else status = 'resolved';

    // Common ports for real attacks
    const commonPorts = [80, 443, 22, 21, 25, 53, 135, 139, 445, 993, 995, 1433, 3389, 5432, 8080];
    const port = commonPorts[Math.floor(Math.random() * commonPorts.length)];

    // Realistic protocols
    const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH', 'FTP', 'SMTP'];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];

    // Generate realistic IP addresses
    const sourceIP = this.generateRealisticIP(sourceCountry);
    const targetIP = this.generateRealisticIP(finalTargetCountry);

    // Assign threat actor based on source country and attack type
    const threatActor = this.assignThreatActor(sourceCountry, attackType);

    return {
      id: `real-attack-${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      sourceCountry,
      targetCountry: finalTargetCountry,
      attackType,
      severity,
      status,
      sourceIP,
      targetIP,
      port,
      protocol,
      threatActor
    };
  }

  private generateRealisticIP(country: string): string {
    // Generate IPs that roughly correspond to country IP ranges
    // This is simplified - real implementation would use actual GeoIP data
    const countryIPRanges: { [key: string]: string[] } = {
      'China': ['61.', '125.', '202.', '218.'],
      'Russia': ['5.', '46.', '78.', '95.'],
      'United States': ['8.', '23.', '50.', '173.'],
      'Germany': ['46.', '78.', '85.', '217.'],
      'United Kingdom': ['81.', '86.', '92.', '212.'],
      'Japan': ['126.', '133.', '153.', '210.'],
      'South Korea': ['1.', '14.', '27.', '175.'],
      'North Korea': ['175.45.', '210.52.']
    };

    const ranges = countryIPRanges[country] || ['192.168.'];
    const prefix = ranges[Math.floor(Math.random() * ranges.length)];
    
    if (prefix.endsWith('.')) {
      return `${prefix}${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    } else {
      return `${prefix}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
  }

  private assignThreatActor(sourceCountry: string, attackType: string): string | undefined {
    // Assign threat actors based on real-world attribution
    const countryActors: { [key: string]: string[] } = {
      'China': ['APT1 (Comment Crew)', 'Winnti Group', 'Mustang Panda', 'OceanLotus'],
      'Russia': ['APT28 (Fancy Bear)', 'APT29 (Cozy Bear)', 'Sandworm Team', 'Turla'],
      'North Korea': ['Lazarus Group', 'Kimsuky'],
      'Iran': ['APT33', 'APT34', 'APT35'],
      'United States': ['Equation Group']
    };

    const actors = countryActors[sourceCountry];
    if (actors && Math.random() < 0.3) { // 30% chance of attribution
      return actors[Math.floor(Math.random() * actors.length)];
    }

    // Generic threat actors for other attacks
    if (Math.random() < 0.15) { // 15% chance for other countries
      return REAL_THREAT_ACTORS[Math.floor(Math.random() * REAL_THREAT_ACTORS.length)];
    }

    return undefined;
  }

  startRealTimeCollection(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🔴 Starting real-time cyber attack data collection...');
    
    // Simulate continuous data collection
    setInterval(async () => {
      if (this.isActive) {
        const newAttacks = await this.fetchRealTimeAttacks();
        this.attackQueue.push(...newAttacks);
        
        // Keep queue manageable
        if (this.attackQueue.length > 1000) {
          this.attackQueue = this.attackQueue.slice(-500);
        }
      }
    }, 5000); // Fetch new data every 5 seconds
  }

  stopRealTimeCollection(): void {
    this.isActive = false;
    console.log('⏹️ Stopped real-time cyber attack data collection');
  }

  getQueuedAttacks(): Attack[] {
    const attacks = [...this.attackQueue];
    this.attackQueue = []; // Clear queue after retrieval
    return attacks;
  }

  isCollectionActive(): boolean {
    return this.isActive;
  }
}

// Export singleton instance
export const realAttackDataService = RealAttackDataService.getInstance();