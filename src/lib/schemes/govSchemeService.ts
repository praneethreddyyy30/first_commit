import { UserProfile } from "@/lib/cedar/evaluator";
import { SchemeOrService } from "@/data/schemes";
import {
  normalizeGovScheme,
  RawGovSchemeResponse,
  RawGovDocumentResponse
} from "./schemeNormalizer";
import {
  saveSchemeToCloud,
  fetchAllSchemesFromCloud
} from "@/lib/dynamodb/dynamoSchemeStore";

export interface DirectoryItem {
  _id: string;
  slug: string;
  en?: {
    basicDetails?: {
      schemeName?: string;
      schemeShortTitle?: string;
    };
  };
}

interface DirectoryCache {
  items: DirectoryItem[];
  fetchedAt: number;
}

const DIRECTORY_TTL_MS = 1000 * 60 * 60; // 1 hour TTL
let directoryCache: DirectoryCache | null = null;

const MYSCHEME_BASE = "https://www.myscheme.gov.in/api/apisetu";

/**
 * Retrieves the complete directory of official schemes from myscheme.gov.in
 */
export async function fetchOfficialDirectory(): Promise<DirectoryItem[]> {
  const now = Date.now();
  if (directoryCache && now - directoryCache.fetchedAt < DIRECTORY_TTL_MS) {
    return directoryCache.items;
  }

  try {
    const res = await fetch(`${MYSCHEME_BASE}/schemes`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (JanSetu AI Civic Engine; Windows NT 10.0; Win64; x64)",
        Accept: "application/json"
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      throw new Error(`Government directory API returned status ${res.status}`);
    }

    const json = await res.json();
    const items: DirectoryItem[] = json.data || [];
    if (items.length > 0) {
      directoryCache = {
        items,
        fetchedAt: now
      };
    }
    return items;
  } catch (error) {
    console.warn("Failed to refresh myscheme.gov.in directory, using fallback:", error);
    return directoryCache?.items || [];
  }
}

/**
 * Fetches raw scheme details for a specific slug from myscheme.gov.in
 */
export async function fetchRawSchemeDetails(slug: string): Promise<RawGovSchemeResponse | null> {
  try {
    const url = `${MYSCHEME_BASE}/schemes?slug=${encodeURIComponent(slug)}&lang=en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (JanSetu AI Civic Engine)",
        Accept: "application/json"
      }
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.warn(`Failed to fetch details for scheme ${slug}:`, error);
    return null;
  }
}

/**
 * Fetches statutory required documents from myscheme.gov.in
 */
export async function fetchRawSchemeDocuments(schemeId: string): Promise<RawGovDocumentResponse | null> {
  try {
    const url = `${MYSCHEME_BASE}/schemes/${encodeURIComponent(schemeId)}/documents?lang=en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (JanSetu AI Civic Engine)",
        Accept: "application/json"
      }
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.warn(`Failed to fetch documents for scheme ${schemeId}:`, error);
    return null;
  }
}

/**
 * Scores how relevant a government scheme directory item is to the citizen's profile.
 */
function calculateRelevance(item: DirectoryItem, profile: UserProfile): number {
  const name = (item.en?.basicDetails?.schemeName || "").toLowerCase();
  const slug = (item.slug || "").toLowerCase();
  let score = 0;

  // Category matching
  if (profile.category === "ST") {
    if (name.includes("scheduled tribe") || name.includes(" st ") || name.includes("tribal")) score += 35;
  } else if (profile.category === "SC") {
    if (name.includes("scheduled caste") || name.includes(" sc ") || name.includes("dalit")) score += 35;
  } else if (profile.category === "OBC") {
    if (name.includes("backward") || name.includes(" obc ")) score += 30;
  } else if (profile.category === "EWS") {
    if (name.includes("economically weaker") || name.includes(" ews ")) score += 30;
  }

  // Education level matching
  const isSchool = profile.educationLevel === "Class 9" || profile.educationLevel === "Class 10";
  const isHigherEd = ["11th", "12th", "UG", "PG", "PhD", "Diploma"].includes(profile.educationLevel);

  if (isSchool) {
    if (name.includes("pre matric") || name.includes("pre-matric") || name.includes("secondary")) score += 40;
    if (name.includes("post matric") || name.includes("higher education")) score -= 20;
  }

  if (isHigherEd) {
    if (name.includes("post matric") || name.includes("post-matric") || name.includes("higher education")) score += 40;
    if (name.includes("scholarship") || name.includes("fellowship") || name.includes("stipend")) score += 25;
    if (name.includes("pre matric")) score -= 30;
  }

  // Gender matching
  if (profile.gender === "Female") {
    if (name.includes("girl") || name.includes("women") || name.includes("kanya") || name.includes("pragati") || name.includes("mahila")) {
      score += 35;
    }
  }

  // Disability matching
  if (profile.isPersonWithDisability) {
    if (name.includes("disabilit") || name.includes("pwd") || name.includes("divyang")) score += 45;
  }

  // State matching
  if (profile.state && profile.state !== "National") {
    const stLower = profile.state.toLowerCase();
    if (name.includes(stLower) || slug.includes(stLower)) {
      score += 30;
    }
  }

  // Universal flagship welfare
  if (name.includes("kisan") || name.includes("awas") || name.includes("ayushman") || name.includes("skill")) {
    score += 15;
  }

  return score;
}

/**
 * Searches, pulls, and normalizes live schemes from the Government of India
 * matching the citizen's demographic profile in real time.
 */
export async function getLiveGovernmentSchemesForProfile(
  profile: UserProfile,
  maxSchemesToFetch: number = 8
): Promise<SchemeOrService[]> {
  // 1. Check existing DynamoDB / local cache first to avoid redundant fetches
  const existingCloud = await fetchAllSchemesFromCloud(profile.state);
  const existingMap = new Map<string, SchemeOrService>();
  existingCloud.schemes.forEach((s) => existingMap.set(s.id.toLowerCase(), s));

  // 2. Fetch official directory from myscheme.gov.in
  const directory = await fetchOfficialDirectory();
  if (directory.length === 0) {
    return existingCloud.schemes;
  }

  // 3. Rank all 5,000+ government schemes by citizen profile relevance
  const scoredItems = directory
    .map((item) => ({
      item,
      score: calculateRelevance(item, profile)
    }))
    .filter((entry) => entry.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSchemesToFetch);

  const results: SchemeOrService[] = [];

  // 4. Ingest top candidate schemes (with caching)
  for (const entry of scoredItems) {
    const slug = entry.item.slug;
    const lowerSlug = slug.toLowerCase();

    // If already normalized and stored, reuse immediately
    if (existingMap.has(lowerSlug)) {
      results.push(existingMap.get(lowerSlug)!);
      continue;
    }

    // Otherwise fetch live criteria and documents from Government APIs
    const rawDetails = await fetchRawSchemeDetails(slug);
    if (!rawDetails) continue;

    const rawDocs = await fetchRawSchemeDocuments(rawDetails._id);
    const normalized = normalizeGovScheme(rawDetails, rawDocs || undefined);

    // Save to DynamoDB / persistent cloud cache for fast subsequent hits
    await saveSchemeToCloud(normalized);
    existingMap.set(lowerSlug, normalized);
    results.push(normalized);
  }

  // Also include relevant existing schemes from cloud store if any
  existingCloud.schemes.forEach((s) => {
    if (!results.some((r) => r.id.toLowerCase() === s.id.toLowerCase())) {
      results.push(s);
    }
  });

  return results;
}
