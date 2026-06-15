import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  Automation,
  AutomationAction,
  AutomationDelivery,
  AutomationTrigger,
} from '@/lib/types';

const TABLE = 'site_automations';
const DELIVERIES = 'automation_deliveries';

interface AutomationRow {
  id: string;
  site_id: string;
  name: string;
  enabled: boolean;
  trigger_event: AutomationTrigger;
  action: AutomationAction;
  created_at: string;
  updated_at: string;
}

function mapRow(r: AutomationRow): Automation {
  return {
    id: r.id,
    name: r.name,
    enabled: r.enabled,
    trigger: r.trigger_event,
    action: r.action,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listAutomations(siteId: string): Promise<Automation[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('listAutomations error:', error.message);
    return [];
  }
  return ((data as AutomationRow[]) || []).map(mapRow);
}

/** Replace the site's automation set: upsert the provided rows, delete the rest. */
export async function saveAutomations(
  siteId: string,
  automations: Automation[],
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error('Database not configured');

  const rows = automations.map((a) => ({
    id: a.id,
    site_id: siteId,
    name: a.name,
    enabled: a.enabled,
    trigger_event: a.trigger,
    action: a.action,
  }));

  if (rows.length > 0) {
    const { error } = await supabase.from(TABLE).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`saveAutomations upsert: ${error.message}`);
  }

  // Delete any of this site's automations not in the incoming set.
  const keepIds = rows.map((r) => r.id);
  let del = supabase.from(TABLE).delete().eq('site_id', siteId);
  if (keepIds.length > 0) {
    del = del.not('id', 'in', `(${keepIds.join(',')})`);
  }
  const { error: delErr } = await del;
  if (delErr) throw new Error(`saveAutomations delete: ${delErr.message}`);
}

export async function recordDelivery(
  d: Omit<AutomationDelivery, 'id' | 'createdAt'> & { siteId: string },
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  const { error } = await supabase.from(DELIVERIES).insert({
    site_id: d.siteId,
    automation_id: d.automationId,
    automation_name: d.automationName,
    trigger_event: d.trigger,
    target_url: d.targetUrl,
    status: d.status,
    status_code: d.statusCode,
    error: d.error,
    is_test: d.isTest,
  });
  if (error) console.error('recordDelivery error:', error.message);
}

export async function listDeliveries(
  siteId: string,
  limit = 50,
): Promise<AutomationDelivery[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(DELIVERIES)
    .select('*')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('listDeliveries error:', error.message);
    return [];
  }
  return ((data as Record<string, unknown>[]) || []).map((r) => ({
    id: r.id as string,
    automationId: (r.automation_id as string) ?? null,
    automationName: r.automation_name as string,
    trigger: r.trigger_event as string,
    targetUrl: r.target_url as string,
    status: r.status as 'ok' | 'failed',
    statusCode: (r.status_code as number) ?? null,
    error: (r.error as string) ?? null,
    isTest: !!r.is_test,
    createdAt: r.created_at as string,
  }));
}
