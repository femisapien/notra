import { cn } from "cn";

import type { OpencodeLogoProps } from "../../types/brainless-opencode";

export function OpencodeLogo({ className, scale = 1 }: OpencodeLogoProps) {
  return (
    <svg
      aria-label="OpenCode"
      className={cn("block", className)}
      height={42 * scale}
      role="img"
      shapeRendering="crispEdges"
      viewBox="0 0 234 42"
      width={234 * scale}
    >
      <path
        d="M18 30H6V18H18V30Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M18 12H6V30H18V12ZM24 36H0V6H24V36Z"
        className="fill-[#656363] dark:fill-[#b7b1b1]"
      />
      <path
        d="M48 30H36V18H48V30Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M36 30H48V12H36V30ZM54 36H36V42H30V6H54V36Z"
        className="fill-[#656363] dark:fill-[#b7b1b1]"
      />
      <path
        d="M84 24V30H66V24H84Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M84 24H66V30H84V36H60V6H84V24ZM66 18H78V12H66V18Z"
        className="fill-[#656363] dark:fill-[#b7b1b1]"
      />
      <path
        d="M108 36H96V18H108V36Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M108 12H96V36H90V6H108V12ZM114 36H108V12H114V36Z"
        className="fill-[#656363] dark:fill-[#b7b1b1]"
      />
      <path
        d="M144 30H126V18H144V30Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M144 12H126V30H144V36H120V6H144V12Z"
        className="fill-[#211e1e] dark:fill-[#f1ecec]"
      />
      <path
        d="M168 30H156V18H168V30Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M168 12H156V30H168V12ZM174 36H150V6H174V36Z"
        className="fill-[#211e1e] dark:fill-[#f1ecec]"
      />
      <path
        d="M198 30H186V18H198V30Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M198 12H186V30H198V12ZM204 36H180V6H198V0H204V36Z"
        className="fill-[#211e1e] dark:fill-[#f1ecec]"
      />
      <path
        d="M234 24V30H216V24H234Z"
        className="fill-[#cfcecd] dark:fill-[#4b4646]"
      />
      <path
        d="M216 12V18H228V12H216ZM234 24H216V30H234V36H210V6H234V24Z"
        className="fill-[#211e1e] dark:fill-[#f1ecec]"
      />
    </svg>
  );
}
