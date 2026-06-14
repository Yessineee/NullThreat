/**
 * MetaDefender (OPSWAT) integration — planned for future implementation.
 *
 * Current limitation: MetaDefender's URL scanning endpoint requires a paid plan.
 * File upload scanning requires re-fetching the downloaded file, which is blocked
 * by CORS policy when called from a browser extension origin.
 *
 * Planned approach for v2:
 * - Implement a lightweight backend proxy (Node.js/Express) that receives the
 *   file URL from the extension, fetches and uploads it to MetaDefender, and
 *   returns the combined VT + MD aggregate threat score.
 * - This would enable dual-engine scanning with 5000 MD requests/day on the
 *   free tier, significantly increasing daily scan capacity.
 */