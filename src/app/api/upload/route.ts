import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary';
import { createClient } from '@/lib/supabase/server';
import { verifyAiStudioAccessServer } from '@/lib/ai-studio/guard';

const ENABLE_PAID_AI_MODERATION = false; // TODO: Enable AWS Rekognition AI moderation when scale justifies the cost

const uploadToCloudinary = (fileBuffer: Buffer, folder: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const options: any = {
      folder: `prizom/${folder}`,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' } // Compression, CDN and WebP optimization
      ]
    };

    if (ENABLE_PAID_AI_MODERATION) {
      options.moderation = 'aws_rek';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderType = formData.get('folder') as string || 'prompts';

    // Feature gate check for AI Studio uploads
    if (folderType.includes('studio')) {
      const access = await verifyAiStudioAccessServer();
      if (!access.allowed) {
        return NextResponse.json(
          { error: 'AI Studio uploads are restricted during private beta.' },
          { status: 403 }
        );
      }
    }

    // Origin / CSRF Header Verification
    const origin = req.headers.get('origin');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (origin && siteUrl && !origin.includes(new URL(siteUrl).hostname) && !origin.includes('localhost')) {
      return NextResponse.json({ error: 'Forbidden: Invalid request origin.' }, { status: 403 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 1. File type validation (JPG, PNG, WebP)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file format. Only JPG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    // 2. File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB.' }, { status: 400 });
    }

    // Convert file to buffer for Node stream upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Magic Byte Buffer Signature Inspection
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
                   buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

    if (!isJpeg && !isPng && !isWebp) {
      return NextResponse.json({ error: 'Invalid file payload. File content signature does not match allowed image formats.' }, { status: 400 });
    }

    // 3. Upload to Cloudinary inside organized folders
    const result = await uploadToCloudinary(buffer, folderType);

    // 4. Cloudinary NSFW AI Moderation Audit
    if (ENABLE_PAID_AI_MODERATION) {
      const moderation = result.moderation;
      if (moderation && moderation.length > 0) {
        const isRejected = moderation.some((mod: any) => mod.status === 'rejected');
        if (isRejected) {
          // Immediate clean up deletion on host Cloudinary storage
          await cloudinary.uploader.destroy(result.public_id);
          return NextResponse.json(
            { error: 'This upload violates community guidelines.' },
            { status: 400 }
          );
        }
      }
    }

    // Return the secure, compressed, WebP-optimized CDN URL
    return NextResponse.json({ 
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    });

  } catch (err: any) {
    console.error('Cloudinary API upload error:', err);
    
    // Check if error is related to moderation failure triggers or content flagging
    if (err.message && (err.message.includes('moderation') || err.message.includes('rejected'))) {
      return NextResponse.json(
        { error: 'This upload violates community guidelines.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: err.message || 'Server upload failed. Please try again.' }, 
      { status: 500 }
    );
  }
}
