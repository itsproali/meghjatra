// Single SVG source for the brand icon — favicon/apple-icon/PWA icons are all generated from this.
// No text, so ImageResponse (Satori) can render it without a font.
export const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b6b4f"/>
      <stop offset="100%" stop-color="#064e3b"/>
    </linearGradient>
    <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#9ff0cf"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="116" fill="url(#bg)"/>
  <circle cx="356" cy="172" r="44" fill="#fcd34d"/>
  <path d="M64 404 L196 214 L300 404 Z" fill="#10b981" opacity="0.5"/>
  <path d="M150 404 L300 150 L452 404 Z" fill="url(#snow)"/>
  <path d="M300 150 L342 220 L312 232 L300 210 L286 236 L256 220 Z" fill="#0b6b4f" opacity="0.18"/>
  <g fill="#ffffff">
    <ellipse cx="206" cy="356" rx="52" ry="30"/>
    <ellipse cx="270" cy="344" rx="66" ry="38"/>
    <ellipse cx="338" cy="358" rx="50" ry="28"/>
    <rect x="184" y="352" width="170" height="34" rx="17"/>
  </g>
</svg>`;

export const ICON_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(ICON_SVG).toString('base64')}`;

// Render element for ImageResponse — fills the whole canvas with the icon.
export function IconImage(size: number) {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ICON_DATA_URI} width={size} height={size} alt="" />
    </div>
  );
}
