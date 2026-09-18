import { NextRequest, NextResponse } from "next/server";
import { globalSchemeRegistry } from "@/lib/schemes/schemeRegistry";

/**
 * POST /api/schemes/sync
 * Connects to API Setu & National Public Data Exchange to pull newly gazetted schemes
 * or apply updated eligibility criteria.
 */
export async function POST(req: NextRequest) {
  try {
    let forceRefresh = false;
    let externalEndpoint: string | undefined;

    try {
      const body = await req.json();
      forceRefresh = !!body.forceRefresh;
      externalEndpoint = body.externalEndpoint;
    } catch {
      // Empty body is acceptable
    }

    // Execute sync through registry (connects to upstream API Setu gateway)
    const syncResult = globalSchemeRegistry.syncWithApiSetu();
    const metadata = globalSchemeRegistry.getSyncMetadata();

    return NextResponse.json({
      success: true,
      message: syncResult.newlyAdded.length > 0
        ? `Sync successful: ${syncResult.newlyAdded.length} newly gazetted scheme(s) ingested from API Setu.`
        : "Sync successful: All 24+ schemes are verified up-to-date with API Setu.",
      newlyAddedSchemes: syncResult.newlyAdded.map(s => ({
        id: s.id,
        title: s.title,
        shortCode: s.shortCode,
        ministry: s.ministry,
        benefitAmount: s.benefitAmount,
        cedarPolicyCode: s.cedarPolicyCode
      })),
      metadata,
      allSchemes: globalSchemeRegistry.getAllSchemes()
    });
  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: (error as Error)?.message || "Failed to sync with API Setu"
    }, { status: 500 });
  }
}
