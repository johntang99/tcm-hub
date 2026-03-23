import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface SEOPage {
  site_id: string;
  slug: string;
  page_type:
    | 'seo-local-landing'
    | 'seo-condition'
    | 'seo-resource'
    | 'seo-near-location';
  active: boolean;
}

export async function getSEOPagesForSite(
  siteId: string
): Promise<SEOPage[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('site_seo_pages')
    .select('*')
    .eq('site_id', siteId)
    .eq('active', true);

  if (error) {
    console.error('getSEOPagesForSite error:', error);
    return [];
  }

  return (data as SEOPage[]) ?? [];
}

export async function registerSEOPage(
  siteId: string,
  slug: string,
  pageType: SEOPage['page_type']
): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.error('registerSEOPage: no Supabase client available');
    return;
  }

  const { error } = await supabase
    .from('site_seo_pages')
    .upsert(
      { site_id: siteId, slug, page_type: pageType, active: true },
      { onConflict: 'site_id,slug' }
    );

  if (error) {
    console.error('registerSEOPage error:', error);
  }
}
