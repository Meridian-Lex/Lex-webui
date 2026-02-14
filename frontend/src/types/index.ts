// v3: Stratavore types — source of truth for all operational data
export * from './stratavore';
export type { FleetPR, FleetPRsResponse } from './fleet';

// Legacy User type kept for auth context (simplified in v3)
export interface User {
  id: string;
  username: string;
  role: string;
  lastLogin: string | null;
}
