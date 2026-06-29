import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '') 
    : `${urlObj.protocol}//${urlObj.host}`;

  if (siteUrl.includes('://prizom.in')) {
    siteUrl = siteUrl.replace('://prizom.in', '://www.prizom.in');
  }

  const robots = `User-agent: *
Allow: /

# Directories
Disallow: /admin/
Disallow: /api/
Disallow: /settings
Disallow: /create

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml
`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
