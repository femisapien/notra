export function ingestDomainKeys(organizationId: string, projectId: string) {
  const scope = `{${organizationId}:${projectId}}`;
  return {
    pending: `geo:ingest-domains:${scope}:pending`,
    ignored: `geo:ingest-domains:${scope}:ignored`,
  };
}
