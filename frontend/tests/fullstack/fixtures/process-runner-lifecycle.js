// Own fake-service children from creation through test teardown, including
// failures before runFullstack gets a chance to adopt them.
import { spawnFakeService } from "./process-runner-fixtures.js";
import { createOwnedTestProcessTracker } from "./owned-test-processes.js";

/** @typedef {import('node:child_process').ChildProcess} ChildProcess */

const ownedProcessTracker = createOwnedTestProcessTracker();

/** @param {Set<ChildProcess>} children @returns {Promise<void>} */
export async function stopOwnedServices(children) {
  const result = await ownedProcessTracker.cleanup(children);
  if (!result.ok)
    throw new Error(`Fake-service cleanup failed: ${result.error}`);
}

/** @param {Set<ChildProcess>} children */
export function lazyFakeService(children) {
  return (/** @type {Parameters<typeof spawnFakeService>[0]} */ options) => {
    const child = spawnFakeService(options);
    children.add(child);
    ownedProcessTracker.track(child);
    return child;
  };
}
