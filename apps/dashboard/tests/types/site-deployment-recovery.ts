import type { ReactNode } from "react";

export interface SiteRecoveryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit" | "reset";
}

export interface SiteRecoveryQueryOptions {
  refetchInterval: (query: {
    state: { data?: { deployments: { id: string }[] } };
  }) => number | false;
}

export interface SiteRecoveryMutationOptions {
  onSuccess?: () => void;
}
