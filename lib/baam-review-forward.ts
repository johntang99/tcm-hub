import type { BookingRecord, BookingService } from '@/lib/types';

const API_URL = process.env.BAAM_REVIEW_API_URL || 'https://baamreview.com';
const API_KEY = process.env.BAAM_REVIEW_API_KEY;
// Report language for the review request (en | zh | es). Clone-safe: each site
// sets its own; TCM sites default to zh.
const LANGUAGE = process.env.BAAM_REVIEW_LANGUAGE || 'zh';

// Fire-and-forget: forwards a confirmed booking to BAAM Review's review queue.
// Never throws — a review-request failure must not affect the booking. The
// per-location API key identifies the business, so the body never names it.
export async function forwardToBaamReview(
  booking: BookingRecord,
  service?: BookingService,
): Promise<void> {
  if (!API_KEY) return; // integration disabled until the key is set
  try {
    const res = await fetch(`${API_URL}/api/integrations/review-request`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
        service: service?.name,
        language: LANGUAGE,
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
