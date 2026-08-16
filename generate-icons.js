import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');
  const svgPath = path.join(publicDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    // Standard PWA & Web icons
    { name: 'icon.png', size: 512, format: 'png' },
    { name: 'icon-512.png', size: 512, format: 'png' },
    { name: 'icon-192.png', size: 192, format: 'png' },
    { name: 'icon-maskable-512.png', size: 512, format: 'png' },
    { name: 'icon-maskable-192.png', size: 192, format: 'png' },
    
    // Apple iOS Touch Icons (Safari Home Screen)
    { name: 'apple-touch-icon.png', size: 180, format: 'png' },
    { name: 'apple-touch-icon-180x180.png', size: 180, format: 'png' },
    { name: 'apple-touch-icon-152x152.png', size: 152, format: 'png' },
    { name: 'apple-touch-icon-167x167.png', size: 167, format: 'png' },
    { name: 'apple-touch-icon-120x120.png', size: 120, format: 'png' },
    { name: 'apple-touch-icon-precomposed.png', size: 180, format: 'png' },

    // Favicon & Misc
    { name: 'favicon.png', size: 64, format: 'png' },
    { name: 'favicon-32x32.png', size: 32, format: 'png' },
    { name: 'favicon-16x16.png', size: 16, format: 'png' },
    { name: 'icon.jpg', size: 512, format: 'jpeg' },
  ];

  for (const item of targets) {
    const dest = path.join(publicDir, item.name);
    if (item.format === 'jpeg') {
      await sharp(svgBuffer)
        .resize(item.size, item.size)
        .jpeg({ quality: 95 })
        .toFile(dest);
    } else {
      await sharp(svgBuffer)
        .resize(item.size, item.size)
        .png({ quality: 100, compressionLevel: 9 })
        .toFile(dest);
    }
    console.log(`Generated ${item.name} (${item.size}x${item.size})`);
  }
}

generateIcons().catch(console.error);
