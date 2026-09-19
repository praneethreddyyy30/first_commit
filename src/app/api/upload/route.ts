import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucketName = process.env.S3_BUCKET_NAME || "jansetu-citizen-dossiers";

function isS3Configured(): boolean {
  return Boolean(
    accessKeyId &&
    secretAccessKey &&
    !accessKeyId.includes("your-access-key") &&
    accessKeyId.trim().length > 10
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, documentType, citizenId } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    const sanitizedCitizen = (citizenId || "citizen").replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const objectKey = `dossiers/${sanitizedCitizen}/${documentType || "general"}/${Date.now()}-${sanitizedFileName}`;

    if (isS3Configured()) {
      const s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: accessKeyId!.trim(),
          secretAccessKey: secretAccessKey!.trim(),
          ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN.trim() } : {}),
        },
      });

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: fileType,
        Metadata: {
          citizenId: sanitizedCitizen,
          documentType: documentType || "verification_doc",
        },
      });

      // Pre-signed URL valid for 15 minutes (900 seconds)
      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

      return NextResponse.json({
        success: true,
        mode: "AWS_S3_PRESIGNED",
        uploadUrl,
        objectKey,
        bucket: bucketName,
        storageTier: "Amazon S3 Standard (Zero-Trust Citizen Vault)",
        expiresInSeconds: 900,
      });
    }

    // Local / Offline Simulated Pre-Flight Vault Mode
    return NextResponse.json({
      success: true,
      mode: "LOCAL_VAULT_STANDBY",
      uploadUrl: `/api/upload/mock?key=${encodeURIComponent(objectKey)}`,
      objectKey,
      bucket: bucketName,
      storageTier: "Local In-Memory Cache (AWS S3 credentials pending in .env.local)",
      message: "Ready to switch to Amazon S3 instantly once credentials are added.",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: (error as Error)?.message || "Failed to generate upload URL",
      },
      { status: 500 }
    );
  }
}
