import type { BookingRecord, BookingService, BookingSettings } from '@/lib/types';

type BaamReviewConfig = NonNullable<BookingSettings['baamReview']>;

// Resolve config. Once the admin card has been configured (cfg present), it is
// the SINGLE source of truth — the "Enabled" toggle fully controls this path,
// with no env override. This lets a site turn the built-in connector OFF and
// route reviews through the generic Automations engine instead (one way only).
// The env vars are a legacy fallback used ONLY when the card was never set up.
function resolveConfig(cfg?: BaamReviewConfig) {
  if (cfg) {
    const apiKey = cfg.apiKey?.trim() || '';
    return {
      enabled: cfg.enabled === true && !!apiKey,
      apiKey,
      apiUrl: cfg.apiUrl?.trim() || 'https://baamreview.com',
      language: cfg.language?.trim() || 'zh',
    };
  }
  const apiKey = process.env.BAAM_REVIEW_API_KEY || '';
  return {
    enabled: !!apiKey,
    apiKey,
    apiUrl: process.env.BAAM_REVIEW_API_URL || 'https://baamreview.com',
    language: process.env.BAAM_REVIEW_LANGUAGE || 'zh',
  };
}

// Fire-and-forget: forwards a confirmed booking to BAAM Review's review queue.
// Never throws — a review-request failure must not affect the booking. The
// per-location API key identifies the business, so the body never names it.
export async function forwardToBaamReview(
  booking: BookingRecord,
  service?: BookingService,
  config?: BaamReviewConfig,
): Promise<void> {
  const { enabled, apiKey, apiUrl, language } = resolveConfig(config);
  if (!enabled) return; // disabled or no key configured
  try {
    const res = await fetch(`${apiUrl}/api/integrations/review-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        service: service?.name,
        language,
        transacted_at: `${booking.date}T${booking.time}:00`,
        external_id: booking.id,                         // dedupes on retry
      }),
    });
    if (!res.ok) {
      console.error('[baam-review] forward failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (e) {
    console.error('[baam-review] forward error:', e);
  }
}
