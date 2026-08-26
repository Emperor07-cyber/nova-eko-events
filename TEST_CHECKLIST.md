# Test Checklist

Use this checklist before shipping changes to the Ekotix app.

## 1. Build and basic health

- [ ] Run `npm install` if dependencies changed.
- [ ] Run `npm run build` and confirm the production build succeeds.
- [ ] Run `npm run lint` and confirm there are no new lint errors.
- [ ] Run `npm test` and confirm the existing unit tests pass.
- [ ] Verify the app starts locally and the home page loads without console errors.

## 2. Public site

- [ ] Home page renders correctly on desktop and mobile widths.
- [ ] Public navigation opens and closes on mobile.
- [ ] Footer renders on public pages.
- [ ] Event list page loads and shows events or an empty-state message.
- [ ] Event detail page opens from both `/event/:eventId` and `/:slug`.
- [ ] Privacy Policy page loads.
- [ ] Terms page loads.

## 3. Authentication

- [ ] Register flow accepts valid input and rejects invalid input.
- [ ] Login flow accepts valid credentials and rejects invalid credentials.
- [ ] Authenticated users can access `My Tickets`.
- [ ] Unauthenticated users are redirected away from protected routes.
- [ ] Host setup flow works for a new host account.

## 4. Ticket purchase

- [ ] Ticket checkout loads for a valid event.
- [ ] Ticket checkout handles missing or invalid event IDs gracefully.
- [ ] Ticket quantity and pricing are calculated correctly.
- [ ] Payment initiation works with the configured provider.
- [ ] Success and failure states are shown clearly after payment attempt.
- [ ] Purchase confirmation is visible in `My Tickets`.

## 5. Merch purchase

- [ ] Merch checkout loads for a valid event.
- [ ] Merch product selection and quantity updates work correctly.
- [ ] Merch pricing is calculated correctly.
- [ ] Payment initiation works with the configured provider.
- [ ] Success and failure states are shown clearly after payment attempt.

## 6. Check-in flow

- [ ] Public check-in page loads.
- [ ] Host check-in page loads for authorized hosts.
- [ ] QR or code-based check-in accepts a valid ticket.
- [ ] Invalid, expired, or already-used tickets are rejected.
- [ ] Successful check-in updates attendee status.

## 7. Host portal

- [ ] Host dashboard loads and displays summary information.
- [ ] Host events page lists the host’s events.
- [ ] Host event details page opens correctly.
- [ ] Host attendees page lists attendees and supports filtering if available.
- [ ] Host merch page loads.
- [ ] Host wallet page loads.
- [ ] Host settings page loads and saves changes correctly.
- [ ] Protected host routes redirect unauthorised users.

## 8. Event creation and editing

- [ ] Admin or host can open the new event form.
- [ ] Required event fields validate correctly.
- [ ] Event image upload works.
- [ ] Event save creates a new event successfully.
- [ ] Existing event data loads into the edit form.
- [ ] Event edits persist correctly.
- [ ] Scanner code or QR generation works where applicable.

## 9. Admin portal

- [ ] Admin dashboard loads for authorized admins only.
- [ ] Admin transactions page loads and shows expected data.
- [ ] Admin withdrawals page loads and shows expected data.
- [ ] Admin events page loads.
- [ ] Admin reports page loads.
- [ ] Admin tickets ledger page loads.
- [ ] Admin users page loads.
- [ ] Admin settings page loads.
- [ ] Admin system logs page loads.
- [ ] Unknown admin sections fall back to the placeholder view.
- [ ] Non-admin users are blocked from admin routes.

## 10. Data and integrations

- [ ] Firebase reads and writes work in the expected environment.
- [ ] Emulator mode behaves correctly in local development.
- [ ] Cloudinary uploads succeed for event images.
- [ ] Email notifications or receipts send when configured.
- [ ] Payments, withdrawals, and transaction records are stored correctly.
- [ ] API calls handle network failures without crashing the UI.

## 11. Regression checks

- [ ] Navigation between public, auth, host, and admin areas works without broken routes.
- [ ] Refreshing a deep link keeps the app on the same route.
- [ ] Toast notifications appear for success and error states.
- [ ] Loading states appear during slow requests.
- [ ] Empty states are readable and not confusing.
- [ ] No new browser console errors appear during the main flows.

## 12. Existing automated coverage

- [ ] `src/firebase/firebaseRuntime.test.js`
- [ ] `src/Utils/adminAccess.test.js`
- [ ] `src/Utils/adminTransactionsTransform.test.js`

