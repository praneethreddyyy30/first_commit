import { NextRequest, NextResponse } from "next/server";
import { SchemeOrService } from "@/data/schemes";
import {
  fetchAllSchemesFromCloud,
  saveSchemeToCloud,
  bulkSaveSchemesToCloud
} from "@/lib/dynamodb/dynamoSchemeStore";
import {
  fetchRawSchemeDetails,
  fetchRawSchemeDocuments
} from "@/lib/schemes/govSchemeService";
import { normalizeGovScheme } from "@/lib/schemes/schemeNormalizer";
import { getSchemesFromDynamoDB, isDynamoDbConfigured, saveSchemeToDynamoDB } from "@/lib/dynamodb";
import { globalSchemeRegistry } from "@/lib/schemes/schemeRegistry";

/**
 * GET /api/schemes
 * Returns active schemes with live government API fallback & DynamoDB cloud support
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
        if (isDynamoDbConfigured()) {
          await saveSchemeToDynamoDB(normalized);
        }
        return NextResponse.json({
          success: true,
          source: "OFFICIAL_MYSCHEME_GOV_IN",
          scheme: normalized
        });
      }
    }

    let schemes: SchemeOrService[] | null = null;
    let dataSource = "Scheme Registry (In-Memory Baseline)";

    if (isDynamoDbConfigured()) {
      schemes = await getSchemesFromDynamoDB();
      if (schemes && schemes.length > 0) {
        dataSource = "Amazon DynamoDB (Table: JanSetuSchemes)";
      }
    }

    if (!schemes || schemes.length === 0) {
      const cloudData = await fetchAllSchemesFromCloud(stateFilter);
      if (cloudData && cloudData.schemes && cloudData.schemes.length > 0) {
        schemes = cloudData.schemes;
        dataSource = cloudData.source;
      } else {
        schemes = globalSchemeRegistry.getAllSchemes();
      }
    }

    const metadata = {
      ...globalSchemeRegistry.getSyncMetadata(),
      dataSource,
      dynamoDbActive: isDynamoDbConfigured(),
    };

    return NextResponse.json({
      success: true,
      source: dataSource,
      metadata,
      totalCount: schemes.length,
      schemes,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to retrieve schemes",
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
      globalSchemeRegistry.bulkRegisterSchemes(schemes);
      if (isDynamoDbConfigured()) {
        for (const s of schemes) {
          await saveSchemeToDynamoDB(s);
        }
      }
      return NextResponse.json({
        success: true,
        message: `Successfully ingested ${result.count || schemes.length} scheme(s) into ${result.source}.`,
        source: result.source,
        metadata: globalSchemeRegistry.getSyncMetadata(),
      });
    }

    if (scheme && scheme.id && scheme.title) {
      const result = await saveSchemeToCloud(scheme as SchemeOrService);
      const regResult = globalSchemeRegistry.registerOrUpdateScheme(scheme as SchemeOrService);
      if (isDynamoDbConfigured()) {
        await saveSchemeToDynamoDB(scheme as SchemeOrService);
      }
      return NextResponse.json({
        success: true,
        isNew: regResult.isNew,
        message: `Scheme ${scheme.shortCode || scheme.id} registered into ${result.source}.`,
        scheme: regResult.scheme || scheme,
        source: result.source,
        metadata: globalSchemeRegistry.getSyncMetadata(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid request payload. Expected 'scheme' object or 'schemes' array.",
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Internal server error during scheme ingestion",
      },
      { status: 500 }
    );
  }
}
