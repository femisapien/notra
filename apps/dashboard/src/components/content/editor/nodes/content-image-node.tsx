"use client";

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $applyNodeReplacement, DecoratorNode } from "lexical";
import type { JSX } from "react";

export interface SerializedContentImageNode extends Spread<
  {
    altText: string;
    src: string;
  },
  SerializedLexicalNode
> {}

function isSafeContentImageSrc(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) {
    return !src.includes("\\") && !src.includes(" ");
  }
  try {
    const url = new URL(src);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function $convertImageElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  if (!(domNode instanceof HTMLImageElement)) {
    return null;
  }
  const src = domNode.getAttribute("src") ?? "";
  if (!isSafeContentImageSrc(src)) {
    return null;
  }
  return {
    node: $createContentImageNode({
      altText: domNode.alt,
      src,
    }),
  };
}

export class ContentImageNode extends DecoratorNode<JSX.Element> {
  __altText: string;
  __src: string;

  static getType(): string {
    return "content-image";
  }

  static clone(node: ContentImageNode): ContentImageNode {
    return new ContentImageNode(node.__src, node.__altText, node.__key);
  }

  static importJSON(
    serializedNode: SerializedContentImageNode
  ): ContentImageNode {
    return $createContentImageNode({
      altText: serializedNode.altText,
      src: serializedNode.src,
    });
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  exportJSON(): SerializedContentImageNode {
    return {
      altText: this.__altText,
      src: this.__src,
      type: "content-image",
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement("img");
    img.setAttribute("src", this.__src);
    img.setAttribute("alt", this.__altText);
    return { element: img };
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const figure = document.createElement("figure");
    figure.className = "content-editor-image my-6";
    return figure;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      // User content can be an R2 host or a same-origin upload. next/image
      // only allows configured remote hosts, so the editor uses a plain image.
      // biome-ignore lint/performance/noImgElement: remote content images are not limited to next/image hosts
      <img
        alt={this.__altText}
        className="max-h-[32rem] w-full rounded-md object-contain"
        draggable={false}
        src={this.__src}
      />
    );
  }
}

export function $createContentImageNode(params: {
  altText: string;
  src: string;
}): ContentImageNode {
  if (!isSafeContentImageSrc(params.src)) {
    throw new Error("Image URL is not allowed");
  }
  return $applyNodeReplacement(
    new ContentImageNode(params.src, params.altText.replace(/[\r\n]/g, " "))
  );
}

export function $isContentImageNode(
  node: LexicalNode | null | undefined
): node is ContentImageNode {
  return node instanceof ContentImageNode;
}
