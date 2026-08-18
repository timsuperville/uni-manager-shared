import { useEffect, useState, useCallback, useRef } from 'react';

import { useSync } from './useSync';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaskRecord {
  id: string;
  status?: string;
  [key: string]: unknown;
}

export interface ProjectMeta {
  [key: string]: unknown;
}

export interface UseProjectSyncResult {
  /** Live task array (reflects all concurrent edits) */
  tasks: TaskRecord[];
  /** Project meta map (milestone toggles, labels, etc.) */
  projectMeta: ProjectMeta;
  /** Connection state */
  status: 'connected' | 'disconnected' | 'connecting';
  /** Array of {name, color, userId} for all users on the canvas */
  awareness: Array<{ name: string; color: string; userId: string }>;
  /** Move task to new column */
  moveTask: (taskId: string, newStatus: string) => void;
  /** Seed initial tasks on first connect */
  seedTasks: (initialTasks: TaskRecord[]) => void;
  /** Patch project metadata */
  updateMeta: (key: string, value: unknown) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useProjectSync — Work App CRDT Kanban Sync (FB-016)
 *
 * Wraps useSync with Work-domain-specific Yjs bindings:
 *   - `yTasks`       — Y.Array of task objects (Kanban board)
 *   - `yProjectMeta` — Y.Map of project-level metadata overrides
 *
 * All mutations are local-first (instant feedback) and merge mathematically
 * via Yjs CRDT semantics. Last-writer-wins per task field.
 *
 * @param workId  - Tenant scope (enforces user owned data isolation)
 * @param projectId   - Project scope (e.g. 'p1', 'p2')
 */
export function useProjectSync(
  workId: string,
  projectId: string
): UseProjectSyncResult {
  const roomName =
    workId && projectId ? `work-project-${workId}-${projectId}` : null;

  const { doc, status, awareness } = useSync(roomName);

  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [projectMeta, setProjectMeta] = useState<ProjectMeta>({});
  const destroyedRef = useRef(false);

  useEffect(() => {
    if (!doc) return;
    destroyedRef.current = false;

    const yTasks = doc.getArray<TaskRecord>('tasks');
    const yMeta = doc.getMap<unknown>('projectMeta');

    const syncTasks = (): void => {
      if (!destroyedRef.current) setTasks(yTasks.toArray());
    };

    const syncMeta = (): void => {
      if (!destroyedRef.current) setProjectMeta(yMeta.toJSON() as ProjectMeta);
    };

    syncTasks();
    syncMeta();

    yTasks.observe(syncTasks);
    yMeta.observe(syncMeta);

    return () => {
      destroyedRef.current = true;
      yTasks.unobserve(syncTasks);
      yMeta.unobserve(syncMeta);
    };
  }, [doc]);

  const moveTask = useCallback(
    (taskId: string, newStatus: string): void => {
      if (!doc) return;
      const yTasks = doc.getArray<TaskRecord>('tasks');
      doc.transact(() => {
        const arr = yTasks.toArray();
        const idx = arr.findIndex(t => t.id === taskId);
        if (idx === -1) return;
        const existing = arr[idx];
        if (!existing) return;
        yTasks.delete(idx, 1);
        yTasks.insert(idx, [{ ...existing, status: newStatus }]);
      });
    },
    [doc]
  );

  const seedTasks = useCallback(
    (initialTasks: TaskRecord[]): void => {
      if (!doc) return;
      const yTasks = doc.getArray<TaskRecord>('tasks');
      if (yTasks.length === 0 && initialTasks.length > 0) {
        doc.transact(() => {
          yTasks.insert(0, initialTasks);
        });
      }
    },
    [doc]
  );

  const updateMeta = useCallback(
    (key: string, value: unknown): void => {
      if (!doc) return;
      const yMeta = doc.getMap<unknown>('projectMeta');
      doc.transact(() => {
        yMeta.set(key, value);
      });
    },
    [doc]
  );

  return {
    tasks,
    projectMeta,
    status,
    awareness,
    moveTask,
    seedTasks,
    updateMeta
  };
}
