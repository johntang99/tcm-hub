import type {
  AutomationAction,
  AutomationKV,
  AutomationTrigger,
  ConnectorType,
} from '@/lib/types';

// BAAM Review's universal intake endpoint. The per-location API key (sent as a
// Bearer header) is what tells BAAM which business the customer belongs to.
export const BAAM_REVIEW_URL = 'https://baamreview.com/api/integrations/review-request';

export interface ConnectorMeta {
  value: ConnectorType;
  label: string;
  description: string;
  /** Which single config field the admin must fill for this connector. */
  needs: 'apiKey' | 'webhookUrl' | 'custom';
}

// Order = the dropdown order. BAAM-direct first (the default, cheapest path).
export const CONNECTORS: ConnectorMeta[] = [
  {
    value: 'baam-review',
    label: 'BAAM Review (direct)',
    description: 'Send the customer straight to your BAAM Review queue. Paste this location’s API key.',
    needs: 'apiKey',
  },
  {
    value: 'n8n',
    label: 'n8n (bridge)',
    description: 'Send to an n8n webhook — use for branching, delays, or fan-out to several systems.',
    needs: 'webhookUrl',
  },
  {
    value: 'zapier',
    label: 'Zapier',
    description: 'Send to a Zapier catch-hook URL.',
    needs: 'webhookUrl',
  },
  {
    value: 'custom',
    label: 'Custom webhook',
    description: 'POST to any URL with your own headers and fields.',
    needs: 'custom',
  },
];

// The default contact field map (shared by baam-review / n8n / zapier presets).
// Values still carry {{placeholders}} — buildRequest renders them per payload.
export function defaultFields(trigger: AutomationTrigger): AutomationKV[] {
  if (trigger === 'lead.created') {
    return [
      { key: 'name', value: '{{lead.name}}' },
      { key: 'email', value: '{{lead.email}}' },
      { key: 'phone', value: '{{lead.phone}}' },
    ];
  }
  return [
    { key: 'name', value: '{{booking.name}}' },
    { key: 'email', value: '{{booking.email}}' },
    { key: 'phone', value: '{{booking.phone}}' },
    { key: 'service', value: '{{service.name}}' },
    { key: 'transacted_at', value: '{{booking.date}}T{{booking.time}}:00' },
    { key: 'external_id', value: '{{booking.id}}' },
  ];
}

export interface ResolvedAction {
  url: string;
  contentType: 'json' | 'form';
  headers: AutomationKV[];
  fields: AutomationKV[];
}

/**
 * Turn a connector + its config into a concrete request shape. Placeholders are
 * left intact — dispatch.buildRequest renders them against the event payload.
 * Missing connector falls back to 'custom' so pre-connector rows still work.
 */
export function resolveConnector(
  action: AutomationAction,
  trigger: AutomationTrigger,
): ResolvedAction {
  const connector = action.connector ?? 'custom';
  switch (connector) {
    case 'baam-review':
      return {
        url: BAAM_REVIEW_URL,
        contentType: 'json',
        headers: [{ key: 'Authorization', value: `Bearer ${(action.apiKey || '').trim()}` }],
        fields: action.fields?.length ? action.fields : defaultFields(trigger),
      };
    case 'n8n':
    case 'zapier':
      return {
        url: (action.webhookUrl || '').trim(),
        contentType: action.contentType ?? 'json',
        headers: action.headers ?? [],
        fields: action.fields?.length ? action.fields : defaultFields(trigger),
      };
    case 'custom':
    default:
      return {
        url: (action.url || action.webhookUrl || '').trim(),
        contentType: action.contentType ?? 'json',
        headers: action.headers ?? [],
        fields: action.fields ?? [],
      };
  }
}

/** Effective destination URL — for the delivery log + "is it ready to test" checks. */
export function resolvedUrl(action: AutomationAction, trigger: AutomationTrigger): string {
  return resolveConnector(action, trigger).url;
}
