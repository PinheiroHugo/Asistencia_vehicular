import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const classificationSchema = z.object({
  tags: z.array(z.string()).describe("List of 3-5 relevant tags for the workshop (e.g., 'Mecánica General', 'Gomería', 'Electricidad')"),
  improvedDescription: z.string().describe("A professional, polished version of the workshop description, highlighting key services."),
});

export async function classifyWorkshop(rawDescription: string) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: classificationSchema,
      prompt: `
        You are an expert automotive consultant. 
        Analyze the following workshop description provided by an owner:
        "${rawDescription}"

        1. Generate 3-5 specific tags that categorize the services offered.
        2. Rewrite the description to be professional, trustworthy, and clear for potential customers. 
           Keep it under 300 characters.
           The output must be in Spanish.
      `,
    });

    return object;
  } catch (error) {
    console.error("Error classifying workshop:", error);
    // Fallback if AI fails
    return {
      tags: ["Taller General"],
      improvedDescription: rawDescription,
    };
  }
}
