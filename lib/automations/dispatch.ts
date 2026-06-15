import type { Automation, AutomationAction, AutomationTrigger } from '@/lib/types';
import { listAutomations, recordDelivery } from './store';

export type EventPayload = Record<string, unknown>;

// Resolve "a.b.c" against a nested object.
function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/** Replace {{ path }} placeholders in a string with values from the payload. */
export function renderTemplate(tpl: string, payload: EventPayload): string {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, path) => {
    const v = getPath(payload, path);
    return v === undefined || v === null ? '' : String(v);
  });
}

/** Build the HTTP request (url, headers, body) for an automation + payload.
 *  Pure — no network. Exposed for testing. */
export function buildRequest(action: AutomationAction, payload: EventPayload) {
  const url = action.url;
  const contentType = action.contentType ?? 'json';

  const fields: Record<string, string> = {};
  for (const f of action.fields ?? []) {
    if (!f.key) continue;
    fields[f.key] = renderTemplate(f.value ?? '', payload);
  }

  const headers: Record<string, string> = {};
  for (const h of action.headers ?? []) {
    if (h.key) headers[h.key] = renderTemplate(h.value ?? '', payload);
  }

  let body: string;
  if (contentType === 'form') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/x-www-form-urlencoded';
    body = new URLSearchParams(fields).toString();
  } else {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    body = JSON.stringify(fields);
  }
  return { url, method: 'POST' as const, headers, body };
}

export interface ExecuteResult {
  status: 'ok' | 'failed';
  statusCode: number | null;
  error: string | null;
}

/** Fire one automation's HTTP request. Never throws. */
export async function executeAutomation(
  automation: Automation,
  payload: EventPayload,
): Promise<ExecuteResult> {
  if (!automation.action?.url) {
    return { status: 'failed', statusCode: null, error: 'No target URL configured' };
  }
  try {
    const req = buildRequest(automation.action, payload);
    const res = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => '')).slice(0, 300);
      return { status: 'failed', statusCode: res.status, error: detail || `HTTP ${res.status}` };
    }
    return { status: 'ok', statusCode: res.status, error: null };
  } catch (e) {
    return {
      status: 'failed',
      statusCode: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Dispatch a trigger event: run every enabled automation on the site that
 * listens for it, logging each delivery. Fire-and-forget — never throws to the
 * caller (a booking/lead must succeed regardless).
 */
export async function dispatchEvent(
  siteId: string,
  trigger: AutomationTrigger,
  payload: EventPayload,
): Promise<void> {
  try {
    const all = await listAutomations(siteId);
    const matching = all.filter((a) => a.enabled && a.trigger === trigger);
    await Promise.all(
      matching.map(async (a) => {
        const result = await executeAutomation(a, payload);
        await recordDelivery({
          siteId,
          automationId: a.id,
          automationName: a.name,
          trigger,
          targetUrl: a.action.url,
          status: result.status,
          statusCode: result.statusCode,
          error: result.error,
          isTest: false,
        });
      }),
    );
  } catch (e) {
    console.error('[automations] dispatch error:', e);
  }
}

/** Realistic sample payload for the admin "Run test" button. */
export function sampledPayload(trigger: AutomationTrigger): EventPayload {
  if (trigger === 'lead.created') {
    return {
      lead: {
        name: 'Test Lead',
        email: 'test.lead@example.com',
        phone: '+12125550123',
        reason: 'General enquiry',
        message: 'This is a test automation payload.',
      },
    };
  }
  return {
    booking: {
      id: 'bk_test_0001',
      name: 'Test Patient',
      email: 'test.patient@example.com',
      phone: '+12125550123',
      date: '2026-06-20',
      time: '10:00',
    },
    service: { name: 'Acupuncture' },
  };
}
