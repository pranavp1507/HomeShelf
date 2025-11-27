/**
 * Application Configuration
 *
 * This file centralizes all configuration values from environment variables.
 * Edit the .env file to customize your library's name, logo, and other settings.
 */

export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',

  // Library Branding
  libraryName: import.meta.env.VITE_LIBRARY_NAME || 'My Library',
  libraryLogo: import.meta.env.VITE_LIBRARY_LOGO || '/Logo.svg',

  // You can add more configuration options here as needed
  // For example:
  // defaultTheme: import.meta.env.VITE_DEFAULT_THEME || 'light',
  // itemsPerPage: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE || '25'),
} as const;

export default config;
