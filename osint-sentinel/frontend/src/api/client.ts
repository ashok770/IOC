// ==============================================================================
// OSINT Sentinel — Centralized HTTP Client
// ==============================================================================

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

// Default base URL uses the Vite dev proxy ('/api') or an environment override
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Builds a clean query string from an object, omitting undefined/null values.
 */
function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Centralized fetch client with automated header management, error normalization,
 * and JSON deserialization.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;
  const queryString = buildQueryString(params);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}${queryString}`;

  const defaultHeaders: HeadersInit = {
    'Accept': 'application/json',
    ...(restOptions.body ? { 'Content-Type': 'application/json' } : {}),
  };

  try {
    const response = await fetch(url, {
      ...restOptions,
      credentials: 'include',
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      let errorDetail = response.statusText;
      let rawError: unknown = null;
      try {
        rawError = await response.json();
        if (rawError && typeof rawError === 'object' && 'detail' in rawError) {
          errorDetail = String((rawError as { detail: unknown }).detail);
        }
      } catch {
        // Response wasn't JSON, retain statusText
      }

      throw new ApiError(errorDetail || `HTTP error ${response.status}`, response.status, rawError);
    }

    // 204 No Content handling
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors, connection refused, DNS errors
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0,
      error
    );
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
