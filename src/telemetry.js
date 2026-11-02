const ENDPOINT = 'http://localhost:6006/v1/traces';

function randomHex(len) {
  const arr = new Uint8Array(len / 2);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function kv(key, value) {
  if (typeof value === 'number') return { key, value: { intValue: Math.trunc(value) } };
  if (typeof value === 'boolean') return { key, value: { boolValue: value } };
  return { key, value: { stringValue: String(value ?? '') } };
}

async function sendSpan({ name, start, end, attributes, status, error }) {
  const startUnix = Math.trunc(start * 1_000_000);
  const endUnix = Math.trunc(end * 1_000_000);
  const body = {
    resourceSpans: [{
      resource: { attributes: [kv('service.name', 'style-advisor-frontend')] },
      scopeSpans: [{
        scope: { name: 'style-advisor' },
        spans: [{
          traceId: randomHex(32),
          spanId: randomHex(16),
          name: name || 'request',
          kind: 1,
          startTimeUnixNano: String(startUnix),
          endTimeUnixNano: String(endUnix),
          attributes: Object.entries(attributes || {}).map(([k, v]) => kv(k, v)),
          status: { code: status === 2 ? 2 : 1, message: error || '' }
        }]
      }]
    }]
  };
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    });
  } catch (_e) {
    // Best-effort only; do not break app.
  }
}

export async function tracedFetch(url, options, meta = {}) {
  const start = performance.now();
  const name = meta.name || 'Ollama request';
  try {
    const r = await fetch(url, options);
    const end = performance.now();
    sendSpan({
      name,
      start,
      end,
      attributes: {
        'http.url': url,
        'http.status_code': r.status,
        'ai.model': meta.model || '',
        ...meta.attributes
      },
      status: r.ok ? 1 : 2,
      error: r.ok ? '' : 'HTTP ' + r.status
    });
    return r;
  } catch (e) {
    const end = performance.now();
    sendSpan({
      name,
      start,
      end,
      attributes: { 'http.url': url, ...meta.attributes },
      status: 2,
      error: e?.message || 'request failed'
    });
    throw e;
  }
}
