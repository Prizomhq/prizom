import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cloudinary, extractCloudinaryPublicId } from '@/lib/cloudinary';
import { rateLimit } from '@/lib/rateLimit';
import { getOptimizedImageUrl } from '@/lib/cloudinary-client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Disable standard static caching for this endpoint to guarantee lookup/auth is fresh
export const dynamic = 'force-dynamic';

// Global variables for font buffers caching to prevent synchronous disk I/O on every request
let cachedSpaceGroteskRegular: Buffer | null = null;
let cachedSpaceGroteskBold: Buffer | null = null;
let cachedInterRegular: Buffer | null = null;
let cachedInterBold: Buffer | null = null;

function loadFonts() {
  if (cachedSpaceGroteskRegular && cachedSpaceGroteskBold && cachedInterRegular && cachedInterBold) {
    return {
      spaceGroteskRegular: cachedSpaceGroteskRegular,
      spaceGroteskBold: cachedSpaceGroteskBold,
      interRegular: cachedInterRegular,
      interBold: cachedInterBold,
    };
  }

  const fontsDir = path.join(process.cwd(), 'src', 'assets', 'fonts');
  cachedSpaceGroteskRegular = fs.readFileSync(path.join(fontsDir, 'SpaceGrotesk-Regular.ttf'));
  cachedSpaceGroteskBold = fs.readFileSync(path.join(fontsDir, 'SpaceGrotesk-Bold.ttf'));
  cachedInterRegular = fs.readFileSync(path.join(fontsDir, 'Inter-Regular.ttf'));
  cachedInterBold = fs.readFileSync(path.join(fontsDir, 'Inter-Bold.ttf'));

  return {
    spaceGroteskRegular: cachedSpaceGroteskRegular,
    spaceGroteskBold: cachedSpaceGroteskBold,
    interRegular: cachedInterRegular,
    interBold: cachedInterBold,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // 1. Fetch prompt details including creator profile (using admin client to bypass user RLS restrictions for profile views)
    const adminClient = await createAdminClient();
    const { data: prompt, error: promptErr } = await adminClient
      .from('prompts')
      .select('*, profiles!user_id(username, full_name, avatar_url)')
      .eq('id', id)
      .maybeSingle();

    if (promptErr || !prompt) {
      return NextResponse.json({ error: 'Prompt not found.' }, { status: 404 });
    }

    const creator = prompt.profiles;

    // 2. Hash calculation for cache lookup
    const TEMPLATE_VERSION = 'v1';
    const hashInput = [
      prompt.title,
      prompt.image_url || '',
      prompt.category || '',
      prompt.ai_tool || '',
      String(prompt.serial_id || ''),
      String(prompt.image_width || ''),
      String(prompt.image_height || ''),
      prompt.aspect_ratio || '',
      creator?.username || '',
      creator?.avatar_url || '',
      TEMPLATE_VERSION
    ].join('|');

    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');

    // 3. Check the database cache
    const { data: cacheEntry, error: cacheErr } = await adminClient
      .from('share_card_cache')
      .select('image_url, cloudinary_public_id')
      .eq('prompt_id', id)
      .eq('hash', hash)
      .maybeSingle();

    if (!cacheErr && cacheEntry) {
      // Cache hit! Redirect instantly to Cloudinary URL
      return NextResponse.redirect(cacheEntry.image_url, {
        status: 307,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    // 4. Cache missed (cold cache). Perform access control:
    // Determine if requester is owner or admin, or if we must rate-limit strict (anonymous/non-owner).
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let isAuthorized = false;
    let isAdmin = false;

    if (user) {
      if (prompt.user_id === user.id) {
        isAuthorized = true;
      } else {
        // Query user's role to check if they are an admin
        const { data: profile } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        isAdmin = ['super_admin', 'admin', 'moderator'].includes(profile?.role || '');
        if (isAdmin) {
          isAuthorized = true;
        }
      }
    }

    if (isAuthorized && user) {
      // Authorized owner / admin. Limit to 10 generations per hour to prevent API abuse.
      const rateLimitRes = await rateLimit(user.id, 'share_card_generation', 10, 60 * 60 * 1000);
      if (!rateLimitRes.success) {
        return NextResponse.json(
          { error: 'Too many share card requests. Please try again in an hour.' },
          { status: 429 }
        );
      }
    } else {
      // Unauthorized/Anonymous crawler. Apply strict rate limiting by IP (2 generations per hour).
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'anonymous-ip';
      const anonRateLimitRes = await rateLimit(ip, 'anon_share_card_generation', 2, 60 * 60 * 1000);
      if (!anonRateLimitRes.success) {
        return NextResponse.json(
          { error: 'Too many share card requests from this IP. Please log in as the owner.' },
          { status: 429 }
        );
      }
    }

    // 5. Log analytics event (using admin client)
    try {
      await adminClient.from('share_card_generation_logs').insert({
        prompt_id: prompt.id,
        creator_id: prompt.user_id
      });
    } catch (logErr) {
      console.error('[SHARE CARD ANALYTICS ERROR]', logErr);
    }

    // 6. Fetch dominant colors from Cloudinary with an 800ms timeout race to prevent slow execution
    let color1 = '#4F46E5';
    let color2 = '#0F172A';
    if (prompt.image_url) {
      const publicId = extractCloudinaryPublicId(prompt.image_url);
      if (publicId) {
        try {
          const fetchColorsPromise = cloudinary.api.resource(publicId, { colors: true });
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Cloudinary fetch timeout')), 800)
          );
          const res = await Promise.race([fetchColorsPromise, timeoutPromise]);
          
          if (res && res.colors && Array.isArray(res.colors) && res.colors.length > 0) {
            // Cloudinary returns hex strings WITHOUT the '#' sign. We format them correctly.
            const colorsList = res.colors.slice(0, 2).map((c: any) => {
              const hexVal = c[0];
              return hexVal.startsWith('#') ? hexVal : '#' + hexVal;
            });
            
            if (colorsList.length >= 2) {
              color1 = colorsList[0];
              color2 = colorsList[1];
            } else if (colorsList.length === 1) {
              color1 = colorsList[0];
              color2 = '#0F172A';
            }
          }
        } catch (colorErr) {
          console.warn('[SHARE CARD] Dynamic color fetch skipped or timed out:', colorErr);
        }
      }
    }

    // 7. Fetch optimized images (sized down to limit bandwidth and resolve under 150ms)
    const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) return null;
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/png';
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      } catch (err) {
        console.warn('[SHARE CARD] Image fetch failed or timed out:', url, err);
        return null;
      }
    };

    const coverUrl = prompt.image_url ? getOptimizedImageUrl(prompt.image_url, 'detail') : null;
    const blurredCoverUrl = prompt.image_url ? getOptimizedImageUrl(prompt.image_url, 'blurred-backdrop') : null;
    const avatarUrl = creator?.avatar_url ? getOptimizedImageUrl(creator.avatar_url, 'avatar') : null;

    const promises: Promise<string | null>[] = [
      coverUrl ? fetchImageAsBase64(coverUrl) : Promise.resolve(null),
    ];
    if (blurredCoverUrl && blurredCoverUrl !== coverUrl) {
      promises.push(fetchImageAsBase64(blurredCoverUrl));
    } else {
      promises.push(Promise.resolve(null));
    }
    promises.push(avatarUrl ? fetchImageAsBase64(avatarUrl) : Promise.resolve(null));

    const [coverBase64, blurredCoverBase64Raw, avatarBase64] = await Promise.all(promises);
    const blurredCoverBase64 = blurredCoverBase64Raw || coverBase64;

    // 8. Load local fonts (cached globally)
    const { spaceGroteskRegular, spaceGroteskBold, interRegular, interBold } = loadFonts();

    const initials = (creator?.full_name || creator?.username || 'U')
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const promptIdString = `PZ-${String(prompt.serial_id || 1000).padStart(5, '0')}`;
    
    // JS Truncation to avoid word clipping (max 70 characters for prompt title)
    const displayTitle = prompt.title.length > 70
      ? prompt.title.substring(0, 67) + '...'
      : prompt.title;

    // Sizing Calculation for Adaptive Image Wrapper
    let width = prompt.image_width || 1000;
    let height = prompt.image_height || 1000;
    if ((!prompt.image_width || !prompt.image_height) && prompt.aspect_ratio) {
      const parts = prompt.aspect_ratio.split(':');
      if (parts.length === 2) {
        const pw = parseFloat(parts[0]);
        const ph = parseFloat(parts[1]);
        if (!isNaN(pw) && !isNaN(ph) && ph !== 0) {
          width = pw;
          height = ph;
        }
      }
    }
    
    const maxW = 960;
    const maxH = 840;
    const imageRatio = width / height;
    let containerW = maxW;
    let containerH = maxH;
    
    if (imageRatio > maxW / maxH) {
      // Landscape / wide image -> fit width, adjust height
      containerH = Math.round(maxW / imageRatio);
    } else {
      // Portrait / tall image -> fit height, adjust width
      containerW = Math.round(maxH * imageRatio);
    }

    // 9. Generate ImageResponse
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: '1080px',
            height: '1350px',
            padding: '60px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
            fontFamily: 'Inter',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          {/* Subtle Dark Overlay to guarantee readability */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(9, 9, 11, 0.78)',
            }}
          />

          {/* Wrapper for contents */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Top Row: Logo & Category Badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {/* Custom Branded Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg
                  width="44"
                  height="44"
                  viewBox="25 15 63 67"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M 46,16 L 26,27.5 L 46,39 Z" fill="#3b4fe4" />
                  <path d="M 50,17.5 L 50,39.5 L 67,28.5 Z" fill="#802cf6" />
                  <path d="M 26,30 L 44,40.5 L 44,49.5 L 35,55 L 44,60.5 L 44,71.5 L 26,81 Z" fill="#2c3ce6" />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M 50,27.5 C 65,27.5 76,34 76,44.5 C 76,55 65,61.5 50,61.5 L 50,71.5 C 71,71.5 87,60 87,44.5 C 87,29 71,17.5 50,17.5 Z"
                    fill="url(#ogGrad)"
                  />
                  <line x1="35" y1="55" x2="51" y2="43" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="51" cy="43" r="4" fill="#a855f7" />
                  <line x1="35" y1="55" x2="62" y2="55" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="62" cy="55" r="4" fill="#a855f7" />
                  <line x1="35" y1="55" x2="51" y2="67" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="51" cy="67" r="4" fill="#a855f7" />
                  <defs>
                    <linearGradient id="ogGrad" x1="50" y1="17.5" x2="50" y2="71.5" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#802cf6" />
                      <stop offset="100%" stopColor="#2c3ce6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    color: '#ffffff',
                    fontFamily: 'Space Grotesk',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Prizom
                </span>
              </div>

              {/* Tag / Category Badge */}
              <div
                style={{
                  padding: '8px 18px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                AI Prompt
              </div>
            </div>

            {/* Hero Wrapper: Flexbox Centered Container */}
            <div
              style={{
                width: '960px',
                height: '840px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}
            >
              {/* Dynamic Image Container */}
              <div
                style={{
                  width: `${containerW}px`,
                  height: `${containerH}px`,
                  borderRadius: '32px',
                  overflow: 'hidden',
                  display: 'flex',
                  position: 'relative',
                  boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.01)',
                }}
              >
                {coverBase64 ? (
                  <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative' }}>
                    {/* Blurred backdrop layer */}
                    <img
                      src={blurredCoverBase64 || coverBase64}
                      alt=""
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.35,
                      }}
                    />
                    {/* Sharp containment foreground */}
                    <img
                      src={coverBase64}
                      alt={prompt.title}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ) : (
                  /* Branded Premium Placeholder for missing/text-only prompt images */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      background: `linear-gradient(135deg, ${color1}15 0%, ${color2}20 100%)`,
                      padding: '80px',
                      boxSizing: 'border-box',
                    }}
                  >
                    <svg
                      width="96"
                      height="96"
                      viewBox="25 15 63 67"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ opacity: 0.8 }}
                    >
                      <path d="M 46,16 L 26,27.5 L 46,39 Z" fill="#3b4fe4" />
                      <path d="M 50,17.5 L 50,39.5 L 67,28.5 Z" fill="#802cf6" />
                      <path d="M 26,30 L 44,40.5 L 44,49.5 L 35,55 L 44,60.5 L 44,71.5 L 26,81 Z" fill="#2c3ce6" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M 50,27.5 C 65,27.5 76,34 76,44.5 C 76,55 65,61.5 50,61.5 L 50,71.5 C 71,71.5 87,60 87,44.5 C 87,29 71,17.5 50,17.5 Z"
                        fill="url(#ogGradPl)"
                      />
                      <line x1="35" y1="55" x2="51" y2="43" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="51" cy="43" r="4" fill="#a855f7" />
                      <line x1="35" y1="55" x2="62" y2="55" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="62" cy="55" r="4" fill="#a855f7" />
                      <line x1="35" y1="55" x2="51" y2="67" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="51" cy="67" r="4" fill="#a855f7" />
                      <defs>
                        <linearGradient id="ogGradPl" x1="50" y1="17.5" x2="50" y2="71.5" gradientUnits="userSpaceOnUse">
                          <stop offset="0%" stopColor="#802cf6" />
                          <stop offset="100%" stopColor="#2c3ce6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span
                      style={{
                        fontSize: '20px',
                        color: '#a855f7',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.25em',
                        marginTop: '30px',
                      }}
                    >
                      {prompt.category}
                    </span>
                    <span
                      style={{
                        fontSize: '44px',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontFamily: 'Space Grotesk',
                        marginTop: '20px',
                        textAlign: 'center',
                        lineHeight: 1.3,
                        letterSpacing: '-0.02em',
                        maxWidth: '800px',
                      }}
                    >
                      {displayTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Details Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              {/* Title */}
              <div
                style={{
                  fontSize: '44px',
                  fontWeight: 700,
                  color: '#ffffff',
                  fontFamily: 'Space Grotesk',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                  overflow: 'hidden',
                  maxHeight: '110px',
                }}
              >
                {displayTitle}
              </div>

              {/* Creator, Tool & Serial ID Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                {/* Creator info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {avatarBase64 ? (
                    <img
                      src={avatarBase64}
                      alt={creator?.username || 'user'}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontSize: '20px',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', fontWeight: 650, letterSpacing: '0.05em' }}>Created by</span>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                      @{creator?.username || 'unknown'}
                    </span>
                  </div>
                </div>

                {/* Right side tools and serial ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Tool Badge */}
                  <div
                    style={{
                      padding: '8px 18px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '15px',
                      fontWeight: 700,
                    }}
                  >
                    {prompt.ai_tool}
                  </div>

                  {/* Serial ID */}
                  <span
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.65)',
                      fontFamily: 'Space Grotesk',
                      letterSpacing: '0.05em',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {promptIdString}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Footer Section */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '28px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', fontWeight: 650, letterSpacing: '0.05em' }}>Discover the full prompt</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                  prizom.in
                </span>
              </div>
              <span
                style={{
                  fontSize: '15px',
                  color: 'rgba(255, 255, 255, 0.35)',
                  fontWeight: 650,
                  letterSpacing: '0.05em',
                }}
              >
                A New Home for AI Prompts
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1350,
        fonts: [
          {
            name: 'Space Grotesk',
            data: spaceGroteskRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Space Grotesk',
            data: spaceGroteskBold,
            weight: 700,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: interRegular,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: interBold,
            weight: 700,
            style: 'normal',
          },
        ],
      }
    );

    // 10. Cache generated card in Cloudinary and save metadata to public.share_card_cache
    try {
      const cloneResponse = imageResponse.clone();
      const arrayBuffer = await cloneResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Define a unique Cloudinary public ID for this specific design state
      const cloudinaryPublicId = `prizom/share-cards/${id}_${hash}`;

      // Upload buffer directly to Cloudinary
      const cloudinaryUploadPromise = new Promise<{ secure_url: string } | null>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: cloudinaryPublicId,
            resource_type: 'image',
            overwrite: true,
          },
          (err, result) => {
            if (err) {
              console.error('[CLOUDINARY UPLOAD ERROR]', err);
              reject(err);
            } else {
              resolve(result as any);
            }
          }
        );
        uploadStream.end(buffer);
      });

      const uploadResult = await cloudinaryUploadPromise;

      if (uploadResult && uploadResult.secure_url) {
        // Fetch old cache entry if any to delete old Cloudinary asset to avoid orphans
        const { data: oldCache } = await adminClient
          .from('share_card_cache')
          .select('cloudinary_public_id')
          .eq('prompt_id', id)
          .maybeSingle();

        if (oldCache && oldCache.cloudinary_public_id && oldCache.cloudinary_public_id !== cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(oldCache.cloudinary_public_id);
          } catch (deleteErr) {
            console.warn('[CLOUDINARY ORPHAN CLEANUP WARNING]', deleteErr);
          }
        }

        // Upsert new cache metadata details
        await adminClient
          .from('share_card_cache')
          .upsert({
            prompt_id: id,
            image_url: uploadResult.secure_url,
            cloudinary_public_id: cloudinaryPublicId,
            hash,
            created_at: new Date().toISOString()
          });
      }
    } catch (cacheUploadErr) {
      console.error('[SHARE CARD CACHE PERSISTENCE ERROR]', cacheUploadErr);
    }

    return imageResponse;

  } catch (err: any) {
    console.error('[SHARE CARD GENERATOR EXCEPTION]', err);
    return NextResponse.json({ error: 'Failed to generate share card image.' }, { status: 500 });
  }
}
