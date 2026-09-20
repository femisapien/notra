"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  FAQ_ASSISTANT_COPY,
  FAQ_ASSISTANT_ENDPOINT,
} from "@/constants/landing/faq-assistant";
import type { FaqAssistantStatus } from "@/types/landing/faq-assistant";

const RATE_LIMITED_STATUS = 429;
const OFF_TOPIC_STATUS = 422;

function messageForStatus(status: number): string {
  if (status === RATE_LIMITED_STATUS) {
    return FAQ_ASSISTANT_COPY.rateLimited;
  }
  if (status === OFF_TOPIC_STATUS) {
    return FAQ_ASSISTANT_COPY.offTopic;
  }
  return FAQ_ASSISTANT_COPY.unavailable;
}

export function useFaqAssistant() {
  const [status, setStatus] = useState<FaqAssistantStatus>("idle");
  const [answer, setAnswer] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const ask = useCallback(async (question: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setAnswer("");
    setStatus("loading");

    try {
      const response = await fetch(FAQ_ASSISTANT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      });

      if (!(response.ok && response.body)) {
        setAnswer(messageForStatus(response.status));
        setStatus("done");
        return;
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader();
      let text = "";
      setStatus("streaming");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        text += value;
        setAnswer(text);
      }

      if (!text.trim()) {
        setAnswer(FAQ_ASSISTANT_COPY.unavailable);
      }
      setStatus("done");
    } catch {
      if (controller.signal.aborted) {
        return;
      }
      setAnswer(FAQ_ASSISTANT_COPY.unavailable);
      setStatus("done");
    }
  }, []);

  return { answer, ask, status };
}
