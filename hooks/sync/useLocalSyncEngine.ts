import { useEffect } from "react";
import { localDB, SyncQueueEntry } from "../../database/LocalDatabase";
import { getApiClient } from "../../api/core/ApiClient";

export function useLocalSyncEngine() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const pushOfflineQueue = async () => {
      try {
        const queue = await localDB.syncQueue.toArray();
        if (queue.length === 0) return;

        const api = getApiClient();

        // Push mutations to backend in order
        for (const entry of queue) {
          try {
            await api.post("/api/v1/sync/push", { mutations: [entry] });
            await localDB.syncQueue.delete(entry.id);
          } catch (e) {
            // If the server rejects due to conflict or offline, stop queue processing
            console.error("[LocalSync] Failed to push mutation", entry, e);
            break;
          }
        }
      } catch (err) {
        console.error("[LocalSync] Error reading sync queue", err);
      }
    };

    const handleOnline = () => {
      pushOfflineQueue();
    };

    window.addEventListener("online", handleOnline);

    // Initial sync push attempt if we are online at mount
    if (navigator.onLine) {
      pushOfflineQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const queueMutation = async (
    collection: string,
    action: SyncQueueEntry["action"],
    documentId: string,
    payload: Record<string, unknown>,
  ) => {
    const entry: SyncQueueEntry = {
      id: crypto.randomUUID(),
      action,
      collection,
      documentId,
      payload,
      timestamp: new Date().toISOString(),
    };
    await localDB.syncQueue.put(entry);

    // If online, immediately try to sync.
    if (navigator.onLine) {
      const api = getApiClient();
      try {
        await api.post("/api/v1/sync/push", { mutations: [entry] });
        await localDB.syncQueue.delete(entry.id);
      } catch (e) {
        console.warn("[LocalSync] Immediate push failed, kept in queue", e);
      }
    }
  };

  return { queueMutation };
}
