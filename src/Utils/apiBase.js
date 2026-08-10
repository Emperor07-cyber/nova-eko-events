const trimTrailingSlash = (value) => value.replace(/\/$/, '');

export const getApiBase = () => {
  const configuredBase = import.meta.env.VITE_API_URL;
  if (configuredBase && configuredBase.trim()) {
    return trimTrailingSlash(configuredBase.trim());
  }

  if (import.meta.env.DEV) {
    return '/api';
  }

  return 'https://nova-eko-events.onrender.com';
};

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBase()}${normalizedPath}`;
};
