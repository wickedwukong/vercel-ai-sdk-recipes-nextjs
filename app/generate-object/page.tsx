"use client";

import { useState } from "react";
import type { Notifications } from "./api/route";
import { sendMessage } from "next/dist/client/dev/hot-reloader/pages/websocket";

export default function Page() {
  const [generation, setGeneration] = useState<Notifications>();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={isLoading}
        onClick={async () => {
          setIsLoading(true);

          const response = await fetch("/generate-object/api", {
            method: "POST",
            body: JSON.stringify({
              prompt: "Messages during finals week.",
            }),
          });

          const json: Notifications = await response.json();

          setGeneration(json);
          setIsLoading(false);
        }}
      >
        Generate
      </button>

      {isLoading ? "Loading..." : <pre>{JSON.stringify(generation, null, 2)}</pre>}
    </div>
  );
}
