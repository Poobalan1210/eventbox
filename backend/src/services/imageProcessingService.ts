import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT.replace('8000', '4566'), // LocalStack S3 port
    forcePathStyle: true,
  }),
});

const QUESTION_IMAGES_BUCKET = process.env.QUESTION_IMAGES_BUCKET || '';
const CLOUDFRONT_IMAGES_URL = process.env.CLOUDFRONT_IMAGES_URL || '';

interface UploadImageResult {
  imageUrl: string;
  key: string;
}

/**
 * Upload and process a question image
 * - Resizes to max 1200x800 maintaining aspect ratio
 * - Optimizes quality
 * - Uploads to S3
 * - Returns CloudFront URL
 */
export async function uploadQuestionImage(
  imageBuffer: Buffer,
  eventId: string,
  questionId: string
): Promise<UploadImageResult> {
  try {
    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image: unable to read dimensions');
    }

    // Resize image to max 1200x800 maintaining aspect ratio
    const optimizedImage = await sharp(imageBuffer)
      .resize(1200, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    // Generate unique key for S3
    const imageId = randomUUID();
    const key = `questions/${eventId}/${questionId}/${imageId}.jpg`;

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: QUESTION_IMAGES_BUCKET,
        Key: key,
        Body: optimizedImage,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=31536000', // 1 year
      })
    );

    // Return CloudFront URL
    const imageUrl = `${CLOUDFRONT_IMAGES_URL}/${key}`;

    return {
      imageUrl,
      key,
    };
  } catch (error) {
    console.error('Error processing and uploading image:', error);
    throw new Error('Failed to process and upload image');
  }
}

/**
 * Validate image file
 * - Check file size (max 5MB)
 * - Check format (JPEG, PNG, GIF)
 */
export function validateImageFile(
  buffer: Buffer,
  mimetype: string
): { valid: boolean; error?: string } {
  // Check file size (5MB = 5 * 1024 * 1024 bytes)
  const maxSize = 5 * 1024 * 1024;
  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: 'Image file size exceeds 5MB limit',
    };
  }

  // Check MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(mimetype)) {
    return {
      valid: false,
      error: 'Invalid image format. Only JPEG, PNG, and GIF are supported',
    };
  }

  return { valid: true };
}

/**
 * Get aspect ratio of an image
 */
export async function getImageAspectRatio(
  buffer: Buffer
): Promise<number> {
  const metadata = await sharp(buffer).metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  return metadata.width / metadata.height;
}
