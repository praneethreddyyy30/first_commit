import { NextRequest, NextResponse } from "next/server";
import { UserProfile, evaluateCedarPolicies } from "@/lib/cedar/evaluator";
import { getLiveGovernmentSchemesForProfile } from "@/lib/schemes/govSchemeService";
import { discoverLiveSchemesForProfile } from "@/lib/schemes/liveSchemeDiscoverer";

/**
 * POST /api/schemes/live-evaluate
 * Automatically fetches active schemes from the Government of India (myscheme.gov.in / API Setu)
 * and Amazon DynamoDB matching the citizen's demographic profile, then deterministically
 * evaluates AWS Cedar policies.
 *
 * ZERO SEARCH REQUIRED: Triggers automatically upon profile change.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const profile: UserProfile = body.profile;
    const shouldAutoDiscover: boolean = body.autoDiscover ?? true;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile is required in request body" },
        { status: 400 }
      );
    }

    // Step 1: Ingest live schemes matching the citizen's profile from official government APIs
    const activeSchemes = await getLiveGovernmentSchemesForProfile(profile);

    // Step 2: Optional background gazette scanner (Bedrock) if configured
    let discoveryResult;
    if (shouldAutoDiscover) {
      try {
        discoveryResult = await discoverLiveSchemesForProfile(profile);
      } catch (err) {
        console.warn("Gazette scanner skipped or failed:", err);
      }
    }

    // Step 3: Run AWS Cedar Policy Deterministic Evaluator
    const evaluationResults = evaluateCedarPolicies(profile, activeSchemes);
    const eligibleCount = evaluationResults.filter((r) => r.decision === "ALLOW").length;

    return NextResponse.json({
      success: true,
      dataSource: "OFFICIAL_MYSCHEME_GOV_IN",
      portal: "https://www.myscheme.gov.in",
      lastSyncedAt: new Date().toISOString(),
      totalSchemes: activeSchemes.length,
      eligibleCount,
      evaluationResults,
      allSchemes: activeSchemes,
      newlyDiscovered: discoveryResult?.newlyDiscovered || []
    });
  } catch (error: unknown) {
    console.error("Live evaluation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to execute live scheme evaluation"
      },
      { status: 500 }
    );
  }
}
