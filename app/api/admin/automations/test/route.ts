import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canManageBookings, requireSiteAccess } from '@/lib/admin/permissions';
import { executeAutomation, sampledPayload } from '@/lib/automations/dispatch';
import { recordDelivery } from '@/lib/automations/store';
import type { Automation } from '@/lib/types';

// Run a single automation against a sample payload and return the result. Logs
// it as a test delivery so it shows in the delivery log (flagged is_test).
export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });

  const payload = await request.json().catch(() => ({}));
  const siteId = String(payload?.siteId || '');
  const automation = payload?.automation as Automation | undefined;
  if (!siteId || !automation) {
    return NextResponse.json({ message: 'Missing siteId or automation' }, { status: 400 });
  }
  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }
  if (!canManageBookings(session.user)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const sample = sampledPayload(automation.trigger);
  const result = await executeAutomation(automation, sample);

  await recordDelivery({
    siteId,
    automationId: automation.id || null,
    automationName: automation.name || 'Test',
    trigger: automation.trigger,
    targetUrl: automation.action?.url || '',
    status: result.status,
    statusCode: result.statusCode,
    error: result.error,
    isTest: true,
  });

  return NextResponse.json({ result, sample });
}
