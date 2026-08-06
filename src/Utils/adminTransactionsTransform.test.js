import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTicketTransactions, normalizeWithdrawals } from './adminTransactionsTransform.js';

describe('adminTransactionsTransform', () => {
  it('normalizes and sorts withdrawals by timestamp descending', () => {
    const withdrawals = normalizeWithdrawals({
      a1: { amount: 1200, timestamp: 10 },
      a2: { amount: 700, timestamp: 40 },
    });

    assert.equal(withdrawals.length, 2);
    assert.equal(withdrawals[0].id, 'a2');
    assert.equal(withdrawals[1].id, 'a1');
  });

  it('normalizes ticket transactions and keeps fallback defaults', () => {
    const transactions = normalizeTicketTransactions({
      t1: { ticketType: 'VIP', totalCharged: 4500, timestamp: 20 },
      t2: { eventTitle: 'Neon Fest', totalPaid: 9000, transactionId: 'TX-2', timestamp: 50 },
    });

    assert.equal(transactions.length, 2);
    assert.equal(transactions[0].id, 't2');
    assert.equal(transactions[0].reference, 'TX-2');
    assert.equal(transactions[0].description, 'Neon Fest');
    assert.equal(transactions[0].amount, 9000);
    assert.equal(transactions[0].type, 'Ticket Sale');
    assert.equal(transactions[0].status, 'Success');

    assert.equal(transactions[1].id, 't1');
    assert.equal(transactions[1].reference, 't1');
    assert.equal(transactions[1].description, 'VIP');
    assert.equal(transactions[1].amount, 4500);
  });

  it('returns empty arrays for empty source maps', () => {
    assert.deepEqual(normalizeWithdrawals({}), []);
    assert.deepEqual(normalizeTicketTransactions({}), []);
  });
});
