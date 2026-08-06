export const hasAdminAccess = ({ tokenClaims, userRecord } = {}) => {
  if (tokenClaims?.admin === true) return true;
  return userRecord?.role === 'admin';
};

export const shouldRedirectFromAdmin = ({ user, isAdmin } = {}) => {
  return !user || !isAdmin;
};
