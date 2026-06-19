import type { Automation, AutomationAction, AutomationTrigger } from '@/lib/types';
import { listAutomations, recordDelivery } from './store';
import { resolveConnector, resolvedUrl } from './connectors';

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
 *  Resolves the connector preset first (BAAM Review / n8n / Zapier / custom),
 *  then renders {{placeholders}}. Pure — no network. Exposed for testing. */
export function buildRequest(
  action: AutomationAction,
  payload: EventPayload,
  trigger: AutomationTrigger,
) {
  const resolved = resolveConnector(action, trigger);
  const url = resolved.url;
  const contentType = resolved.contentType;

  const fields: Record<string, string> = {};
  for (const f of resolved.fields) {
    if (!f.key) continue;
    fields[f.key] = renderTemplate(f.value ?? '', payload);
  }

  const headers: Record<string, string> = {};
  for (const h of resolved.headers) {
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
  /** First ~300 chars of the destination's response body (for the test view). */
  responseBody?: string;
}

/** Fire one automation's HTTP request. Never throws. */
export async function executeAutomation(
  automation: Automation,
  payload: EventPayload,
): Promise<ExecuteResult> {
  try {
    const req = buildRequest(automation.action, payload, automation.trigger);
    if (!req.url) {
      return { status: 'failed', statusCode: null, error: 'No target URL configured' };
    }
    const res = await fetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body,
    });
    const responseBody = (await res.text().catch(() => '')).slice(0, 300);
    if (!res.ok) {
      return { status: 'failed', statusCode: res.status, error: responseBody || `HTTP ${res.status}`, responseBody };
    }
    return { status: 'ok', statusCode: res.status, error: null, responseBody };
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
  trigger: AutomationTrigger | AutomationTrigger[],
  payload: EventPayload,
): Promise<void> {
  const triggers = Array.isArray(trigger) ? trigger : [trigger];
  try {
    const all = await listAutomations(siteId);
    // An automation has ONE trigger; if several event names are passed it still
    // runs at most once (its own trigger must be in the set).
    const matching = all.filter((a) => a.enabled && triggers.includes(a.trigger));
    await Promise.all(
      matching.map(async (a) => {
        const result = await executeAutomation(a, payload);
        await recordDelivery({
          siteId,
          automationId: a.id,
          automationName: a.name,
          trigger: a.trigger,
          targetUrl: resolvedUrl(a.action, a.trigger),
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
