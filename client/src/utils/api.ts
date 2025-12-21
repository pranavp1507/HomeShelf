/**
 * API utility for handling fetch requests with automatic auth error handling
 */

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Custom fetch wrapper that automatically handles 401 errors
 * and redirects to login when token expires
 */
export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  const response = await fetch(url, options);

  // Check for 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to login page
    window.location.href = '/login';

    // Throw error to stop further processing
    throw new Error('Session expired. Please login again.');
  }

  return response;
}

/**
 * Helper to create Authorization header with token
 */
export function getAuthHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}
