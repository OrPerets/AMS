import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);

const DOCUMENT_MIME_TYPES = new Set([
  ...IMAGE_MIME_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

const DOCUMENT_EXTENSIONS = new Set([
  ...IMAGE_EXTENSIONS,
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
]);

export const imageUploadOptions = {
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    validateUpload(file, IMAGE_MIME_TYPES, IMAGE_EXTENSIONS, 'Only image uploads are allowed.', cb);
  },
};

export const documentUploadOptions = {
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req: unknown, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    validateUpload(file, DOCUMENT_MIME_TYPES, DOCUMENT_EXTENSIONS, 'Unsupported document type.', cb);
  },
};

export function ensureUploadsDir() {
  const dir = join(__dirname, '..', '..', 'uploads');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function persistUploadLocally(file: Express.Multer.File) {
  const uploadsDir = ensureUploadsDir();
  const filename = buildUploadFilename(file.originalname, file.mimetype);
  const target = join(uploadsDir, filename);
  writeFileSync(target, file.buffer);
  return `/uploads/${filename}`;
}

export function buildUploadFilename(originalname: string, mimeType: string) {
  const extension = normalizeExtension(extname(originalname)) || inferExtension(mimeType);
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
}

function inferExtension(mimeType: string) {
  const mapping: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
  };
  return mapping[mimeType] ?? '';
}

function validateUpload(
  file: Express.Multer.File,
  allowedMimeTypes: Set<string>,
  allowedExtensions: Set<string>,
  message: string,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const extension = normalizeExtension(extname(file.originalname));
  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    cb(new BadRequestException(message) as unknown as Error, false);
    return;
  }
  cb(null, true);
}

function normalizeExtension(value: string) {
  return value.trim().toLowerCase();
}
