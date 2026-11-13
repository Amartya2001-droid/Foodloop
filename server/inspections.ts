import OpenAI from "openai";
import { z } from "zod";
export const inspectionSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(2000),
  category: z.enum([
    "produce",
    "bakery",
    "dairy",
    "prepared",
    "packaged",
    "other",
  ]),
  quantity: z.string().min(1).max(100),
  defectsDetected: z.array(z.string().max(200)).max(20),
});
export async function inspectImage(bytes: Buffer, mime: string) {
  if (!process.env.OPENAI_API_KEY) throw new Error("AI_NOT_CONFIGURED");
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    ...(process.env.OPENAI_BASE_URL
      ? { baseURL: process.env.OPENAI_BASE_URL }
      : {}),
    timeout: 20000,
    maxRetries: 0,
  });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe visible food only. Return JSON with title, description, category (produce/bakery/dairy/prepared/packaged/other), quantity and defectsDetected (array of strings). Do not claim safety, certification, precise freshness, shelf life or confidence. State uncertainty in description.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${bytes.toString("base64")}`,
            },
          },
        ],
      },
    ],
    max_tokens: 500,
  });
  return inspectionSchema.parse(
    JSON.parse(response.choices[0]?.message.content ?? ""),
  );
}
