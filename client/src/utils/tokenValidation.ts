/**
 * Token validation utilities for JWT tokens
 */

interface DecodedToken {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Decode a JWT token without verification
 * Note: This is for client-side expiry checking only, not for security validation
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if a token is expired
 * @param token - JWT token string
 * @returns true if expired, false if still valid
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;

  // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
}

/**
 * Get the expiration time of a token
 * @param token - JWT token string
 * @returns Date object of expiration time, or null if invalid
 */
export function getTokenExpiration(token: string): Date | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;

  return new Date(decoded.exp * 1000);
}

/**
 * Get remaining time until token expiration in milliseconds
 * @param token - JWT token string
 * @returns milliseconds until expiration, or 0 if expired/invalid
 */
export function getTokenRemainingTime(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;

  const remaining = expiration.getTime() - Date.now();
  return Math.max(0, remaining);
}
