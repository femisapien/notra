"use client";

import type { ReactNode } from "react";
import { createContext, useMemo } from "react";
import type { DropEvent, DropzoneOptions, FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { buttonVariants } from "@notra/ui/components/ui/button";
import { cn } from "@notra/ui/lib/utils";

type DropzoneContextType = {
  src?: File[];
  accept?: DropzoneOptions["accept"];
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  maxFiles?: DropzoneOptions["maxFiles"];
};


const DropzoneContext = createContext<DropzoneContextType | undefined>(
  undefined,
);

export type DropzoneProps = Omit<DropzoneOptions, "onDrop"> & {
  src?: File[];
  className?: string;
  onDrop?: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void;
  children?: ReactNode;
};

export const Dropzone = ({
  accept,
  maxFiles = 1,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  src,
  className,
  children,
  ...props
}: DropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles,
    maxSize,
    minSize,
    onError,
    disabled,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        const message = fileRejections.at(0)?.errors.at(0)?.message;
        onError?.(new Error(message));
      }

      onDrop?.(acceptedFiles, fileRejections, event);
    },
    ...props,
  });

  const contextValue = useMemo(
    () => ({ src, accept, maxSize, minSize, maxFiles }),
    [src, accept, maxSize, minSize, maxFiles],
  );

  return (
    <DropzoneContext.Provider value={contextValue}>
      <div
        className={cn(
          buttonVariants({ variant: "outline" }),
          "relative h-auto w-full cursor-pointer flex-col overflow-hidden p-8",
          isDragActive && "outline-none ring-1 ring-ring",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        {...getRootProps()}
      >
        <input {...getInputProps()} disabled={disabled} />
        {children}
      </div>
    </DropzoneContext.Provider>
  );
};
