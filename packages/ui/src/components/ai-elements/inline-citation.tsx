"use client";

import {
  Carousel,
  type CarouselApi,
} from "@notra/ui/components/ui/carousel";
import {
  type ComponentProps,
  createContext,
} from "react";











const CarouselApiContext = createContext<CarouselApi | undefined>(undefined);


export type InlineCitationCarouselProps = ComponentProps<typeof Carousel>;








export type InlineCitationCarouselIndexProps = ComponentProps<"div">;


export type InlineCitationCarouselPrevProps = ComponentProps<"button">;


export type InlineCitationCarouselNextProps = ComponentProps<"button">;
