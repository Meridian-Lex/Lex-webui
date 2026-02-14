// Fleet PR types — matches GET /api/v1/fleet/prs response shape

export interface FleetPR {
  repo: string;
  number: number;
  title: string;
  author: string;
  created_at: string;
  draft: boolean;
  assignees: string[];
  url: string;
}

export interface FleetPRsResponse {
  prs: FleetPR[];
  cached_at: string;
  total: number;
}
