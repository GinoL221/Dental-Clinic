import { describe, it, expect, vi } from "vitest";
import { createSubmitEnhance } from "./formEnhance.js";

describe("createSubmitEnhance", () => {
  it("sets submitting true on start and false after update resolves", async () => {
    const setSubmitting = vi.fn();
    const enhanceFn = createSubmitEnhance(setSubmitting);

    const onResult = enhanceFn(/** @type {any} */ ({}));
    expect(setSubmitting).toHaveBeenCalledTimes(1);
    expect(setSubmitting).toHaveBeenNthCalledWith(1, true);

    const update = vi.fn().mockResolvedValue(undefined);
    await /** @type {Function} */ (onResult)({ update });

    expect(update).toHaveBeenCalledTimes(1);
    expect(setSubmitting).toHaveBeenCalledTimes(2);
    expect(setSubmitting).toHaveBeenNthCalledWith(2, false);
  });

  it("resets submitting to false even when update rejects", async () => {
    const setSubmitting = vi.fn();
    const enhanceFn = createSubmitEnhance(setSubmitting);

    const onResult = enhanceFn(/** @type {any} */ ({}));
    const update = vi.fn().mockRejectedValue(new Error("Network error"));

    await expect(
      /** @type {Function} */ (onResult)({ update }),
    ).rejects.toThrow("Network error");

    expect(setSubmitting).toHaveBeenNthCalledWith(1, true);
    expect(setSubmitting).toHaveBeenNthCalledWith(2, false);
  });
});
