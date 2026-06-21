import { ImageResponse } from 'next/og';
import { IconImage } from '../../lib/icon';

export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(IconImage(512), { width: 512, height: 512 });
}
