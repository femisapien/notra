import type { Metadata } from "next";

import { MarketingHeroWash } from "@/components/marketing-hero-wash";
import { OfferingTool } from "@/components/offering/offering-tool";
import {
  OFFERING_DESCRIPTION,
  OFFERING_HERO_SUBTITLE,
  OFFERING_SAMPLES,
  OFFERING_TITLE,
  OFFERING_URL,
} from "@/constants/offering";
import type { OfferingPageProps } from "@/types/offering";
import { buildBreadcrumbJsonLd, serializeJsonLd } from "@/utils/jsonld";
import { DEFAULT_SOCIAL_IMAGE, TWITTER_HANDLE } from "@/utils/metadata";
import { SITE_URL } from "@/utils/urls";

const title = OFFERING_TITLE;
const description = OFFERING_DESCRIPTION;
const url = OFFERING_URL;

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: url,
    types: { "text/markdown": `${url}.md` },
  },
  openGraph: {
    title,
    description,
    url,
    type: "website",
    siteName: "Notra",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_SOCIAL_IMAGE.url],
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
  },
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd([
  { name: "Home", url: SITE_URL },
  { name: title, url },
]);

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: title,
  url,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web",
  description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

const sectionTitleClass =
  "font-display text-[1.625rem]/8 font-medium tracking-[-0.02em] text-[#1E1E1E] dark:text-white";
const bodyClass =
  "font-sans text-[0.9375rem]/6 text-pretty text-[#1E1E1EBF] dark:text-white/70";

function firstQueryValue(
  value: string | string[] | undefined
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function OfferingPage({
  searchParams,
}: OfferingPageProps) {
  const params = await searchParams;
  const initialBrand = firstQueryValue(params.brand);
  const initialFeature = firstQueryValue(params.feature);

  return (
    <div className="flex w-full flex-col items-center">
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
        type="application/ld+json"
      />
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: server-built JSON-LD
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(softwareJsonLd) }}
        type="application/ld+json"
      />

      <section className="flex w-full flex-col items-center gap-10 pb-16 antialiased [font-synthesis:none] md:gap-12 md:pb-24">
        <MarketingHeroWash
          subtitle={OFFERING_HERO_SUBTITLE}
          title={
            <>
              Does AI know this <span className="text-primary">feature</span>?
            </>
          }
        />

        <div className="flex w-full max-w-[64rem] flex-col gap-10 px-4 sm:px-6 md:gap-12">
          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#1E1E1E14] bg-[linear-gradient(in_oklab_180deg,oklab(95.1%_0.011_-0.018_/_15%)_0%,oklab(93.7%_0.019_-0.031_/_75%)_100%)] p-2 sm:p-4 dark:border-white/10 dark:bg-white/[0.02] dark:bg-none">
            <div className="bg-background rounded-2xl border border-[#1E1E1E0D] p-4 sm:p-6 dark:border-white/5">
              <OfferingTool
                initialBrand={initialBrand}
                initialFeature={initialFeature}
                samples={OFFERING_SAMPLES}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className={sectionTitleClass}>How the check works</h2>
            <p className={bodyClass}>
              We do not ask ChatGPT “do you know this feature?”. That would put
              the name in the question. We ask what the product offers, with
              GPT-5.6 native search, then look for the feature in the answer and
              rank the sites it cited.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className={sectionTitleClass}>What a miss means</h2>
            <p className={bodyClass}>
              If the feature is missing, ChatGPT cannot recommend it when a
              buyer asks what you sell. One check is a snapshot on one engine,
              not a score. Notra runs the same kind of prompt across ChatGPT,
              Claude, Gemini and Perplexity on a schedule, and turns the misses
              into pages worth publishing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
