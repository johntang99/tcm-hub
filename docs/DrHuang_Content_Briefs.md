# Dr. Huang Clinic — SEO Content Briefs
## P1 Pages: Core Landing + 3 Condition Pages + 1 Resource Page

> **Version:** 1.0
> **Date:** March 2026
> **Feed to Claude Code:** Yes — reference this file in every page-building session.
> **Pipeline B note:** All `{{variables}}` are substituted by O5 during client onboarding.
> **Content rule:** Write for the patient first, Google second. Every page must also function as a conversion page.

---

## Brief 1 — Core Local Landing Page

**Canonical URL:** `/en/acupuncture-middletown-ny`
**Page Type:** Core landing
**Primary Keyword:** acupuncture middletown ny
**Secondary Keywords:** acupuncturist middletown ny, tcm middletown ny, chinese medicine middletown
**Target Word Count:** 900–1,200 words
**Schema:** LocalBusiness, Service, BreadcrumbList

### SEO Object
```json
{
  "title": "Acupuncture in {{CITY_STATE}} | {{CLINIC_NAME}}",
  "description": "Expert acupuncture & TCM in {{CITY_STATE}}. Back pain, insomnia, stress & more. Book your first visit with {{PRACTITIONER_NAME}} today.",
  "h1": "Acupuncture in {{CITY_STATE}}",
  "canonicalUrl": "/en/acupuncture-{{CITY_SLUG}}-{{STATE_LOWER}}",
  "schema": ["LocalBusiness", "Service", "BreadcrumbList"],
  "noindex": false,
  "priority": 0.9
}
```

### Page Section Structure

**Section 1 — Hero**
- H1: "Acupuncture in {{CITY_STATE}}"
- Subheading: "{{CLINIC_NAME}} — Traditional Chinese Medicine & Acupuncture Care"
- Body: 2 sentences about what the clinic offers and who it serves
- CTA button: "Book Your First Visit" → /contact
- Trust signals below fold: years in practice, number of patients, credentials, languages

**Section 2 — What We Treat**
- H2: "What Conditions Can Acupuncture Help With?"
- 2 intro sentences — acupuncture treats the root cause, not just symptoms
- Grid or list of 6–8 conditions: back pain, neck pain, insomnia, anxiety, stress, fertility, digestive issues, headaches
- Each condition links to its condition page (back pain → /en/acupuncture-for-back-pain-middletown-ny etc.)

**Section 3 — Our Services**
- H2: "Acupuncture & TCM Services at {{CLINIC_NAME}}"
- Cards or list: Acupuncture, Chinese Herbal Medicine, Cupping, Moxibustion, Tui Na
- 1–2 sentences per service
- Link to Chinese Herbal Medicine service page

**Section 4 — Why Choose {{CLINIC_NAME}}**
- H2: "Why Patients Choose {{CLINIC_NAME}} in {{CITY_STATE}}"
- 3–4 trust points: credentials, years of experience, personalized care, multi-language
- 1 short patient testimonial mentioning the city and a specific condition

**Section 5 — FAQ**
- H2: "Frequently Asked Questions About Acupuncture in {{CITY_STATE}}"
- FAQ accordion (4–6 questions) — required for FAQPage schema
- Questions:
  1. How much does acupuncture cost in {{CITY_STATE}}? → brief answer, link to cost page
  2. Is acupuncture painful?
  3. How many sessions will I need?
  4. Does insurance cover acupuncture in {{STATE}}?
  5. What should I expect at my first acupuncture visit?
  6. Do you speak Chinese / other languages?

**Section 6 — Location & Contact**
- H2: "Visit {{CLINIC_NAME}} in {{CITY_STATE}}"
- Google Map embed
- Full NAP block: {{CLINIC_NAME}}, {{ADDRESS}}, {{CITY_STATE}} {{ZIP}}, {{PHONE}}
- Hours of operation
- CTA: "Book Your Appointment" → /contact

### Internal Links Required
- FROM homepage → this page, anchor: "Acupuncture in {{CITY_STATE}}"
- FROM this page → /en/acupuncture-for-back-pain-middletown-ny, anchor: "acupuncture for back pain"
- FROM this page → /en/acupuncture-for-insomnia-middletown-ny, anchor: "acupuncture for insomnia"
- FROM this page → /en/acupuncture-for-anxiety-middletown-ny, anchor: "acupuncture for anxiety"
- FROM this page → /en/acupuncture-cost-middletown-ny, anchor: "how much acupuncture costs"
- FROM this page → /contact, anchor: "Book Your First Visit"

### Pipeline B Clone Notes
- City substitution must feel natural — not "Acupuncture in Flushing, NY" bolted onto Middletown copy
- O5 must rewrite Section 1 hero intro and Section 4 trust points with new city context
- Condition links must update to the new client's city slug automatically

---

## Brief 2 — Condition Page: Back Pain

**Canonical URL:** `/en/acupuncture-for-back-pain-middletown-ny`
**Page Type:** Condition
**Primary Keyword:** acupuncture for back pain middletown ny
**Secondary Keywords:** back pain treatment middletown ny, acupuncture lower back pain middletown
**Target Word Count:** 700–1,000 words
**Schema:** Service, FAQPage, BreadcrumbList

### SEO Object
```json
{
  "title": "Acupuncture for Back Pain in {{CITY_STATE}} | {{CLINIC_NAME}}",
  "description": "Relieve back pain naturally with acupuncture at {{CLINIC_NAME}} in {{CITY_STATE}}. Proven results, personalized care. Book today.",
  "h1": "Acupuncture for Back Pain in {{CITY_STATE}}",
  "canonicalUrl": "/en/acupuncture-for-back-pain-{{CITY_SLUG}}-{{STATE_LOWER}}",
  "schema": ["Service", "FAQPage", "BreadcrumbList"],
  "noindex": false,
  "priority": 0.8
}
```

### Page Section Structure

**Section 1 — Hero / Intro**
- H1: "Acupuncture for Back Pain in {{CITY_STATE}}"
- Opening paragraph (100–130 words): Back pain affects X million Americans. Most cases involve muscle tension, nerve compression, or structural imbalance. Acupuncture addresses these root causes by stimulating specific points that release tension, improve circulation, and activate the body's natural pain-relief response. At {{CLINIC_NAME}} in {{CITY_STATE}}, {{PRACTITIONER_NAME}} has helped hundreds of patients reduce or eliminate back pain without medication.
- CTA: "Book a Back Pain Consultation" → /contact

**Section 2 — How Acupuncture Treats Back Pain**
- H2: "How Acupuncture Relieves Back Pain"
- 3–4 paragraphs: mechanism of action, types of back pain treated (lower back, upper back, sciatica, disc issues, muscle spasm), what a treatment session involves
- What to expect: number of sessions (typically 6–10), frequency, realistic outcomes

**Section 3 — What to Expect**
- H2: "What Happens During Your Back Pain Treatment at {{CLINIC_NAME}}"
- Step by step: intake consultation → diagnosis → needle placement → rest period → follow-up plan
- Addresses the fear of needles: fine gauge, most patients feel minimal discomfort, many find it deeply relaxing

**Section 4 — Patient Story**
- H2: "Real Results for {{CITY}} Patients"
- 1 testimonial from a back pain patient mentioning: the condition, how long they suffered, the improvement after treatment, the practitioner's name, the city
- Format: blockquote with patient first name and general location

**Section 5 — FAQ**
- H2: "Back Pain Acupuncture — Common Questions"
- 4 questions from Google People Also Ask:
  1. Can acupuncture fix back pain permanently?
  2. How many acupuncture sessions do I need for back pain?
  3. Is acupuncture better than physiotherapy for back pain?
  4. Does acupuncture for back pain hurt?

**Section 6 — Related Conditions + CTA**
- H2: "Other Conditions We Treat at {{CLINIC_NAME}}"
- 3 links: acupuncture for insomnia, acupuncture for anxiety, acupuncture for fertility
- Final CTA: "Ready to relieve your back pain? Book your first visit today." → /contact

### Internal Links Required
- FROM core landing page → this page, anchor: "acupuncture for back pain"
- FROM this page → /en/acupuncture-middletown-ny, anchor: "acupuncture in {{CITY_STATE}}"
- FROM this page → /en/acupuncture-for-insomnia-middletown-ny, anchor: "acupuncture for insomnia"
- FROM this page → /en/acupuncture-for-anxiety-middletown-ny, anchor: "acupuncture for anxiety"
- FROM this page → /contact, anchor: "Book a Back Pain Consultation"

---

## Brief 3 — Condition Page: Insomnia

**Canonical URL:** `/en/acupuncture-for-insomnia-middletown-ny`
**Page Type:** Condition
**Primary Keyword:** acupuncture for insomnia middletown ny
**Secondary Keywords:** acupuncture for sleep middletown ny, sleep treatment middletown
**Target Word Count:** 700–1,000 words
**Schema:** Service, FAQPage, BreadcrumbList

### SEO Object
```json
{
  "title": "Acupuncture for Insomnia in {{CITY_STATE}} | {{CLINIC_NAME}}",
  "description": "Struggling with sleep? Acupuncture at {{CLINIC_NAME}} in {{CITY_STATE}} helps restore natural sleep patterns. Book a visit today.",
  "h1": "Acupuncture for Insomnia in {{CITY_STATE}}",
  "canonicalUrl": "/en/acupuncture-for-insomnia-{{CITY_SLUG}}-{{STATE_LOWER}}",
  "schema": ["Service", "FAQPage", "BreadcrumbList"],
  "noindex": false,
  "priority": 0.8
}
```

### Page Section Structure

**Section 1 — Hero / Intro**
- H1: "Acupuncture for Insomnia in {{CITY_STATE}}"
- Opening paragraph (100–130 words): Insomnia affects 1 in 3 adults. Difficulty falling asleep, staying asleep, or waking too early are signs of underlying imbalances in the nervous system, stress hormones, or organ function. In Traditional Chinese Medicine, these patterns are treated at the root — not masked with medication. At {{CLINIC_NAME}} in {{CITY_STATE}}, {{PRACTITIONER_NAME}} uses acupuncture and herbal support to calm the nervous system and restore natural sleep.
- CTA: "Book a Sleep Consultation" → /contact

**Section 2 — How Acupuncture Treats Insomnia**
- H2: "How Acupuncture Restores Healthy Sleep"
- TCM patterns that cause insomnia: Heart-Kidney disharmony, Liver Qi stagnation, Blood deficiency (explain in plain language)
- How acupuncture points regulate cortisol, melatonin, and the nervous system
- Role of herbal medicine alongside acupuncture

**Section 3 — What to Expect**
- H2: "What Your Insomnia Treatment Looks Like"
- Intake: sleep diary, lifestyle, stress, diet assessment
- Treatment plan: typically 6–8 sessions, combined with lifestyle advice
- Most patients notice improvement within 3–4 sessions

**Section 4 — Patient Story**
- 1 testimonial from a sleep/insomnia patient

**Section 5 — FAQ**
- H2: "Acupuncture for Sleep — Common Questions"
- 4 questions:
  1. How quickly does acupuncture work for insomnia?
  2. Can acupuncture replace sleep medication?
  3. Is acupuncture or herbal medicine better for sleep problems?
  4. What TCM patterns cause insomnia?

**Section 6 — Related Conditions + CTA**
- Links to: back pain, anxiety, fertility condition pages
- Final CTA → /contact

### Internal Links Required
- FROM core landing page → this page, anchor: "acupuncture for insomnia"
- FROM this page → /en/acupuncture-middletown-ny, anchor: "acupuncture in {{CITY_STATE}}"
- FROM this page → /en/acupuncture-for-anxiety-middletown-ny, anchor: "acupuncture for anxiety"
- FROM this page → /contact, anchor: "Book a Sleep Consultation"

---

## Brief 4 — Condition Page: Anxiety

**Canonical URL:** `/en/acupuncture-for-anxiety-middletown-ny`
**Page Type:** Condition
**Primary Keyword:** acupuncture for anxiety middletown ny
**Secondary Keywords:** acupuncture for stress middletown ny, anxiety treatment middletown
**Target Word Count:** 700–1,000 words
**Schema:** Service, FAQPage, BreadcrumbList

### SEO Object
```json
{
  "title": "Acupuncture for Anxiety in {{CITY_STATE}} | {{CLINIC_NAME}}",
  "description": "Find calm with acupuncture at {{CLINIC_NAME}} in {{CITY_STATE}}. Natural relief for anxiety, stress & nervous tension. Book today.",
  "h1": "Acupuncture for Anxiety in {{CITY_STATE}}",
  "canonicalUrl": "/en/acupuncture-for-anxiety-{{CITY_SLUG}}-{{STATE_LOWER}}",
  "schema": ["Service", "FAQPage", "BreadcrumbList"],
  "noindex": false,
  "priority": 0.8
}
```

### Page Section Structure

**Section 1 — Hero / Intro**
- H1: "Acupuncture for Anxiety in {{CITY_STATE}}"
- Opening paragraph: Anxiety shows up differently for everyone — racing thoughts, tight chest, difficulty concentrating, constant low-level worry. In TCM, these symptoms reflect an imbalance in the Heart, Liver, or Kidney systems. Acupuncture regulates the nervous system, lowers cortisol, and promotes a sustained sense of calm that many patients describe as unlike anything medication has provided. {{CLINIC_NAME}} in {{CITY_STATE}} offers a structured treatment plan tailored to your anxiety pattern.
- CTA: "Book an Anxiety Consultation" → /contact

**Section 2 — How It Works**
- H2: "How Acupuncture Calms the Anxious Mind"
- Science: reduces sympathetic nervous system activity, increases parasympathetic response
- TCM view: Liver Qi stagnation, Heart Yin deficiency (plain language)
- Role of herbal medicine for sustained effect between sessions

**Section 3 — What to Expect**
- H2: "Your Anxiety Treatment Plan at {{CLINIC_NAME}}"
- Intake: anxiety triggers, sleep, digestion, menstrual cycle (if applicable)
- Treatment: typically 8–12 sessions
- What patients feel during and after treatment

**Section 4 — Patient Story**
- 1 testimonial from an anxiety patient

**Section 5 — FAQ**
- H2: "Acupuncture for Anxiety — Common Questions"
- 4 questions:
  1. How many acupuncture sessions does it take to help anxiety?
  2. Can acupuncture help panic attacks?
  3. Is acupuncture safe to use alongside anti-anxiety medication?
  4. What does acupuncture feel like for someone with anxiety?

**Section 6 — Related Conditions + CTA**
- Links to: back pain, insomnia, fertility
- Final CTA → /contact

### Internal Links Required
- FROM core landing page → this page, anchor: "acupuncture for anxiety"
- FROM this page → /en/acupuncture-middletown-ny, anchor: "acupuncture in {{CITY_STATE}}"
- FROM this page → /en/acupuncture-for-insomnia-middletown-ny, anchor: "acupuncture for insomnia"
- FROM this page → /contact, anchor: "Book an Anxiety Consultation"

---

## Brief 5 — Resource Page: Cost

**Canonical URL:** `/en/acupuncture-cost-middletown-ny`
**Page Type:** Resource / Decision
**Primary Keyword:** acupuncture cost middletown ny
**Secondary Keywords:** how much does acupuncture cost, acupuncture price middletown ny
**Target Word Count:** 700–1,000 words
**Schema:** FAQPage, BreadcrumbList

### SEO Object
```json
{
  "title": "Acupuncture Cost in {{CITY_STATE}} | {{CLINIC_NAME}}",
  "description": "Acupuncture costs $75–$150/session in {{CITY_STATE}}. See what's included, insurance options & new patient specials at {{CLINIC_NAME}}.",
  "h1": "How Much Does Acupuncture Cost in {{CITY_STATE}}?",
  "canonicalUrl": "/en/acupuncture-cost-{{CITY_SLUG}}-{{STATE_LOWER}}",
  "schema": ["FAQPage", "BreadcrumbList"],
  "noindex": false,
  "priority": 0.7
}
```

### Page Section Structure

**Section 1 — Direct Answer (above fold)**
- H1: "How Much Does Acupuncture Cost in {{CITY_STATE}}?"
- Answer in first paragraph (do not bury): At {{CLINIC_NAME}} in {{CITY_STATE}}, acupuncture sessions range from $[X] for a follow-up treatment to $[X] for an initial consultation and treatment. Most patients complete 6–10 sessions for full results.
- CTA: "See New Patient Specials" → /contact

**Section 2 — Price Breakdown**
- H2: "{{CLINIC_NAME}} Acupuncture Pricing"
- Table or clear list:
  - Initial consultation + treatment: $[X]
  - Follow-up session (60 min): $[X]
  - Follow-up session (45 min): $[X]
  - Package of 5 sessions: $[X]
  - Chinese herbal medicine (if separate): $[X]
- Note: prices are set by the clinic — use real values, not placeholder ranges in production

**Section 3 — What Affects the Cost**
- H2: "What Affects Acupuncture Costs in {{STATE}}?"
- Factors: session length, condition complexity, number of sessions needed, whether herbs are included
- Comparison context: how {{CITY_STATE}} pricing compares to regional averages (honest, not inflated)

**Section 4 — Insurance & Payment**
- H2: "Does Insurance Cover Acupuncture in {{STATE}}?"
- Honest answer about insurance coverage in NY
- What to check with your insurer
- Payment options: cash, card, HSA/FSA accepted

**Section 5 — Is It Worth It?**
- H2: "Is Acupuncture Worth the Cost?"
- 1 short patient quote about value received
- ROI framing: cost of ongoing pain medication vs. acupuncture course of treatment
- Most patients need 6–10 sessions for lasting results — total cost context

**Section 6 — FAQ**
- H2: "Acupuncture Cost — Common Questions"
- 5 questions:
  1. How many acupuncture sessions will I need?
  2. Is acupuncture covered by health insurance in New York?
  3. Can I use my HSA or FSA for acupuncture?
  4. Do you offer a first-visit discount?
  5. What is the difference between the initial consultation and a follow-up?

**Section 7 — CTA**
- "Ready to get started? Book your first visit at {{CLINIC_NAME}} in {{CITY_STATE}}."
- CTA button: "Book Now" → /contact

### Internal Links Required
- FROM core landing page → this page, anchor: "how much acupuncture costs in {{CITY_STATE}}"
- FROM this page → /en/acupuncture-middletown-ny, anchor: "acupuncture in {{CITY_STATE}}"
- FROM this page → /en/first-acupuncture-visit-middletown-ny (when built), anchor: "what to expect at your first visit"
- FROM this page → /contact, anchor: "Book Your First Visit"

---

## Content Writing Rules (All Pages)

1. **City appears naturally**: mention {{CITY_STATE}} in H1, first paragraph, location section, and 1–2 body paragraphs. Not mechanically repeated every sentence.
2. **No Lorem Ipsum**: every page ships with real placeholder copy using the `{{variable}}` system — never empty or generic filler.
3. **Medical accuracy**: do not make diagnostic claims. Use language like "may help", "has been shown to support", "many patients report". Never "cures" or "treats [disease]".
4. **FAQ answers**: 50–120 words each. Direct answer first sentence. Natural mention of clinic/city where appropriate. Soft CTA at the end of 1–2 answers.
5. **Testimonials**: must mention a specific condition, the city, and the practitioner by name. Format: "[Result]. [Specific detail about experience]. — [First name], [City]"
