import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/admin/auth';
import { canManageBookings, requireSiteAccess } from '@/lib/admin/permissions';
import { listAutomations, saveAutomations } from '@/lib/automations/store';
import type { Automation, ConnectorType } from '@/lib/types';

const CONNECTORS: ConnectorType[] = ['baam-review', 'n8n', 'zapier', 'custom'];

async function authorize(request: NextRequest, siteId: string) {
  const session = await getSessionFromRequest(request);
  if (!session) return { ok: false as const, status: 401, error: 'Not authenticated' };
  if (!siteId) return { ok: false as const, status: 400, error: 'Missing siteId' };
  try {
    requireSiteAccess(session.user, siteId);
  } catch {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }
  if (!canManageBookings(session.user)) {
    return { ok: false as const, status: 403, error: 'Forbidden' };
  }
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  const siteId = new URL(request.url).searchParams.get('siteId') || '';
  const authz = await authorize(request, siteId);
  if (!authz.ok) return NextResponse.json({ message: authz.error }, { status: authz.status });
  const automations = await listAutomations(siteId);
  return NextResponse.json({ automations });
}

export async function PUT(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  const siteId = String(payload?.siteId || '');
  const authz = await authorize(request, siteId);
  if (!authz.ok) return NextResponse.json({ message: authz.error }, { status: authz.status });

  const incoming = Array.isArray(payload?.automations) ? payload.automations : [];
  // Coerce to a safe shape.
  const automations: Automation[] = incoming.map((a: Record<string, unknown>) => {
    const act = (a.action as Record<string, unknown>) || {};
    const connector = CONNECTORS.includes(act.connector as ConnectorType)
      ? (act.connector as ConnectorType)
      : 'custom';
    return {
      id: String(a.id),
      name: String(a.name || 'Untitled automation'),
      enabled: a.enabled !== false,
      trigger: a.trigger as Automation['trigger'],
      action: {
        method: 'POST',
        connector,
        apiKey: String(act.apiKey || '') || undefined,
        webhookUrl: String(act.webhookUrl || '') || undefined,
        url: String(act.url || ''),
        contentType: act.contentType === 'form' ? 'form' : 'json',
        headers: (act.headers as Automation['action']['headers']) || [],
        fields: (act.fields as Automation['action']['fields']) || [],
      },
    };
  });

  try {
    await saveAutomations(siteId, automations);
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Save failed' },
      { status: 500 },
    );
  }
  return NextResponse.json({ status: 'ok' });
}
