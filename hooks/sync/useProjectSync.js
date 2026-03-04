import { useEffect, useState, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { useSync } from './useSync.js';

/**
 * useProjectSync — Work App CRDT Kanban Sync (FB-016)
 *
 * Wraps useSync with Work-domain-specific Yjs bindings:
 *   - `yTasks`   — Y.Array of task objects (Kanban board)
 *   - `yProjectMeta` — Y.Map of project-level metadata overrides
 *
 * All mutations are local-first (instant feedback) and merge mathematically
 * via Yjs CRDT semantics. Last-writer-wins per task field.
 *
 * @param {string} businessId  - Tenant scope (enforces sovereign data isolation)
 * @param {string} projectId   - Project scope (e.g. 'p1', 'p2')
 * @returns {object}
 */
export function useProjectSync(businessId, projectId) {
    const roomName = businessId && projectId
        ? `work-project-${businessId}-${projectId}`
        : null;

    const { doc, status, awareness } = useSync(roomName);

    const [tasks, setTasks] = useState([]);
    const [projectMeta, setProjectMeta] = useState({});
    const destroyedRef = useRef(false);

    // Wire up Yjs observers whenever doc changes
    useEffect(() => {
        if (!doc) return;
        destroyedRef.current = false;

        const yTasks = doc.getArray('tasks');
        const yMeta = doc.getMap('projectMeta');

        const syncTasks = () => {
            if (!destroyedRef.current) {
                setTasks(yTasks.toArray());
            }
        };

        const syncMeta = () => {
            if (!destroyedRef.current) {
                setProjectMeta(yMeta.toJSON());
            }
        };

        // Seed initial state
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

    /**
     * Move a task to a new Kanban status column.
     * Uses a Y.Doc transaction to batch the mutation atomically.
     */
    const moveTask = useCallback(
        (taskId, newStatus) => {
            if (!doc) return;
            const yTasks = doc.getArray('tasks');
            doc.transact(() => {
                const arr = yTasks.toArray();
                const idx = arr.findIndex((t) => t.id === taskId);
                if (idx === -1) return;
                // Delete old entry, insert updated entry at same position
                yTasks.delete(idx, 1);
                yTasks.insert(idx, [{ ...arr[idx], status: newStatus }]);
            });
        },
        [doc],
    );

    /**
     * Seed the Y.Array with initial tasks if it's empty (first person to join).
     * Safe to call multiple times — only seeds if array is empty.
     */
    const seedTasks = useCallback(
        (initialTasks) => {
            if (!doc) return;
            const yTasks = doc.getArray('tasks');
            if (yTasks.length === 0 && initialTasks?.length > 0) {
                doc.transact(() => {
                    yTasks.insert(0, initialTasks);
                });
            }
        },
        [doc],
    );

    /**
     * Update project-level metadata (e.g. a milestone toggle).
     */
    const updateMeta = useCallback(
        (key, value) => {
            if (!doc) return;
            const yMeta = doc.getMap('projectMeta');
            doc.transact(() => {
                yMeta.set(key, value);
            });
        },
        [doc],
    );

    return {
        /** Live task array (reflects all concurrent edits) */
        tasks,
        /** Project meta map (milestone toggles, labels, etc.) */
        projectMeta,
        /** Connection state: 'connected' | 'disconnected' */
        status,
        /** Array of {name, color, userId} for all users on the canvas */
        awareness,
        /** Move task to new column */
        moveTask,
        /** Seed initial tasks on first connect */
        seedTasks,
        /** Patch project metadata */
        updateMeta,
    };
}
