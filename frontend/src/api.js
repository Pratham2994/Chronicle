import { useEffect, useState } from 'react';

/** One call to the backend. A failure carries the message the backend wrote. */
export async function call(path, options) {
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    throw new Error('The backend did not answer. Is it running?');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(body?.detail || `The backend said ${res.status}.`);
    error.status = res.status;
    throw error;
  }
  return body;
}

export const send = (path, method, body) =>
  call(path, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

/**
 * Reads one endpoint. A new `version` reads it again, and the old answer stays on screen
 * until the new one is here.
 */
export function useApi(path, version = 0, enabled = true) {
  const key = enabled ? `${path}#${version}` : null;
  const [state, setState] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    if (!key) return;
    let live = true;
    call(path).then(
      (data) => live && setState({ key, data, error: null }),
      (error) => live && setState({ key, data: null, error }),
    );
    return () => {
      live = false;
    };
  }, [key, path]);

  const settled = state.key === key;
  return { data: state.data, error: settled ? state.error : null, loading: Boolean(key) && !settled, settled };
}
