import { NextRequest, NextResponse } from 'next/server';
import { upsertContentEntry } from '@/lib/contentDb';
import { getSiteById } from '@/lib/sites';

/**
 * Bridge/Ingest API – receives articles from baam-platform and writes them
 * to this site's content system (Supabase content_entries table).
 *
 * POST /api/content/ingest
 * Authorization: Bearer <INGEST_API_KEY>
 * Body: { siteId, locale, slug, title, content, excerpt, image, imageAlt,
 *         tags, category, author, seoData, relatedServices }
 * Returns: { ok, url, entryId }
 */
export async function POST(req: NextRequest) {
  // Validate API key
  const auth = req.headers.get('authorization')?.replace('Bearer ', '');
  const expectedKey = process.env.INGEST_API_KEY;
  if (!expectedKey || !auth || auth !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      siteId,
      locale = 'en',
      slug: rawSlug,
      title,
      content,
      excerpt,
      image,
      imageAlt,
      tags,
      category,
      author,
      seoData,
      relatedServices,
    } = body;

    if (!siteId || !rawSlug || !title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: siteId, slug, title, content' },
        { status: 400 },
      );
    }

    // Sanitize slug — strip markdown chars, normalize
    const slug = rawSlug
      .replace(/[*_~`#>\[\]()!]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);

    // Build blog post JSON in this site's format
    const blogData: Record<string, unknown> = {
      slug,
      title,
      author: author || 'Staff',
      excerpt: excerpt || '',
      category: category || 'blog',
      featured: false,
      image: image || null,
      imageAlt: imageAlt || title,
      imageCredit: '',
      imageSource: image || null,
      publishDate: new Date().toISOString().split('T')[0],
      contentMarkdown: content,
      relatedServices: relatedServices || [],
      tags: tags || [],
    };

    // Attach SEO fields if provided
    if (seoData) {
      if (seoData.metaTitle) blogData.metaTitle = seoData.metaTitle;
      if (seoData.metaDescription) blogData.metaDescription = seoData.metaDescription;
    }

    // Write to content_entries table
    const path = `blog/${slug}.json`;
    const result = await upsertContentEntry({
      siteId,
      locale,
      path,
      data: blogData,
      updatedBy: 'baam-automation',
    });

    if (!result) {
      return NextResponse.json({ error: 'Failed to write content entry' }, { status: 500 });
    }

    // Resolve the site's domain from _sites.json / DB (not env var)
    let domain = 'https://example.com';
    try {
      const siteConfig = await getSiteById(siteId);
      if (siteConfig?.domain) {
        domain = siteConfig.domain.startsWith('http')
          ? siteConfig.domain
          : `https://${siteConfig.domain}`;
      }
    } catch { /* fallback to default */ }

    const localePrefix = locale === 'en' ? '' : `${locale}/`;
    const publishedUrl = `${domain}/${localePrefix}blog/${slug}`;

    return NextResponse.json({ ok: true, url: publishedUrl, entryId: result.id });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Ingest failed' },
      { status: 500 },
    );
  }
}
