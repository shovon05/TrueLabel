# TrueLabel Community — F11/F13

This change adds F11 consumer reviews and F13 product complaint reporting.

## Routes

- GET /community/products/:productId/reviews — public product reviews
- POST /community/products/:productId/reviews — consumer creates a review
- POST /community/reviews/:reviewId/reply — owner manufacturer or admin responds
- GET /community/products/:productId/report — consumer complaint form
- POST /community/products/:productId/report — consumer submits complaint
- GET /community/reports/mine — consumer's own complaints
- GET /community/reports/queue — inspector/admin private queue
- POST /community/reports/:reportId/status — inspector/admin status update

## Testing and deployment

1. Copy .env.example to .env locally; use a separate development database.
2. Install dependencies: npm install
3. Run the unit tests: npm test
4. Build: npm run build
5. Run existing end-to-end tests: npm run test:e2e
6. Sign up with a real consumer account, not the demo role switcher. The demo user ID is not necessarily a persisted database user, and F11/F13 use foreign keys.
7. Verify all four pages plus role restrictions before merging.

PostgreSQL synchronize is disabled by default. Do not enable DB_SYNC=true against your team's live Supabase database. Set up and review a migration for food_reviews and food_reports before deployment.

The current shared application lacks CSRF protection for session-based POST forms. Address that as a separate shared security fix before real deployment.

F12 moderation/community feed and evidence uploads are not part of this change.
