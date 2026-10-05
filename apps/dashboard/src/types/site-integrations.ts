import type { SiteIntegrationName } from "@notra/sites-server/types/integrations";
import type { ComponentType, SVGProps } from "react";

export type { SiteIntegrationName };

export interface SiteIntegrationField {
  /** The key in notra.json under `integrations.<provider>`. */
  key: string;
  kind: "text" | "switch" | "select";
  placeholder?: string;
  optional?: boolean;
  /** Select values; the first is the schema's default and stays out of notra.json. */
  options?: readonly string[];
}

export interface SiteIntegrationProvider {
  id: SiteIntegrationName;
  name: string;
  /** Null shows the name's initial on a tile. */
  logo: ComponentType<SVGProps<SVGSVGElement>> | null;
  docsUrl: string;
  fields: readonly SiteIntegrationField[];
}

/** One provider's form: text and select fields as strings, switches as booleans. */
export type SiteIntegrationValues = Record<string, string | boolean>;
