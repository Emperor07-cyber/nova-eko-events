export const normalizeText = (value) => String(value ?? '').trim().toLowerCase();

export const ticketMatchesEvent = (ticket = {}, event = {}) => {
  if (!ticket || !event) return false;

  const ticketEventId = normalizeText(ticket.eventId);
  const eventId = normalizeText(event.id);
  if (ticketEventId && eventId && ticketEventId === eventId) {
    return true;
  }

  const ticketEventTitle = normalizeText(ticket.eventTitle || ticket.eventTitle || ticket.event?.title);
  const eventTitle = normalizeText(event.title);
  if (ticketEventTitle && eventTitle && ticketEventTitle === eventTitle) {
    return true;
  }

  const ticketHostCandidates = [
    ticket.hostEmail,
    ticket.host_uid,
    ticket.hostUid,
    ticket.createdBy,
    ticket.ownerEmail,
    ticket.ownerUid,
  ];
  const eventHostCandidates = [
    event.hostEmail,
    event.createdBy,
    event.hostUid,
    event.ownerEmail,
    event.ownerUid,
  ];

  return ticketHostCandidates.some((candidate) => {
    const normalizedCandidate = normalizeText(candidate);
    if (!normalizedCandidate) return false;
    return eventHostCandidates.some((eventCandidate) => normalizeText(eventCandidate) === normalizedCandidate);
  });
};
