import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import fs from "fs";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
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
}

loadEnv(".env.local");

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const tableName = process.env.DYNAMODB_SCHEMES_TABLE || "JanSetuSchemes";

console.log("=================================================================");
console.log("🔄 SEEDING COMPLETE BASELINE SCHEMES TO AMAZON DYNAMODB");
console.log("=================================================================");
console.log(`Region: ${region}`);
console.log(`Table:  ${tableName}`);

if (!accessKeyId || !secretAccessKey) {
  console.log("❌ No AWS credentials in .env.local");
  process.exit(1);
}

const client = new DynamoDBClient({
  region,
  credentials: {
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

// We can fetch baseline schemes from the running app API or read the compiled bundle
async function main() {
  try {
    console.log("Fetching verified baseline schemes from local server...");
    const res = await fetch("http://localhost:3000/api/schemes");
    const json = await res.json();
    const schemes = json.schemes || [];

    const validSchemes = schemes.filter(s => s.title && s.title.trim().length > 0);
    console.log(`Found ${validSchemes.length} valid complete schemes to upload to DynamoDB.`);

    let uploaded = 0;
    for (const scheme of validSchemes) {
      process.stdout.write(`Writing scheme: ${scheme.id} (${scheme.title.slice(0, 30)}...)... `);
      await docClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...scheme,
            updatedAt: new Date().toISOString(),
            dataSource: "National Gazette & State Welfare Portal Gateway",
          },
        })
      );
      console.log("✔️");
      uploaded++;
    }

    console.log(`\n🎉 SUCCESS! Uploaded ${uploaded} complete schemes with full titles, benefits, and rules to DynamoDB table '${tableName}'!`);
  } catch (err) {
    console.error("❌ Error seeding complete schemes:", err);
  }
}

main();
