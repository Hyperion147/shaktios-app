import { apiRequest } from './client';
import type { PriorityAssessment as SharedPriorityAssessment, Urgency } from '@/src/types';

export type SuggestedUrgency = Urgency;

export type PriorityAssessment = SharedPriorityAssessment;

const URGENCIES: readonly string[] = ['low', 'medium', 'high'];

/** Strict client-side validation; the backend validates again before Sarvam. */
export function parsePriorityAssessment(raw: unknown): PriorityAssessment {
  const fallback = 'Priority assist is unavailable. Choose urgency manually.';
  if (typeof raw !== 'object' || raw === null) throw new Error(fallback);
  const record = raw as Record<string, unknown>;
  if (typeof record.suggested_urgency !== 'string' || !URGENCIES.includes(record.suggested_urgency)) {
    throw new Error(fallback);
  }
  if (typeof record.priority !== 'boolean') throw new Error(fallback);
  if (
    !Array.isArray(record.reasons) ||
    record.reasons.length > 3 ||
    record.reasons.some((reason) => typeof reason !== 'string' || !reason.trim() || reason.length > 120)
  ) {
    throw new Error(fallback);
  }
  return {
    suggested_urgency: record.suggested_urgency as SuggestedUrgency,
    priority: record.priority,
    reasons: (record.reasons as string[]).map((reason) => reason.trim()),
  };
}

/** Sarvam triage of the report text; throws a manual-fallback message on any failure. */
export async function assessPriority(
  input: { category: string; description: string; hasPhoto: boolean },
  signal?: AbortSignal
): Promise<PriorityAssessment> {
  const description = input.description.trim();
  if (!description) throw new Error('Add a short description for priority assist.');
  const raw = await apiRequest<unknown>('/priority/assess', {
    method: 'POST',
    body: { category: input.category, description, has_photo: input.hasPhoto },
    signal,
    timeoutMs: 20_000,
  });
  return parsePriorityAssessment(raw);
}
