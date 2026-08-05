export const shouldUseFirebaseEmulators = (env = import.meta.env, hostname = typeof window !== "undefined" ? window.location.hostname : "localhost") => {
  if (env.VITE_USE_FIREBASE_EMULATORS === "false") return false;
  if (env.VITE_USE_FIREBASE_EMULATORS === "true") return true;
  return env.DEV && (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0");
};
