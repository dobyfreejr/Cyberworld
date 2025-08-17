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
  private db: IDBDatabase | null = null;
  private static instance: ThreatDatabase;
  private dbName = 'ThreatIntelligenceDB';
  private dbVersion = 1;

  constructor() {
    this.initializeDatabase();
  }

  static getInstance(): ThreatDatabase {
    if (!ThreatDatabase.instance) {
      ThreatDatabase.instance = new ThreatDatabase();
    }
    return ThreatDatabase.instance;
  }

  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ Threat intelligence database initialized with IndexedDB');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Attacks store
        if (!db.objectStoreNames.contains('attacks')) {
          const attacksStore = db.createObjectStore('attacks', { keyPath: 'id' });
          attacksStore.createIndex('timestamp', 'timestamp');
          attacksStore.createIndex('threatFamily', 'threatFamily');
          attacksStore.createIndex('sourceCountry', 'sourceCountry');
        }

        // Threat families store
        if (!db.objectStoreNames.contains('threatFamilies')) {
          const familiesStore = db.createObjectStore('threatFamilies', { keyPath: 'id' });
          familiesStore.createIndex('name', 'name', { unique: true });
          familiesStore.createIndex('category', 'category');
        }

        // Threat actors store
        if (!db.objectStoreNames.contains('threatActors')) {
          const actorsStore = db.createObjectStore('threatActors', { keyPath: 'id' });
          actorsStore.createIndex('name', 'name', { unique: true });
          actorsStore.createIndex('country', 'country');
        }

        // MISP events store
        if (!db.objectStoreNames.contains('mispEvents')) {
          const mispStore = db.createObjectStore('mispEvents', { keyPath: 'id' });
          mispStore.createIndex('eventId', 'eventId', { unique: true });
          mispStore.createIndex('timestamp', 'timestamp');
        }
      };
    });
  }

  private async ensureDatabase(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDatabase();
    }
    return this.db!;
  }

  // Store attack data
  async storeAttack(attack: Attack, threatFamily?: string, mispEventId?: string): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['attacks'], 'readwrite');
      const store = transaction.objectStore('attacks');

      const attackData = {
        ...attack,
        timestamp: attack.timestamp.getTime(),
        threatFamily: threatFamily || null,
        mispEventId: mispEventId || null,
        createdAt: Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(attackData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to store attack:', error);
    }
  }

  // Store threat family data
  async storeThreatFamily(family: ThreatFamily): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['threatFamilies'], 'readwrite');
      const store = transaction.objectStore('threatFamilies');

      const familyData = {
        ...family,
        firstSeen: family.firstSeen.getTime(),
        lastSeen: family.lastSeen.getTime(),
        updatedAt: Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(familyData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to store threat family:', error);
    }
  }

  // Store threat actor data
  async storeThreatActor(actor: ThreatActor, associatedFamilies: string[] = []): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['threatActors'], 'readwrite');
      const store = transaction.objectStore('threatActors');

      const actorData = {
        ...actor,
        lastSeen: actor.lastSeen.getTime(),
        associatedFamilies,
        updatedAt: Date.now()
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(actorData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to store threat actor:', error);
    }
  }

  // Get historical statistics
  async getHistoricalStats(days: number = 30): Promise<HistoricalStats[]> {
    try {
      const db = this.ensureDatabase();
      const transaction = db.transaction(['attacks'], 'readonly');
      const store = transaction.objectStore('attacks');
      const index = store.index('timestamp');

      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.lowerBound(cutoffTime);

      const attacks: any[] = [];
      
      return new Promise<HistoricalStats[]>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            attacks.push(cursor.value);
            cursor.continue();
          } else {
            // Group by date and threat family
            const grouped: { [key: string]: HistoricalStats } = {};
            
            attacks.forEach(attack => {
              const date = new Date(attack.timestamp).toISOString().split('T')[0];
              const key = `${date}-${attack.threatFamily || 'unknown'}`;
              
              if (!grouped[key]) {
                grouped[key] = {
                  date,
                  threatFamily: attack.threatFamily || 'unknown',
                  attackCount: 0,
                  countries: [],
                  severity: attack.severity
                };
              }
              
              grouped[key].attackCount++;
              if (!grouped[key].countries.includes(attack.sourceCountry)) {
                grouped[key].countries.push(attack.sourceCountry);
              }
            });

            resolve(Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date)));
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get historical stats:', error);
      return Promise.resolve([]);
    }
  }

  // Get threat family evolution over time
  async getThreatFamilyEvolution(familyName: string, days: number = 30): Promise<ThreatEvolution[]> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['attacks'], 'readonly');
      const store = transaction.objectStore('attacks');
      const index = store.index('timestamp');

      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const range = IDBKeyRange.lowerBound(cutoffTime);

      const attacks: any[] = [];
      
      await new Promise<void>((resolve, reject) => {
        const request = index.openCursor(range);
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const attack = cursor.value;
            if (attack.threatFamily === familyName) {
              attacks.push(attack);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      // Group by date and severity
      const grouped: { [key: string]: ThreatEvolution } = {};
      
      attacks.forEach(attack => {
        const date = new Date(attack.timestamp).toISOString().split('T')[0];
        const key = `${date}-${attack.severity}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            threatFamily: familyName,
            timeframe: date,
            attackCount: 0,
            newCountries: [],
            techniques: [],
            severity: attack.severity
          };
        }
        
        grouped[key].attackCount++;
        if (!grouped[key].newCountries.includes(attack.sourceCountry)) {
          grouped[key].newCountries.push(attack.sourceCountry);
        }
        if (!grouped[key].techniques.includes(attack.attackType)) {
          grouped[key].techniques.push(attack.attackType);
        }
      });

      return Object.values(grouped).sort((a, b) => b.timeframe.localeCompare(a.timeframe));
    } catch (error) {
      console.error('Failed to get threat family evolution:', error);
      return [];
    }
  }

  // Get top threat families by time period
  async getTopThreatFamilies(days: number = 7): Promise<ThreatFamily[]> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['threatFamilies', 'attacks'], 'readonly');
      const familiesStore = transaction.objectStore('threatFamilies');
      const attacksStore = transaction.objectStore('attacks');

      const families: any[] = [];
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);

      // Get all families
      await new Promise<void>((resolve, reject) => {
        const request = familiesStore.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            families.push(cursor.value);
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      // Count recent attacks for each family
      const familyAttackCounts: { [key: string]: number } = {};
      
      await new Promise<void>((resolve, reject) => {
        const index = attacksStore.index('timestamp');
        const range = IDBKeyRange.lowerBound(cutoffTime);
        const request = index.openCursor(range);
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const attack = cursor.value;
            if (attack.threatFamily) {
              familyAttackCounts[attack.threatFamily] = (familyAttackCounts[attack.threatFamily] || 0) + 1;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      // Convert and sort families
      return families
        .map(family => ({
          id: family.id,
          name: family.name,
          category: family.category,
          firstSeen: new Date(family.firstSeen),
          lastSeen: new Date(family.lastSeen),
          totalAttacks: family.totalAttacks,
          countries: family.countries || [],
          description: family.description,
          aliases: family.aliases || [],
          techniques: family.techniques || [],
          targetSectors: family.targetSectors || [],
          recentAttacks: familyAttackCounts[family.name] || 0
        }))
        .sort((a: any, b: any) => b.recentAttacks - a.recentAttacks)
        .slice(0, 20);
    } catch (error) {
      console.error('Failed to get top threat families:', error);
      return [];
    }
  }

  // Store MISP event data
  async storeMispEvent(event: any): Promise<void> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['mispEvents'], 'readwrite');
      const store = transaction.objectStore('mispEvents');

      const eventData = {
        id: `misp-${event.id}`,
        eventId: event.id,
        info: event.info,
        threatLevelId: event.threat_level_id,
        analysis: event.analysis,
        date: event.date,
        timestamp: parseInt(event.timestamp),
        orgId: event.org_id || null,
        orgcId: event.orgc_id || null,
        attributes: JSON.stringify(event.Attribute || []),
        tags: JSON.stringify(event.Tag || []),
        galaxyClusters: JSON.stringify(event.Galaxy || [])
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(eventData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to store MISP event:', error);
    }
  }

  // Get database statistics
  async getStats(): Promise<any> {
    try {
      const db = await this.ensureDatabase();
      const transaction = db.transaction(['attacks', 'threatFamilies', 'threatActors', 'mispEvents'], 'readonly');

      const stats = {
        totalAttacks: 0,
        totalFamilies: 0,
        totalActors: 0,
        totalMispEvents: 0,
        oldestAttack: null as Date | null,
        newestAttack: null as Date | null
      };

      // Count attacks
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('attacks').count();
        request.onsuccess = () => {
          stats.totalAttacks = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      // Count families
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('threatFamilies').count();
        request.onsuccess = () => {
          stats.totalFamilies = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      // Count actors
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('threatActors').count();
        request.onsuccess = () => {
          stats.totalActors = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      // Count MISP events
      await new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('mispEvents').count();
        request.onsuccess = () => {
          stats.totalMispEvents = request.result;
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        totalAttacks: 0,
        totalFamilies: 0,
        totalActors: 0,
        totalMispEvents: 0,
        dataRange: { oldest: null, newest: null }
      };
    }
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const threatDatabase = ThreatDatabase.getInstance();