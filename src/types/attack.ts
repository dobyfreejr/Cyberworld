export interface Attack {
  id: string;
  timestamp: Date;
  sourceCountry: string;
  targetCountry: string;
  attackType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'blocked' | 'resolved';
  sourceIP: string;
  targetIP: string;
  port: number;
  protocol: string;
  threatActor?: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  country: string;
  type: 'nation-state' | 'cybercriminal' | 'hacktivist' | 'insider';
  activeAttacks: number;
  totalAttacks: number;
  lastSeen: Date;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}