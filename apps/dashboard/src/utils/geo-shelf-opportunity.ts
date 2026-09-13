import { GEO_SHELF_OPEN_STATUSES } from "@/constants/geo-shelf";
import type { GeoShelfOpportunity } from "@/types/geo-shelf";

export function isOpenShelfStatus(
  status: GeoShelfOpportunity["status"] | null | undefined
): boolean {
  return status ? GEO_SHELF_OPEN_STATUSES.includes(status) : false;
}

export function resolveShelfPoc(
  opportunity: GeoShelfOpportunity | null
): string | null {
  if (!opportunity) {
    return null;
  }
  return opportunity.pocMemberId ?? opportunity.assigneeMemberId;
}
