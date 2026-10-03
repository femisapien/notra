import z from "zod";

export const domainConnectSettingsSchema = z.object({
  providerId: z.string().min(1),
  providerName: z.string().min(1),
  providerDisplayName: z.string().min(1).optional(),
  urlSyncUX: z.url({ protocol: /^https$/ }).optional(),
  urlAPI: z.url({ protocol: /^https$/ }),
});
