import { NextRequest, NextResponse } from "next/server";
import { globalSchemeRegistry } from "@/lib/schemes/schemeRegistry";
import { SchemeOrService } from "@/data/schemes";
import { getSchemesFromDynamoDB, isDynamoDbConfigured, saveSchemeToDynamoDB } from "@/lib/dynamodb";

/**
 * GET /api/schemes
 * Returns all active schemes (Amazon DynamoDB priority with baseline registry fallback)
 */
export async function GET() {
  try {
    let schemes = null;
    let dataSource = "Scheme Registry (In-Memory Baseline)";

    if (isDynamoDbConfigured()) {
      schemes = await getSchemesFromDynamoDB();
      if (schemes && schemes.length > 0) {
        dataSource = "Amazon DynamoDB (Table: JanSetuSchemes)";
      }
    }

    if (!schemes || schemes.length === 0) {
      schemes = globalSchemeRegistry.getAllSchemes();
    }

    const metadata = {
      ...globalSchemeRegistry.getSyncMetadata(),
      dataSource,
      dynamoDbActive: isDynamoDbConfigured(),
    };

    return NextResponse.json({
      success: true,
      metadata,
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
 * Dynamic ingestion endpoint for API Setu webhooks, DynamoDB streams, or administrative updates.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scheme, schemes } = body;

    if (schemes && Array.isArray(schemes)) {
      const result = globalSchemeRegistry.bulkRegisterSchemes(schemes);
      // If DynamoDB is active, persist schemes there too
      if (isDynamoDbConfigured()) {
        for (const s of schemes) {
          await saveSchemeToDynamoDB(s);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully ingested ${result.added} new and updated ${result.updated} schemes.`,
        metadata: globalSchemeRegistry.getSyncMetadata(),
      });
    }

    if (scheme && scheme.id && scheme.title) {
      const result = globalSchemeRegistry.registerOrUpdateScheme(scheme as SchemeOrService);
      if (isDynamoDbConfigured()) {
        await saveSchemeToDynamoDB(scheme as SchemeOrService);
      }

      return NextResponse.json({
        success: true,
        isNew: result.isNew,
        message: `Scheme ${scheme.shortCode || scheme.id} ${result.isNew ? "registered" : "updated"} successfully.`,
        scheme: result.scheme,
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
        error: (error as Error)?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
