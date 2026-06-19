'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Automation,
  AutomationDelivery,
  AutomationKV,
  AutomationTrigger,
  ConnectorType,
  SiteConfig,
} from '@/lib/types';
import { CONNECTORS } from '@/lib/automations/connectors';
import { Button } from '@/components/ui';

interface Props {
  sites: SiteConfig[];
  selectedSiteId: string;
}

const TRIGGERS: { value: AutomationTrigger; label: string }[] = [
  { value: 'booking.confirmed', label: 'Booking confirmed' },
  { value: 'booking.created', label: 'Booking created' },
  { value: 'lead.created', label: 'Lead / contact form submitted' },
];

const VARIABLES: Record<AutomationTrigger, string[]> = {
  'booking.confirmed': [
    'booking.id', 'booking.name', 'booking.email', 'booking.phone',
    'booking.date', 'booking.time', 'service.name',
  ],
  'booking.created': [
    'booking.id', 'booking.name', 'booking.email', 'booking.phone',
    'booking.date', 'booking.time', 'service.name',
  ],
  'lead.created': [
    'lead.name', 'lead.email', 'lead.phone', 'lead.reason', 'lead.reasonLabel', 'lead.message',
  ],
};

// New automations default to the BAAM Review (direct) connector — the cheapest,
// one-hop path. Fields are left empty so the preset's default map is used.
function newAutomation(trigger: AutomationTrigger): Automation {
  return {
    id: crypto.randomUUID(),
    name: 'New automation',
    enabled: true,
    trigger,
    action: {
      method: 'POST',
      connector: 'baam-review',
      apiKey: '',
      webhookUrl: '',
      url: '',
      contentType: 'json',
      headers: [],
      fields: [],
    },
  };
}

// Is this automation configured enough to test/run? (depends on its connector)
function actionReady(a: Automation): boolean {
  const c = a.action.connector ?? 'custom';
  if (c === 'baam-review') return !!a.action.apiKey?.trim();
  if (c === 'n8n' || c === 'zapier') return !!a.action.webhookUrl?.trim();
  return !!a.action.url?.trim();
}

export function AutomationsManager({ sites, selectedSiteId }: Props) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(selectedSiteId);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [deliveries, setDeliveries] = useState<AutomationDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, { busy?: boolean; msg?: string; ok?: boolean }>>({});

  const load = useCallback(async () => {
    if (!siteId) return;
    setLoading(true);
    try {
      const [a, d] = await Promise.all([
        fetch(`/api/admin/automations?siteId=${siteId}`).then((r) => r.json()),
        fetch(`/api/admin/automations/deliveries?siteId=${siteId}`).then((r) => r.json()),
      ]);
      setAutomations(a.automations || []);
      setDeliveries(d.deliveries || []);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  // Refresh only the delivery log — never touches the (possibly unsaved)
  // automations being edited.
  const loadDeliveries = useCallback(async () => {
    if (!siteId) return;
    const d = await fetch(`/api/admin/automations/deliveries?siteId=${siteId}`).then((r) => r.json());
    setDeliveries(d.deliveries || []);
  }, [siteId]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (id: string, patch: Partial<Automation>) =>
    setAutomations((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const updateAction = (id: string, patch: Partial<Automation['action']>) =>
    setAutomations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, action: { ...a.action, ...patch } } : a)),
    );

  const updateKV = (
    id: string,
    listKey: 'headers' | 'fields',
    idx: number,
    patch: Partial<AutomationKV>,
  ) =>
    setAutomations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const list = [...(a.action[listKey] || [])];
        list[idx] = { ...list[idx], ...patch };
        return { ...a, action: { ...a.action, [listKey]: list } };
      }),
    );

  const addKV = (id: string, listKey: 'headers' | 'fields') =>
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, action: { ...a.action, [listKey]: [...(a.action[listKey] || []), { key: '', value: '' }] } }
          : a,
      ),
    );

  const removeKV = (id: string, listKey: 'headers' | 'fields', idx: number) =>
    setAutomations((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, action: { ...a.action, [listKey]: (a.action[listKey] || []).filter((_, i) => i !== idx) } }
          : a,
      ),
    );

  const save = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/automations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, automations }),
      });
      setStatus(res.ok ? 'Saved' : 'Save failed');
      if (res.ok) await load();
    } finally {
      setLoading(false);
    }
  };

  const runTest = async (a: Automation) => {
    setTests((t) => ({ ...t, [a.id]: { busy: true } }));
    try {
      const res = await fetch('/api/admin/automations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, automation: a }),
      });
      const data = await res.json();
      const r = data.result;
      const body: string = r?.responseBody || '';
      const skipped = /"?status"?\s*:\s*"?skipped/i.test(body);
      let msg: string;
      if (r?.status !== 'ok') {
        msg = `Failed: ${r?.error || 'unknown'}`;
      } else if (skipped) {
        // Target accepted it but didn't act (e.g. BAAM Review 60-day dedupe).
        msg = `Sent ✓ (HTTP ${r.statusCode}) — target skipped it: ${body}. The sample contact is reused each test, so this is expected. A real booking with a new contact will be added.`;
      } else {
        msg = `Sent ✓ (HTTP ${r.statusCode})${body ? ` — ${body}` : ''}`;
      }
      setTests((t) => ({ ...t, [a.id]: { ok: r?.status === 'ok', msg } }));
      loadDeliveries();
    } catch {
      setTests((t) => ({ ...t, [a.id]: { ok: false, msg: 'Request error' } }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Automations</h1>
          <p className="text-sm text-gray-600">
            When something happens on this site, POST it anywhere — your own Zapier.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Site</label>
            <select
              className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
              value={siteId}
              onChange={(e) => {
                setSiteId(e.target.value);
                router.replace(`/admin/automations?siteId=${e.target.value}`);
              }}
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setAutomations((prev) => [...prev, newAutomation('booking.confirmed')])}
          >
            + Add automation
          </Button>
        </div>
      </div>

      {status && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {status}
        </div>
      )}

      <div className="space-y-4">
        {automations.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
            No automations yet. Click “Add automation” to create one.
          </div>
        )}

        {automations.map((a) => {
          const conn = a.action.connector ?? 'custom';
          const meta = CONNECTORS.find((c) => c.value === conn);
          return (
          <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <input
                className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium"
                value={a.name}
                onChange={(e) => update(a.id, { name: e.target.value })}
              />
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={(e) => update(a.id, { enabled: e.target.checked })}
                />
                Enabled
              </label>
              <button
                type="button"
                className="text-xs text-red-600 hover:underline"
                onClick={() => setAutomations((prev) => prev.filter((x) => x.id !== a.id))}
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-500">When (trigger)</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={a.trigger}
                  onChange={(e) => update(a.id, { trigger: e.target.value as AutomationTrigger })}
                >
                  {TRIGGERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Send to (connector)</label>
                <select
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                  value={conn}
                  onChange={(e) => updateAction(a.id, { connector: e.target.value as ConnectorType })}
                >
                  {CONNECTORS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {meta && <p className="text-[11px] text-gray-400 -mt-1">{meta.description}</p>}

            {/* Connector-specific config */}
            {conn === 'baam-review' && (
              <div>
                <label className="block text-xs text-gray-500">BAAM Review API key (this location)</label>
                <input
                  placeholder="brk_…"
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                  value={a.action.apiKey || ''}
                  onChange={(e) => updateAction(a.id, { apiKey: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Generate it in BAAM Review → Location Setup → Integrations · API keys. Name, email,
                  phone &amp; service are sent automatically.
                </p>
              </div>
            )}

            {(conn === 'n8n' || conn === 'zapier') && (
              <div>
                <label className="block text-xs text-gray-500">
                  {conn === 'n8n' ? 'n8n' : 'Zapier'} webhook URL
                </label>
                <input
                  placeholder={conn === 'n8n'
                    ? 'https://n8n.baamplatform.com/webhook/…'
                    : 'https://hooks.zapier.com/hooks/catch/…'}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                  value={a.action.webhookUrl || ''}
                  onChange={(e) => updateAction(a.id, { webhookUrl: e.target.value })}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Name, email, phone &amp; service are sent automatically — map them inside {conn === 'n8n' ? 'n8n' : 'Zapier'}.
                </p>
              </div>
            )}

            {conn === 'custom' && (
              <>
                <div>
                  <label className="block text-xs text-gray-500">POST to URL</label>
                  <input
                    placeholder="https://example.com/webhook"
                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-mono"
                    value={a.action.url || ''}
                    onChange={(e) => updateAction(a.id, { url: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500">Body format</label>
                  <select
                    className="mt-1 rounded-md border border-gray-200 px-3 py-2 text-sm"
                    value={a.action.contentType || 'json'}
                    onChange={(e) => updateAction(a.id, { contentType: e.target.value as 'json' | 'form' })}
                  >
                    <option value="json">JSON</option>
                    <option value="form">Form-encoded</option>
                  </select>
                </div>

                {/* Headers */}
                <KVEditor
                  title="Headers (e.g. Authorization: Bearer brk_…)"
                  rows={a.action.headers || []}
                  onAdd={() => addKV(a.id, 'headers')}
                  onRemove={(i) => removeKV(a.id, 'headers', i)}
                  onChange={(i, patch) => updateKV(a.id, 'headers', i, patch)}
                  keyPlaceholder="Header name"
                  valuePlaceholder="Value"
                />

                {/* Fields */}
                <KVEditor
                  title="Fields (value supports {{placeholders}})"
                  rows={a.action.fields || []}
                  onAdd={() => addKV(a.id, 'fields')}
                  onRemove={(i) => removeKV(a.id, 'fields', i)}
                  onChange={(i, patch) => updateKV(a.id, 'fields', i, patch)}
                  keyPlaceholder="field"
                  valuePlaceholder="{{booking.email}}"
                />

                <div className="text-[11px] text-gray-400">
                  Available variables: {VARIABLES[a.trigger].map((v) => `{{${v}}}`).join('  ')}
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => runTest(a)}
                disabled={tests[a.id]?.busy || !actionReady(a)}
              >
                {tests[a.id]?.busy ? 'Testing…' : 'Run test'}
              </Button>
              {tests[a.id]?.msg && (
                <span className={`text-xs font-medium ${tests[a.id]?.ok ? 'text-green-700' : 'text-red-600'}`}>
                  {tests[a.id]?.msg}
                </span>
              )}
            </div>
          </div>
          );
        })}
      </div>

      <Button type="button" onClick={save} disabled={loading}>
        Save automations
      </Button>

      {/* Delivery log */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-gray-900 mb-3">Recent deliveries</div>
        {deliveries.length === 0 ? (
          <p className="text-sm text-gray-500">No deliveries yet.</p>
        ) : (
          <div className="space-y-1.5">
            {deliveries.map((d) => (
              <div key={d.id} className="flex items-center gap-3 text-xs border-b border-gray-100 pb-1.5">
                <span className={`font-semibold ${d.status === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                  {d.status === 'ok' ? '✓' : '✕'}
                </span>
                <span className="text-gray-500 w-36 shrink-0">{new Date(d.createdAt).toLocaleString()}</span>
                <span className="font-medium text-gray-800">{d.automationName}</span>
                <span className="text-gray-400">{d.trigger}{d.isTest ? ' · test' : ''}</span>
                <span className="text-gray-400 truncate flex-1">{d.targetUrl}</span>
                <span className="text-gray-500">{d.statusCode ?? d.error ?? ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KVEditor({
  title, rows, onAdd, onRemove, onChange, keyPlaceholder, valuePlaceholder,
}: {
  title: string;
  rows: AutomationKV[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onChange: (i: number, patch: Partial<AutomationKV>) => void;
  keyPlaceholder: string;
  valuePlaceholder: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs text-gray-500">{title}</label>
        <button type="button" className="text-xs text-emerald-700 hover:underline" onClick={onAdd}>
          + Add row
        </button>
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="w-1/3 rounded-md border border-gray-200 px-2 py-1.5 text-sm font-mono"
              placeholder={keyPlaceholder}
              value={row.key}
              onChange={(e) => onChange(i, { key: e.target.value })}
            />
            <input
              className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm font-mono"
              placeholder={valuePlaceholder}
              value={row.value}
              onChange={(e) => onChange(i, { value: e.target.value })}
            />
            <button type="button" className="text-gray-400 hover:text-red-600 px-1" onClick={() => onRemove(i)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
