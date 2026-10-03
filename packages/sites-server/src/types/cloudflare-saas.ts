export interface CloudflareSaasConfig {
  zoneId: string;
  apiToken: string;
}

export interface CloudflareCustomHostname {
  id: string;
  hostname: string;
  status: string;
  verification_errors?: string[];
  ownership_verification?: { type: string; name: string; value: string };
  ssl?: {
    status?: string;
    validation_errors?: Array<{ message: string }>;
    validation_records?: Array<{
      txt_name?: string;
      txt_value?: string;
      http_url?: string;
      http_body?: string;
    }>;
  };
}

export interface CloudflareApiResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ code: number; message: string }>;
}
