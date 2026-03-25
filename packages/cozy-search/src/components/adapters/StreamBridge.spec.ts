import { StreamBridge } from "./StreamBridge";

describe("StreamBridge", () => {
  let bridge: StreamBridge;

  beforeEach(() => {
    bridge = new StreamBridge();
  });

  it("should create an async iterable iterator", () => {
    const iterator = bridge.createStream("convo_1");
    expect(typeof iterator.next).toBe("function");
    expect(iterator[Symbol.asyncIterator]).toBeDefined();
  });

  it("should push deltas and yield them from the iterator", async () => {
    const iterator = bridge.createStream("convo_1");

    bridge.onDelta("convo_1", "Hello ");
    bridge.onDelta("convo_1", "world!");

    const first = await iterator.next();
    expect(first).toEqual({ value: "Hello ", done: false });

    const second = await iterator.next();
    expect(second).toEqual({ value: "world!", done: false });
  });

  it("should mark the stream as done when complete is called", async () => {
    const iterator = bridge.createStream("convo_1");

    bridge.onDelta("convo_1", "done chunk");
    bridge.onDone("convo_1");

    const first = await iterator.next();
    expect(first).toEqual({ value: "done chunk", done: false });

    const second = await iterator.next();
    expect(second.done).toBe(true);
  });

  it("should reject the iterator when an error occurs", async () => {
    const iterator = bridge.createStream("convo_1");
    const error = new Error("Socket disconnected");

    bridge.onError("convo_1", error);

    await expect(iterator.next()).rejects.toThrow("Socket disconnected");
  });

  it("should reject the iterator when an error occurs mid-stream", async () => {
    const iterator = bridge.createStream("convo_1");

    bridge.onDelta("convo_1", "partial ");
    const first = await iterator.next();
    expect(first).toEqual({ value: "partial ", done: false });

    bridge.onError("convo_1", new Error("LLM unavailable"));

    await expect(iterator.next()).rejects.toThrow("LLM unavailable");
  });

  it("should call the cleanup callback and mark the stream complete on cleanup", async () => {
    const cleanupSpy = jest.fn();
    bridge.setCleanupCallback(cleanupSpy);

    const iterator = bridge.createStream("convo_1");
    bridge.cleanup("convo_1");

    expect(cleanupSpy).toHaveBeenCalledTimes(1);
    expect(bridge.hasStream("convo_1")).toBe(false);

    // The iterator should be marked done
    const result = await iterator.next();
    expect(result.done).toBe(true);
  });

  it("should reorder out-of-order deltas when position is provided", async () => {
    const iterator = bridge.createStream("convo_1");

    // Arrive out of order: position 1 before position 0
    bridge.onDelta("convo_1", "world!", 1);
    bridge.onDelta("convo_1", "Hello ", 0);

    const first = await iterator.next();
    expect(first).toEqual({ value: "Hello ", done: false });

    const second = await iterator.next();
    expect(second).toEqual({ value: "world!", done: false });
  });

  it("should flush buffered positions in order when gap is filled", async () => {
    const iterator = bridge.createStream("convo_1");

    // Positions 2 and 1 arrive before 0
    bridge.onDelta("convo_1", "c", 2);
    bridge.onDelta("convo_1", "b", 1);
    // Nothing yielded yet since position 0 is missing

    bridge.onDelta("convo_1", "a", 0);
    // Now all three should flush in order

    const first = await iterator.next();
    expect(first).toEqual({ value: "a", done: false });

    const second = await iterator.next();
    expect(second).toEqual({ value: "b", done: false });

    const third = await iterator.next();
    expect(third).toEqual({ value: "c", done: false });
  });

  it("should push directly when no position is provided", async () => {
    const iterator = bridge.createStream("convo_1");

    bridge.onDelta("convo_1", "Hello ");
    bridge.onDelta("convo_1", "world!");

    const first = await iterator.next();
    expect(first).toEqual({ value: "Hello ", done: false });

    const second = await iterator.next();
    expect(second).toEqual({ value: "world!", done: false });
  });

  it("multiple unresolved next calls should reject to prevent concurrency issues", async () => {
    const iterator = bridge.createStream("convo_1");

    // Call next twice concurrently
    const p1 = iterator.next();
    const p2 = iterator.next();

    await expect(p2).rejects.toThrow(
      "StreamBridge: concurrent next() calls are not supported"
    );

    // Fulfill the first one
    bridge.onDelta("convo_1", "ok");
    const res1 = await p1;
    expect(res1).toEqual({ value: "ok", done: false });
  });
});

describe("tool calls", () => {
  it("should store tool calls via onToolCall and retrieve via getToolCalls", () => {
    const bridge = new StreamBridge();
    bridge.createStream("convo_1");

    bridge.onToolCall("convo_1", {
      id: "call_1",
      name: "createFolder",
      arguments: { name: "Invoices" },
    });

    const toolCalls = bridge.getToolCalls("convo_1");
    expect(toolCalls).toEqual([
      { id: "call_1", name: "createFolder", arguments: { name: "Invoices" } },
    ]);
  });

  it("should accumulate multiple tool calls for the same conversation", () => {
    const bridge = new StreamBridge();
    bridge.createStream("convo_1");

    bridge.onToolCall("convo_1", {
      id: "call_1",
      name: "createFolder",
      arguments: { name: "Q1" },
    });
    bridge.onToolCall("convo_1", {
      id: "call_2",
      name: "createFolder",
      arguments: { name: "Q2" },
    });

    const toolCalls = bridge.getToolCalls("convo_1");
    expect(toolCalls).toHaveLength(2);
  });

  it("should return undefined for conversations with no tool calls", () => {
    const bridge = new StreamBridge();
    expect(bridge.getToolCalls("convo_1")).toBeUndefined();
  });

  it("should ignore tool calls for non-existent streams", () => {
    const bridge = new StreamBridge();
    bridge.onToolCall("convo_1", {
      id: "call_1",
      name: "createFolder",
      arguments: { name: "test" },
    });
    expect(bridge.getToolCalls("convo_1")).toBeUndefined();
  });

  it("should clear tool calls on cleanup", () => {
    const bridge = new StreamBridge();
    bridge.createStream("convo_1");
    bridge.onToolCall("convo_1", {
      id: "call_1",
      name: "createFolder",
      arguments: { name: "test" },
    });

    bridge.cleanup("convo_1");
    expect(bridge.getToolCalls("convo_1")).toBeUndefined();
  });

  it("should enforce max 10 tool calls per conversation", () => {
    const bridge = new StreamBridge();
    bridge.createStream("convo_1");

    for (let i = 0; i < 12; i++) {
      bridge.onToolCall("convo_1", {
        id: `call_${i}`,
        name: "createFolder",
        arguments: { name: `folder_${i}` },
      });
    }

    const toolCalls = bridge.getToolCalls("convo_1");
    expect(toolCalls).toHaveLength(10);
  });
});
