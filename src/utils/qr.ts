import * as QRCode from 'qrcode';
import { put } from '@vercel/blob';

interface QRUploadResult {
  buffer: Buffer;
  url: string;
}

export async function sendQRCodeToVercelBlobDirect(
  link: string,
  recipeId: string,
): Promise<QRUploadResult> {
  const qrBuffer = await QRCode.toBuffer(link, {
    type: 'png',
    errorCorrectionLevel: 'H',
  });

  const blob = await put(`${recipeId}.png`, qrBuffer, {
    access: 'public', // публичный доступ к файлу
    allowOverwrite: true, // разрешить перезапись, если нужно
  });

  return {
    buffer: qrBuffer,
    url: blob.url,
  };
}
