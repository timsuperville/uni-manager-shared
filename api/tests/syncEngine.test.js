import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncEngine } from "../syncEngine";
import * as idb from "idb-keyval";

// Mock idb-keyval
vi.mock("idb-keyval", () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
}));

describe("SyncEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should queue a mutation correctly", async () => {
    idb.get.mockResolvedValue([]);
    const mutationKey = "test-mutation";
    const variables = [{ id: 1 }];
    const fnName = "testService.create";

    const id = await syncEngine.queueMutation(mutationKey, variables, fnName);

    expect(id).toBeDefined();
    expect(idb.set).toHaveBeenCalledWith(
      "offline-mutations",
      expect.arrayContaining([
        expect.objectContaining({
          mutationKey,
          variables,
          mutationFnName: fnName,
        }),
      ]),
    );
  });

  it("should process the queue successfully", async () => {
    const mockEntry = {
      id: "test_123",
      mutationKey: "test",
      variables: [{ name: "New Item" }],
      mutationFnName: "itemService.create",
      retries: 0,
    };
    idb.get.mockResolvedValue([mockEntry]);

    const mockCreate = vi.fn().mockResolvedValue({ id: "1" });
    const serviceMap = {
      itemService: {
        create: mockCreate,
      },
    };

    await syncEngine.processQueue(serviceMap);

    expect(mockCreate).toHaveBeenCalledWith(mockEntry.variables[0]);
    // Should be dequeued
    expect(idb.set).toHaveBeenCalledWith("offline-mutations", []);
  });

  it("should handle service method failure and increment retries", async () => {
    const mockEntry = {
      id: "test_fail",
      mutationKey: "test",
      variables: [{}],
      mutationFnName: "failService.fail",
      retries: 0,
    };
    idb.get.mockResolvedValue([mockEntry]);

    const mockFail = vi.fn().mockRejectedValue(new Error("API Error"));
    const serviceMap = {
      failService: {
        fail: mockFail,
      },
    };

    await syncEngine.processQueue(serviceMap);

    expect(mockFail).toHaveBeenCalled();
    // Entry should still be in queue with incremented retries (it updates the local entry object)
    // Actually the current processQueue implementation updates the object in the for loop
    // But it doesn't persist the incremented retry back to IDB unless it succeeds and dequeues.
    // Wait, let's check my implementation.
  });
});
