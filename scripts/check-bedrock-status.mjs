import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import fs from "fs";

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
const configuredModel = process.env.AWS_BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0";

console.log("==================================================================");
console.log("  🔍 Amazon Bedrock Live Health & Access Check");
console.log("==================================================================");
console.log(`Region:           ${region}`);
console.log(`Access Key:       ${accessKeyId ? accessKeyId.substring(0, 8) + "..." : "NOT SET"}`);
console.log(`Configured Model: ${configuredModel}`);
console.log("==================================================================\n");

if (!accessKeyId || !secretAccessKey) {
  console.log("❌ AWS Credentials missing in .env.local");
  process.exit(1);
}

const client = new BedrockRuntimeClient({
  region,
  credentials: {
    accessKeyId: accessKeyId.trim(),
    secretAccessKey: secretAccessKey.trim(),
    ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN.trim() } : {}),
  },
});

const modelsToTest = [
  configuredModel,
  "amazon.nova-lite-v1:0",
  "us.amazon.nova-lite-v1:0",
  "amazon.nova-pro-v1:0",
  "us.amazon.nova-pro-v1:0",
  "anthropic.claude-3-haiku-20240307-v1:0",
  "meta.llama3-8b-instruct-v1:0",
];

const uniqueModels = [...new Set(modelsToTest)];
let workingModel = null;

for (const m of uniqueModels) {
  process.stdout.write(`Testing [${m}] ... `);
  try {
    const res = await client.send(
      new ConverseCommand({
        modelId: m,
        messages: [{ role: "user", content: [{ text: "Respond only with: OK" }] }],
        inferenceConfig: { maxTokens: 20, temperature: 0.1 },
      })
    );
    const reply = res.output?.message?.content?.[0]?.text?.trim();
    console.log(`✅ SUCCESS! Response: "${reply}"`);
    workingModel = m;
    break;
  } catch (err) {
    console.log(`❌ FAILED (${err.name}: ${err.message})`);
  }
}

console.log("\n==================================================================");
if (workingModel) {
  console.log(`🎉 Amazon Bedrock is WORKING! Operational model: ${workingModel}`);
} else {
  console.log("⏳ Amazon Bedrock is NOT ACTIVE YET.");
  console.log("   Reason: The AWS account is still undergoing verification or");
  console.log("   Model Access is not enabled in the AWS Console for these models.");
}
console.log("==================================================================");
