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

console.log("==================================================================");
console.log("  🧪 COMPREHENSIVE AMAZON BEDROCK ALL-MODELS TEST SUITE");
console.log("==================================================================");
console.log(`Region:     ${region}`);
console.log(`Access Key: ${accessKeyId ? accessKeyId.substring(0, 8) + "..." : "NOT SET"}`);
console.log("==================================================================\n");

if (!accessKeyId || !secretAccessKey) {
  console.log("❌ AWS credentials not found in .env.local");
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

// Comprehensive list of foundation models on Bedrock
const modelCatalog = [
  // 1. Amazon First-Party Models (Nova & Titan)
  { provider: "Amazon", id: "amazon.nova-lite-v1:0", name: "Amazon Nova Lite" },
  { provider: "Amazon", id: "us.amazon.nova-lite-v1:0", name: "Amazon Nova Lite (US Profile)" },
  { provider: "Amazon", id: "amazon.nova-pro-v1:0", name: "Amazon Nova Pro" },
  { provider: "Amazon", id: "us.amazon.nova-pro-v1:0", name: "Amazon Nova Pro (US Profile)" },
  { provider: "Amazon", id: "amazon.nova-micro-v1:0", name: "Amazon Nova Micro" },
  { provider: "Amazon", id: "us.amazon.nova-micro-v1:0", name: "Amazon Nova Micro (US Profile)" },
  { provider: "Amazon", id: "amazon.titan-text-express-v1", name: "Amazon Titan Express" },
  { provider: "Amazon", id: "amazon.titan-text-lite-v1", name: "Amazon Titan Lite" },
  { provider: "Amazon", id: "amazon.titan-text-premier-v1:0", name: "Amazon Titan Premier" },

  // 2. Anthropic Claude Models
  { provider: "Anthropic", id: "anthropic.claude-3-haiku-20240307-v1:0", name: "Claude 3 Haiku" },
  { provider: "Anthropic", id: "anthropic.claude-3-sonnet-20240229-v1:0", name: "Claude 3 Sonnet" },
  { provider: "Anthropic", id: "anthropic.claude-3-5-sonnet-20240620-v1:0", name: "Claude 3.5 Sonnet v1" },
  { provider: "Anthropic", id: "us.anthropic.claude-3-5-sonnet-20241022-v2:0", name: "Claude 3.5 Sonnet v2 (US Profile)" },
  { provider: "Anthropic", id: "us.anthropic.claude-3-5-haiku-20241022-v1:0", name: "Claude 3.5 Haiku (US Profile)" },

  // 3. Meta Llama Models
  { provider: "Meta", id: "meta.llama3-8b-instruct-v1:0", name: "Llama 3 8B" },
  { provider: "Meta", id: "meta.llama3-70b-instruct-v1:0", name: "Llama 3 70B" },
  { provider: "Meta", id: "meta.llama3-1-8b-instruct-v1:0", name: "Llama 3.1 8B" },
  { provider: "Meta", id: "meta.llama3-1-70b-instruct-v1:0", name: "Llama 3.1 70B" },
  { provider: "Meta", id: "us.meta.llama3-2-1b-instruct-v1:0", name: "Llama 3.2 1B (US Profile)" },
  { provider: "Meta", id: "us.meta.llama3-2-3b-instruct-v1:0", name: "Llama 3.2 3B (US Profile)" },
  { provider: "Meta", id: "us.meta.llama3-2-11b-instruct-v1:0", name: "Llama 3.2 11B (US Profile)" },
  { provider: "Meta", id: "us.meta.llama3-3-70b-instruct-v1:0", name: "Llama 3.3 70B (US Profile)" },

  // 4. Mistral AI Models
  { provider: "Mistral", id: "mistral.mistral-7b-instruct-v0:2", name: "Mistral 7B" },
  { provider: "Mistral", id: "mistral.mixtral-8x7b-instruct-v0:1", name: "Mixtral 8x7B" },
  { provider: "Mistral", id: "mistral.mistral-large-2402-v1:0", name: "Mistral Large" },
  { provider: "Mistral", id: "mistral.mistral-small-2402-v1:0", name: "Mistral Small" },

  // 5. Cohere Models
  { provider: "Cohere", id: "cohere.command-text-v14", name: "Cohere Command" },
  { provider: "Cohere", id: "cohere.command-r-v1:0", name: "Cohere Command R" },
  { provider: "Cohere", id: "cohere.command-r-plus-v1:0", name: "Cohere Command R+" },

  // 6. AI21 Labs Models
  { provider: "AI21", id: "ai21.jamba-1-5-mini-v1:0", name: "Jamba 1.5 Mini" },
  { provider: "AI21", id: "ai21.jamba-1-5-large-v1:0", name: "Jamba 1.5 Large" },
  { provider: "AI21", id: "ai21.j2-mid-v1", name: "Jurassic-2 Mid" },
  { provider: "AI21", id: "ai21.j2-ultra-v1", name: "Jurassic-2 Ultra" },

  // 7. Qwen / DeepSeek / Other Marketplace Models
  { provider: "Alibaba", id: "qwen.qwen2-5-72b-instruct", name: "Qwen 2.5 72B" },
  { provider: "Alibaba", id: "qwen.qwen2-5-7b-instruct", name: "Qwen 2.5 7B" },
  { provider: "DeepSeek", id: "deepseek.deepseek-r1-distill-llama-8b", name: "DeepSeek R1 Distill 8B" },
  { provider: "DeepSeek", id: "deepseek.deepseek-r1-distill-llama-70b", name: "DeepSeek R1 Distill 70B" },
];

const results = {
  success: [],
  failed: [],
};

for (const m of modelCatalog) {
  process.stdout.write(`[${m.provider}] ${m.name} (${m.id}) ... `);
  try {
    const res = await client.send(
      new ConverseCommand({
        modelId: m.id,
        messages: [{ role: "user", content: [{ text: "Ping" }] }],
        inferenceConfig: { maxTokens: 10, temperature: 0.1 },
      })
    );
    const reply = res.output?.message?.content?.[0]?.text?.trim() || "OK";
    console.log(`🟢 SUCCESS! Response: "${reply}"`);
    results.success.push({ ...m, reply });
  } catch (err) {
    console.log(`🔴 FAILED (${err.name}: ${err.message})`);
    results.failed.push({ ...m, errorName: err.name, errorMessage: err.message });
  }
}

console.log("\n==================================================================");
console.log("  📊 SUMMARY RESULTS");
console.log("==================================================================");
console.log(`Total Tested:  ${modelCatalog.length}`);
console.log(`Working:       ${results.success.length}`);
console.log(`Failed:        ${results.failed.length}`);

if (results.success.length > 0) {
  console.log("\n🎉 WORKING MODELS FOUND:");
  for (const s of results.success) {
    console.log(`  • [${s.provider}] ${s.name} -> ID: ${s.id}`);
  }
} else {
  console.log("\n⚠️ ZERO models responded successfully.");
  console.log("Common reasons observed:");
  const errMap = {};
  for (const f of results.failed) {
    const key = `${f.errorName}: ${f.errorMessage}`;
    errMap[key] = (errMap[key] || 0) + 1;
  }
  for (const [k, count] of Object.entries(errMap)) {
    console.log(`  - (${count}x) ${k}`);
  }
}
console.log("==================================================================");
