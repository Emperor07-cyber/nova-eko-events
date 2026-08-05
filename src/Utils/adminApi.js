const trimTrailingSlash = (value) => value.replace(/\/$/, '');

const getAdminApiBase = () => {
  const configuredBase = import.meta.env.VITE_ADMIN_API_BASE;
  if (configuredBase && configuredBase.trim()) {
    return trimTrailingSlash(configuredBase.trim());
  }

  // In local Vite dev, /api/* is proxied to the backend origin.
  if (import.meta.env.DEV) return '/api/admin';
  return '/admin';
};

export const adminApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getAdminApiBase()}${normalizedPath}`;
};
