/**
 * lazyWithRetry.js
 *
 * Wraps React.lazy() with automatic exponential-backoff retries.
 * Motivation: Vite code-split chunks are cache-busted on each deploy.
 * A user who has the old page open when a deploy happens will get a
 * "Failed to fetch dynamically imported module" error on the first
 * lazy navigation. 3 retries with growing delays recovers silently.
 *
 * Usage (drop-in replacement for React.lazy):
 *   const WorkflowCanvas = lazyWithRetry(() => import('../../Editor/WorkflowCanvas'));
 */

import React from 'react';

/**
 * @param {() => Promise<{ default: React.ComponentType<any> }>} factory
 * @param {number} retries   Number of retry attempts (default 3)
 * @param {number} delayMs   Initial delay in ms, doubles each attempt (default 800)
 */
export function lazyWithRetry(factory, retries = 3, delayMs = 800) {
  return React.lazy(() => tryLoad(factory, retries, delayMs));
}

function tryLoad(factory, attemptsLeft, delayMs) {
  return factory().catch((err) => {
    if (attemptsLeft <= 0) {
      // All retries exhausted — surface the error to the nearest ErrorBoundary
      throw err;
    }
    // Wait, then retry with doubled delay (exponential back-off)
    return new Promise((resolve) => setTimeout(resolve, delayMs)).then(() =>
      tryLoad(factory, attemptsLeft - 1, delayMs * 2)
    );
  });
}
