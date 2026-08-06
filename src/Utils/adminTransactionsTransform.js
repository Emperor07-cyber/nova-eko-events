export const normalizeWithdrawals = (withdrawalsMap = {}) => {
  return Object.entries(withdrawalsMap)
    .map(([id, withdrawal]) => ({ id, ...withdrawal }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

export const normalizeTicketTransactions = (ticketsMap = {}) => {
  return Object.entries(ticketsMap)
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
};
