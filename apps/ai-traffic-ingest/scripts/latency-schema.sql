CREATE TABLE IF NOT EXISTS latency_control (
  id integer PRIMARY KEY,
  generation integer NOT NULL,
  delay_ms integer NOT NULL
);
INSERT INTO latency_control VALUES (1, 1, 0)
ON CONFLICT (id) DO UPDATE SET generation = 1, delay_ms = 0;

CREATE OR REPLACE FUNCTION latency_generation() RETURNS integer AS $$
DECLARE current_generation integer; delay integer;
BEGIN
  SELECT generation, delay_ms INTO current_generation, delay FROM latency_control WHERE id = 1;
  PERFORM pg_sleep(delay / 1000.0);
  RETURN current_generation;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE VIEW projects AS
SELECT 'bench_project'::text AS id,
       'bench_org'::text AS organization_id,
       'bench_brand'::text AS brand_settings_id,
       now() AS created_at,
       latency_generation() AS geo_ingest_token_generation;

CREATE TABLE IF NOT EXISTS brand_settings (id text PRIMARY KEY, website_url text NOT NULL);
INSERT INTO brand_settings VALUES ('bench_brand', 'https://example.test') ON CONFLICT (id) DO NOTHING;
CREATE TABLE IF NOT EXISTS geo_settings (project_id text PRIMARY KEY, domains text[] NOT NULL);
INSERT INTO geo_settings VALUES ('bench_project', ARRAY[]::text[]) ON CONFLICT (project_id) DO NOTHING;
