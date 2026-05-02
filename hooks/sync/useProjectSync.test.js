/**
 * useProjectSync — Unit Tests (FB-016)
 *
 * Tests the CRDT Kanban sync hook with mocked useSync.
 * All Yjs I/O is in-memory (no real WebSocket traffic).
 *
 * Framework: Vitest + @testing-library/react (renderHook + act)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as Y from "yjs";

// ---------------------------------------------------------------------------
// Mock useSync — we control doc, status, and awareness directly
// ---------------------------------------------------------------------------
let mockDoc = null;
let mockStatus = "disconnected";
let mockAwareness = [];

vi.mock("./useSync.js", () => ({
  useSync: vi.fn((roomName) => {
    if (!roomName) {
      return {
        doc: null,
        status: "disconnected",
        awareness: [],
        provider: null,
      };
    }
    return {
      doc: mockDoc,
      status: mockStatus,
      awareness: mockAwareness,
      provider: null,
    };
  }),
}));

// Import AFTER vi.mock so the factory is applied
import { useProjectSync } from "./useProjectSync.js";
import { useSync } from "./useSync.js";

const SEED_TASKS = [
  {
    id: "t1",
    title: "Alpha",
    status: "backlog",
    assignee: "A",
    priority: "high",
  },
  {
    id: "t2",
    title: "Beta",
    status: "in_progress",
    assignee: "B",
    priority: "medium",
  },
];

beforeEach(() => {
  mockDoc = new Y.Doc();
  mockStatus = "disconnected";
  mockAwareness = [];
  vi.clearAllMocks();
  // Re-apply mock return so clearAllMocks restores it
  useSync.mockImplementation((roomName) => {
    if (!roomName) {
      return {
        doc: null,
        status: "disconnected",
        awareness: [],
        provider: null,
      };
    }
    return {
      doc: mockDoc,
      status: mockStatus,
      awareness: mockAwareness,
      provider: null,
    };
  });
});

afterEach(() => {
  if (mockDoc) {
    mockDoc.destroy();
    mockDoc = null;
  }
});

// ---------------------------------------------------------------------------
// 1. Null guard — no room when workId / projectId missing
// ---------------------------------------------------------------------------
describe("useProjectSync — null guard", () => {
  it("returns empty state when workId is null", () => {
    const { result } = renderHook(() => useProjectSync(null, "p1"));
    expect(result.current.tasks).toEqual([]);
    expect(result.current.status).toBe("disconnected");
    expect(result.current.awareness).toEqual([]);
  });

  it("returns empty state when projectId is null", () => {
    const { result } = renderHook(() => useProjectSync("biz123", null));
    expect(result.current.tasks).toEqual([]);
  });

  it("passes null roomName to useSync when workId is null", () => {
    renderHook(() => useProjectSync(null, "p1"));
    expect(useSync).toHaveBeenCalledWith(null);
  });
});

// ---------------------------------------------------------------------------
// 2. seedTasks — populates Yjs array on first connect
// ---------------------------------------------------------------------------
describe("useProjectSync — seedTasks", () => {
  it("inserts tasks into Y.Array when empty", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.seedTasks(SEED_TASKS);
    });

    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.tasks[0].id).toBe("t1");
    expect(result.current.tasks[1].id).toBe("t2");
  });

  it("does NOT add more tasks if Y.Array is already populated (idempotent)", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    // Pre-populate the doc before seeding
    act(() => {
      mockDoc.getArray("tasks").insert(0, [SEED_TASKS[0]]);
    });

    act(() => {
      result.current.seedTasks(SEED_TASKS); // Guard should fire — array size >= 1
    });

    expect(result.current.tasks).toHaveLength(1);
  });

  it("is a no-op when seedTasks is called with an empty array", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.seedTasks([]);
    });

    expect(result.current.tasks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 3. moveTask — mutates task status in Y.Array
// ---------------------------------------------------------------------------
describe("useProjectSync — moveTask", () => {
  it("updates the status of the target task", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.seedTasks(SEED_TASKS);
    });

    act(() => {
      result.current.moveTask("t1", "in_progress");
    });

    const t1 = result.current.tasks.find((t) => t.id === "t1");
    expect(t1.status).toBe("in_progress");
  });

  it("leaves other tasks unchanged when one is moved", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.seedTasks(SEED_TASKS);
    });

    act(() => {
      result.current.moveTask("t1", "done");
    });

    const t2 = result.current.tasks.find((t) => t.id === "t2");
    expect(t2.status).toBe("in_progress"); // unchanged
  });

  it("is a no-op for a non-existent taskId", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.seedTasks(SEED_TASKS);
    });

    const before = result.current.tasks.map((t) => t.status);

    act(() => {
      result.current.moveTask("ghost-id", "done");
    });

    expect(result.current.tasks.map((t) => t.status)).toEqual(before);
  });

  it("can move a task through all four Kanban columns", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.seedTasks(SEED_TASKS);
    });

    const cols = ["in_progress", "review", "done", "backlog"];
    for (const col of cols) {
      act(() => {
        result.current.moveTask("t1", col);
      });
      const t1 = result.current.tasks.find((t) => t.id === "t1");
      expect(t1.status).toBe(col);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. updateMeta — patches Y.Map projectMeta
// ---------------------------------------------------------------------------
describe("useProjectSync — updateMeta", () => {
  it("sets a key in projectMeta", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.updateMeta("milestone_m1_done", true);
    });

    expect(result.current.projectMeta["milestone_m1_done"]).toBe(true);
  });

  it("overwrites an existing key (LWW semantics)", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.updateMeta("label", "Alpha");
    });
    act(() => {
      result.current.updateMeta("label", "Beta");
    });

    expect(result.current.projectMeta["label"]).toBe("Beta");
  });

  it("supports multiple independent keys", () => {
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    act(() => {
      result.current.updateMeta("phase", 3);
      result.current.updateMeta("locked", false);
    });

    expect(result.current.projectMeta["phase"]).toBe(3);
    expect(result.current.projectMeta["locked"]).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Multi-tenant isolation — room name encoding
// ---------------------------------------------------------------------------
describe("useProjectSync — tenant scope (room name)", () => {
  it("encodes workId into room name", () => {
    renderHook(() => useProjectSync("biz-A", "p1"));
    expect(useSync).toHaveBeenCalledWith("work-project-biz-A-p1");
  });

  it("encodes different businessIds into distinct room names", () => {
    renderHook(() => useProjectSync("biz-A", "p1"));
    renderHook(() => useProjectSync("biz-B", "p1"));

    const calls = useSync.mock.calls.map((c) => c[0]);
    expect(calls).toContain("work-project-biz-A-p1");
    expect(calls).toContain("work-project-biz-B-p1");
  });

  it("produces null room when workId is null (sovereign guarantee)", () => {
    renderHook(() => useProjectSync(null, "p1"));
    expect(useSync).toHaveBeenCalledWith(null);
  });

  it("produces null room when projectId is null", () => {
    renderHook(() => useProjectSync("biz123", null));
    expect(useSync).toHaveBeenCalledWith(null);
  });
});

// ---------------------------------------------------------------------------
// 6. Awareness passthrough
// ---------------------------------------------------------------------------
describe("useProjectSync — awareness", () => {
  it("returns the awareness array from useSync", () => {
    mockAwareness = [
      { name: "Carol", color: "#ff0", userId: "u1" },
      { name: "Dave", color: "#0f0", userId: "u2" },
    ];

    const { result } = renderHook(() => useProjectSync("biz123", "p1"));

    expect(result.current.awareness).toHaveLength(2);
    expect(result.current.awareness[0].name).toBe("Carol");
    expect(result.current.awareness[1].name).toBe("Dave");
  });

  it("returns empty array when no other users are present", () => {
    mockAwareness = [];
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));
    expect(result.current.awareness).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 7. Status passthrough
// ---------------------------------------------------------------------------
describe("useProjectSync — status", () => {
  it('reflects "connected" status from useSync', () => {
    mockStatus = "connected";
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));
    expect(result.current.status).toBe("connected");
  });

  it('reflects "disconnected" status from useSync', () => {
    mockStatus = "disconnected";
    const { result } = renderHook(() => useProjectSync("biz123", "p1"));
    expect(result.current.status).toBe("disconnected");
  });
});
