// src/lib/services/geminiService.ts
// ─── Raw Gemini REST wrapper ───────────────────────────────────────────────────
// Handles ONLY the API call + JSON parsing. No DB access, no ObjectIds.
// Imported by botEvaluationService.ts — never called directly from routes.

import type {
  GeminiEvaluationResponse,
  ITask,
  IAssignment,
} from "@/types/tasks";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

// ─── Prompt Builder ────────────────────────────────────────────────────────────

function flattenSubmissionItems(
  items: NonNullable<IAssignment["submission"]>["items"],
): string {
  if (!items?.length) return "(no items submitted)";
  return items
    .map(
      (item, i) =>
        `[${i + 1}] ${item.deliverableLabel} (${item.type}):\n${item.value}`,
    )
    .join("\n\n");
}

export function buildEvaluationPrompt(
  task: Pick<
    ITask,
    "title" | "description" | "evaluationCriteria" | "maxScore"
  >,
  submission: NonNullable<IAssignment["submission"]>,
): string {
  const criteria =
    task.evaluationCriteria?.trim() ||
    "Evaluate based on completeness, quality, accuracy, and relevance to the task description.";

  const notesBlock = submission.additionalNotes?.trim()
    ? `\nADDITIONAL NOTES FROM MEMBER:\n${submission.additionalNotes}\n`
    : "";

  return `\
You are an objective evaluation engine for DIUSCADI, a student tech organisation. \
Evaluate the member's task submission fairly, constructively, and specifically.

TASK TITLE: ${task.title}

TASK DESCRIPTION:
${task.description}

EVALUATION CRITERIA:
${criteria}

MAXIMUM POSSIBLE SCORE: ${task.maxScore}

MEMBER SUBMISSION:
${flattenSubmissionItems(submission.items)}
${notesBlock}
---

Instructions:
1. Evaluate against every criterion in EVALUATION CRITERIA. Distribute maxScore proportionally.
2. Write 2–4 sentences of constructive overall feedback.
3. Set "flaggedForHumanReview" to true ONLY if the submission is ambiguous, \
contains unverifiable external links critical to scoring, is inappropriate, \
or if you have less than 60 % confidence in your score.
4. Respond ONLY with valid JSON. No markdown fences. No preamble. Pure JSON only.

Required response shape:
{
  "totalScore": <integer 0–${task.maxScore}>,
  "percentageScore": <number 0.00–100.00>,
  "feedback": "<2–4 sentence constructive assessment>",
  "criteriaBreakdown": [
    {
      "criterion": "<criterion label>",
      "awarded": <points awarded>,
      "maximum": <max points for this criterion>,
      "rationale": "<1–2 sentences explaining this score>"
    }
  ],
  "flaggedForHumanReview": <true | false>,
  "reviewNote": <"<brief reason if flagged>" | null>
}`;
}

// ─── API Types ─────────────────────────────────────────────────────────────────

interface GeminiAPIResponse {
  candidates?: Array<{
    content: { parts: Array<{ text: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: { totalTokenCount?: number };
  error?: { message: string; code: number };
}

export interface GeminiCallResult {
  parsed: GeminiEvaluationResponse;
  rawText: string;
  tokensUsed: number;
  modelVersion: string;
  processingMs: number;
}

// ─── API Caller ────────────────────────────────────────────────────────────────

export async function callGeminiEvaluate(
  prompt: string,
): Promise<GeminiCallResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    throw new Error("GEMINI_API_KEY environment variable is not configured");

  const startMs = Date.now();
  const url = `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2, // Low = consistent, deterministic scoring
        maxOutputTokens: 1024,
        responseMimeType: "application/json", // Native JSON mode — Gemini 1.5+
      },
    }),
  });

  const processingMs = Date.now() - startMs;

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errBody.slice(0, 300)}`);
  }

  const data: GeminiAPIResponse = await res.json();

  if (data.error) {
    throw new Error(
      `Gemini API error (${data.error.code}): ${data.error.message}`,
    );
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!rawText) throw new Error("Gemini returned an empty response");

  // Defensive strip of accidental markdown fences (belt-and-suspenders)
  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: GeminiEvaluationResponse;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Gemini response is not valid JSON. Received: ${cleaned.slice(0, 200)}`,
    );
  }

  // ── Structural validation — every field the downstream code depends on ──────
  const checks: [boolean, string][] = [
    [typeof parsed.totalScore === "number", "missing/invalid totalScore"],
    [
      typeof parsed.percentageScore === "number",
      "missing/invalid percentageScore",
    ],
    [typeof parsed.feedback === "string", "missing/invalid feedback"],
    [
      Array.isArray(parsed.criteriaBreakdown),
      "missing/invalid criteriaBreakdown",
    ],
    [
      typeof parsed.flaggedForHumanReview === "boolean",
      "missing/invalid flaggedForHumanReview",
    ],
  ];
  for (const [ok, msg] of checks) {
    if (!ok) throw new Error(`Invalid Gemini response structure: ${msg}`);
  }

  return {
    parsed,
    rawText,
    tokensUsed: data.usageMetadata?.totalTokenCount ?? 0,
    modelVersion: GEMINI_MODEL,
    processingMs,
  };
}
