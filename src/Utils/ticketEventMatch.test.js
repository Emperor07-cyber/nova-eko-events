import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ticketMatchesEvent } from './ticketEventMatch.js';

describe('ticketEventMatch helpers', () => {
  it('matches a ticket to an event by eventId', () => {
    const ticket = { eventId: 'evt-123', eventTitle: 'Launch Night' };
    const event = { id: 'evt-123', title: 'Launch Night', hostEmail: 'host@example.com' };

    assert.equal(ticketMatchesEvent(ticket, event), true);
  });

  it('matches a ticket to an event by title when eventId is missing', () => {
    const ticket = { eventTitle: 'Launch Night', hostEmail: 'host@example.com' };
    const event = { id: 'evt-456', title: 'Launch Night', hostEmail: 'host@example.com' };

    assert.equal(ticketMatchesEvent(ticket, event), true);
  });

  it('matches by host identity when ticket metadata is stale', () => {
    const ticket = { eventId: '', eventTitle: 'Legacy Event', hostEmail: 'host@example.com', hostUid: 'abc-123' };
    const event = { id: 'evt-789', title: 'Different Title', hostEmail: 'host@example.com', hostUid: 'abc-123' };

    assert.equal(ticketMatchesEvent(ticket, event), true);
  });

  it('matches tickets with snake_case host metadata', () => {
    const ticket = {
      eventId: '',
      eventTitle: 'Legacy Event',
      host_email: 'host@example.com',
      host_uid: 'abc-123',
    };
    const event = {
      id: 'evt-789',
      title: 'Different Title',
      hostEmail: 'host@example.com',
      hostUid: 'abc-123',
    };

    assert.equal(ticketMatchesEvent(ticket, event), true);
  });

  it('matches tickets by snake_case event_id when eventId is absent', () => {
    const ticket = {
      event_id: 'evt-999',
      eventTitle: 'Legacy Event',
      hostEmail: 'host@example.com',
    };
    const event = {
      id: 'evt-999',
      title: 'Different Title',
      hostEmail: 'host@example.com',
    };

    assert.equal(ticketMatchesEvent(ticket, event), true);
  });
});
