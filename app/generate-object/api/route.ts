import { openai } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

const notificationSchema = z.object({
  notifications: z.array(
    z.object({
      name: z.string().describe("Name of a fictional person."),
      message: z.string().describe("Do not use emojis or links."),
      minutesAgo: z.number(),
    }),
  ),
});

export type Notifications = z.infer<typeof notificationSchema>;

export async function POST(req: Request) {
  const { prompt }: { prompt: string } = await req.json();

  const result = await generateText({
    model: openai("gpt-5-nano"),
    instructions: "You generate three notifications for a messages app.",
    prompt,
    output: Output.object({
      schema: notificationSchema,
    }),
  });

  return Response.json(result.output);
}
