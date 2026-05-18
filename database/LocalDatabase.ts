import Dexie, { Table } from 'dexie';

// Define the shape of our offline mutation queue.
export interface SyncQueueEntry {
  id: string; // UUID
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  collection: string;
  documentId: string;
  payload: Record<string, unknown>;
  timestamp: string; // ISO String
}

// Define the shape of a generic local document (LWW logic).
export interface LocalDocument {
  id: string;
  updatedAt: string;
  deletedAt?: string | null;
  [key: string]: unknown;
}

export class LocalFirstDatabase extends Dexie {
  syncQueue!: Table<SyncQueueEntry, string>;
  chores!: Table<LocalDocument, string>;
  journal!: Table<LocalDocument, string>;
  tasks!: Table<LocalDocument, string>;

  constructor() {
    super('UniManagerLocalDB');

    // Define the schema.
    // id means it's the primary key.
    // We index the updatedAt to easily fetch recent records.
    this.version(1).stores({
      syncQueue: 'id, collection, timestamp',
      chores: 'id, updatedAt, deletedAt',
      journal: 'id, updatedAt, deletedAt',
      tasks: 'id, updatedAt, deletedAt'
    });
  }
}

export const localDB = new LocalFirstDatabase();
