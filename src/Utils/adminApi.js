const trimTrailingSlash = (value) => value.replace(/\/$/, '');

const getAdminApiBase = () => {
  const configuredBase = import.meta.env.VITE_ADMIN_API_BASE;
  if (configuredBase && configuredBase.trim()) {
    return trimTrailingSlash(configuredBase.trim());
  }

  const apiRoot = import.meta.env.VITE_API_URL;
  if (apiRoot && apiRoot.trim()) {
    return `${trimTrailingSlash(apiRoot.trim())}/admin`;
  }

  // In local Vite dev, /api/* is proxied to the backend origin.
  if (import.meta.env.DEV) return '/api/admin';

  // In production the frontend host rewrites app routes to index.html,
  // so same-origin /admin/* requests hit the SPA instead of the backend.
  return 'https://nova-eko-events.onrender.com/admin';
};

export const adminApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getAdminApiBase()}${normalizedPath}`;
};
