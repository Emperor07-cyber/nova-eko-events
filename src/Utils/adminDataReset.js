import { ref, remove } from 'firebase/database';

export const ADMIN_DATA_RESET_PATHS = [
  'events',
  'tickets',
  'withdrawalRequests',
  'merchOrders',
  'aggregates',
  'adminAudit',
];

export const ADMIN_DATA_RESET_WARNING =
  'This permanently clears all event listings, ticket sales, withdrawal requests, merch orders, aggregate summaries, and admin audit records.';

export const resetAdminDataInFirebase = async (databaseInstance) => {
  if (!databaseInstance) return;

  await Promise.all(
    ADMIN_DATA_RESET_PATHS.map((path) => remove(ref(databaseInstance, path)))
  );
};
