import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SITE_CONFIG } from '@/lib/site-config';

export async function GET(request: Request) {
  // Use the canonical base for sitemap URLs — always www.prizom.in in production.
  // getSiteUrl() from site-config centralises all URL normalization.
  const siteUrl = SITE_CONFIG.canonicalBase;

  const supabase = await createAdminClient();

  // Fetch all active, approved prompts (id and updated_at)
  const { data: prompts } = await supabase
    .from('prompts')
    .select('id, updated_at, profiles!user_id!inner(role, is_deactivated, pending_deletion)')
    .eq('moderation_status', 'active')
    .not('profiles.role', 'in', '(suspended,banned,permanently_banned,disabled)')
    .eq('profiles.is_deactivated', false)
    .eq('profiles.pending_deletion', false)
    .order('updated_at', { ascending: false })
    .limit(2000);

  // Fetch active creators (username and updated_at)
  const { data: creators } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .not('role', 'in', '(suspended,banned,permanently_banned,disabled)')
    .eq('is_deactivated', false)
    .eq('pending_deletion', false)
    .order('updated_at', { ascending: false })
    .limit(1000);

  const lastmodPolicy = '2026-06-26';
  const lastmodToday = new Date().toISOString().split('T')[0];

  const staticPages = [
    { loc: '', changefreq: 'daily', priority: '1.0', lastmod: lastmodToday },
    { loc: '/discover', changefreq: 'daily', priority: '0.9', lastmod: lastmodToday },
    { loc: '/trending', changefreq: 'daily', priority: '0.9', lastmod: lastmodToday },
    { loc: '/terms', changefreq: 'monthly', priority: '0.3', lastmod: lastmodPolicy },
    { loc: '/privacy', changefreq: 'monthly', priority: '0.3', lastmod: lastmodPolicy },
    { loc: '/community-guidelines', changefreq: 'monthly', priority: '0.3', lastmod: lastmodPolicy },
    { loc: '/cookie-policy', changefreq: 'monthly', priority: '0.3', lastmod: lastmodPolicy },
    { loc: '/copyright-policy', changefreq: 'monthly', priority: '0.3', lastmod: lastmodPolicy },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // 1. Static Pages
  staticPages.forEach((page) => {
    xml += `
  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // 2. Dynamic Prompts
  if (prompts) {
    prompts.forEach((p) => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `
  <url>
    <loc>${siteUrl}/prompt/${p.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  }

  // 3. Dynamic Creators
  if (creators) {
    creators.forEach((c) => {
      if (c.username) {
        const lastmod = c.updated_at ? new Date(c.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        xml += `
  <url>
    <loc>${siteUrl}/creator/${c.username}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      }
    });
  }

  xml += `
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
