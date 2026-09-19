import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  GetCommand,
  BatchWriteCommand
} from "@aws-sdk/lib-dynamodb";
import { SchemeOrService, SCHEMES_DATABASE } from "@/data/schemes";

export interface DynamoSchemeStoreResult {
  schemes: SchemeOrService[];
  source: "AMAZON_DYNAMODB" | "LOCAL_CACHE";
  totalCount: number;
  lastSyncedAt: string;
  tableName: string;
}

const TABLE_NAME = process.env.SCHEMES_TABLE || "JanSetuSchemes";
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// In-memory fallback and seed cache
class LocalSchemeCache {
  private schemes: Map<string, SchemeOrService> = new Map();
  private lastSyncedAt: string = new Date().toISOString();

  constructor() {
    SCHEMES_DATABASE.forEach((s) => {
      this.schemes.set(s.id, s);
    });
  }

  public getAll(): SchemeOrService[] {
    return Array.from(this.schemes.values());
  }

  public getById(id: string): SchemeOrService | undefined {
    return this.schemes.get(id);
  }

  public set(scheme: SchemeOrService): void {
    this.schemes.set(scheme.id, scheme);
    this.lastSyncedAt = new Date().toISOString();
  }

  public bulkSet(schemes: SchemeOrService[]): void {
    schemes.forEach((s) => this.schemes.set(s.id, s));
    this.lastSyncedAt = new Date().toISOString();
  }

  public getLastSyncedAt(): string {
    return this.lastSyncedAt;
  }
}

const localCache = new LocalSchemeCache();

function getDynamoDocClient(): DynamoDBDocumentClient | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const sessionToken = process.env.AWS_SESSION_TOKEN;

  if (
    !accessKeyId ||
    !secretAccessKey ||
    accessKeyId.includes("your-access-key") ||
    accessKeyId.trim().length < 10
  ) {
    return null;
  }

  try {
    const client = new DynamoDBClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        ...(sessionToken ? { sessionToken: sessionToken.trim() } : {})
      }
    });

    return DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true
      }
    });
  } catch (err) {
    console.warn("Could not initialize DynamoDB Client, using resilient local store:", err);
    return null;
  }
}

/**
 * Fetches all schemes from Amazon DynamoDB (with transparent fallback to local cache).
 */
export async function fetchAllSchemesFromCloud(stateFilter?: string): Promise<DynamoSchemeStoreResult> {
  const docClient = getDynamoDocClient();

  if (docClient) {
    try {
      const command = new ScanCommand({
        TableName: TABLE_NAME
      });

      const response = await docClient.send(command);
      const items = (response.Items as SchemeOrService[]) || [];

      if (items.length > 0) {
        // Also update local cache
        localCache.bulkSet(items);

        let filtered = items;
        if (stateFilter && stateFilter !== "All" && stateFilter !== "National") {
          filtered = items.filter(
            (s) =>
              s.level === "Central" ||
              !s.applicableStates ||
              s.applicableStates.length === 0 ||
              s.applicableStates.includes(stateFilter)
          );
        }

        return {
          schemes: filtered,
          source: "AMAZON_DYNAMODB",
          totalCount: items.length,
          lastSyncedAt: new Date().toISOString(),
          tableName: TABLE_NAME
        };
      }
    } catch (err: unknown) {
      console.warn("DynamoDB ScanCommand failed, serving from verified cache:", (err as Error)?.message);
    }
  }

  // Resilient fallback (local verified catalog + dynamically ingested schemes)
  const allCached = localCache.getAll();
  let filtered = allCached;
  if (stateFilter && stateFilter !== "All" && stateFilter !== "National") {
    filtered = allCached.filter(
      (s) =>
        s.level === "Central" ||
        !s.applicableStates ||
        s.applicableStates.length === 0 ||
        s.applicableStates.includes(stateFilter)
    );
  }

  return {
    schemes: filtered,
    source: "LOCAL_CACHE",
    totalCount: allCached.length,
    lastSyncedAt: localCache.getLastSyncedAt(),
    tableName: TABLE_NAME
  };
}

/**
 * Persists a single scheme to Amazon DynamoDB and updates local cache.
 */
export async function saveSchemeToCloud(scheme: SchemeOrService): Promise<{ success: boolean; source: string }> {
  // Always update local cache
  localCache.set(scheme);

  const docClient = getDynamoDocClient();
  if (docClient) {
    try {
      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: scheme
      });
      await docClient.send(command);
      return { success: true, source: "AMAZON_DYNAMODB" };
    } catch (err) {
      console.warn("Failed to write to DynamoDB table, saved to local cache:", err);
      return { success: true, source: "LOCAL_CACHE_FALLBACK" };
    }
  }

  return { success: true, source: "LOCAL_CACHE" };
}

/**
 * Bulk writes multiple schemes to Amazon DynamoDB.
 */
export async function bulkSaveSchemesToCloud(schemes: SchemeOrService[]): Promise<{ count: number; source: string }> {
  localCache.bulkSet(schemes);

  const docClient = getDynamoDocClient();
  if (docClient && schemes.length > 0) {
    try {
      // Chunk into batches of 25 for DynamoDB BatchWriteItem limit
      const chunkSize = 25;
      for (let i = 0; i < schemes.length; i += chunkSize) {
        const chunk = schemes.slice(i, i + chunkSize);
        const putRequests = chunk.map((item) => ({
          PutRequest: {
            Item: item
          }
        }));

        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: putRequests
            }
          })
        );
      }
      return { count: schemes.length, source: "AMAZON_DYNAMODB" };
    } catch (err) {
      console.warn("DynamoDB BatchWrite failed, items cached locally:", err);
      return { count: schemes.length, source: "LOCAL_CACHE_FALLBACK" };
    }
  }

  return { count: schemes.length, source: "LOCAL_CACHE" };
}

/**
 * Get a specific scheme by ID.
 */
export async function getSchemeByIdFromCloud(id: string): Promise<SchemeOrService | undefined> {
  const docClient = getDynamoDocClient();
  if (docClient) {
    try {
      const response = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { id }
        })
      );
      if (response.Item) {
        return response.Item as SchemeOrService;
      }
    } catch (err) {
      console.warn(`DynamoDB GetCommand failed for ${id}:`, err);
    }
  }

  return localCache.getById(id);
}
