export const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

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
