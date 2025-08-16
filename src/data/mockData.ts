import { Attack, ThreatActor } from '../types/attack';

const countries = [
  'United States', 'China', 'Russia', 'Germany', 'United Kingdom', 
  'France', 'Japan', 'South Korea', 'India', 'Brazil', 'Canada', 
  'Australia', 'Netherlands', 'Sweden', 'Israel', 'Iran', 'North Korea'
];

const attackTypes = [
  'DDoS', 'Malware', 'Phishing', 'SQL Injection', 'Ransomware', 
  'Brute Force', 'Zero-day Exploit', 'Man-in-the-Middle', 'Social Engineering'
];

const protocols = ['HTTP', 'HTTPS', 'SSH', 'FTP', 'SMTP', 'DNS', 'TCP', 'UDP'];

const threatActorNames = [
  'APT28', 'Lazarus Group', 'Fancy Bear', 'Cozy Bear', 'Equation Group',
  'Dark Halo', 'Carbanak', 'FIN7', 'Sandworm', 'Turla'
];

export const mockThreatActors: ThreatActor[] = threatActorNames.map((name, index) => ({
  id: `actor-${index + 1}`,
  name,
  country: countries[Math.floor(Math.random() * countries.length)],
  type: ['nation-state', 'cybercriminal', 'hacktivist', 'insider'][Math.floor(Math.random() * 4)] as ThreatActor['type'],
  activeAttacks: Math.floor(Math.random() * 50),
  totalAttacks: Math.floor(Math.random() * 1000) + 100,
  lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  riskLevel: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as ThreatActor['riskLevel']
}));

export function generateMockAttack(): Attack {
  const sourceCountry = countries[Math.floor(Math.random() * countries.length)];
  const targetCountry = countries[Math.floor(Math.random() * countries.length)];
  const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
  const protocol = protocols[Math.floor(Math.random() * protocols.length)];
  
  return {
    id: `attack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    sourceCountry,
    targetCountry,
    attackType,
    severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as Attack['severity'],
    status: ['active', 'blocked', 'resolved'][Math.floor(Math.random() * 3)] as Attack['status'],
    sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    targetIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    port: Math.floor(Math.random() * 65535) + 1,
    protocol,
    threatActor: Math.random() > 0.7 ? threatActorNames[Math.floor(Math.random() * threatActorNames.length)] : undefined
  };
}