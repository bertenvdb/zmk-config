const TIMEOUT_MS = 10_000;

let _baseUrl = '';

export function setMoonrakerBaseUrl(url: string): void {
  _baseUrl = url.replace(/\/$/, '');
}

export function getMoonrakerBaseUrl(): string {
  return _baseUrl;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${_baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function pingMoonraker(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = baseUrl.replace(/\/$/, '');
    const res = await fetch(`${url}/server/info`, { signal: controller.signal });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

export async function getActiveSpool(): Promise<number | null> {
  const data = await request<{ result: { spool_id: number | null } }>(
    '/server/spoolman/spool_id',
  );
  return data.result?.spool_id ?? null;
}

export async function setActiveSpool(spoolId: number | null): Promise<void> {
  await request('/server/spoolman/spool_id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spool_id: spoolId }),
  });
}
