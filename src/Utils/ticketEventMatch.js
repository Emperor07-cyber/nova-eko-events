export const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (String(value ?? '').trim()) return value;
  }
  return '';
};

export const ticketMatchesEvent = (ticket = {}, event = {}) => {
  if (!ticket || !event) return false;

  const ticketEventId = normalizeText(
    ticket.eventId || ticket.event_id || ticket.eventID || ticket.eventid
  );
  const eventId = normalizeText(event.id);
  if (ticketEventId && eventId && ticketEventId === eventId) {
    return true;
  }

  const ticketEventTitle = normalizeText(
    ticket.eventTitle || ticket.event?.title || ticket.event_title || ticket.eventTitle
  );
  const eventTitle = normalizeText(event.title);
  if (ticketEventTitle && eventTitle && ticketEventTitle === eventTitle) {
    return true;
  }

  const ticketHostCandidates = [
    ticket.hostEmail,
    ticket.host_email,
    ticket.host_uid,
    ticket.hostUid,
    ticket.createdBy,
    ticket.ownerEmail,
    ticket.owner_email,
    ticket.ownerUid,
    ticket.owner_uid,
    ticket.requestedByEmail,
    ticket.requestedByUid,
  ];
  const eventHostCandidates = [
    event.hostEmail,
    event.host_email,
    event.hostUid,
    event.host_uid,
    event.createdBy,
    event.ownerEmail,
    event.owner_email,
    event.ownerUid,
    event.owner_uid,
  ];

  return ticketHostCandidates.some((candidate) => {
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedCandidate) return false;
    return eventHostCandidates.some((eventCandidate) => normalizeText(eventCandidate) === normalizedCandidate);
  });
};

export const findMatchingEventForTicket = (ticket = {}, events = []) => {
  if (!ticket || !Array.isArray(events)) return [];
  return events.filter((event) => ticketMatchesEvent(ticket, event));
};

export const buildTicketMetadataPatch = (ticket = {}, event = {}) => {
  if (!ticket || !event) return {};

  const patch = {};
  const eventIdValue = firstNonEmpty(ticket.eventId, ticket.event_id, ticket.eventID, ticket.eventid, event.id);
  const eventTitleValue = firstNonEmpty(ticket.eventTitle, ticket.event_title, event.title);
  const hostEmailValue = firstNonEmpty(
    ticket.hostEmail,
    ticket.host_email,
    ticket.createdBy,
    ticket.ownerEmail,
    ticket.owner_email,
    event.hostEmail,
    event.createdBy,
    event.ownerEmail,
    event.owner_email
  );
  const hostUidValue = firstNonEmpty(
    ticket.hostUid,
    ticket.host_uid,
    ticket.ownerUid,
    ticket.owner_uid,
    event.hostUid,
    event.host_uid,
    event.ownerUid,
    event.owner_uid
  );

  if (eventIdValue && !ticket.eventId) patch.eventId = eventIdValue;
  if (eventIdValue && !ticket.event_id && !ticket.eventID && !ticket.eventid) patch.event_id = eventIdValue;

  if (eventTitleValue && !ticket.eventTitle) patch.eventTitle = eventTitleValue;
  if (eventTitleValue && !ticket.event_title) patch.event_title = eventTitleValue;

  if (hostEmailValue && !ticket.hostEmail) patch.hostEmail = hostEmailValue;
  if (hostEmailValue && !ticket.host_email) patch.host_email = hostEmailValue;

  if (hostUidValue && !ticket.hostUid) patch.hostUid = hostUidValue;
  if (hostUidValue && !ticket.host_uid) patch.host_uid = hostUidValue;

  return patch;
};
