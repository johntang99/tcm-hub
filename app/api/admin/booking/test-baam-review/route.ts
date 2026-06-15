import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canManageBookings, requireSiteAccess } from '@/lib/admin/permissions';

// Validates a BAAM Review API key by calling its ping endpoint. Server-side so
// the key never round-trips through the browser to a third-party origin and we
// avoid CORS. Returns the bound location name on success.
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
  }
  const payload = await request.json().catch(() => ({}));
  const siteId = String(payload?.siteId || '');
  const apiKey = String(payload?.apiKey || '').trim();
  const apiUrl = (String(payload?.apiUrl || '').trim() || 'https://baamreview.com').replace(/\/$/, '');

  if (!siteId) {
    return NextResponse.json({ ok: false, error: 'Missing siteId' }, { status: 400 });
  }
  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  if (!canManageBookings(session.user)) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Enter an API key first.' }, { status: 400 });
  }

  try {
    const res = await fetch(`${apiUrl}/api/integrations/ping`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (res.status === 401) {
      return NextResponse.json({ ok: false, error: 'Invalid API key.' });
    }
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `BAAM Review returned ${res.status}.` });
    }
    const data = (await res.json().catch(() => null)) as
      | { ok?: boolean; location?: { name?: string } }
      | null;
    if (!data?.ok) {
      return NextResponse.json({ ok: false, error: 'Key not accepted.' });
    }
    return NextResponse.json({ ok: true, location: data.location?.name ?? 'Connected' });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not reach BAAM Review.' });
  }
}
