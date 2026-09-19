import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { SchemeOrService } from "@/data/schemes";

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.AWS_ENDPOINT_URL || process.env.DYNAMODB_ENDPOINT;

export const SCHEMES_TABLE = process.env.DYNAMODB_SCHEMES_TABLE || "JanSetuSchemes";
export const DOSSIERS_TABLE = process.env.DYNAMODB_DOSSIERS_TABLE || "JanSetuDossiers";

export function isDynamoDbConfigured(): boolean {
  return Boolean(
    accessKeyId &&
    secretAccessKey &&
    !accessKeyId.includes("your-access-key") &&
    accessKeyId.trim().length > 10
  );
}

// Create base DynamoDB client with either AWS Cloud or LocalStack
const rawClient = new DynamoDBClient({
  region,
  ...(endpoint ? { endpoint } : {}),
  ...(isDynamoDbConfigured()
    ? {
        credentials: {
          accessKeyId: accessKeyId!.trim(),
          secretAccessKey: secretAccessKey!.trim(),
          ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN.trim() } : {}),
        },
      }
    : {}),
});

export const dynamoDocClient = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

/**
 * Fetch all schemes from DynamoDB table
 */
export async function getSchemesFromDynamoDB(): Promise<SchemeOrService[] | null> {
  if (!isDynamoDbConfigured() && !endpoint) {
    return null;
  }

  try {
    const cmd = new ScanCommand({ TableName: SCHEMES_TABLE });
    const res = await dynamoDocClient.send(cmd);
    if (res.Items && res.Items.length > 0) {
      return res.Items as SchemeOrService[];
    }
    return null;
  } catch (err) {
    console.warn("DynamoDB scan error (falling back to baseline catalog):", (err as Error)?.message);
    return null;
  }
}

/**
 * Save or update a single scheme in DynamoDB
 */
export async function saveSchemeToDynamoDB(scheme: SchemeOrService): Promise<boolean> {
  if (!isDynamoDbConfigured() && !endpoint) return false;

  try {
    const cmd = new PutCommand({
      TableName: SCHEMES_TABLE,
      Item: scheme,
    });
    await dynamoDocClient.send(cmd);
    return true;
  } catch (err) {
    console.warn("DynamoDB put error:", (err as Error)?.message);
    return false;
  }
}

/**
 * Save citizen dossier audit & readiness state to DynamoDB
 */
export async function saveDossierToDynamoDB(dossier: {
  dossierId: string;
  citizenName: string;
  schemeId: string;
  overallScore: number;
  updatedAt: string;
  status: string;
  data: unknown;
}): Promise<boolean> {
  if (!isDynamoDbConfigured() && !endpoint) return false;

  try {
    const cmd = new PutCommand({
      TableName: DOSSIERS_TABLE,
      Item: dossier,
    });
    await dynamoDocClient.send(cmd);
    return true;
  } catch (err) {
    console.warn("DynamoDB saveDossier error:", (err as Error)?.message);
    return false;
  }
}

/**
 * Get citizen dossier from DynamoDB
 */
export async function getDossierFromDynamoDB(dossierId: string) {
  if (!isDynamoDbConfigured() && !endpoint) return null;

  try {
    const cmd = new GetCommand({
      TableName: DOSSIERS_TABLE,
      Key: { dossierId },
    });
    const res = await dynamoDocClient.send(cmd);
    return res.Item || null;
  } catch (err) {
    console.warn("DynamoDB getDossier error:", (err as Error)?.message);
    return null;
  }
}
