const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** Prevent sensitive application traffic from leaving the browser in plaintext. */
export function assertSecureTransport(input) {
  const rawUrl = typeof Request !== 'undefined' && input instanceof Request ? input.url : String(input);
  const baseUrl = globalThis.location?.href || 'https://localhost/';
  const destination = new URL(rawUrl, baseUrl);
  const isSecure = destination.protocol === 'https:' || destination.protocol === 'wss:';
  const isLoopbackDevelopment =
    (destination.protocol === 'http:' || destination.protocol === 'ws:') &&
    LOOPBACK_HOSTS.has(destination.hostname);

  if (!isSecure && !isLoopbackDevelopment) {
    throw new Error('Sensitive data may only be transmitted over HTTPS or secure WebSockets.');
  }
}
