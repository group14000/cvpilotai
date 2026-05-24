import { openRouterClient } from '@/lib/ai/client';
import {
  sanitizeJobDescription,
  sanitizeAiTextOutput,
} from '@/lib/ai/sanitize';
import {
  buildSystemPrompt,
  buildUserPrompt,
} from '@/lib/ai/prompts/resumeOptimizationPrompt';
import { RESUME_OPTIMIZATION_PROMPT_VERSION } from '@/lib/ai/prompts/promptVersion';
import { aiOptimizationResponseSchema } from '../schemas/aiResponseSchema';
import { getResumeById } from '@/features/resume/services/resumeService';
import { resumeDataSchema } from '@/features/resume/schemas/resumeSchema';
import {
  AiEmptyResponseError,
  AiParseError,
  AiValidationError,
  type AiOptimizationResponse,
  type PendingAiOptimization,
} from '../types';
import { OpenRouterError } from '@openrouter/sdk/models/errors';
import type { Resume } from '@/types/resume';
import type { DescriptionBlock } from '@/types/resume';

// ─── Model constant ───────────────────────────────────────────────────────────
//
// One place to change the model. Switching to a paid tier is a one-line edit.

const AI_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free' as const;

// ─── Main service function ────────────────────────────────────────────────────

/**
 * Orchestrates the full AI resume optimization pipeline.
 *
 * Steps:
 *   1. Sanitize job description input
 *   2. Fetch + validate resume (ownership enforced)
 *   3. Check optimizable content exists
 *   4. Build prompts
 *   5. Call OpenRouter (non-streaming, JSON mode)
 *   6. Log token usage
 *   7. Parse JSON
 *   8. Zod validate
 *   9. Sanitize AI text output
 *  10. ID reconciliation (drop hallucinated experience/project IDs)
 *  11. Convert to store-compatible PendingAiOptimization (stable UUIDs)
 *
 * @param resumeId         - DB resume id (from URL params)
 * @param userId           - DB user.id (NOT the Clerk userId — already resolved)
 * @param rawJobDescription - Raw user-provided job description
 *
 * @throws {Error}              if resume is not found / not owned
 * @throws {Error}              if resume has no optimizable content
 * @throws {AiEmptyResponseError} if AI returns null content
 * @throws {AiParseError}       if AI returns non-JSON
 * @throws {AiValidationError}  if AI JSON doesn't match schema
 * @throws {Error}              on OpenRouter network failure
 */
export async function optimizeResume(
  resumeId: string,
  userId: string,
  rawJobDescription: string
): Promise<PendingAiOptimization> {
  const startMs = Date.now();

  // ── Step 1: Sanitize job description ──────────────────────────────────────
  const sanitizedJd = sanitizeJobDescription(rawJobDescription);

  // ── Step 2: Fetch resume (ownership enforced via compound WHERE) ──────────
  const dbResume = await getResumeById(resumeId, userId);
  if (!dbResume) {
    throw new Error('Resume not found');
  }

  // Parse the raw JSON data field into a typed ResumeData object
  const parsedData = resumeDataSchema.safeParse(dbResume.data);
  if (!parsedData.success) {
    throw new Error('Resume not found');
  }

  // ── Step 3: Check optimizable content ─────────────────────────────────────
  const hasContent =
    parsedData.data.summary.trim().length > 0 ||
    parsedData.data.experiences.length > 0 ||
    parsedData.data.projects.length > 0;

  if (!hasContent) {
    throw new Error('Resume has no optimizable content');
  }

  // Build a full Resume object for the prompt builder
  const resume: Resume = {
    id: dbResume.id,
    templateId: dbResume.template.slug,
    ...parsedData.data,
  };

  // ── Step 4: Build prompts ─────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(resume, sanitizedJd);

  // ── Step 5: Call OpenRouter ───────────────────────────────────────────────
  // stream: false — non-streaming MVP decision (see plan section 7)
  // temperature: 0.3 — low = deterministic, less hallucination
  // maxTokens: 3000 — sufficient for full optimized resume response
  // responseFormat: json_object — instructs model to output valid JSON
  //
  // SDK type: SendChatCompletionRequestRequest wraps all chat params inside
  // `chatRequest: ChatRequest`. Field names follow camelCase (SDK convention).
  //
  // SDK errors (OpenRouterError subclasses) are logged here for diagnostics,
  // then re-thrown so the route handler can map them to HTTP responses.
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
        maxTokens: 3000,
        temperature: 0.3,
        responseFormat: { type: 'json_object' as const },
      },
    });
  } catch (sdkError) {
    if (sdkError instanceof OpenRouterError) {
      // Log status code + error class — never the response body (may contain PII)
      console.error(
        '[AI:sdk-error]',
        JSON.stringify({
          model: AI_MODEL,
          errorClass: sdkError.constructor.name,
          statusCode: sdkError.statusCode,
          durationMs: Date.now() - startMs,
        })
      );
    } else {
      console.error(
        '[AI:sdk-error]',
        JSON.stringify({
          model: AI_MODEL,
          errorClass:
            sdkError instanceof Error ? sdkError.constructor.name : 'Unknown',
          message:
            sdkError instanceof Error ? sdkError.message : String(sdkError),
          durationMs: Date.now() - startMs,
        })
      );
    }
    throw sdkError; // re-throw for route handler to map to HTTP response
  }

  const durationMs = Date.now() - startMs;

  // ── Step 6: Log token usage ───────────────────────────────────────────────
  // Structured JSON format — parseable by log aggregators in production.
  // Log BEFORE parsing so a parse failure still gets a usage record.
  // ChatUsage fields are camelCase: promptTokens, completionTokens, totalTokens.
  const usageLog = {
    timestamp: new Date().toISOString(),
    userId,
    resumeId,
    model: AI_MODEL,
    promptVersion: RESUME_OPTIMIZATION_PROMPT_VERSION,
    promptTokens: response.usage?.promptTokens ?? 0,
    completionTokens: response.usage?.completionTokens ?? 0,
    totalTokens: response.usage?.totalTokens ?? 0,
    durationMs,
  };

  // ── Step 7: Extract and parse JSON ───────────────────────────────────────
  // ChatResult.choices is Array<ChatChoice>; ChatChoice.message is ChatAssistantMessage;
  // ChatAssistantMessage.content is string | Array<ChatContentItems> | null | undefined.
  // For JSON mode responses, content is always a plain string — coerce to string for safety.
  const rawContent =
    typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content
      : null;

  if (!rawContent || rawContent.trim().length === 0) {
    console.log(
      '[AI:usage]',
      JSON.stringify({
        ...usageLog,
        success: false,
        failureReason: 'empty_response',
      })
    );
    throw new AiEmptyResponseError();
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch {
    // Log content LENGTH not content (content could contain injected text)
    console.log(
      '[AI:usage]',
      JSON.stringify({
        ...usageLog,
        success: false,
        failureReason: 'json_parse_error',
        rawContentLength: rawContent.length,
      })
    );
    throw new AiParseError(rawContent.length);
  }

  // ── Step 8: Zod validation ────────────────────────────────────────────────
  const validated = aiOptimizationResponseSchema.safeParse(parsedJson);
  if (!validated.success) {
    const issuesSummary = validated.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    console.log(
      '[AI:usage]',
      JSON.stringify({
        ...usageLog,
        success: false,
        failureReason: 'zod_validation_error',
        issuesSummary,
      })
    );
    throw new AiValidationError(issuesSummary);
  }

  console.log('[AI:usage]', JSON.stringify({ ...usageLog, success: true }));

  const aiResult: AiOptimizationResponse = validated.data;

  // ── Step 9: Sanitize AI text output ──────────────────────────────────────
  const sanitizedResult: AiOptimizationResponse = {
    ...aiResult,
    optimizedSummary: sanitizeAiTextOutput(aiResult.optimizedSummary),
    optimizedExperiences: aiResult.optimizedExperiences.map((exp) => ({
      ...exp,
      description: exp.description.map((d) => ({
        ...d,
        content: sanitizeAiTextOutput(d.content),
      })),
    })),
    optimizedProjects: aiResult.optimizedProjects.map((proj) => ({
      ...proj,
      description: proj.description.map((d) => ({
        ...d,
        content: sanitizeAiTextOutput(d.content),
      })),
    })),
    suggestedSkills: aiResult.suggestedSkills.map((sk) => ({
      ...sk,
      name: sanitizeAiTextOutput(sk.name),
      reason: sanitizeAiTextOutput(sk.reason),
    })),
    analysis: {
      ...aiResult.analysis,
      extractedKeywords:
        aiResult.analysis.extractedKeywords.map(sanitizeAiTextOutput),
      matchedKeywords:
        aiResult.analysis.matchedKeywords.map(sanitizeAiTextOutput),
      missingKeywords:
        aiResult.analysis.missingKeywords.map(sanitizeAiTextOutput),
      improvementSuggestions:
        aiResult.analysis.improvementSuggestions.map(sanitizeAiTextOutput),
      // Clamp atsScore as defense-in-depth (Zod already validates 0–100 but
      // floating point edge cases can slip past integer validation in some runtimes)
      atsScore: Math.max(
        0,
        Math.min(100, Math.round(aiResult.analysis.atsScore))
      ),
    },
  };

  // ── Step 10: ID reconciliation ────────────────────────────────────────────
  // Verify that every experience id returned by the AI exists in the real resume.
  // Silently drop any items with non-matching IDs (hallucinated entries).
  const validExperienceIds = new Set(resume.experiences.map((e) => e.id));
  const reconciled_experiences = sanitizedResult.optimizedExperiences.filter(
    (e) => validExperienceIds.has(e.id)
  );

  const validProjectIds = new Set(resume.projects.map((p) => p.id));
  const reconciled_projects = sanitizedResult.optimizedProjects.filter((p) =>
    validProjectIds.has(p.id)
  );

  // ── Step 11: Convert to store-compatible PendingAiOptimization ────────────
  // Generate proper crypto.randomUUID() ids for all DescriptionBlocks.
  // The AI uses "new-N" for new bullets and existing ids for modified ones.
  // We replace ALL ids with fresh UUIDs at this point for consistency.
  const toDescriptionBlocks = (
    aiBlocks: AiOptimizationResponse['optimizedExperiences'][number]['description']
  ): DescriptionBlock[] =>
    aiBlocks.map((block) => ({
      id: crypto.randomUUID(),
      type: 'bullet' as const,
      content: block.content,
    }));

  const pending: PendingAiOptimization = {
    optimizedSummary: sanitizedResult.optimizedSummary,
    optimizedExperiences: reconciled_experiences.map((exp) => ({
      id: exp.id,
      description: toDescriptionBlocks(exp.description),
    })),
    optimizedProjects: reconciled_projects.map((proj) => ({
      id: proj.id,
      description: toDescriptionBlocks(proj.description),
    })),
    suggestedSkills: sanitizedResult.suggestedSkills,
    analysis: sanitizedResult.analysis,
  };

  return pending;
}
