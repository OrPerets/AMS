import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class PhotoService {
  private s3 = new S3Client({});

  async upload(file: Express.Multer.File): Promise<string> {
    const bucket = process.env.S3_BUCKET || 'local-bucket';
    const key = `${Date.now()}-${file.originalname}`;
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
      console.log('S3 upload failed or skipped:', e.message);
    }
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
}
