export interface OfferingSource {
  title: string;
  url: string;
  domain: string;
}

export interface OfferingCitationShare {
  domain: string;
  count: number;
  share: number;
  title: string;
  url: string;
  isBrand: boolean;
}

export interface OfferingScanResult {
  brand: string;
  feature: string | null;
  prompt: string;
  known: boolean;
  matchedTerm: string | null;
  answer: string;
  engine: string;
  queries: string[];
  sources: OfferingSource[];
  citations: OfferingCitationShare[];
  cached: boolean;
}

export interface OfferingSample {
  brand: string;
  feature: string;
}

export type OfferingScanStatus =
  | "idle"
  | "checking"
  | "done"
  | "invalid"
  | "rate-limited"
  | "unavailable"
  | "error";

export interface OfferingToolProps {
  samples: readonly OfferingSample[];
  initialBrand?: string;
  initialFeature?: string;
}

export interface OfferingPageProps {
  searchParams: Promise<{
    brand?: string | string[];
    feature?: string | string[];
  }>;
}

export interface OfferingResultCardProps {
  result: OfferingScanResult;
}
