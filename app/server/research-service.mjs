import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { id } from "ethers";

const defaultProviderConfig = path.join(
  os.homedir(),
  "IMOO",
  "IMOO-Agent-Data",
  "provider.json",
);

function normalizeBaseUrl(value) {
  return String(value || "https://api.deepseek.com").replace(/\/+$/, "");
}

function parseJson(value) {
  const text = String(value || "").trim();
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) {
      return JSON.parse(fenced);
    }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Research-to-Story model returned invalid JSON");
  }
}

function validateResult(value) {
  const result = {
    brief: String(value.brief || "").trim(),
    keyFacts: Array.isArray(value.keyFacts)
      ? value.keyFacts.map(String).filter(Boolean).slice(0, 8)
      : [],
    risks: Array.isArray(value.risks)
      ? value.risks.map(String).filter(Boolean).slice(0, 6)
      : [],
    contentAngles: Array.isArray(value.contentAngles)
      ? value.contentAngles.map(String).filter(Boolean).slice(0, 8)
      : [],
    story: String(value.story || "").trim(),
    imagePrompt: String(value.imagePrompt || "").trim(),
    citations: Array.isArray(value.citations)
      ? value.citations
          .map((item) => ({
            title: String(item.title || "").trim(),
            url: String(item.url || "").trim(),
            claim: String(item.claim || "").trim(),
          }))
          .filter((item) => item.title && item.url)
          .slice(0, 8)
      : [],
  };

  if (!result.brief || !result.story || result.keyFacts.length === 0) {
    throw new Error("Research-to-Story result is incomplete");
  }
  return result;
}

export async function runResearchToStory({
  topic,
  sources,
  providerConfigPath = process.env.IMOO_PROVIDER_CONFIG_PATH ??
    defaultProviderConfig,
} = {}) {
  const cleanTopic = String(topic || "").trim();
  if (!cleanTopic) {
    throw new Error("Research topic is required");
  }
  const cleanSources = Array.isArray(sources)
    ? sources
        .map((source) => ({
          title: String(source.title || "").trim(),
          url: String(source.url || "").trim(),
          excerpt: String(source.excerpt || "").trim().slice(0, 8_000),
        }))
        .filter((source) => source.title && source.url && source.excerpt)
        .slice(0, 8)
    : [];
  if (cleanSources.length === 0) {
    throw new Error("At least one sourced excerpt is required");
  }

  const config = JSON.parse(
    await fs.readFile(providerConfigPath, "utf8"),
  );
  if (!config.apiKey || !config.modelId) {
    throw new Error("DeepSeek provider is not configured");
  }

  const response = await fetch(
    `${normalizeBaseUrl(config.baseUrl)}/chat/completions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.modelId,
        messages: [
          {
            role: "system",
            content: [
              "You are the SkillPass Research-to-Story service.",
              "Turn supplied research excerpts into a sourced brief and a short, memorable story.",
              "Use only the supplied sources. Do not invent facts, quotes, numbers, or citations.",
              "Return only valid JSON with this shape:",
              "{",
              '  "brief": string,',
              '  "keyFacts": string[],',
              '  "risks": string[],',
              '  "contentAngles": string[],',
              '  "story": string,',
              '  "imagePrompt": string,',
              '  "citations": [{"title": string, "url": string, "claim": string}]',
              "}",
              "The story should be concise, vivid, and suitable for a compliant Agent Company post draft.",
            ].join("\n"),
          },
          {
            role: "user",
            content: JSON.stringify({
              topic: cleanTopic,
              sources: cleanSources,
            }),
          },
        ],
        temperature: 0.35,
        stream: false,
      }),
      signal: AbortSignal.timeout(120_000),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `DeepSeek request failed: ${response.status}`,
    );
  }

  const raw = payload?.choices?.[0]?.message?.content;
  const result = validateResult(parseJson(raw));
  const resultHash = id(JSON.stringify(result));

  return {
    provider: config.provider || "deepseek",
    model: config.modelId,
    modelDisplayName: config.modelDisplayName || config.modelId,
    topic: cleanTopic,
    sources: cleanSources.map(({ title, url }) => ({ title, url })),
    result,
    resultHash,
  };
}
