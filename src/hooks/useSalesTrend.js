import { useQuery } from '@tanstack/react-query';
import { auth } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';

const fetchSalesTrend = async ({ queryKey, signal }) => {
  const [_key, { days = 30 } = {}] = queryKey;
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const idToken = await user.getIdToken();
  const url = new URL(adminApiUrl('/sales-trend'), window.location.origin);
  url.searchParams.set('days', String(days));
  const res = await fetch(url.toString(), {
    headers: { Authorization: 'Bearer ' + idToken },
    signal,
  });
  if (!res.ok) throw new Error('Failed to fetch sales trend');
  return res.json();
};

export const useSalesTrend = (days = 30, options = {}) => {
  return useQuery({
    queryKey: ['admin-sales-trend', { days }],
    queryFn: fetchSalesTrend,
    staleTime: 1000 * 30,
    ...options,
  });
};
