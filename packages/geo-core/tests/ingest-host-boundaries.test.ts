import { expect, test } from "bun:test";

import {
  acceptsIngestHost,
  ingestAllowedHosts,
} from "../src/utils/geo-project-domains";

test("the main domain and its subdomains do not need additional approval", () => {
  const allowed = ingestAllowedHosts("https://www.example.com");
  expect(allowed).toEqual(["example.com"]);
  for (const host of [
    "example.com",
    "www.example.com",
    "docs.example.com",
    "preview.docs.example.com",
    "DOCS.EXAMPLE.COM.",
  ]) {
    expect(acceptsIngestHost(host, allowed)).toBe(true);
  }
});

test("unrelated domains and suffix lookalikes are rejected", () => {
  const allowed = ingestAllowedHosts("https://example.com");
  for (const host of [
    "example.dev",
    "unrelated.com",
    "notexample.com",
    "example.com.evil.test",
    "docs.example.com.evil.test",
    "evil-example.com",
  ]) {
    expect(acceptsIngestHost(host, allowed)).toBe(false);
  }
});

test("a configured subdomain does not authorize its parent or siblings", () => {
  const allowed = ingestAllowedHosts("https://docs.example.com");
  expect(acceptsIngestHost("preview.docs.example.com", allowed)).toBe(true);
  expect(acceptsIngestHost("example.com", allowed)).toBe(false);
  expect(acceptsIngestHost("app.example.com", allowed)).toBe(false);
});

test("Unicode main domains keep the same subdomain boundary", () => {
  const allowed = ingestAllowedHosts("https://bücher.de");
  expect(acceptsIngestHost("docs.xn--bcher-kva.de", allowed)).toBe(true);
  expect(acceptsIngestHost("xn--bcher-kva.de.evil.test", allowed)).toBe(false);
});

test("manually configured additional domains keep their existing behavior", () => {
  const allowed = ingestAllowedHosts("https://example.com", ["owned.dev"]);
  expect(acceptsIngestHost("docs.owned.dev", allowed)).toBe(true);
  expect(acceptsIngestHost("unrelated.dev", allowed)).toBe(false);
});
