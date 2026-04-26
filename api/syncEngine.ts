import { get, set } from "idb-keyval";

const SYNC_STORE_NAME = "offline-mutations";

export interface SyncEntry {
  id: string;
  mutationKey: string;
  variables: unknown[];
  mutationFnName: string;
  timestamp: number;
  retries: number;
}

export type ServiceMap = Record<
  string,
  Record<string, (...args: unknown[]) => Promise<unknown>>
>;

/**
 * Sync Engine — offline mutation queue backed by IndexedDB.
 *
 * Queue mutations while offline; drain the queue via processQueue()
 * when the device regains connectivity.
 *
 * Used by App.jsx (church) to replay failed API calls after network recovery.
 */
export const syncEngine = {
  /**
   * Queue a mutation for later processing.
   */
  async queueMutation(
    mutationKey: string,
    variables: unknown[],
    mutationFnName: string,
  ): Promise<string> {
    const id = `${mutationKey}_${Date.now()}`;
    const entry: SyncEntry = {
      id,
      mutationKey,
      variables,
      mutationFnName,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue: SyncEntry[] = (await get(SYNC_STORE_NAME)) ?? [];
    queue.push(entry);
    await set(SYNC_STORE_NAME, queue);
    if (import.meta.env.DEV) console.log(`[SyncEngine] Queued mutation: ${id}`);
    return id;
  },

  /**
   * Return all queued mutations.
   */
  async getQueue(): Promise<SyncEntry[]> {
    return (await get<SyncEntry[]>(SYNC_STORE_NAME)) ?? [];
  },

  /**
   * Remove a single mutation from the queue by id.
   */
  async dequeueMutation(id: string): Promise<void> {
    const queue: SyncEntry[] = (await get(SYNC_STORE_NAME)) ?? [];
    const filtered = queue.filter((item) => item.id !== id);
    await set(SYNC_STORE_NAME, filtered);
  },

  /**
   * Drain the queue — call with a serviceMap of { serviceName: serviceInstance }.
   * Each queued entry must have a mutationFnName of the form "serviceName.methodName".
   * Entries are retried up to 5 times before being dropped.
   */
  async processQueue(serviceMap: ServiceMap): Promise<void> {
    const queue = await this.getQueue();
    if (queue.length === 0) return;

    if (import.meta.env.DEV) {
      console.log(
        `[SyncEngine] Processing ${queue.length} queued mutations...`,
      );
    }

    for (const entry of queue) {
      try {
        const [serviceName, fnName] = entry.mutationFnName.split(".");
        const service = serviceName ? serviceMap[serviceName] : undefined;

        if (service && fnName && typeof service[fnName] === "function") {
          await service[fnName](...entry.variables);
          await this.dequeueMutation(entry.id);
          if (import.meta.env.DEV) {
            console.log(`[SyncEngine] Successfully synced: ${entry.id}`);
          }
        } else {
          if (import.meta.env.DEV) {
            console.warn(
              `[SyncEngine] Service or method not found for ${entry.mutationFnName}`,
            );
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(`[SyncEngine] Failed to sync ${entry.id}:`, error);
        }
        entry.retries += 1;
        if (entry.retries > 5) {
          await this.dequeueMutation(entry.id);
          if (import.meta.env.DEV) {
            console.error(
              `[SyncEngine] Max retries reached for ${entry.id}. Dropping.`,
            );
          }
        } else {
          // Persist the incremented retry count back to IndexedDB.
          // Without this write-back, the counter resets to 0 on every
          // processQueue() call and entries can never be dropped.
          const currentQueue: SyncEntry[] = (await get(SYNC_STORE_NAME)) ?? [];
          const updated = currentQueue.map((item) =>
            item.id === entry.id ? { ...item, retries: entry.retries } : item,
          );
          await set(SYNC_STORE_NAME, updated);
        }
      }
    }
  },
};
