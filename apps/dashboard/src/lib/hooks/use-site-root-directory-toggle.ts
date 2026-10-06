import { useState } from "react";

import type { SiteRootDirectoryToggleProps } from "@/types/components/sites";

/**
 * Most repositories keep notra.json at the root, so the folder field stays
 * hidden until the switch says otherwise. A folder already set (or prefilled
 * from the repository scan) keeps it open; switching off clears it.
 */
export function useSiteRootDirectoryToggle(
  rootDirectory: string,
  onRootDirectoryChange: (value: string) => void
): SiteRootDirectoryToggleProps {
  const [opened, setOpened] = useState(false);
  return {
    checked: opened || rootDirectory.trim().length > 0,
    onCheckedChange: (next) => {
      setOpened(next);
      if (!next) {
        onRootDirectoryChange("");
      }
    },
  };
}
