const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { calculateTicketCharge, validateTicketPayment } = require('./paymentValidation');

describe('ticket payment validation', () => {
  it('calculates the checkout total from stored ticket price and quantity', () => {
    assert.deepEqual(calculateTicketCharge(4300, 1), {
      baseAmount: 4300,
      platformFee: 315,
      totalAmount: 4615,
      expectedAmountKobo: 461500,
    });
  });

  it('rejects invalid prices and quantities', () => {
    assert.equal(calculateTicketCharge(-10, 1), null);
    assert.equal(calculateTicketCharge(4300, 1.5), null);
    assert.equal(calculateTicketCharge(4300, 0), null);
  });

  it('accepts only the exact expected NGN charge', () => {
    assert.equal(validateTicketPayment({
      amountKobo: 461500,
      currency: 'NGN',
      expectedAmountKobo: 461500,
    }).valid, true);

    assert.equal(validateTicketPayment({
      amountKobo: 10000,
      currency: 'NGN',
      expectedAmountKobo: 461500,
    }).valid, false);

    assert.equal(validateTicketPayment({
      amountKobo: 461500,
      currency: 'USD',
      expectedAmountKobo: 461500,
    }).valid, false);
  });
});