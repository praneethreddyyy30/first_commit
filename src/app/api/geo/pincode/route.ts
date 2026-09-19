import { NextRequest, NextResponse } from "next/server";
import { lookupPincode } from "@/lib/geo/pincodeService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get("pincode");

    if (!pincode) {
      return NextResponse.json(
        { error: "Query parameter 'pincode' is required" },
        { status: 400 }
      );
    }

    const result = await lookupPincode(pincode);

    return NextResponse.json({
      success: result.success,
      data: result,
      source: "India Post National Directory API (api.postalpincode.in)",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to lookup pincode",
      },
      { status: 500 }
    );
  }
}
