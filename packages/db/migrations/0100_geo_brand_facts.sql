ALTER TABLE "geo_settings" ADD COLUMN "brand_facts" jsonb DEFAULT '[]'::jsonb NOT NULL;
