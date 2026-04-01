import { BaseService } from "./BaseService";
import { ApiClient } from "../core/ApiClient";
import { getApiServices } from "./index";

export class ArtNetBridgeService extends BaseService {
  constructor(client: ApiClient) {
    super(client, "", "ArtNetBridgeService");
  }

  /**
   * Fires an ArtNet UDP packet with a specific preset ID to the given lighting console IP.
   */
  public async triggerPreset(
    targetIp: string,
    presetId: number,
    universe: number = 0,
  ): Promise<void> {
    const url = "/api/v1/presentation/hardware/artnet/trigger";
    await this.post(url, { targetIp, presetId, universe });
  }
}

let instance: ArtNetBridgeService | null = null;

export const artNetBridgeService = {
  triggerPreset: async (
    targetIp: string,
    presetId: number,
    universe: number = 0,
  ): Promise<void> => {
    if (!instance) {
      instance = new ArtNetBridgeService(getApiServices().apiClient);
    }
    return instance.triggerPreset(targetIp, presetId, universe);
  },
} as unknown as ArtNetBridgeService;
