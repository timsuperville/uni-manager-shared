import { BaseService } from "../../../api/services/BaseService";
import { ApiClient } from "../../../api/core/ApiClient";

export class ArtNetBridgeService extends BaseService {
  constructor(client: ApiClient) {
    // baseEndpoint is relative — ApiClient.baseURL (/api/v1) is prepended automatically.
    super(client, "/presentation/hardware/artnet", "ArtNetBridgeService");
  }

  /**
   * Fires an ArtNet UDP packet with a specific preset ID to the given lighting console IP.
   */
  public async triggerPreset(
    targetIp: string,
    presetId: number,
    universe: number = 0,
  ): Promise<void> {
    // "/trigger" → buildEndpoint → /presentation/hardware/artnet/trigger
    await this.post("/trigger", { targetIp, presetId, universe });
  }
}

// ==================== LAZY SINGLETON ====================
// Previously this called getApiServices() from "./index", which created a circular
// import (index → ArtNetBridgeService → index). Circular imports produce `undefined`
// at module init time.
//
// Pattern: call initArtNetBridge(apiClient) from wherever the ApiClient is created
// (e.g. services/index.ts ApiServices constructor) instead of importing back here.

let instance: ArtNetBridgeService | null = null;

/**
 * Initialize the ArtNet singleton with a live ApiClient.
 * Call this once from your service bootstrap (e.g. ApiServices constructor).
 */
export function initArtNetBridge(client: ApiClient): void {
  instance = new ArtNetBridgeService(client);
}

export const artNetBridgeService = {
  triggerPreset: async (
    targetIp: string,
    presetId: number,
    universe: number = 0,
  ): Promise<void> => {
    if (!instance) {
      throw new Error(
        "ArtNetBridgeService not initialized. Call initArtNetBridge(apiClient) first.",
      );
    }
    return instance.triggerPreset(targetIp, presetId, universe);
  },
} as unknown as ArtNetBridgeService;
