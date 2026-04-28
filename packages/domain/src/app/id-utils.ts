/**
 * Simple local ID generator for the application layer.
 *
 * Combines a human-readable prefix with a timestamp and a short random suffix
 * to produce a collision-resistant identifier without any external dependency.
 *
 * Tests that need deterministic ids should inject a custom `createId` function
 * into `PantryAppService` instead of calling this directly.
 */
export function createId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${ts}-${rnd}`;
}
