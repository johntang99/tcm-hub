-- Site Automations — the per-site "mini-Zapier".
--
-- Each row is one automation: when a TRIGGER event fires on a site
-- (booking.confirmed, booking.created, lead.created), POST a mapped payload to
-- an ACTION url. automation_deliveries is the run log (success/failure + code),
-- powering the admin "delivery log" and "Run test" surfaces.
--
-- Admin UI: /admin/automations (components/admin/AutomationsManager.tsx)
-- Dispatch: lib/automations/dispatch.ts (wired into booking + contact routes)

CREATE TABLE IF NOT EXISTS site_automations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        text NOT NULL,
  name           text NOT NULL,
  enabled        boolean NOT NULL DEFAULT true,
  trigger_event  text NOT NULL
                   CHECK (trigger_event IN ('booking.confirmed', 'booking.created', 'lead.created')),
  action         jsonb NOT NULL,   -- { url, method, contentType, headers[], fields[] }
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_automations_site
  ON site_automations (site_id);
CREATE INDEX IF NOT EXISTS idx_site_automations_dispatch
  ON site_automations (site_id, trigger_event) WHERE enabled = true;

CREATE TABLE IF NOT EXISTS automation_deliveries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         text NOT NULL,
  automation_id   uuid,
  automation_name text NOT NULL,
  trigger_event   text NOT NULL,
  target_url      text NOT NULL,
  status          text NOT NULL CHECK (status IN ('ok', 'failed')),
  status_code     integer,
  error           text,
  is_test         boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_deliveries_site_time
  ON automation_deliveries (site_id, created_at DESC);

-- updated_at trigger for site_automations
CREATE OR REPLACE FUNCTION set_site_automations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'site_automations_set_updated_at'
      AND tgrelid = 'public.site_automations'::regclass
  ) THEN
    CREATE TRIGGER site_automations_set_updated_at
      BEFORE UPDATE ON public.site_automations
      FOR EACH ROW EXECUTE FUNCTION set_site_automations_updated_at();
  END IF;
END $$;

ALTER TABLE site_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_deliveries ENABLE ROW LEVEL SECURITY;

-- Service role only — admin APIs and the dispatcher use the service-role client.
CREATE POLICY "service_manage_automations"
  ON site_automations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_manage_automation_deliveries"
  ON automation_deliveries FOR ALL USING (auth.role() = 'service_role');
