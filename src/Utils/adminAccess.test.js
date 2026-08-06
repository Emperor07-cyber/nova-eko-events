import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasAdminAccess, shouldRedirectFromAdmin } from './adminAccess.js';

describe('adminAccess helpers', () => {
  it('grants access when token has admin claim', () => {
    assert.equal(hasAdminAccess({ tokenClaims: { admin: true } }), true);
  });

  it('grants access when database role is admin', () => {
    assert.equal(hasAdminAccess({ tokenClaims: {}, userRecord: { role: 'admin' } }), true);
  });

  it('denies access when neither claim nor role indicates admin', () => {
    assert.equal(hasAdminAccess({ tokenClaims: {}, userRecord: { role: 'host' } }), false);
  });

  it('redirects when user is missing', () => {
    assert.equal(shouldRedirectFromAdmin({ user: null, isAdmin: true }), true);
  });

  it('redirects when admin check fails', () => {
    assert.equal(shouldRedirectFromAdmin({ user: { uid: 'abc' }, isAdmin: false }), true);
  });

  it('does not redirect for authenticated admin', () => {
    assert.equal(shouldRedirectFromAdmin({ user: { uid: 'abc' }, isAdmin: true }), false);
  });
});
