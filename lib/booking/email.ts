import { Resend } from 'resend';
import { loadSiteInfo } from '@/lib/content';
import { clinicSenderFrom } from '@/lib/email/from-address';
import { getSiteDisplayName } from '@/lib/siteInfo';
import type { BookingRecord, BookingService, SiteInfo } from '@/lib/types';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fallbackAdminRecipients = (process.env.CONTACT_FALLBACK_TO || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function formatBookingDetails(booking: BookingRecord, service?: BookingService) {
  return [
    `Service: ${service?.name || booking.serviceId}`,
    booking.serviceType ? `Service Type: ${booking.serviceType}` : null,
    `Date: ${booking.date}`,
    `Time: ${booking.time}`,
    `Name: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    booking.pickupAddress ? `Pickup Address: ${booking.pickupAddress}` : null,
    booking.deliveryAddress ? `Delivery Address: ${booking.deliveryAddress}` : null,
    booking.zipCode ? `ZIP: ${booking.zipCode}` : null,
    booking.bags ? `Bags: ${booking.bags}` : null,
    booking.estimatedWeightLb ? `Estimated Weight (lb): ${booking.estimatedWeightLb}` : null,
    booking.addOnIds?.length ? `Add-ons: ${booking.addOnIds.join(', ')}` : null,
    booking.requestType ? `Request Type: ${booking.requestType}` : null,
    booking.note ? `Note: ${booking.note}` : null,
    `Status: ${booking.status}`,
    `Booking ID: ${booking.id}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Clinic name plus that clinic's no-reply address on the shared domain. */
export async function resolveBookingFrom(siteId: string, localPart?: string | null) {
  const siteInfo = (await loadSiteInfo(siteId, 'en')) as Partial<SiteInfo> | null;
  return clinicSenderFrom({
    siteId,
    displayName: getSiteDisplayName(siteInfo, 'No-Reply'),
    localPart,
  });
}

export async function sendBookingEmails({
  booking,
  service,
  subject,
  message,
  adminRecipients,
  from,
}: {
  booking: BookingRecord;
  service?: BookingService;
  subject: string;
  message: string;
  adminRecipients?: string[];
  from?: string;
}) {
  const sender = from?.trim();
  if (!resend || !sender) {
    console.warn('Resend not configured. Missing RESEND_API_KEY or a From address.');
    return;
  }

  const detailText = formatBookingDetails(booking, service);
  const body = `${message}\n\n${detailText}`;
  const resolvedAdminRecipients =
    adminRecipients && adminRecipients.length > 0 ? adminRecipients : fallbackAdminRecipients;

  try {
    await resend.emails.send({
      from: sender,
      to: booking.email,
      subject,
      text: body,
    });
  } catch (error) {
    console.warn('Client email failed:', error);
  }

  if (resolvedAdminRecipients.length > 0) {
    try {
      await resend.emails.send({
        from: sender,
        to: resolvedAdminRecipients,
        subject: `[Admin] ${subject}`,
        text: body,
        // Allow clinic staff to reply directly to the customer who booked.
        reply_to: booking.email,
      });
    } catch (error) {
      console.warn('Admin email failed:', error);
    }
  }
}
