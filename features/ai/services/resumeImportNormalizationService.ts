// SERVER-ONLY — never import in client components.
// AI-powered semantic normalization of raw resume text into the strict internal schema.

import { openRouterClient } from '@/lib/ai/client';
import { sanitizeResumeText, sanitizeAiTextOutput } from '@/lib/ai/sanitize';
import {
  buildImportSystemPrompt,
  buildImportUserPrompt,
} from '@/lib/ai/prompts/resumeImportPrompt';
import { RESUME_IMPORT_PROMPT_VERSION } from '@/lib/ai/prompts/promptVersion';
import { aiImportResponseSchema } from '../schemas/aiImportResponseSchema';
import {
  AiImportEmptyResponseError,
  AiImportParseError,
  AiImportValidationError,
} from '../types';
import { OpenRouterError } from '@openrouter/sdk/models/errors';
import type { Resume, DescriptionBlock } from '@/types/resume';

// ─── Model constant ───────────────────────────────────────────────────────────

const AI_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free' as const;

// ─── JSON extraction helper (same as optimization service) ────────────────────

function extractJsonObject(raw: string): string {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && start !== -1) return raw.slice(start, i + 1);
    }
  }
  if (start !== -1) return raw.slice(start);
  return raw;
}

// ─── Return type ──────────────────────────────────────────────────────────────

/** Imported resume data — same shape as Resume minus id and templateId. */
export type ImportedResumeData = Omit<Resume, 'id' | 'templateId'>;

// ─── Main service function ────────────────────────────────────────────────────

/**
 * Run the AI import normalization pipeline on raw extracted text.
 *
 * Steps:
 *   1. Sanitize extracted text (strip HTML, control chars, truncate)
 *   2. Build prompts (static system + dynamic user with XML delimiters)
 *   3. Call OpenRouter (non-streaming, JSON mode, temp=0.1)
 *   4. Log token usage
 *   5. Extract JSON from model response
 *   6. Parse JSON
 *   7. Zod validate with normalization (dates, proficiency, description format)
 *   8. Sanitize AI text output (strip HTML/markdown from all string fields)
 *   9. Assign crypto.randomUUID() to all items and description blocks
 *  10. Return ImportedResumeData
 *
 * @param rawText - Plain text extracted from the uploaded file
 * @param userId  - DB user.id (for logging only)
 *
 * @throws {AiImportEmptyResponseError} if AI returns null/empty content
 * @throws {AiImportParseError}         if response is not valid JSON
 * @throws {AiImportValidationError}    if JSON doesn't match expected schema
 * @throws {OpenRouterError}            on API/network failures
 */
export async function normalizeImportedResume(
  rawText: string,
  userId: string
): Promise<ImportedResumeData> {
  const startMs = Date.now();

  // ── Step 1: Sanitize ─────────────────────────────────────────────────────
  const sanitizedText = sanitizeResumeText(rawText);

  if (!sanitizedText || sanitizedText.trim().length < 50) {
    throw new Error(
      'Extracted text is too short to parse (minimum 50 characters)'
    );
  }

  // ── Step 2: Build prompts ─────────────────────────────────────────────────
  const systemPrompt = buildImportSystemPrompt();
  const userPrompt = buildImportUserPrompt(sanitizedText);

  // ── Step 3: Call OpenRouter ───────────────────────────────────────────────
  // temperature: 0.1 — near-deterministic; import requires faithful extraction
  // maxTokens: 4096 — full resume schema without lengthy suggestions
  // responseFormat: json_object — instructs model to output valid JSON
  let response: Awaited<ReturnType<typeof openRouterClient.chat.send>>;
  try {
    response = await openRouterClient.chat.send({
      chatRequest: {
        model: AI_MODEL,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt },
        ],
        stream: false,
        maxTokens: 4096,
        temperature: 0.1,
        responseFormat: { type: 'json_object' as const },
      },
    });
  } catch (sdkError) {
    if (sdkError instanceof OpenRouterError) {
      console.error(
        '[AI:import]',
        JSON.stringify({
          event: 'sdk_error',
          userId,
          model: AI_MODEL,
          errorClass: sdkError.constructor.name,
          statusCode: sdkError.statusCode,
          durationMs: Date.now() - startMs,
        })
      );
    } else {
      console.error(
        '[AI:import]',
        JSON.stringify({
          event: 'sdk_error',
          userId,
          model: AI_MODEL,
          errorClass:
            sdkError instanceof Error ? sdkError.constructor.name : 'Unknown',
          message:
            sdkError instanceof Error ? sdkError.message : String(sdkError),
          durationMs: Date.now() - startMs,
        })
      );
    }
    throw sdkError;
  }

  const durationMs = Date.now() - startMs;

  // ── Step 4: Log token usage ───────────────────────────────────────────────
  const usageLog = {
    event: 'ai_call_complete',
    userId,
    model: AI_MODEL,
    promptVersion: RESUME_IMPORT_PROMPT_VERSION,
    promptTokens: response.usage?.promptTokens ?? 0,
    completionTokens: response.usage?.completionTokens ?? 0,
    totalTokens: response.usage?.totalTokens ?? 0,
    extractedTextLength: sanitizedText.length,
    durationMs,
  };

  // ── Step 5: Extract JSON from model response ──────────────────────────────
  const rawContent =
    typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content
      : null;

  if (!rawContent || rawContent.trim().length === 0) {
    console.error(
      '[AI:import]',
      JSON.stringify({
        ...usageLog,
        success: false,
        failureReason: 'empty_response',
      })
    );
    throw new AiImportEmptyResponseError();
  }

  const cleanContent = extractJsonObject(rawContent.trim());

  // ── Step 6: Parse JSON ────────────────────────────────────────────────────
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(cleanContent);
  } catch {
    console.error(
      '[AI:import]',
      JSON.stringify({
        ...usageLog,
        success: false,
        failureReason: 'json_parse_error',
        rawContentLength: cleanContent.length,
      })
    );
    throw new AiImportParseError(cleanContent.length);
  }

  // ── Step 7: Zod validation ────────────────────────────────────────────────
  const validated = aiImportResponseSchema.safeParse(parsedJson);
  if (!validated.success) {
    const issuesSummary = validated.error.issues
      .slice(0, 10)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    console.error(
      '[AI:import]',
      JSON.stringify({
        ...usageLog,
        success: false,
        failureReason: 'zod_validation_error',
        issuesSummary,
      })
    );
    throw new AiImportValidationError(issuesSummary);
  }

  console.error('[AI:import]', JSON.stringify({ ...usageLog, success: true }));

  const aiResult = validated.data;

  // ── Step 8: Sanitize AI text output ──────────────────────────────────────
  const san = sanitizeAiTextOutput;

  // ── Step 9: Assign UUIDs and build ImportedResumeData ────────────────────
  const toDescBlocks = (items: { content: string }[]): DescriptionBlock[] =>
    items.map((item) => ({
      id: crypto.randomUUID(),
      type: 'bullet' as const,
      content: san(item.content),
    }));

  const result: ImportedResumeData = {
    personalInfo: {
      firstName: san(aiResult.personalInfo.firstName),
      ...(aiResult.personalInfo.middleName !== undefined && {
        middleName: san(aiResult.personalInfo.middleName),
      }),
      lastName: san(aiResult.personalInfo.lastName),
      email: san(aiResult.personalInfo.email),
      phone: san(aiResult.personalInfo.phone),
      location: san(aiResult.personalInfo.location),
      ...(aiResult.personalInfo.linkedin && {
        linkedin: san(aiResult.personalInfo.linkedin),
      }),
      ...(aiResult.personalInfo.github && {
        github: san(aiResult.personalInfo.github),
      }),
      ...(aiResult.personalInfo.portfolio && {
        portfolio: san(aiResult.personalInfo.portfolio),
      }),
    },
    summary: san(aiResult.summary),
    experiences: aiResult.experiences.map((exp) => ({
      id: crypto.randomUUID(),
      companyName: san(exp.companyName),
      role: san(exp.role),
      location: san(exp.location),
      startDate: san(exp.startDate),
      endDate: san(exp.endDate),
      description: toDescBlocks(exp.description),
    })),
    skills: aiResult.skills.map((sk) => ({
      id: crypto.randomUUID(),
      name: san(sk.name),
      proficiency: sk.proficiency,
    })),
    projects: aiResult.projects.map((proj) => ({
      id: crypto.randomUUID(),
      name: san(proj.name),
      ...(proj.website && { website: san(proj.website) }),
      ...(proj.sourceCode && { sourceCode: san(proj.sourceCode) }),
      description: toDescBlocks(proj.description),
    })),
    education: aiResult.education.map((edu) => ({
      id: crypto.randomUUID(),
      institution: san(edu.institution),
      degree: san(edu.degree),
      areaOfStudy: san(edu.areaOfStudy),
      grade: san(edu.grade),
      location: san(edu.location),
      startDate: san(edu.startDate),
      endDate: san(edu.endDate),
      ...(edu.website && { website: san(edu.website) }),
      description: toDescBlocks(edu.description),
    })),
    certifications: aiResult.certifications.map((cert) => ({
      id: crypto.randomUUID(),
      title: san(cert.title),
      issuer: san(cert.issuer),
      date: san(cert.date),
      ...(cert.website && { website: san(cert.website) }),
    })),
  };

  return result;
}
