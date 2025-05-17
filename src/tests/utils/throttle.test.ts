import { throttle } from "../../utils";

describe("throttle", () => {
  beforeEach(() => {
    // tell vitest we use mocked time
    vi.useFakeTimers();
  });

  afterEach(() => {
    // restoring date after each test run
    vi.useRealTimers();
  });

  it("executes immediately on first call", () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn("test");
    expect(mockFn).toHaveBeenCalledWith("test");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("limits execution frequency", () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 100);

    // First call executes immediately
    throttledFn("first");
    expect(mockFn).toHaveBeenCalledTimes(1);

    // These calls are throttled
    throttledFn("second");
    throttledFn("third");
    expect(mockFn).toHaveBeenCalledTimes(1);

    // After wait time, the last call executes
    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith("third");
  });

  it("continues to throttle over multiple intervals", () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 100);

    // First interval
    throttledFn("first"); // Executes immediately
    throttledFn("second"); // Queued

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(2);

    // Second interval
    throttledFn("third"); // Executes immediately
    throttledFn("fourth"); // Queued

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(mockFn).toHaveBeenLastCalledWith("fourth");
  });

  it("cancel prevents scheduled execution", () => {
    const mockFn = vi.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn("first"); // Executes immediately
    throttledFn("second"); // Queued

    throttledFn.cancel();

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith("first");
  });
});
