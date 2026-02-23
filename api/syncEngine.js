import { get, set, del, keys } from "idb-keyval";

const SYNC_STORE_NAME = "offline-mutations";

/**
 * Sync Engine for handling offline mutations using IndexedDB
 */
export const syncEngine = {
  /**
   * Queue a mutation for later processing
   */
  async queueMutation(mutationKey, variables, mutationFnName) {
    const id = `${mutationKey}_${Date.now()}`;
    const entry = {
      id,
      mutationKey,
      variables,
      mutationFnName,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue = (await get(SYNC_STORE_NAME)) || [];
    queue.push(entry);
    await set(SYNC_STORE_NAME, queue);
    console.log(`[SyncEngine] Queued mutation: ${id}`);
    return id;
  },

  /**
   * Get all queued mutations
   */
  async getQueue() {
    return (await get(SYNC_STORE_NAME)) || [];
  },

  /**
   * Remove a mutation from the queue
   */
  async dequeueMutation(id) {
    const queue = (await get(SYNC_STORE_NAME)) || [];
    const filtered = queue.filter((item) => item.id !== id);
    await set(SYNC_STORE_NAME, filtered);
  },

  /**
   * Process the sync queue
   * @param {Object} serviceMap - Map of service names to service instances
   */
  async processQueue(serviceMap) {
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`[SyncEngine] Processing ${queue.length} queued mutations...`);

    for (const entry of queue) {
      try {
        const service = serviceMap[entry.mutationFnName.split(".")[0]];
        const fnName = entry.mutationFnName.split(".")[1];

        if (service && typeof service[fnName] === "function") {
          await service[fnName](...entry.variables);
          await this.dequeueMutation(entry.id);
          console.log(`[SyncEngine] Successfully synced: ${entry.id}`);
        } else {
          if (import.meta.env.DEV) {
            console.warn(
              `[SyncEngine] Service or method not found for ${entry.mutationFnName}`,
            );
          }
          // Consider manual resolution or removal if invalid
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`[SyncEngine] Failed to sync ${entry.id}:`, error);
        }
        // Increment retries or handle backoff
        entry.retries += 1;
        if (entry.retries > 5) {
          await this.dequeueMutation(entry.id);
          if (import.meta.env.DEV) {
            console.error(
              `[SyncEngine] Max retries reached for ${entry.id}. Dropping.`,
            );
          }
        }
      }
    }
  },
};
