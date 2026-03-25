# Acu-Flushing — SEO Implementation Plan
## Site: acupunctureflushing.com (site_id: acu-flushing)

| | |
|---|---|
| **Date** | March 25, 2026 |
| **Business** | Flushing Acupuncture & TCM |
| **Practitioner** | Dr. Li, L.Ac., DAOM |
| **Location** | 143-26 41st Ave, Flushing, NY 11355 |
| **Phone** | (718) 888-9512 |
| **Languages** | English, Mandarin Chinese |
| **System** | Same codebase as DrHuangClinic (multi-site, Supabase, dynamic [slug] route) |

---

## Current Status vs Dr. Huang (Reference Site)

| SEO Component | Dr. Huang (done) | Acu-Flushing (current) | Gap |
|--------------|------------------|----------------------|-----|
| site_seo_pages registered | 9 slugs | 5 slugs | Missing 4 service pages |
| Core landing page | ✓ acupuncture-middletown-ny | ✓ acupuncture-flushing-ny | Done |
| Condition pages (3) | ✓ back pain, insomnia, anxiety | ✓ back pain, insomnia, anxiety | Done |
| Resource page (cost) | ✓ acupuncture-cost-middletown-ny | ✓ acupuncture-cost-flushing-ny | Done |
| Service pages (4) | ✓ herbal medicine, cupping, moxibustion, tui na | ✗ None | **Build** |
| ZH locale pages | ✓ 5 pages (partial) | ✗ 0 pages | **Build** |
| seo objects on existing pages | ✓ home, about, services, contact | ✗ None | **Add** |
| Homepage SEO hub section | ✓ "Everything You Need to Know" | ✗ None | **Add** |
| Footer SEO columns | ✓ Resources + Service Areas | ✗ None | **Add** |
| Header nav link to core page | ✓ | ✗ | **Add** |
| FAQ schema on pages | ✓ All SEO pages | ✓ (via layouts) | Done |
| Internal links (product → landing) | ✓ Visible section | ✗ Not applicable (different page structure) | — |
| Sitemap includes SEO pages | ✓ | ✓ (via site_seo_pages query) | Done |
| GSC submitted | ✓ | ✗ | **Manual** |

---

## Implementation Phases

| Phase | What | Effort | Timeline |
|-------|------|--------|----------|
| **Phase 1** | Run pipeline: generate 4 service pages + ZH locale for all 9 pages | Automated — 5 min | Now |
| **Phase 2** | Add seo objects to existing pages (home, about, services, contact) | Automated — 5 min | Now |
| **Phase 3** | Add homepage SEO hub + footer columns + header nav link | Code + DB update — 15 min | Now |
| **Phase 4** | Verify all pages render correctly | Test — 10 min | Now |
| **Phase 5** | Submit sitemap + URLs to GSC | Manual — 15 min | After deploy |
| **Phase 6** | GBP optimization + reviews + backlinks | Manual — ongoing | After Phase 5 |

---

## Phase 1 — Generate Missing SEO Pages (Automated)

### 1.1 Generate 4 Service Pages

Run the pipeline to generate service pages for the 4 modalities in intake.json:

```bash
node scripts/seed-seo-pages.mjs acu-flushing
```

This will create:

| Page | Slug | Type |
|------|------|------|
| Chinese Herbal Medicine | `chinese-herbal-medicine-flushing-ny` | seo-service |
| Cupping Therapy | `cupping-therapy-flushing-ny` | seo-service |
| Moxibustion | `moxibustion-flushing-ny` | seo-service |
| Tui Na Massage | `tui-na-massage-flushing-ny` | seo-service |

Plus ZH versions of all 9 pages (5 existing + 4 new).

### 1.2 Expected Result After Pipeline

| Type | Count | Slugs |
|------|-------|-------|
| seo-local-landing | 1 | acupuncture-flushing-ny |
| seo-condition | 3 | back pain, insomnia, anxiety |
| seo-resource | 1 | acupuncture-cost-flushing-ny |
| seo-service | 4 | herbal medicine, cupping, moxibustion, tui na |
| **Total** | **9 slugs × 2 locales = 18 pages** | |

---

## Phase 2 — Add SEO Objects to Existing Pages

Update content_entries for existing pages to add `seo` objects:

| Page | seo.title | Priority |
|------|-----------|----------|
| home | Already in seo.json — needs sync to DB | P1 |
| about | Already in seo.json — needs sync to DB | P1 |
| services | Already in seo.json — needs sync to DB | P1 |
| contact | Already in seo.json — needs sync to DB | P1 |

---

## Phase 3 — Internal Link Rewiring + Navigation Updates

> **Critical step:** All existing pages (homepage, services, conditions) must link to SEO pages instead of anchor links. This is what drives internal link authority to the SEO pages.

### 3.1 Homepage — Services Section Links

Rewrite `services.services[].link` and `services.featured.link` in `pages/home.json` DB content:

| Service | Before | After |
|---------|--------|-------|
| Acupuncture (featured) | `/en/services#acupuncture` | `/en/acupuncture-flushing-ny` |
| Chinese Herbal Medicine | `/en/services#herbs` | `/en/chinese-herbal-medicine-flushing-ny` |
| Cupping Therapy | `/en/services#cupping` | `/en/cupping-therapy-flushing-ny` |
| Moxibustion | `/en/services#moxibustion` | `/en/moxibustion-flushing-ny` |
| Tui Na Massage | `/en/services#tuina` | `/en/tui-na-massage-flushing-ny` |
| Gua Sha | `/en/services#gua-sha` | stays (no SEO page) |

### 3.2 Homepage — Conditions Section Links

Rewrite `conditions.conditions[].link` in `pages/home.json` DB content:

| Condition | Before | After |
|-----------|--------|-------|
| Back Pain | `/en/conditions#back-pain` | `/en/acupuncture-for-back-pain-flushing-ny` |
| Anxiety & Panic | `/en/conditions#anxiety` | `/en/acupuncture-for-anxiety-flushing-ny` |
| Others without SEO pages | anchor links | stay as-is |

### 3.3 Services Page (`pages/services.json`) — Add Links

Update `servicesList.items[].link` — each service with an SEO page gets a link:

| Service ID | Link Added |
|------------|-----------|
| acupuncture | `/en/acupuncture-flushing-ny` |
| chinese-herbal-medicine | `/en/chinese-herbal-medicine-flushing-ny` |
| cupping-therapy | `/en/cupping-therapy-flushing-ny` |
| moxibustion | `/en/moxibustion-flushing-ny` |
| tuina-massage | `/en/tui-na-massage-flushing-ny` |

> The `ServicesSection` component already renders "Learn More →" links when `service.link` exists (added during Dr. Huang retrofit).

### 3.4 Conditions Page (`pages/conditions.json`) — Add Links

Update `conditions[].link` for conditions that have SEO pages:

| Condition | Link Added |
|-----------|-----------|
| Back Pain (+ neck/shoulder, arthritis) | `/en/acupuncture-for-back-pain-flushing-ny` |
| Anxiety & Panic | `/en/acupuncture-for-anxiety-flushing-ny` |
| Insomnia & Sleep | `/en/acupuncture-for-insomnia-flushing-ny` |

### 3.5 Homepage — seoLink to Core Landing Page

Add `services.seoLink` to homepage content:
```json
{ "url": "/en/acupuncture-flushing-ny", "text": "Acupuncture in Flushing, NY" }
```

### 3.6 Header Navigation — Core Landing Page

Add "Acupuncture" nav item linking to `/en/acupuncture-flushing-ny` after "Home".

### 3.7 Footer — Resources + Service Areas Columns

Add to `footer.json` DB content:

| Column | Links |
|--------|-------|
| **Resources** | Acupuncture Cost → `/en/acupuncture-cost-flushing-ny` |
| | Acupuncture in Flushing → `/en/acupuncture-flushing-ny` |
| **Service Areas** | Flushing, NY → `/en/acupuncture-flushing-ny` |
| | Back Pain Treatment → `/en/acupuncture-for-back-pain-flushing-ny` |
| | Insomnia Treatment → `/en/acupuncture-for-insomnia-flushing-ny` |
| | Anxiety Treatment → `/en/acupuncture-for-anxiety-flushing-ny` |

---

## Phase 4 — Verification

Run verify script:
```bash
node scripts/verify-site.mjs acu-flushing
```

Then run pipeline in QA mode:
```bash
node scripts/seo-pipeline.mjs acu-flushing --skip-generation
```

### Done-Gate
- [ ] 9 site_seo_pages rows (all active)
- [ ] 18 content_entries (9 EN + 9 ZH)
- [ ] All pages return HTTP 200 via [slug] route
- [ ] All titles ≤ 60 chars, descriptions ≤ 155 chars
- [ ] All H1s unique
- [ ] FAQPage schema on all SEO pages
- [ ] Homepage hub section links to all 9 pages
- [ ] Footer has Resources column
- [ ] Header has core landing page link
- [ ] No TypeScript errors

---

## Phase 5 — Google Search Console (Manual)

### Sitemap
```
https://acupunctureflushing.com/sitemap.xml
```

### URLs to Request Indexing
```
https://acupunctureflushing.com/en/acupuncture-flushing-ny
https://acupunctureflushing.com/en/acupuncture-for-back-pain-flushing-ny
https://acupunctureflushing.com/en/acupuncture-for-insomnia-flushing-ny
https://acupunctureflushing.com/en/acupuncture-for-anxiety-flushing-ny
https://acupunctureflushing.com/en/acupuncture-cost-flushing-ny
https://acupunctureflushing.com/en/chinese-herbal-medicine-flushing-ny
https://acupunctureflushing.com/en/cupping-therapy-flushing-ny
https://acupunctureflushing.com/en/moxibustion-flushing-ny
https://acupunctureflushing.com/en/tui-na-massage-flushing-ny
```

---

## Phase 6 — Ongoing (Manual)

| Task | Priority | Frequency |
|------|----------|-----------|
| Optimize GBP listing (services, photos, Q&As) | High | Once |
| Set up review collection system | High | Once + ongoing |
| Monthly GSC review | Medium | Monthly |
| Monthly AI citation monitoring | Medium | Monthly |
| Blog posts targeting long-tail keywords | Medium | 2/month |
| Backlink building | Medium | Ongoing |
| GBP posts | Low | Weekly |

---

## Key Advantage: Pipeline Automation

Since Acu-Flushing uses the same codebase as Dr. Huang, all the infrastructure is already in place:
- `[slug]/page.tsx` dynamic route ✓
- `SEO*Layout.tsx` components ✓
- `site_seo_pages` DB table ✓
- `seed-seo-pages.mjs` pipeline ✓
- `getServiceSEOLinks()` auto-linking ✓

**Phase 1–4 can be completed in ~30 minutes** by running the pipeline + a few DB updates. No new code needed.

---

*Acu-Flushing SEO Implementation Plan — March 25, 2026*
*Ref: BAAM SEO Playbook | DrHuang retrofit as reference implementation*
