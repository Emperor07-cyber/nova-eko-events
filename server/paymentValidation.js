const calculateTicketCharge = (ticketPrice, quantity) => {
  const price = Number(ticketPrice);
  const qty = Number(quantity);

  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(qty) || qty < 1) {
    return null;
  }

  const baseAmount = price * qty;
  const platformFee = baseAmount > 0 ? Math.round(baseAmount * 0.05) + 100 : 0;
  const totalAmount = baseAmount + platformFee;

  return {
    baseAmount,
    platformFee,
    totalAmount,
    expectedAmountKobo: Math.round(totalAmount * 100),
  };
};

const validateTicketPayment = ({ amountKobo, currency, expectedAmountKobo }) => {
  const actualAmount = Number(amountKobo);
  const expectedAmount = Number(expectedAmountKobo);

  return {
    valid:
      String(currency || '').toUpperCase() === 'NGN' &&
      Number.isFinite(actualAmount) &&
      Number.isFinite(expectedAmount) &&
      actualAmount === expectedAmount,
    actualAmountKobo: Number.isFinite(actualAmount) ? actualAmount : null,
    expectedAmountKobo: Number.isFinite(expectedAmount) ? expectedAmount : null,
  };
};

module.exports = { calculateTicketCharge, validateTicketPayment };