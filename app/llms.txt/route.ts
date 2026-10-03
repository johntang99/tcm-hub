import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { getDefaultSite, getSiteByHost } from '@/lib/sites';
import { getBaseUrlFromHost } from '@/lib/seo';
import { getSEOPagesForSite } from '@/lib/seo-pages';
import { loadAllItems, loadSiteInfo } from '@/lib/content';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';
import { getSiteDisplayName } from '@/lib/siteInfo';
import type { SiteInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CONTENT_DIR = path.join(process.cwd(), 'content');
const PAGE_SLUG_DENYLIST = new Set(['home', 'faq-copy', 'components-preview']);

type NamedItem = { slug?: string; title?: string; name?: string };
type SiteInfoLike = Partial<SiteInfo> & { name?: string; serviceAreas?: string[] };

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function cleanSingleLine(value: string): string {
  return value.replace(/\s*\n\s*/g, ' ').trim();
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listJsonSlugs(dirPath: string): Promise<string[]> {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter((file) => file.endsWith('.json')).map((file) => file.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

async function resolvePrimaryLocale(siteId: string, candidates: Locale[], fallback: Locale): Promise<Locale> {
  for (const locale of candidates) {
    const siteFile = path.join(CONTENT_DIR, siteId, locale, 'site.json');
    const homeFile = path.join(CONTENT_DIR, siteId, locale, 'pages', 'home.json');
    if ((await fileExists(siteFile)) || (await fileExists(homeFile))) return locale;
  }
  return fallback;
}

function pageRoute(locale: Locale, slug: string): string {
  if (slug === 'home') return `/${locale}`;
  return `/${locale}/${slug}`;
}

export async function GET(): Promise<Response> {
  const host = headers().get('host');
  const baseUrl = getBaseUrlFromHost(host);
  const site = (await getSiteByHost(host)) || (await getDefaultSite());
  if (!site) return new Response('', { status: 404 });

  const supportedLocales = (site.supportedLocales?.length ? site.supportedLocales : locales) as Locale[];
  const locale = await resolvePrimaryLocale(site.id, supportedLocales, (site.defaultLocale as Locale) || defaultLocale);

  const [rawSiteInfo, pageSlugsRaw, blogPosts, services, localSeoSlugs, seoPages] = await Promise.all([
    loadSiteInfo(site.id, locale) as Promise<SiteInfoLike | null>,
    listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'pages')),
    loadAllItems<NamedItem>(site.id, locale, 'blog').catch(() => []),
    loadAllItems<NamedItem>(site.id, locale, 'services').catch(() => []),
    listJsonSlugs(path.join(CONTENT_DIR, site.id, locale, 'local-seo')),
    getSEOPagesForSite(site.id).catch(() => []),
  ]);

  const pageSlugs = pageSlugsRaw.filter((slug) => {
    if (slug.endsWith('.layout')) return false;
    if (slug.endsWith('-copy') || slug.endsWith('-new')) return false;
    return !PAGE_SLUG_DENYLIST.has(slug);
  });

  const info: SiteInfoLike = rawSiteInfo || {};
  const displayName = getSiteDisplayName(rawSiteInfo, site.name || site.id);
  const lines: string[] = [`# ${displayName}`];

  if (typeof info.description === 'string' && info.description.trim()) {
    lines.push('', `> ${cleanSingleLine(info.description)}`);
  }
  if (typeof info.tagline === 'string' && info.tagline.trim()) {
    lines.push('', `Tagline: ${cleanSingleLine(info.tagline)}`);
  }

  const contact: string[] = [];
  if (typeof info.phone === 'string' && info.phone.trim()) contact.push(`- Phone: ${info.phone.trim()}`);
  if (typeof info.email === 'string' && info.email.trim()) contact.push(`- Email: ${info.email.trim()}`);
  if (typeof info.address === 'string' && info.address.trim()) contact.push(`- Address: ${info.address.trim()}`);
  if (Array.isArray(info.serviceAreas) && info.serviceAreas.length > 0) {
    contact.push(`- Service areas: ${info.serviceAreas.slice(0, 8).join(', ')}`);
  }
  if (contact.length > 0) lines.push('', '## Contact', ...contact);

  const preferredPageOrder = [
    'about',
    'services',
    'conditions',
    'book',
    'contact',
    'pricing',
    'new-patients',
    'gallery',
    'blog',
    'case-studies',
    'privacy',
    'terms',
  ];
  const orderedPages = [
    ...preferredPageOrder.filter((slug) => pageSlugs.includes(slug)),
    ...pageSlugs.filter((slug) => !preferredPageOrder.includes(slug)),
  ];

  lines.push('', '## Key pages', `- [Home](${new URL(`/${locale}`, baseUrl).toString()})`);
  for (const slug of orderedPages.slice(0, 20)) {
    lines.push(`- [${titleFromSlug(slug)}](${new URL(pageRoute(locale, slug), baseUrl).toString()})`);
  }

  const cleanNamed = (items: NamedItem[]) =>
    items.filter((item) => typeof item.slug === 'string' && item.slug.trim().length > 0);

  const serviceItems = cleanNamed(services).slice(0, 20);
  if (serviceItems.length > 0) {
    lines.push('', '## Services');
    for (const item of serviceItems) {
      const title = item.title || item.name || titleFromSlug(item.slug as string);
      lines.push(`- [${title}](${new URL(`/${locale}/services/${item.slug}`, baseUrl).toString()})`);
    }
  }

  const articleItems = cleanNamed(blogPosts).slice(0, 20);
  if (articleItems.length > 0) {
    lines.push('', '## Articles');
    for (const item of articleItems) {
      const title = item.title || item.name || titleFromSlug(item.slug as string);
      lines.push(`- [${title}](${new URL(`/${locale}/blog/${item.slug}`, baseUrl).toString()})`);
    }
  }

  const seoSlugSet = new Set<string>();
  for (const slug of localSeoSlugs) seoSlugSet.add(slug);
  for (const page of seoPages) {
    if (typeof page.slug === 'string' && page.slug.trim()) seoSlugSet.add(page.slug);
  }
  const seoSlugs = [...seoSlugSet].slice(0, 25);
  if (seoSlugs.length > 0) {
    lines.push('', '## SEO pages');
    for (const slug of seoSlugs) {
      lines.push(`- [${slug}](${new URL(`/${locale}/${slug}`, baseUrl).toString()})`);
    }
  }

  lines.push(
    '',
    '## Site',
    `- Sitemap: ${new URL('/sitemap.xml', baseUrl).toString()}`,
    `- Robots: ${new URL('/robots.txt', baseUrl).toString()}`,
    `- Languages: ${supportedLocales.join(', ')}`,
    '- Private paths excluded from crawling: /admin, /api'
  );

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
