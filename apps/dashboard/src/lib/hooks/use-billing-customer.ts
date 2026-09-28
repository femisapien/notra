"use client";

import { useCustomer } from "autumn-js/react";

import { useDemoMode } from "@/components/demo/demo-context";
import { DEMO_CUSTOMER } from "@/constants/demo/workspace";
import { billingCustomerOptions } from "@/utils/billing-customer";

export function useBillingCustomer(params?: Parameters<typeof useCustomer>[0]) {
  const demo = useDemoMode();
  return useCustomer(
    billingCustomerOptions(
      demo
        ? {
            ...params,
            queryOptions: { enabled: false, initialData: DEMO_CUSTOMER },
          }
        : params
    )
  );
}
