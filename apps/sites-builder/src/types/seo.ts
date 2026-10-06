/** A schema.org node; `undefined` properties drop out of the serialized JSON. */
export type JsonLdNode = Record<string, unknown>;

export interface SocialImage {
  url: string;
  /** A real cover, worth a large card; the logo fallback is not. */
  large: boolean;
}

/** A `seo.metatags` entry: Open Graph style keys are `property`, the rest `name`. */
export interface ExtraMetaTag {
  key: "name" | "property";
  value: string;
  content: string;
}
