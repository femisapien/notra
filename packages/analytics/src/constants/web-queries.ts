import { p } from "@tinybirdco/sdk";

import { GEO_HOSTS_SQL } from "./geo-queries";

// Narrows web analytics to one Notra Site and/or a set of hosts.
export const WEB_SCOPE_PARAMS = {
  site_id: p
    .string()
    .optional("")
    .describe("Notra Site id, empty for every site and SDK host"),
  hosts: p
    .string()
    .optional("")
    .describe(
      "Comma-separated domains, empty for every host. Subdomains match."
    ),
};

export const WEB_SCOPE_SQL = `AND ({{String(site_id, '')}} = '' OR site_id = {{String(site_id, '')}})
          ${GEO_HOSTS_SQL}`;
