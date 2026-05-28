import type {
  SpoolmanSpool,
  SpoolmanFilament,
  SpoolmanVendor,
  SpoolmanLocation,
} from '../types';

const TIMEOUT_MS = 10_000;

let _baseUrl = '';

export function setSpoolmanBaseUrl(url: string): void {
  _baseUrl = url.replace(/\/$/, '');
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
    if (res.status === 204) {
      return undefined as unknown as T;
    }
    return res.json() as Promise<T>;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function pingSpoolman(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    clearTimeout(timer);
    return false;
  }
}

// Spools
export function listSpools(): Promise<SpoolmanSpool[]> {
  return request<SpoolmanSpool[]>('/api/v1/spool');
}

export function getSpool(id: number): Promise<SpoolmanSpool> {
  return request<SpoolmanSpool>(`/api/v1/spool/${id}`);
}

export function createSpool(data: Record<string, unknown>): Promise<SpoolmanSpool> {
  return request<SpoolmanSpool>('/api/v1/spool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateSpool(id: number, data: Record<string, unknown>): Promise<SpoolmanSpool> {
  return request<SpoolmanSpool>(`/api/v1/spool/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteSpool(id: number): Promise<void> {
  return request<void>(`/api/v1/spool/${id}`, { method: 'DELETE' });
}

// Filaments
export function listFilaments(): Promise<SpoolmanFilament[]> {
  return request<SpoolmanFilament[]>('/api/v1/filament');
}

// Vendors (Manufacturers)
export function listVendors(): Promise<SpoolmanVendor[]> {
  return request<SpoolmanVendor[]>('/api/v1/vendor');
}

// Locations
export function listLocations(): Promise<SpoolmanLocation[]> {
  return request<SpoolmanLocation[]>('/api/v1/location');
}
