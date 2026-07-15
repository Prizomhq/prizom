import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const host = request.headers.get('host') || urlObj.host;
  
  // Staging/Preview Environments Safeguard
  const isProduction = host === 'www.prizom.in' || host === 'prizom.in';

  let robots = '';
  if (!isProduction) {
    robots = `User-agent: *
Disallow: /
`;
  } else {
    const siteUrl = 'https://www.prizom.in';
    robots = `User-agent: *
Allow: /
# Directories
Disallow: /admin/
Disallow: /api/
Disallow: /settings
Disallow: /create
Disallow: /upload
Disallow: /upload/
Disallow: /profile
Disallow: /notifications
Disallow: /restore-account
Disallow: /reactivate-account
Disallow: /suspended
Disallow: /account-appeal
# Sitemap
Sitemap: ${siteUrl}/sitemap.xml
`;
  }

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
