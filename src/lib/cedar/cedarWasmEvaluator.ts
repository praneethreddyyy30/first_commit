import { SchemeOrService } from "@/data/schemes";
import { UserProfile } from "@/lib/cedar/evaluator";

export interface CedarWasmAuthResult {
  isWasmEngineActive: boolean;
  engineVersion: string;
  decision: "ALLOW" | "DENY";
  reason: string[];
  diagnostics?: unknown;
}

let cachedCedar: unknown = null;

async function getCedarEngine() {
  if (cachedCedar) return cachedCedar;
  try {
    const { createRequire } = await import("module");
    const req = createRequire(process.cwd() + "/");
    cachedCedar = req("@cedar-policy/cedar-wasm/nodejs");
    return cachedCedar;
  } catch (err) {
    try {
      const cedarModule = await import("@cedar-policy/cedar-wasm/nodejs");
      cachedCedar = cedarModule.default || cedarModule;
      return cachedCedar;
    } catch (innerErr) {
      console.warn("Could not initialize @cedar-policy/cedar-wasm:", innerErr);
      return null;
    }
  }
}

/**
 * Executes genuine AWS Cedar WASM authorization check.
 * Compiles declarative policy text and evaluates context using the official Rust/WASM binary.
 */
export async function evaluateSchemeWithCedarWasm(
  scheme: SchemeOrService,
  profile: UserProfile
): Promise<CedarWasmAuthResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cedar: any = await getCedarEngine();

  if (!cedar) {
    return {
      isWasmEngineActive: false,
      engineVersion: "FALLBACK_RULES_MODE",
      decision: profile.annualFamilyIncome <= scheme.maxIncome ? "ALLOW" : "DENY",
      reason: ["WASM engine not initialized; baseline rules evaluated."]
    };
  }

  try {
    const version = typeof cedar.getCedarVersion === "function" ? cedar.getCedarVersion() : "4.13.0";

    // Standardize a robust Cedar policy for the target scheme
    const policyText = `permit(
      principal == Citizen::"${(profile.name || "citizen").replace(/[^a-zA-Z0-9_]/g, "_")}",
      action == Action::"apply",
      resource == Scheme::"${scheme.id.replace(/[^a-zA-Z0-9_]/g, "_")}"
    ) when {
      context.annualFamilyIncome <= ${scheme.maxIncome} &&
      ${scheme.targetCategories.includes("All") ? "true" : `context.isCategoryMatch == true`}
    };`;

    const isTN = profile.state === "Tamil Nadu";
    const isAP = profile.state === "Andhra Pradesh";
    const community = profile.tnCommunity || "BC";
    const apComm = profile.apCommunity || "BC-A";

    const isCategoryMatch =
      scheme.targetCategories.includes("All") ||
      scheme.targetCategories.includes(profile.category) ||
      (isTN && (
        (community === "ST" && scheme.targetCategories.includes("ST")) ||
        (["SC", "SCA"].includes(community) && scheme.targetCategories.includes("SC")) ||
        (["BC", "BCM", "MBC", "DNC"].includes(community) && (
          scheme.targetCategories.includes("OBC") ||
          scheme.targetCategories.includes("BC") ||
          scheme.targetCategories.includes("MBC")
        ))
      )) ||
      (isAP && (
        (apComm === "ST" && scheme.targetCategories.includes("ST")) ||
        (apComm === "SC" && scheme.targetCategories.includes("SC")) ||
        (["BC-A", "BC-B", "BC-C", "BC-D", "BC-E"].includes(apComm) && (
          scheme.targetCategories.includes("OBC") ||
          scheme.targetCategories.includes("BC")
        ))
      ));

    const authCall = {
      principal: { type: "Citizen", id: (profile.name || "citizen").replace(/[^a-zA-Z0-9_]/g, "_") },
      action: { type: "Action", id: "apply" },
      resource: { type: "Scheme", id: scheme.id.replace(/[^a-zA-Z0-9_]/g, "_") },
      context: {
        annualFamilyIncome: profile.annualFamilyIncome,
        isCategoryMatch: Boolean(isCategoryMatch),
        category: profile.category,
        state: profile.state,
        educationLevel: profile.educationLevel,
        isHosteller: profile.isHosteller
      },
      policies: {
        staticPolicies: policyText
      },
      entities: []
    };

    const result = cedar.isAuthorized(authCall);

    if (result && result.type === "success" && result.response) {
      const decisionStr = result.response.decision === "allow" ? "ALLOW" : "DENY";
      return {
        isWasmEngineActive: true,
        engineVersion: version,
        decision: decisionStr,
        reason: result.response.diagnostics?.reason || [],
        diagnostics: result.response.diagnostics
      };
    }

    return {
      isWasmEngineActive: true,
      engineVersion: version,
      decision: "DENY",
      reason: result?.errors?.map((e: { message: string }) => e.message) || ["Evaluation denied by Cedar default-deny"]
    };
  } catch (err: unknown) {
    console.warn("Cedar WASM runtime error:", err);
    return {
      isWasmEngineActive: false,
      engineVersion: "FALLBACK_MODE",
      decision: profile.annualFamilyIncome <= scheme.maxIncome ? "ALLOW" : "DENY",
      reason: [(err as Error)?.message || "Cedar execution exception"]
    };
  }
}
