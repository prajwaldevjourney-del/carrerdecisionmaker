import { NextRequest, NextResponse } from "next/server";
import { parsePdfBuffer } from "@/lib/pdfParser";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Step 1: raw PDF text
    let rawText = "";
    try {
      rawText = await parsePdfBuffer(buffer);
    } catch (e) {
      return NextResponse.json({ step: "pdf_parse", error: String(e) }, { status: 422 });
    }

    const textLength = rawText.trim().length;
    const textPreview = rawText.slice(0, 500);

    // Step 2: try Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ step: "no_api_key", textLength, textPreview });

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0, maxOutputTokens: 200 },
        });
        const result = await model.generateContent(`Say "OK ${modelName}" and nothing else.`);
        const reply = result.response.text().trim();
        return NextResponse.json({
          status: "gemini_ok",
          model: modelName,
          reply,
          textLength,
          textPreview,
        });
      } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        const msg = e?.message ?? String(e);
        if (msg.includes("429") || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
        return NextResponse.json({ step: `gemini_${modelName}`, error: msg.slice(0, 300), textLength, textPreview });
      }
    }

    return NextResponse.json({ status: "all_models_rate_limited", textLength, textPreview });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
