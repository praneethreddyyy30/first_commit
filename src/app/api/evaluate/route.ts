import { NextRequest, NextResponse } from "next/server";
import { evaluateCedarPolicies, UserProfile } from "@/lib/cedar/evaluator";
import { globalSchemeRegistry } from "@/lib/schemes/schemeRegistry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;

    if (!profile) {
      return NextResponse.json({ error: "Missing profile in request body" }, { status: 400 });
    }

    const results = evaluateCedarPolicies(profile, globalSchemeRegistry.getAllSchemes());
    const eligibleCount = results.filter(r => r.decision === "ALLOW").length;

    return NextResponse.json({
      success: true,
      eligibleCount,
      totalEvaluated: results.length,
      evaluatorEngine: "AWS Cedar Deterministic Policy Engine (Wasm/TypeScript)",
      results
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: (error as Error)?.message || "Internal server error"
    }, { status: 500 });
  }
}
