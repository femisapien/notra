import type { SiteIntegrationName } from "@notra/sites-server/types/integrations";
import type { ComponentType, SVGProps } from "react";

export type { SiteIntegrationName };

export interface SiteIntegrationField {
  /** The key in notra.json under `integrations.<provider>`. */
  key: string;
  placeholder?: string;
  optional?: boolean;
}

export interface SiteIntegrationProvider {
  id: SiteIntegrationName;
  name: string;
  /** Null shows the name's initial on a tile. */
  logo: ComponentType<SVGProps<SVGSVGElement>> | null;
  docsUrl: string;
  fields: readonly SiteIntegrationField[];
}

/** One provider's form, field key to the typed text. */
export type SiteIntegrationValues = Record<string, string>;
