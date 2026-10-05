import type { z } from "zod";

import type { geoIngestDomainActionInputSchema } from "../schemas/geo";

export type GeoIngestDomainActionInput = z.infer<
  typeof geoIngestDomainActionInputSchema
>;

export interface GeoIngestDomainsResponse {
  domains: string[];
}
