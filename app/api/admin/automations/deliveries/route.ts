import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canManageBookings, requireSiteAccess } from '@/lib/admin/permissions';
import { listDeliveries } from '@/lib/automations/store';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  const siteId = new URL(request.url).searchParams.get('siteId') || '';
  if (!siteId) return NextResponse.json({ message: 'Missing siteId' }, { status: 400 });
  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!canManageBookings(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  const deliveries = await listDeliveries(siteId, 50);
  return NextResponse.json({ deliveries });
}
