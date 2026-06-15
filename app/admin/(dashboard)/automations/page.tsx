import { AutomationsManager } from '@/components/admin/AutomationsManager';
import { getSites } from '@/lib/sites';
import { getSession } from '@/lib/admin/auth';
import { filterSitesForUser } from '@/lib/admin/permissions';

export default async function AdminAutomationsPage({
  searchParams,
}: {
  searchParams?: { siteId?: string };
}) {
  const session = await getSession();
  const sites = await getSites();
  const visibleSites = session ? filterSitesForUser(sites, session.user) : sites;
  const requestedSiteId = searchParams?.siteId || '';
  const selectedSite =
    visibleSites.find((site) => site.id === requestedSiteId) || visibleSites[0];
  const selectedSiteId = selectedSite?.id || '';
  return <AutomationsManager sites={visibleSites} selectedSiteId={selectedSiteId} />;
}
