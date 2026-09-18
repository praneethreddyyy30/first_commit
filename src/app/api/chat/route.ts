import { NextRequest, NextResponse } from "next/server";
import { askJanSetuCopilot, ChatMessage } from "@/lib/bedrock/bedrockClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body.query;
    const history: ChatMessage[] = body.history || [];
    const language: "en" | "hi" | "te" | "or" = body.language || "en";
    const customCredentials = body.customCredentials;
    const profile = body.profile;
    const evaluationResults = body.evaluationResults;
    const targetSchemeId = body.targetSchemeId;
    const auditResult = body.auditResult;
    const auditInput = body.auditInput;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = await askJanSetuCopilot(
      query,
      history,
      language,
      customCredentials,
      { profile, evaluationResults, targetSchemeId, auditResult, auditInput }
    );

    return NextResponse.json({
      success: true,
      ...response
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: (error as Error)?.message || "Failed to process chat query"
    }, { status: 500 });
  }
}
