/**
 * Re-exports frontend-only saju calculation.
 * Legacy server saju endpoints are not used; calculation runs in the browser only.
 */
export { calculateSajuFromProfile, type CalculatedSaju } from "./saju";
