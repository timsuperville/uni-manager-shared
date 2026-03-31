import { BaseService } from './BaseService';
import { ApiConfig } from '../config/apiConfig';

export class ArtNetBridgeService extends BaseService {
  constructor(config?: Partial<ApiConfig>) {
    super(config);
  }

  /**
   * Fires an ArtNet UDP packet with a specific preset ID to the given lighting console IP.
   */
  public async triggerPreset(targetIp: string, presetId: number, universe: number = 0): Promise<void> {
    const url = '/api/v1/presentation/hardware/artnet/trigger';
    await this.post(url, { targetIp, presetId, universe });
  }
}

export const artNetBridgeService = new ArtNetBridgeService();
