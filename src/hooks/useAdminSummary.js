import { useQuery } from '@tanstack/react-query';
import { auth } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';

const fetchSummary = async ({ signal }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const res = await fetch(adminApiUrl('/summary'), {
    headers: { Authorization: 'Bearer ' + idToken },
    signal,
  });
  if (!res.ok) throw new Error('Failed to fetch admin summary');
  return res.json();
};

export const useAdminSummary = (options = {}) => {
  return useQuery({
    queryKey: ['admin-summary'],
    queryFn: fetchSummary,
    staleTime: 1000 * 30,
    ...options,
  });
};
