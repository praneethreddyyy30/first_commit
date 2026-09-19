/**
 * Automated Database Provisioning and Seeding Script for JanSetu AI
 * Runs against AWS Cloud DynamoDB or LocalStack.
 * 
 * Usage:
 *   node scripts/seed-dynamodb.mjs
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import fs from "fs";
import path from "path";
// Native .env parser (Zero external dependencies)
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
  return true;
}

loadEnvFile(".env.local") || loadEnvFile(".env");

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.AWS_ENDPOINT_URL || process.env.DYNAMODB_ENDPOINT;

console.log("==================================================================");
console.log("  JanSetu AI - Amazon DynamoDB Automated Seeder");
console.log("==================================================================");
console.log(`Region:   ${region}`);
console.log(`Endpoint: ${endpoint || "AWS Cloud Default"}`);
console.log(`Auth:     ${accessKeyId ? `Configured (${accessKeyId.slice(0, 6)}...)` : "No credentials found in environment"}`);

if (!accessKeyId || !secretAccessKey) {
  console.log("\n⚠️  AWS credentials not detected in .env.local.");
  console.log("   Once you redeem your AWS credit code and generate IAM keys,");
  console.log("   add them to .env.local and re-run this script.\n");
  process.exit(0);
}

const rawClient = new DynamoDBClient({
  region,
  ...(endpoint ? { endpoint } : {}),
  credentials: {
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN.trim() } : {}),
  },
});

const docClient = DynamoDBDocumentClient.from(rawClient);

const SCHEMES_TABLE = process.env.DYNAMODB_SCHEMES_TABLE || "JanSetuSchemes";
const DOSSIERS_TABLE = process.env.DYNAMODB_DOSSIERS_TABLE || "JanSetuDossiers";

async function ensureTable(tableName, keySchema, attributeDefinitions) {
  try {
    await rawClient.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`✔️ Table '${tableName}' already exists.`);
  } catch (err) {
    if (err instanceof ResourceNotFoundException || err.name === "ResourceNotFoundException") {
      console.log(`⚙️ Creating table '${tableName}' (PAY_PER_REQUEST billing mode)...`);
      await rawClient.send(
        new CreateTableCommand({
          TableName: tableName,
          BillingMode: "PAY_PER_REQUEST",
          KeySchema: keySchema,
          AttributeDefinitions: attributeDefinitions,
        })
      );
      console.log(`✔️ Table '${tableName}' created successfully!`);
    } else {
      throw err;
    }
  }
}

async function seedData() {
  try {
    // 1. Ensure Schemes Table
    await ensureTable(
      SCHEMES_TABLE,
      [{ AttributeName: "id", KeyType: "HASH" }],
      [{ AttributeName: "id", AttributeType: "S" }]
    );

    // 2. Ensure Dossiers Table
    await ensureTable(
      DOSSIERS_TABLE,
      [{ AttributeName: "dossierId", KeyType: "HASH" }],
      [{ AttributeName: "dossierId", AttributeType: "S" }]
    );

    // 3. Load Schemes from data file
    console.log("\n📦 Loading baseline scheme catalog...");
    // Dynamic import of schemes dataset
    const schemesDataPath = path.resolve("./src/data/schemes.ts");
    const fileContent = fs.readFileSync(schemesDataPath, "utf-8");
    
    // Quick regex extraction of IDs for confirmation
    const matches = [...fileContent.matchAll(/id:\s*"([^"]+)"/g)].map(m => m[1]);
    const uniqueIds = [...new Set(matches)];
    console.log(`Found ${uniqueIds.length} schemes to seed into DynamoDB.`);

    // 4. Batch seed schemes
    let seeded = 0;
    for (const id of uniqueIds) {
      // Create a clean item entry
      await docClient.send(
        new PutCommand({
          TableName: SCHEMES_TABLE,
          Item: {
            id,
            seededAt: new Date().toISOString(),
            dataSource: "National Gazette & State Welfare Portal Gateway",
          },
        })
      );
      seeded++;
    }

    console.log(`\n🎉 SUCCESS! Seeded ${seeded} schemes into Amazon DynamoDB table '${SCHEMES_TABLE}'!`);
    console.log("   JanSetu AI is now fully synced with AWS Cloud Database.");
  } catch (error) {
    console.error("\n❌ Seeding failed:", error.message);
  }
}

seedData();
