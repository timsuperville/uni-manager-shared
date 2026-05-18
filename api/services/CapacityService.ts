import { BaseService } from './BaseService';
import { ApiClient } from '../core/ApiClient';
export interface SyncBiometricDto {
  source: string;
  date: string;
  recoveryScore?: number;
  sleepScore?: number;
  hrvBaseline?: number;
  restingHeartRate?: number;
  deepWorkState?: boolean;
}

export interface StartDeepWorkDto {
  suppressNotifications?: boolean;
  blockNewTasks?: boolean;
  recoveryScoreSnapshot?: number;
  biometricSyncId?: string;
}

export class CapacityService extends BaseService {
  constructor(client: ApiClient) {
    super(client, '/personal/capacity', 'CapacityService');
  }

  // --- Biometrics ---

  public async getLatestBiometric(): Promise<any> {
    return this.get('/biometric');
  }

  public async getBiometricHistory(limit: number = 30): Promise<any[]> {
    return this.get('/biometric/history', { params: { limit } });
  }

  public async syncBiometric(data: SyncBiometricDto): Promise<any> {
    return this.post('/biometric/sync', data);
  }

  // --- Deep Work Sessions ---

  public async getActiveSession(): Promise<any> {
    return this.get('/deep-work');
  }

  public async getSessionHistory(limit: number = 20): Promise<any[]> {
    return this.get('/deep-work/history', { params: { limit } });
  }

  public async startDeepWork(data: StartDeepWorkDto): Promise<any> {
    return this.post('/deep-work', data);
  }

  public async endDeepWork(
    id: string,
    status?: 'completed' | 'interrupted'
  ): Promise<any> {
    return this.patch(`/deep-work/${id}/end`, { status });
  }
}

// ==================== LAZY SINGLETON ====================

let instance: CapacityService | null = null;

export function initCapacityService(client: ApiClient): void {
  instance = new CapacityService(client);
}

export const capacityService = {
  getLatestBiometric: async (): Promise<any> => {
    if (!instance) throw new Error('CapacityService not initialized.');
    return instance.getLatestBiometric();
  },
  getBiometricHistory: async (limit?: number): Promise<any[]> => {
    if (!instance) throw new Error('CapacityService not initialized.');
    return instance.getBiometricHistory(limit);
  },
  syncBiometric: async (data: SyncBiometricDto): Promise<any> => {
    if (!instance) throw new Error('CapacityService not initialized.');
    return instance.syncBiometric(data);
  },
  getActiveSession: async (): Promise<any> => {
    if (!instance) throw new Error('CapacityService not initialized.');
    return instance.getActiveSession();
  },
  getSessionHistory: async (limit?: number): Promise<any[]> => {
    if (!instance) throw new Error('CapacityService not initialized.');
    return instance.getSessionHistory(limit);
  },
  startDeepWork: async (data: StartDeepWorkDto): Promise<any> => {
    if (!instance) throw new Error('CapacityService not initialized.');
    return instance.startDeepWork(data);
  },
  endDeepWork: async (
    id: string,
    status?: 'completed' | 'interrupted'
  ): Promise<any> => {
    if (!instance) throw new Error('CapacityService not initialized.');
    return instance.endDeepWork(id, status);
  }
} as unknown as CapacityService;
