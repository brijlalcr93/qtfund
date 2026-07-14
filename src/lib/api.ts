const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function refreshToken(): Promise<string | null> {
  const refresh = localStorage.getItem('quantum_refresh_token');
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });

    if (!res.ok) {
      localStorage.removeItem('quantum_token');
      localStorage.removeItem('quantum_refresh_token');
      return null;
    }

    const data = await res.json();
    const newToken = data.token || data.data?.token;
    const newRefresh = data.refreshToken || data.data?.refreshToken;

    if (newToken) localStorage.setItem('quantum_token', newToken);
    if (newRefresh) localStorage.setItem('quantum_refresh_token', newRefresh);

    return newToken || null;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem('quantum_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    }
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error || json?.message || `Request failed with status ${res.status}`,
      json
    );
  }

  // Some endpoints (e.g. GET /kyc with no submission yet) legitimately return a bare `null`
  // body rather than an object — guard against that before probing for a `.data` envelope.
  return json != null && json.data !== undefined ? (json.data as T) : (json as T);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};
