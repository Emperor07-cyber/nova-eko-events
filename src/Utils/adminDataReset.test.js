import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ADMIN_DATA_RESET_PATHS } from './adminDataReset.js';

describe('adminDataReset', () => {
  it('lists the platform data nodes that should be cleared from the admin section', () => {
    assert.deepEqual(ADMIN_DATA_RESET_PATHS, [
      'events',
      'tickets',
      'withdrawalRequests',
      'merchOrders',
      'aggregates',
      'adminAudit',
    ]);
  });
});
