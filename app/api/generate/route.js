import { GoogleGenAI } from '@google/genai';

export async function POST(req) {
  try {
    const data = await req.json();
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // We inject the exact numbers the user clicked on the website!
    const prompt = `You are a strict, expert AI tutor. 

    FIRST, if any image is provided and it is too blurry to read, reply EXACTLY with "IMAGE_UNCLEAR" and nothing else.

    QUESTION GENERATION RULES:
    - You MUST generate EXACTLY ${data.numMCQ} Multiple Choice Questions.
    - You MUST generate EXACTLY ${data.numQnA} Short Answer Questions.
    - TOTAL QUESTIONS: ${data.numMCQ + data.numQnA}.
    - If the provided text/images are too short, you MUST use your general knowledge of the subject to invent highly relevant questions until you reach the exact counts requested. Do not stop early.

    CRITICAL FORMATTING RULES:
    - NO MATH CODE: Do NOT use LaTeX formatting. Write math as plain readable text (e.g., F = m * a).
    - THE SEPARATOR: After the final question, you MUST write this exact phrase on a brand new line to separate the quiz from the answers:
    ---ANSWER_KEY---
    - Below the separator, list all answers clearly.

    User Text: ${data.notes || "No text provided."}`;

    const contents = [prompt];

    if (data.images && data.images.length > 0) {
      data.images.forEach((img) => {
        contents.push({
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType
          }
        });
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    return new Response(JSON.stringify({ result: response.text }), { status: 200 });
  } catch (error) {
    console.error("🔥 THE REAL ERROR IS:", error); 
    return new Response(JSON.stringify({ error: "Failed to generate quiz." }), { status: 500 });
  }
}