import type { BookingRecord, BookingService, BookingSettings } from '@/lib/types';

type BaamReviewConfig = NonNullable<BookingSettings['baamReview']>;

// Resolve config: prefer admin settings (no deploy), fall back to env so
// existing env-based setups keep working.
function resolveConfig(cfg?: BaamReviewConfig) {
  const apiKey = cfg?.apiKey?.trim() || process.env.BAAM_REVIEW_API_KEY || '';
  const enabled = cfg ? cfg.enabled !== false && !!apiKey : !!apiKey;
  return {
    enabled,
    apiKey,
    apiUrl: cfg?.apiUrl?.trim() || process.env.BAAM_REVIEW_API_URL || 'https://baamreview.com',
    language: cfg?.language?.trim() || process.env.BAAM_REVIEW_LANGUAGE || 'zh',
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
