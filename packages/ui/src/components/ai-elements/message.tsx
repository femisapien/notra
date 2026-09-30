"use client";

import {
  ArrowExpandDiagonal02Icon,
  Cancel01Icon,
  Copy01Icon,
  Download01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@notra/ui/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@notra/ui/components/ui/dropdown-menu";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@notra/ui/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { TABLE_CHROME_CLASS } from "@notra/ui/constants/table";

import type { UIMessage } from "ai";
import Image from "next/image";
import type { ComponentProps, HTMLAttributes, ReactElement } from "react";
import {
  createContext,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";
import { MESSAGE_CODE_PLUGINS } from "@notra/ui/constants/message-code";
import { MESSAGE_TEXT_ANIMATION } from "@notra/ui/constants/message-animation";
import {
  MESSAGE_TABLE_COPY_FORMATS,
  MESSAGE_TABLE_COPY_RESET_MS,
} from "@notra/ui/constants/message-table";
import {
  tableDataToCopyFormat,
  tableDataToCsv,
  tableDataToMarkdown,
} from "@notra/ui/lib/message-table";
import type {
  MessageTableCopyFormat,
  MessageTableData,
} from "@notra/ui/types/message-table";
import { useUiLabels } from "@notra/ui/components/shared/ui-labels-provider";
import { cn } from "@notra/ui/lib/utils";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] min-w-0 flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className,
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({
  children,
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(
      "is-user:dark flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden text-sm",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:w-full group-[.is-assistant]:text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);





interface MessageBranchContextType {
  currentBranch: number;
  totalBranches: number;
  goToPrevious: () => void;
  goToNext: () => void;
  branches: ReactElement[];
  setBranches: (branches: ReactElement[]) => void;
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(
  null,
);


export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number;
  onBranchChange?: (branchIndex: number) => void;
};


export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>;


export type MessageBranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};


export type MessageBranchPreviousProps = ComponentProps<typeof Button>;


export type MessageBranchNextProps = ComponentProps<typeof Button>;


export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>;


export type MessageResponseProps = Omit<
  ComponentProps<typeof Streamdown>,
  "animated"
>;

type MarkdownTableProps = ComponentProps<"table"> & {
  node?: unknown;
};

function readTableData(table: HTMLTableElement): MessageTableData {
  const headers = Array.from(table.querySelectorAll("thead th")).map(
    (cell) => cell.textContent?.trim() ?? "",
  );
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
  const fallbackRows =
    bodyRows.length > 0 ? bodyRows : Array.from(table.querySelectorAll("tr"));
  const rows = fallbackRows
    .map((row) =>
      Array.from(row.querySelectorAll("td")).map(
        (cell) => cell.textContent?.trim() ?? "",
      ),
    )
    .filter((row) => row.length > 0);

  if (headers.length > 0) {
    return { headers, rows };
  }

  const [firstRow, ...remainingRows] = rows;
  return {
    headers: firstRow ?? [],
    rows: remainingRows,
  };
}

async function writeClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return;
  }
  await navigator.clipboard.writeText(value);
}

function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function MessageMarkdownTable({
  children,
  className,
  node: _node,
  ...props
}: MarkdownTableProps) {
  const labels = useUiLabels();
  const formatLabels: Record<MessageTableCopyFormat, string> = {
    csv: labels.tableFormatCsv,
    markdown: labels.tableFormatMarkdown,
    plain: labels.tableFormatPlain,
  };
  const tableRef = useRef<HTMLTableElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyMenuOpen, setCopyMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const toolbarOpen = copyMenuOpen || downloadMenuOpen || copied;

  useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  const getData = () => {
    if (!tableRef.current) {
      return { headers: [], rows: [] };
    }
    return readTableData(tableRef.current);
  };

  const markCopied = () => {
    setCopied(true);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(
      () => setCopied(false),
      MESSAGE_TABLE_COPY_RESET_MS,
    );
  };

  const copyAs = async (format: MessageTableCopyFormat) => {
    await writeClipboard(tableDataToCopyFormat(getData(), format));
    markCopied();
  };

  const copyMarkdown = async () => {
    await copyAs("markdown");
  };

  const downloadCsv = () => {
    downloadText("table.csv", tableDataToCsv(getData()), "text/csv");
  };

  const downloadMarkdown = () => {
    downloadText("table.md", tableDataToMarkdown(getData()), "text/markdown");
  };

  const renderTable = () => (
    <div className="max-w-full overflow-x-auto">
      <table
        className={cn(
          "w-full min-w-max caption-bottom border-separate border-spacing-0 text-sm [&_thead_th:last-child]:pr-24",
          className,
        )}
        ref={tableRef}
        {...props}
      >
        {children}
      </table>
    </div>
  );

  return (
    <div
      className={cn(
        "group/table relative max-w-full",
        TABLE_CHROME_CLASS,
        toolbarOpen && "is-menu-open",
      )}
    >
      <div className="absolute top-1 right-1.5 z-10">
        <div
          className={cn(
            "flex items-center gap-1 rounded-md border bg-background/90 p-0.5 opacity-0 shadow-sm transition-opacity group-focus-within/table:opacity-100 group-hover/table:opacity-100 supports-[backdrop-filter]:bg-background/75 supports-[backdrop-filter]:backdrop-blur",
            toolbarOpen && "opacity-100",
          )}
        >
          <ContextMenu onOpenChange={setCopyMenuOpen}>
            <Tooltip>
              <ContextMenuTrigger
                render={
                  <TooltipTrigger
                    render={
                      <Button
                        onClick={() => {
                          copyMarkdown().catch(() => undefined);
                        }}
                        size="icon-xs"
                        variant="ghost"
                      />
                    }
                  />
                }
              >
                <HugeiconsIcon
                  className="size-3.5"
                  icon={copied ? Tick01Icon : Copy01Icon}
                />
                <span className="sr-only">{labels.copyTableAsMarkdown}</span>
              </ContextMenuTrigger>
              {copyMenuOpen ? null : (
                <TooltipContent>
                  {copied ? labels.copied : labels.copyTableAsMarkdown}
                </TooltipContent>
              )}
            </Tooltip>
            <ContextMenuContent className="w-44 min-w-44">
              {MESSAGE_TABLE_COPY_FORMATS.map((format) => (
                <ContextMenuItem
                  className="whitespace-nowrap"
                  key={format.id}
                  onClick={() => {
                    copyAs(format.id).catch(() => undefined);
                  }}
                >
                  <HugeiconsIcon
                    className="size-4"
                    icon={format.icon}
                    strokeWidth={2}
                  />
                  {formatLabels[format.id]}
                </ContextMenuItem>
              ))}
            </ContextMenuContent>
          </ContextMenu>
          <DropdownMenu
            onOpenChange={setDownloadMenuOpen}
            open={downloadMenuOpen}
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={<Button size="icon-xs" variant="ghost" />}
                  />
                }
              >
                <HugeiconsIcon icon={Download01Icon} className="size-3.5" />
                <span className="sr-only">{labels.downloadTable}</span>
              </TooltipTrigger>
              <TooltipContent>{labels.downloadTable}</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-44 min-w-44">
              <DropdownMenuItem
                className="whitespace-nowrap"
                onClick={downloadCsv}
              >
                {labels.tableFormatCsv}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="whitespace-nowrap"
                onClick={downloadMarkdown}
              >
                {labels.tableFormatMarkdown}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ResponsiveDialog>
            <Tooltip>
              <TooltipTrigger
                render={
                  <ResponsiveDialogTrigger
                    render={<Button size="icon-xs" variant="ghost" />}
                  />
                }
              >
                <HugeiconsIcon
                  icon={ArrowExpandDiagonal02Icon}
                  className="size-3.5"
                />
                <span className="sr-only">{labels.viewTableFullscreen}</span>
              </TooltipTrigger>
              <TooltipContent>{labels.viewTableFullscreen}</TooltipContent>
            </Tooltip>
            <ResponsiveDialogContent
              className="flex h-[min(calc(100vh-2rem),900px)] max-h-[calc(100vh-2rem)] max-w-[min(calc(100vw-2rem),1200px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),1200px)]"
              drawerClassName="h-[85svh] max-h-[85svh]"
              showCloseButton={false}
            >
              <ResponsiveDialogHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-2">
                <ResponsiveDialogTitle>{labels.table}</ResponsiveDialogTitle>
                <ResponsiveDialogClose
                  render={<Button size="icon-sm" variant="ghost" />}
                >
                  <HugeiconsIcon className="size-4" icon={Cancel01Icon} />
                  <span className="sr-only">{labels.close}</span>
                </ResponsiveDialogClose>
              </ResponsiveDialogHeader>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                <div className={TABLE_CHROME_CLASS}>{renderTable()}</div>
              </div>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>
      </div>
      {renderTable()}
    </div>
  );
}

function MessageTableHead({
  children,
  className,
  node: _node,
  ...props
}: ComponentProps<"thead"> & { node?: unknown }) {
  return (
    <TableHeader
      className={cn("[&_tr]:hover:bg-transparent", className)}
      {...props}
    >
      {children}
    </TableHeader>
  );
}

function MessageTableBody({
  children,
  className,
  node: _node,
  ...props
}: ComponentProps<"tbody"> & { node?: unknown }) {
  return (
    <TableBody className={className} {...props}>
      {children}
    </TableBody>
  );
}

function MessageTableRow({
  children,
  className,
  node: _node,
  ...props
}: ComponentProps<"tr"> & { node?: unknown }) {
  return (
    <TableRow className={className} {...props}>
      {children}
    </TableRow>
  );
}

export function MessageTableHeaderCell({
  children,
  className,
  node: _node,
  ...props
}: ComponentProps<"th"> & { node?: unknown }) {
  return (
    <TableHead className={className} {...props}>
      {children}
    </TableHead>
  );
}

export function MessageTableCell({
  children,
  className,
  node: _node,
  ...props
}: ComponentProps<"td"> & { node?: unknown }) {
  return (
    <TableCell className={className} {...props}>
      {children}
    </TableCell>
  );
}

function MessageLink({
  children,
  className,
  href,
  node: _node,
  rel,
  target,
  ...props
}: ComponentProps<"a"> & { node?: unknown }) {
  const isExternal = typeof href === "string" && /^https?:\/\//i.test(href);

  return (
    <a
      className={cn(
        "font-medium text-foreground underline underline-offset-3 transition-colors hover:text-foreground/80",
        className,
      )}
      href={href}
      rel={rel ?? (isExternal ? "noopener noreferrer" : undefined)}
      target={target ?? (isExternal ? "_blank" : undefined)}
      {...props}
    >
      {children}
    </a>
  );
}

const messageResponseComponents = {
  a: MessageLink,
  table: MessageMarkdownTable,
  thead: MessageTableHead,
  tbody: MessageTableBody,
  tr: MessageTableRow,
  th: MessageTableHeaderCell,
  td: MessageTableCell,
};

export const MessageResponse = memo(
  ({ className, components, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn(
        "message-response wrap-anywhere size-full min-w-0 max-w-full overflow-hidden break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:max-w-full [&_pre]:overflow-x-auto",
        className
      )}
      components={{ ...messageResponseComponents, ...components }}
      plugins={MESSAGE_CODE_PLUGINS}
      lineNumbers={false}
      {...props}
      animated={props.isAnimating ? MESSAGE_TEXT_ANIMATION : false}
    />
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.mode === nextProps.mode &&
    prevProps.isAnimating === nextProps.isAnimating
);

MessageResponse.displayName = "MessageResponse";
