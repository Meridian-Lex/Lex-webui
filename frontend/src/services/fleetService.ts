import { stratavoreApi } from './api';
import type { FleetPRsResponse } from '../types/fleet';

export const fleetApi = {
  async listOpenPRs(refresh = false): Promise<FleetPRsResponse> {
    const params: Record<string, string> = {};
    if (refresh) params.refresh = 'true';
    const r = await stratavoreApi.get<FleetPRsResponse>('/fleet/prs', { params });
    return r.data;
  },
};
