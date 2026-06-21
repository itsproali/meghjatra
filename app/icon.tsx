import { ImageResponse } from 'next/og';
import { IconImage } from '../lib/icon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(IconImage(32), { ...size });
}
