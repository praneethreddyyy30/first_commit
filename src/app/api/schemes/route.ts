import { NextRequest, NextResponse } from "next/server";
import {
  fetchAllSchemesFromCloud,
  saveSchemeToCloud,
  bulkSaveSchemesToCloud
} from "@/lib/dynamodb/dynamoSchemeStore";
import { SchemeOrService } from "@/data/schemes";
import {
  fetchRawSchemeDetails,
  fetchRawSchemeDocuments
} from "@/lib/schemes/govSchemeService";
import { normalizeGovScheme } from "@/lib/schemes/schemeNormalizer";

/**
 * GET /api/schemes
 * Returns active schemes from Amazon DynamoDB or live fetches from myscheme.gov.in by slug
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stateFilter = searchParams.get("state") || undefined;
    const slug = searchParams.get("slug");

    // If requesting a specific scheme by slug, fetch directly from government API if needed
    if (slug) {
      const cloudData = await fetchAllSchemesFromCloud();
      const existing = cloudData.schemes.find(
        (s) => s.id.toLowerCase() === slug.toLowerCase()
      );
      if (existing) {
        return NextResponse.json({ success: true, source: cloudData.source, scheme: existing });
      }

      const raw = await fetchRawSchemeDetails(slug);
      if (raw) {
        const rawDocs = await fetchRawSchemeDocuments(raw._id);
        const normalized = normalizeGovScheme(raw, rawDocs || undefined);
        await saveSchemeToCloud(normalized);
        return NextResponse.json({
          success: true,
          source: "OFFICIAL_MYSCHEME_GOV_IN",
          scheme: normalized
        });
      }
    }

    const cloudData = await fetchAllSchemesFromCloud(stateFilter);

    return NextResponse.json({
      success: true,
      source: cloudData.source,
      tableName: cloudData.tableName,
      lastSyncedAt: cloudData.lastSyncedAt,
      totalCount: cloudData.totalCount,
      schemes: cloudData.schemes
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to retrieve schemes from cloud database"
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/schemes
 * Dynamic cloud ingestion endpoint for API Setu webhooks, DynamoDB streams, or administrative updates.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scheme, schemes } = body;

    if (schemes && Array.isArray(schemes)) {
      const result = await bulkSaveSchemesToCloud(schemes);
      return NextResponse.json({
        success: true,
        message: `Successfully ingested ${result.count} scheme(s) into ${result.source}.`,
        source: result.source
      });
    }

    if (scheme && scheme.id && scheme.title) {
      const result = await saveSchemeToCloud(scheme as SchemeOrService);
      return NextResponse.json({
        success: true,
        message: `Scheme ${scheme.shortCode || scheme.id} registered into ${result.source}.`,
        scheme,
        source: result.source
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request payload. Expected 'scheme' object or 'schemes' array."
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Internal server error during scheme ingestion"
      },
      { status: 500 }
    );
  }
}
