import { useQuery } from '@tanstack/react-query';
import { get, ref } from 'firebase/database';
import { auth } from '../firebase/firebaseConfig.jsx';
import { database } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';

const buildTransactionsFallback = async () => {
  const [withdrawalsSnap, ticketsSnap] = await Promise.all([
    get(ref(database, 'withdrawalRequests')),
    get(ref(database, 'tickets')),
  ]);

  const withdrawalsMap = withdrawalsSnap.val() || {};
  const ticketsMap = ticketsSnap.val() || {};

  const withdrawals = Object.entries(withdrawalsMap)
    .map(([id, withdrawal]) => ({ id, ...withdrawal }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const transactions = Object.entries(ticketsMap)
    .map(([id, ticket]) => ({
      id,
      reference: ticket.transactionId || id,
      type: 'Ticket Sale',
      description: ticket.eventTitle || ticket.ticketType || 'Ticket',
      amount: ticket.totalPaid || ticket.totalCharged || 0,
      date: ticket.timestamp || 0,
      status: 'Success',
    }))
    .sort((a, b) => (b.date || 0) - (a.date || 0));

  return { withdrawals, transactions };
};

const fetchTransactions = async ({ signal }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const token = await user.getIdToken();

  try {
    const res = await fetch(adminApiUrl('/transactions'), {
      headers: { Authorization: 'Bearer ' + token },
      signal,
    });

    if (res.ok) {
      return res.json();
    }

    // If backend admin routes are unavailable in the current environment,
    // fall back to direct Firebase reads used elsewhere in the admin app.
    if (res.status === 404 || res.status === 405) {
      return buildTransactionsFallback();
    }

    throw new Error('Failed to fetch admin transactions');
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    return buildTransactionsFallback();
  }
};

export const useAdminTransactions = (options = {}) => {
  return useQuery({
    queryKey: ['admin-transactions'],
    queryFn: fetchTransactions,
    staleTime: 1000 * 30,
    ...options,
  });
};
