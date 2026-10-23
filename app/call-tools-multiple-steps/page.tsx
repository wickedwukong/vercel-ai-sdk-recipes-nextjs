"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";
import type { ChatMessage } from "./api/route";

export default function Page() {
  const [input, setInput] = useState("");

  const { messages, sendMessage } = useChat<ChatMessage>({
    transport: new DefaultChatTransport({
      api: "/call-tools-multiple-steps/api",
    }),
  });

  return (
    <div>
      <input
        className="border"
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
        }}
        onKeyDown={async (event) => {
          if (event.key === "Enter") {
            sendMessage({
              text: input,
            });
            setInput("");
          }
        }}
      />

      {messages.map((message, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: kept as in the AI SDK docs
        <div key={index}>
          {/* biome-ignore lint/suspicious/useIterableCallbackReturn: kept as in the AI SDK docs */}
          {message.parts.map((part, i) => {
            switch (part.type) {
              case "text":
                return <div key={`${message.id}-text`}>{part.text}</div>;
              case "tool-getLocation":
              case "tool-getWeather":
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: kept as in the AI SDK docs
                  <div key={`${message.id}-weather-${i}`}>{JSON.stringify(part, null, 2)}</div>
                );
            }
          })}
        </div>
      ))}
    </div>
  );
}
