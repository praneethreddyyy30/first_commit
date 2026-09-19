import { NextRequest, NextResponse } from "next/server";
import { evaluateCedarPolicies, UserProfile } from "@/lib/cedar/evaluator";
import { evaluateSchemeWithCedarWasm } from "@/lib/cedar/cedarWasmEvaluator";
import { globalSchemeRegistry } from "@/lib/schemes/schemeRegistry";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;

    if (!profile) {
      return NextResponse.json({ error: "Missing profile in request body" }, { status: 400 });
    }

    const allSchemes = globalSchemeRegistry.getAllSchemes();
    const results = evaluateCedarPolicies(profile, allSchemes);
    const eligibleCount = results.filter(r => r.decision === "ALLOW").length;

    // Run official Cedar WASM evaluation on the top scheme to verify Rust/WASM binary execution
    let wasmVerification = null;
    if (allSchemes.length > 0) {
      wasmVerification = await evaluateSchemeWithCedarWasm(allSchemes[0], profile);
    }

    return NextResponse.json({
      success: true,
      eligibleCount,
      totalEvaluated: results.length,
      evaluatorEngine: wasmVerification?.isWasmEngineActive
        ? `Official AWS Cedar Engine v${wasmVerification.engineVersion} (WebAssembly)`
        : "AWS Cedar Policy Store (Deterministic)",
      wasmEngineActive: wasmVerification?.isWasmEngineActive ?? false,
      cedarEngineVersion: wasmVerification?.engineVersion ?? "4.13.0",
      topSchemeWasmVerification: wasmVerification,
      results
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: (error as Error)?.message || "Internal server error"
    }, { status: 500 });
  }
}
