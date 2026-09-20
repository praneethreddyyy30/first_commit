import { NextRequest } from "next/server";
import { POST as extractDocumentHandler } from "../extract-document/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  return extractDocumentHandler(req);
}
