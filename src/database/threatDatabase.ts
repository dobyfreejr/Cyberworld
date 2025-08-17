import Database from 'better-sqlite3';
import { Attack, ThreatActor } from '../types/attack';

export interface ThreatFamily {
  id: string;
  name: string;
  category: string;
  firstSeen: Date;
  lastSeen: Date;
  totalAttacks: number;
  countries: string[];
  description?: string;
  aliases: string[];
  techniques: string[];
  targetSectors: string[];
}

export interface HistoricalStats {
  date: string;
  threatFamily: string;
  attackCount: number;
  countries: string[];
  severity: string;
}

export interface ThreatEvolution {
  threatFamily: string;
  timeframe: string;
  attackCount: number;
  newCountries: string[];
  techniques: string[];
  severity: string;
}

export class ThreatDatabase {
  private db: Database.Database;
  private static instance: ThreatDatabase;

  constructor() {
    this.db = new Database('threat_intelligence.db');
    this.initializeTables();
  }

  static getInstance(): ThreatDatabase {
    if (!ThreatDatabase.instance) {
      ThreatDatabase.instance = new ThreatDatabase();
    }
    return ThreatDatabase.instance;
  }

  private initializeTables(): void {
    // Attacks table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS attacks (
        id TEXT PRIMARY KEY,
        timestamp INTEGER NOT NULL,
        source_country TEXT NOT NULL,
        target_country TEXT NOT NULL,
        attack_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        source_ip TEXT NOT NULL,
        target_ip TEXT NOT NULL,
        port INTEGER NOT NULL,
        protocol TEXT NOT NULL,
        threat_actor TEXT,
        threat_family TEXT,
        misp_event_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Threat families table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS threat_families (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        first_seen INTEGER NOT NULL,
        last_seen INTEGER NOT NULL,
        total_attacks INTEGER DEFAULT 0,
        countries TEXT, -- JSON array
        description TEXT,
        aliases TEXT, -- JSON array
        techniques TEXT, -- JSON array
        target_sectors TEXT, -- JSON array
        misp_galaxy_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Threat actors table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS threat_actors (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        country TEXT NOT NULL,
        type TEXT NOT NULL,
        active_attacks INTEGER DEFAULT 0,
        total_attacks INTEGER DEFAULT 0,
        last_seen INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        associated_families TEXT, -- JSON array
        misp_galaxy_id TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Historical statistics table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS historical_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        threat_family TEXT NOT NULL,
        attack_count INTEGER NOT NULL,
        countries TEXT, -- JSON array
        severity TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // MISP events table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS misp_events (
        id TEXT PRIMARY KEY,
        event_id TEXT UNIQUE NOT NULL,
        info TEXT NOT NULL,
        threat_level_id INTEGER NOT NULL,
        analysis INTEGER NOT NULL,
        date TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        org_id TEXT,
        orgc_id TEXT,
        attributes TEXT, -- JSON array
        tags TEXT, -- JSON array
        galaxy_clusters TEXT, -- JSON array
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_attacks_timestamp ON attacks(timestamp);
      CREATE INDEX IF NOT EXISTS idx_attacks_threat_family ON attacks(threat_family);
      CREATE INDEX IF NOT EXISTS idx_attacks_source_country ON attacks(source_country);
      CREATE INDEX IF NOT EXISTS idx_threat_families_category ON threat_families(category);
      CREATE INDEX IF NOT EXISTS idx_historical_stats_date ON historical_stats(date);
      CREATE INDEX IF NOT EXISTS idx_misp_events_timestamp ON misp_events(timestamp);
    `);

    console.log('✅ Threat intelligence database initialized');
  }

  // Store attack data
  storeAttack(attack: Attack, threatFamily?: string, mispEventId?: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO attacks (
        id, timestamp, source_country, target_country, attack_type, 
        severity, status, source_ip, target_ip, port, protocol, 
        threat_actor, threat_family, misp_event_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      attack.id,
      attack.timestamp.getTime(),
      attack.sourceCountry,
      attack.targetCountry,
      attack.attackType,
      attack.severity,
      attack.status,
      attack.sourceIP,
      attack.targetIP,
      attack.port,
      attack.protocol,
      attack.threatActor || null,
      threatFamily || null,
      mispEventId || null
    );
  }

  // Store threat family data
  storeThreatFamily(family: ThreatFamily): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO threat_families (
        id, name, category, first_seen, last_seen, total_attacks,
        countries, description, aliases, techniques, target_sectors,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      family.id,
      family.name,
      family.category,
      family.firstSeen.getTime(),
      family.lastSeen.getTime(),
      family.totalAttacks,
      JSON.stringify(family.countries),
      family.description || null,
      JSON.stringify(family.aliases),
      JSON.stringify(family.techniques),
      JSON.stringify(family.targetSectors),
      Date.now()
    );
  }

  // Store threat actor data
  storeThreatActor(actor: ThreatActor, associatedFamilies: string[] = []): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO threat_actors (
        id, name, country, type, active_attacks, total_attacks,
        last_seen, risk_level, associated_families, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      actor.id,
      actor.name,
      actor.country,
      actor.type,
      actor.activeAttacks,
      actor.totalAttacks,
      actor.lastSeen.getTime(),
      actor.riskLevel,
      JSON.stringify(associatedFamilies),
      Date.now()
    );
  }

  // Get threat family evolution over time
  getThreatFamilyEvolution(familyName: string, days: number = 30): ThreatEvolution[] {
    const stmt = this.db.prepare(`
      SELECT 
        DATE(timestamp/1000, 'unixepoch') as date,
        COUNT(*) as attack_count,
        GROUP_CONCAT(DISTINCT source_country) as countries,
        GROUP_CONCAT(DISTINCT attack_type) as techniques,
        severity
      FROM attacks 
      WHERE threat_family = ? 
        AND timestamp > ? 
      GROUP BY DATE(timestamp/1000, 'unixepoch'), severity
      ORDER BY date DESC
    `);

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const rows = stmt.all(familyName, cutoffTime) as any[];

    return rows.map(row => ({
      threatFamily: familyName,
      timeframe: row.date,
      attackCount: row.attack_count,
      newCountries: row.countries ? row.countries.split(',') : [],
      techniques: row.techniques ? row.techniques.split(',') : [],
      severity: row.severity
    }));
  }

  // Get historical statistics
  getHistoricalStats(days: number = 30): HistoricalStats[] {
    const stmt = this.db.prepare(`
      SELECT 
        DATE(timestamp/1000, 'unixepoch') as date,
        threat_family,
        COUNT(*) as attack_count,
        GROUP_CONCAT(DISTINCT source_country) as countries,
        severity
      FROM attacks 
      WHERE timestamp > ? 
        AND threat_family IS NOT NULL
      GROUP BY DATE(timestamp/1000, 'unixepoch'), threat_family, severity
      ORDER BY date DESC, attack_count DESC
    `);

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const rows = stmt.all(cutoffTime) as any[];

    return rows.map(row => ({
      date: row.date,
      threatFamily: row.threat_family,
      attackCount: row.attack_count,
      countries: row.countries ? row.countries.split(',') : [],
      severity: row.severity
    }));
  }

  // Get top threat families by time period
  getTopThreatFamilies(days: number = 7): ThreatFamily[] {
    const stmt = this.db.prepare(`
      SELECT 
        tf.*,
        COUNT(a.id) as recent_attacks
      FROM threat_families tf
      LEFT JOIN attacks a ON tf.name = a.threat_family 
        AND a.timestamp > ?
      GROUP BY tf.id
      ORDER BY recent_attacks DESC, tf.total_attacks DESC
      LIMIT 20
    `);

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    const rows = stmt.all(cutoffTime) as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      firstSeen: new Date(row.first_seen),
      lastSeen: new Date(row.last_seen),
      totalAttacks: row.total_attacks,
      countries: JSON.parse(row.countries || '[]'),
      description: row.description,
      aliases: JSON.parse(row.aliases || '[]'),
      techniques: JSON.parse(row.techniques || '[]'),
      targetSectors: JSON.parse(row.target_sectors || '[]')
    }));
  }

  // Get threat actor activity over time
  getThreatActorActivity(actorName: string, days: number = 30): any[] {
    const stmt = this.db.prepare(`
      SELECT 
        DATE(timestamp/1000, 'unixepoch') as date,
        COUNT(*) as attacks,
        GROUP_CONCAT(DISTINCT target_country) as targets,
        GROUP_CONCAT(DISTINCT attack_type) as techniques
      FROM attacks 
      WHERE threat_actor = ? 
        AND timestamp > ?
      GROUP BY DATE(timestamp/1000, 'unixepoch')
      ORDER BY date DESC
    `);

    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    return stmt.all(actorName, cutoffTime);
  }

  // Store MISP event data
  storeMispEvent(event: any): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO misp_events (
        id, event_id, info, threat_level_id, analysis, date, timestamp,
        org_id, orgc_id, attributes, tags, galaxy_clusters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      `misp-${event.id}`,
      event.id,
      event.info,
      event.threat_level_id,
      event.analysis,
      event.date,
      parseInt(event.timestamp),
      event.org_id || null,
      event.orgc_id || null,
      JSON.stringify(event.Attribute || []),
      JSON.stringify(event.Tag || []),
      JSON.stringify(event.Galaxy || [])
    );
  }

  // Get database statistics
  getStats(): any {
    const stats = {
      totalAttacks: this.db.prepare('SELECT COUNT(*) as count FROM attacks').get() as any,
      totalFamilies: this.db.prepare('SELECT COUNT(*) as count FROM threat_families').get() as any,
      totalActors: this.db.prepare('SELECT COUNT(*) as count FROM threat_actors').get() as any,
      totalMispEvents: this.db.prepare('SELECT COUNT(*) as count FROM misp_events').get() as any,
      oldestAttack: this.db.prepare('SELECT MIN(timestamp) as timestamp FROM attacks').get() as any,
      newestAttack: this.db.prepare('SELECT MAX(timestamp) as timestamp FROM attacks').get() as any
    };

    return {
      totalAttacks: stats.totalAttacks.count,
      totalFamilies: stats.totalFamilies.count,
      totalActors: stats.totalActors.count,
      totalMispEvents: stats.totalMispEvents.count,
      dataRange: {
        oldest: stats.oldestAttack.timestamp ? new Date(stats.oldestAttack.timestamp) : null,
        newest: stats.newestAttack.timestamp ? new Date(stats.newestAttack.timestamp) : null
      }
    };
  }

  // Close database connection
  close(): void {
    this.db.close();
  }
}

export const threatDatabase = ThreatDatabase.getInstance();