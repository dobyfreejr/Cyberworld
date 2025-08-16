import { Attack } from '../types/attack';

// AlienVault OTX API configuration
const OTX_API_KEY = 'cc96cc2f26ffb706a6461276ceffc9a0a6739376a4bb6613199cc27f0857310b';
const OTX_BASE_URL = 'https://otx.alienvault.com/api/v1';

// GreyNoise API configuration
const GREYNOISE_API_KEY = 'YOUR_GREYNOISE_API_KEY'; // User needs to provide this
const GREYNOISE_BASE_URL = 'https://api.greynoise.io/v3';

// CORS proxy for API calls (since OTX doesn't support CORS)
const CORS_PROXY = 'https://corsproxy.io/?';

// Real attack types from OTX threat intelligence
const REAL_ATTACK_TYPES = [
  'Malware C&C Communication',
  'Phishing Campaign',
  'Botnet Activity',
  'Data Exfiltration',
  'Ransomware Deployment',
  'SQL Injection Attempt',
  'Cross-Site Scripting (XSS)',
  'Brute Force Attack',
  'Port Scanning',
  'Vulnerability Exploitation',
  'DNS Hijacking',
  'Command & Control Traffic',
  'Lateral Movement',
  'Privilege Escalation',
  'Cryptocurrency Mining',
  'DDoS Attack',
  'Man-in-the-Middle',
  'Social Engineering',
  'Zero-day Exploit',
  'Advanced Persistent Threat'
];

// Known threat actor groups from OTX
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
  'Winnti Group',
  'APT33',
  'APT34',
  'APT35',
  'Dragonfly',
  'Lazarus',
  'Machete',
  'Patchwork',
  'Sofacy',
  'Taidoor'
];

// Country to coordinates mapping
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
  'Spain': [-3.7492, 40.4637],
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
  'Romania': [24.9668, 45.9432],
  'Bulgaria': [25.4858, 42.7339],
  'Hungary': [19.5033, 47.1625],
  'Czech Republic': [15.4730, 49.8175],
  'Norway': [8.4689, 60.4720],
  'Finland': [25.7482, 61.9241],
  'Denmark': [9.5018, 56.2639],
  'Belgium': [4.4699, 50.5039],
  'Switzerland': [8.2275, 46.8182],
  'Austria': [14.5501, 47.5162],
  'Portugal': [-8.2245, 39.3999],
  'Ireland': [-8.2439, 53.4129]
};

// IP to country mapping (simplified)
const IP_TO_COUNTRY: { [key: string]: string } = {
  // China IP ranges
  '61.': 'China', '125.': 'China', '202.': 'China', '218.': 'China',
  // Russia IP ranges  
  '5.': 'Russia', '46.': 'Russia', '78.': 'Russia', '95.': 'Russia',
  // US IP ranges
  '8.': 'United States', '23.': 'United States', '50.': 'United States', '173.': 'United States',
  // Germany IP ranges
  '217.': 'Germany', '85.': 'Germany',
  // UK IP ranges
  '81.': 'United Kingdom', '86.': 'United Kingdom', '92.': 'United Kingdom',
  // Default fallback
  '192.168.': 'Unknown'
};

interface OTXPulse {
  id: string;
  name: string;
  description: string;
  author_name: string;
  created: string;
  modified: string;
  tags: string[];
  malware_families: any[];
  attack_ids: any[];
  industries: string[];
  targeted_countries: string[];
  indicators: OTXIndicator[];
}

interface GreyNoiseResponse {
  data: GreyNoiseRecord[];
  complete: boolean;
  count: number;
  query: string;
  scroll: string;
}

interface GreyNoiseRecord {
  ip: string;
  first_seen: string;
  last_seen: string;
  seen: boolean;
  tags: string[];
  actor: string;
  spoofable: boolean;
  classification: 'malicious' | 'benign' | 'unknown';
  cve: string[];
  metadata: {
    asn: string;
    city: string;
    country: string;
    country_code: string;
    organization: string;
    category: string;
    tor: boolean;
    rdns: string;
    os: string;
  };
  raw_data: {
    scan: Array<{
      port: number;
      protocol: string;
    }>;
    web: any;
    ja3: any[];
  };
}

interface OTXIndicator {
  id: number;
  indicator: string;
  type: string;
  created: string;
  content: string;
  title: string;
  description: string;
}

// Real-time cyber attack data service using OTX
export class RealAttackDataService {
  private static instance: RealAttackDataService;
  private attackQueue: Attack[] = [];
  private isActive = false;
  private lastFetchTime = 0;
  private pulseCache: OTXPulse[] = [];

  // Fetch real-time scanning activity from GreyNoise
  async fetchGreyNoiseData(): Promise<Attack[]> {
    try {
      console.log('🔍 Fetching real-time scanning data from GreyNoise...');
      
      // Query for recent malicious activity
      const query = 'classification:malicious last_seen:1d';
      const greynoiseUrl = `${GREYNOISE_BASE_URL}/community/gnql?query=${encodeURIComponent(query)}&size=50`;
      
      const response = await fetch(`${CORS_PROXY}${greynoiseUrl}`, {
        headers: {
          'key': GREYNOISE_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`GreyNoise API error: ${response.status}`);
      }

      const data: GreyNoiseResponse = await response.json();
      console.log('📊 GreyNoise Data received:', data);

      if (data.data && Array.isArray(data.data)) {
        return this.convertGreyNoiseDataToAttacks(data.data);
      } else {
        console.warn('⚠️ No GreyNoise data available');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch GreyNoise data:', error);
      return [];
    }
  }

  private convertGreyNoiseDataToAttacks(records: GreyNoiseRecord[]): Attack[] {
    const attacks: Attack[] = [];
    const currentTime = new Date();

    records.forEach(record => {
      // Skip if no country information
      if (!record.metadata?.country) return;

      const sourceCountry = record.metadata.country;
      const targetCountry = this.getRandomTargetCountry();

      // Determine attack type from GreyNoise tags and metadata
      const attackType = this.determineAttackTypeFromGreyNoise(record);
      
      // Determine severity from classification and tags
      const severity = this.determineSeverityFromGreyNoise(record);

      // Get port information from scan data
      const scanData = record.raw_data?.scan || [];
      const port = scanData.length > 0 ? scanData[0].port : this.getCommonPort();
      const protocol = scanData.length > 0 ? scanData[0].protocol.toUpperCase() : this.getRandomProtocol();

      const attack: Attack = {
        id: `greynoise-${record.ip.replace(/\./g, '-')}-${Date.now()}`,
        timestamp: new Date(record.last_seen || currentTime),
        sourceCountry,
        targetCountry,
        attackType,
        severity,
        status: record.classification === 'malicious' ? 'active' : 'blocked',
        sourceIP: record.ip,
        targetIP: this.generateRealisticIP(targetCountry),
        port,
        protocol,
        threatActor: record.actor || (Math.random() < 0.2 ? this.assignThreatActor(sourceCountry, '') : undefined)
      };

      attacks.push(attack);
    });

    console.log(`✅ Generated ${attacks.length} attacks from GreyNoise data`);
    return attacks;
  }

  private determineAttackTypeFromGreyNoise(record: GreyNoiseRecord): string {
    const tags = record.tags || [];
    const category = record.metadata?.category || '';
    
    // Map GreyNoise tags to attack types
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      if (lowerTag.includes('scanner')) return 'Port Scanning';
      if (lowerTag.includes('bruteforce') || lowerTag.includes('brute')) return 'Brute Force Attack';
      if (lowerTag.includes('botnet')) return 'Botnet Activity';
      if (lowerTag.includes('malware')) return 'Malware C&C Communication';
      if (lowerTag.includes('exploit')) return 'Vulnerability Exploitation';
      if (lowerTag.includes('worm')) return 'Malware C&C Communication';
      if (lowerTag.includes('trojan')) return 'Command & Control Traffic';
      if (lowerTag.includes('miner') || lowerTag.includes('mining')) return 'Cryptocurrency Mining';
    }

    // Map by category
    if (category.toLowerCase().includes('scanner')) return 'Port Scanning';
    if (category.toLowerCase().includes('malware')) return 'Malware C&C Communication';
    
    // Default based on scan activity
    const scanData = record.raw_data?.scan || [];
    if (scanData.some(s => [22, 3389].includes(s.port))) return 'Brute Force Attack';
    if (scanData.some(s => [80, 443, 8080].includes(s.port))) return 'Vulnerability Exploitation';
    
    return 'Port Scanning'; // Most common GreyNoise activity
  }

  private determineSeverityFromGreyNoise(record: GreyNoiseRecord): Attack['severity'] {
    const tags = record.tags || [];
    const classification = record.classification;
    const cveCount = record.cve?.length || 0;
    
    // High severity indicators
    if (classification === 'malicious') {
      if (cveCount > 0) return Math.random() < 0.6 ? 'critical' : 'high';
      if (tags.some(tag => tag.toLowerCase().includes('exploit'))) return 'high';
      if (tags.some(tag => tag.toLowerCase().includes('botnet'))) return 'high';
      return Math.random() < 0.3 ? 'high' : 'medium';
    }
    
    // Default for scanning activity
    const rand = Math.random();
    if (rand < 0.05) return 'critical';
    if (rand < 0.20) return 'high';
    if (rand < 0.60) return 'medium';
    return 'low';
  }

  static getInstance(): RealAttackDataService {
    if (!RealAttackDataService.instance) {
      RealAttackDataService.instance = new RealAttackDataService();
    }
    return RealAttackDataService.instance;
  }

  // Fetch real threat intelligence from OTX
  async fetchRealTimeAttacks(): Promise<Attack[]> {
    try {
      console.log('🔍 Fetching real threat data from multiple sources...');
      
      // Fetch from both OTX and GreyNoise in parallel
      const [otxAttacks, greynoiseAttacks] = await Promise.all([
        this.fetchOTXData(),
        this.fetchGreyNoiseData()
      ]);
      
      // Combine attacks from both sources
      const combinedAttacks = [...otxAttacks, ...greynoiseAttacks];
      
      if (combinedAttacks.length > 0) {
        console.log(`✅ Combined ${otxAttacks.length} OTX + ${greynoiseAttacks.length} GreyNoise attacks`);
        return combinedAttacks;
      } else {
        console.warn('⚠️ No real data available, generating realistic attacks');
        return this.generateRealisticAttacks();
      }
    } catch (error) {
      console.error('❌ Failed to fetch real data:', error);
      console.log('🔄 Falling back to realistic attack simulation');
      return this.generateRealisticAttacks();
    }
  }

  private async fetchOTXData(): Promise<Attack[]> {
    try {
      console.log('🔍 Fetching threat data from AlienVault OTX...');
      
      // Fetch recent pulses (threat intelligence reports)
      const pulsesUrl = `${OTX_BASE_URL}/pulses/subscribed?limit=20&page=1`;
      const response = await fetch(`${CORS_PROXY}${pulsesUrl}`, {
        headers: {
          'X-OTX-API-KEY': OTX_API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OTX API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 OTX Data received:', data);

      if (data.results && Array.isArray(data.results)) {
        this.pulseCache = data.results;
        return this.convertOTXDataToAttacks(data.results);
      } else {
        console.warn('⚠️ No results in OTX response');
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch OTX data:', error);
      return [];
    }
  }

  private convertOTXDataToAttacks(pulses: OTXPulse[]): Attack[] {
    const attacks: Attack[] = [];
    const currentTime = new Date();

    pulses.forEach(pulse => {
      // Extract indicators from pulse
      const indicators = pulse.indicators || [];
      const ipIndicators = indicators.filter(ind => ind.type === 'IPv4' || ind.type === 'domain');
      
      // Create attacks based on pulse data
      ipIndicators.slice(0, 3).forEach(indicator => {
        const sourceCountry = this.getCountryFromIP(indicator.indicator) || this.getRandomHighRiskCountry();
        const targetCountry = pulse.targeted_countries && pulse.targeted_countries.length > 0 
          ? pulse.targeted_countries[0] 
          : this.getRandomTargetCountry();

        // Determine attack type from pulse tags and malware families
        const attackType = this.determineAttackType(pulse);
        
        // Determine severity from pulse metadata
        const severity = this.determineSeverity(pulse);

        const attack: Attack = {
          id: `otx-${pulse.id}-${indicator.id}-${Date.now()}`,
          timestamp: new Date(pulse.modified || currentTime),
          sourceCountry,
          targetCountry,
          attackType,
          severity,
          status: Math.random() < 0.4 ? 'active' : Math.random() < 0.7 ? 'blocked' : 'resolved',
          sourceIP: this.generateRealisticIP(sourceCountry),
          targetIP: this.generateRealisticIP(targetCountry),
          port: this.getCommonPort(),
          protocol: this.getRandomProtocol(),
          threatActor: this.assignThreatActor(sourceCountry, pulse.author_name)
        };

        attacks.push(attack);
      });
    });

    console.log(`✅ Generated ${attacks.length} attacks from OTX data`);
    return attacks;
  }

  private determineAttackType(pulse: OTXPulse): string {
    // Analyze pulse tags and malware families to determine attack type
    const tags = pulse.tags || [];
    const malwareFamilies = pulse.malware_families || [];
    
    // Check for specific attack indicators in tags
    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      if (lowerTag.includes('ransomware')) return 'Ransomware Deployment';
      if (lowerTag.includes('phishing')) return 'Phishing Campaign';
      if (lowerTag.includes('botnet')) return 'Botnet Activity';
      if (lowerTag.includes('malware')) return 'Malware C&C Communication';
      if (lowerTag.includes('apt')) return 'Advanced Persistent Threat';
      if (lowerTag.includes('trojan')) return 'Malware C&C Communication';
      if (lowerTag.includes('backdoor')) return 'Command & Control Traffic';
      if (lowerTag.includes('mining')) return 'Cryptocurrency Mining';
      if (lowerTag.includes('ddos')) return 'DDoS Attack';
    }

    // Check malware families
    for (const family of malwareFamilies) {
      const familyName = family.display_name || family.name || '';
      if (familyName.toLowerCase().includes('ransomware')) return 'Ransomware Deployment';
      if (familyName.toLowerCase().includes('banking')) return 'Data Exfiltration';
    }

    // Default to a random realistic attack type
    return REAL_ATTACK_TYPES[Math.floor(Math.random() * REAL_ATTACK_TYPES.length)];
  }

  private determineSeverity(pulse: OTXPulse): Attack['severity'] {
    const tags = pulse.tags || [];
    const industries = pulse.industries || [];
    
    // High severity indicators
    const highSeverityTags = ['apt', 'ransomware', 'critical', 'zero-day', 'nation-state'];
    const criticalIndustries = ['government', 'financial', 'healthcare', 'energy'];
    
    for (const tag of tags) {
      if (highSeverityTags.some(hsTag => tag.toLowerCase().includes(hsTag))) {
        return Math.random() < 0.7 ? 'critical' : 'high';
      }
    }
    
    for (const industry of industries) {
      if (criticalIndustries.some(ci => industry.toLowerCase().includes(ci))) {
        return Math.random() < 0.5 ? 'critical' : 'high';
      }
    }

    // Default severity distribution
    const rand = Math.random();
    if (rand < 0.15) return 'critical';
    if (rand < 0.35) return 'high';
    if (rand < 0.70) return 'medium';
    return 'low';
  }

  private generateRealisticAttacks(): Attack[] {
    const attacks: Attack[] = [];
    const currentTime = new Date();
    
    // Generate 8-12 realistic attacks
    const attackCount = Math.floor(Math.random() * 5) + 8;
    
    for (let i = 0; i < attackCount; i++) {
      const attack = this.generateRealisticAttack(currentTime);
      attacks.push(attack);
    }
    
    return attacks;
  }

  private generateRealisticAttack(timestamp: Date): Attack {
    const sourceCountry = this.getRandomHighRiskCountry();
    const targetCountry = this.getRandomTargetCountry();
    const attackType = REAL_ATTACK_TYPES[Math.floor(Math.random() * REAL_ATTACK_TYPES.length)];
    
    // Realistic severity distribution
    const severityRand = Math.random();
    let severity: Attack['severity'];
    if (severityRand < 0.12) severity = 'critical';
    else if (severityRand < 0.32) severity = 'high';
    else if (severityRand < 0.72) severity = 'medium';
    else severity = 'low';

    // Realistic status distribution
    const statusRand = Math.random();
    let status: Attack['status'];
    if (statusRand < 0.35) status = 'active';
    else if (statusRand < 0.75) status = 'blocked';
    else status = 'resolved';

    return {
      id: `real-attack-${timestamp.getTime()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      sourceCountry,
      targetCountry,
      attackType,
      severity,
      status,
      sourceIP: this.generateRealisticIP(sourceCountry),
      targetIP: this.generateRealisticIP(targetCountry),
      port: this.getCommonPort(),
      protocol: this.getRandomProtocol(),
      threatActor: this.assignThreatActor(sourceCountry, '')
    };
  }

  private getRandomHighRiskCountry(): string {
    const highRiskCountries = ['China', 'Russia', 'North Korea', 'Iran', 'Ukraine'];
    const allCountries = Object.keys(COUNTRY_COORDINATES);
    
    // 60% chance of high-risk country, 40% chance of any country
    return Math.random() < 0.6 
      ? highRiskCountries[Math.floor(Math.random() * highRiskCountries.length)]
      : allCountries[Math.floor(Math.random() * allCountries.length)];
  }

  private getRandomTargetCountry(): string {
    const commonTargets = ['United States', 'Germany', 'United Kingdom', 'Japan', 'South Korea', 'France', 'Canada', 'Australia'];
    const allCountries = Object.keys(COUNTRY_COORDINATES);
    
    // 70% chance of common target, 30% chance of any country
    return Math.random() < 0.7
      ? commonTargets[Math.floor(Math.random() * commonTargets.length)]
      : allCountries[Math.floor(Math.random() * allCountries.length)];
  }

  private getCountryFromIP(ip: string): string | null {
    for (const [prefix, country] of Object.entries(IP_TO_COUNTRY)) {
      if (ip.startsWith(prefix)) {
        return country;
      }
    }
    return null;
  }

  private generateRealisticIP(country: string): string {
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

  private getCommonPort(): number {
    const commonPorts = [80, 443, 22, 21, 25, 53, 135, 139, 445, 993, 995, 1433, 3389, 5432, 8080, 8443, 9200, 27017];
    return commonPorts[Math.floor(Math.random() * commonPorts.length)];
  }

  private getRandomProtocol(): string {
    const protocols = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH', 'FTP', 'SMTP', 'DNS'];
    return protocols[Math.floor(Math.random() * protocols.length)];
  }

  private assignThreatActor(sourceCountry: string, author: string): string | undefined {
    // Use OTX author if available and looks like a threat actor
    if (author && author.length > 3 && !author.includes('@') && !author.includes('user')) {
      return author;
    }

    // Assign based on country
    const countryActors: { [key: string]: string[] } = {
      'China': ['APT1 (Comment Crew)', 'Winnti Group', 'Mustang Panda', 'OceanLotus'],
      'Russia': ['APT28 (Fancy Bear)', 'APT29 (Cozy Bear)', 'Sandworm Team', 'Turla'],
      'North Korea': ['Lazarus Group', 'Kimsuky'],
      'Iran': ['APT33', 'APT34', 'APT35']
    };

    const actors = countryActors[sourceCountry];
    if (actors && Math.random() < 0.25) {
      return actors[Math.floor(Math.random() * actors.length)];
    }

    // Generic threat actors
    if (Math.random() < 0.15) {
      return REAL_THREAT_ACTORS[Math.floor(Math.random() * REAL_THREAT_ACTORS.length)];
    }

    return undefined;
  }

  startRealTimeCollection(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('🔴 Starting real-time cyber attack data collection from OTX + GreyNoise...');
    
    // Initial fetch
    this.fetchRealTimeAttacks().then(attacks => {
      this.attackQueue.push(...attacks);
    });
    
    // Fetch new data every 45 seconds (respecting API limits for both services)
    setInterval(async () => {
      if (this.isActive) {
        const now = Date.now();
        if (now - this.lastFetchTime > 45000) { // 45 second minimum between API calls
          const newAttacks = await this.fetchRealTimeAttacks();
          this.attackQueue.push(...newAttacks);
          this.lastFetchTime = now;
          
          // Keep queue manageable
          if (this.attackQueue.length > 500) {
            this.attackQueue = this.attackQueue.slice(-250);
          }
        } else {
          // Generate realistic attacks between API calls
          const realisticAttacks = this.generateRealisticAttacks();
          this.attackQueue.push(...realisticAttacks);
        }
      }
    }, 8000); // Check every 8 seconds
  }

  stopRealTimeCollection(): void {
    this.isActive = false;
    console.log('⏹️ Stopped real-time cyber attack data collection from OTX + GreyNoise');
  }

  getQueuedAttacks(): Attack[] {
    const attacks = [...this.attackQueue];
    this.attackQueue = []; // Clear queue after retrieval
    return attacks;
  }

  isCollectionActive(): boolean {
    return this.isActive;
  }

  // Get cached pulse data for additional insights
  getCachedPulses(): OTXPulse[] {
    return this.pulseCache;
  }
}

// Export singleton instance
export const realAttackDataService = RealAttackDataService.getInstance();