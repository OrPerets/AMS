import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { persistUploadLocally } from '../uploads/upload.utils';

@Injectable()
export class PhotoService {
  private s3 = new S3Client({});

  async upload(file: Express.Multer.File): Promise<string> {
    const bucket = process.env.S3_BUCKET || 'local-bucket';
    const key = `${Date.now()}-${file.originalname}`;
    const hasS3Config = Boolean(process.env.S3_BUCKET);

    if (!file?.buffer) {
      return persistUploadLocally(file);
    }

    if (!hasS3Config) {
      return persistUploadLocally(file);
    }

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
    } catch (e) {
      if (e instanceof Error) {
        console.log('S3 upload failed or skipped:', e.message);
      } else {
        console.log('S3 upload failed or skipped:', e);
      }
      return persistUploadLocally(file);
    }
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
}
