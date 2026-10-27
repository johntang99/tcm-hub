/**
 * One verified Resend domain, a different From for each clinic.
 *
 * `baamplatform.com` is verified once. Any local part on that domain is a
 * valid sender, so clinics do not need their own domain or API key.
 * `RESEND_FROM` supplies the domain. A clinic that does not set its own
 * local part sends as `no-reply-{siteId}@that-domain`.
 */

const DEFAULT_FROM = 'No-Reply<no-reply@baamplatform.com>';

function configuredFrom(): string {
  const from = process.env.RESEND_FROM?.trim();
  return from || DEFAULT_FROM;
}

function addressIn(from: string): string {
  const wrapped = from.match(/<([^<>\s]+@[^<>\s]+)>/);
  if (wrapped) return wrapped[1].trim().toLowerCase();
  const bare = from.match(/[^\s<>]+@[^\s<>]+/);
  return bare ? bare[0].trim().toLowerCase() : '';
}

export function verifiedFromDomain(): string {
  const address = addressIn(configuredFrom());
  const at = address.lastIndexOf('@');
  return at > 0 ? address.slice(at + 1) : 'baamplatform.com';
}

function localPart(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const withoutDomain = trimmed.includes('@') ? trimmed.slice(0, trimmed.indexOf('@')) : trimmed;
  return withoutDomain
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 64);
}

function displayName(value: string | null | undefined): string {
  const cleaned = (value || 'No-Reply').replace(/[<>"]/g, '').trim();
  return cleaned || 'No-Reply';
}

/**
 * Build `Clinic Name <no-reply-clinic@baamplatform.com>`.
 *
 * `localPart` may be a local part or a full address. A full address is used
 * only when it is on the verified domain. Anything else is ignored, so a
 * clinic cannot send from an unverified domain and have Resend reject it.
 */
export function clinicSenderFrom(input: {
  siteId: string;
  displayName?: string | null;
  localPart?: string | null;
}): string {
  const domain = verifiedFromDomain();
  const requested = (input.localPart || '').trim();
  const requestedAddress = addressIn(requested);
  const requestedDomain = requestedAddress.includes('@')
    ? requestedAddress.slice(requestedAddress.lastIndexOf('@') + 1)
    : '';
  const onOurDomain = !requestedDomain || requestedDomain === domain;
  const local =
    (onOurDomain ? localPart(requestedAddress || requested) : '') ||
    `no-reply-${localPart(input.siteId) || 'clinic'}`;

  if (requested && !onOurDomain) {
    console.warn(
      `[email] ignored sender "${requested}" because it is not @${domain}`
    );
  }

  return `${displayName(input.displayName)} <${local}@${domain}>`;
}
