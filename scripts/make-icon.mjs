import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pngToIco from 'png-to-ico'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = path.join(root, 'build', 'icon-source.png')
const buildDir = path.join(root, 'build')
const publicDir = path.join(root, 'public')

async function resizePng(size, outPath) {
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(outPath)
}

async function main() {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing icon source at ${source}`)
  }

  const sizes = [16, 24, 32, 48, 64, 128, 256, 512]
  const pngPaths = []

  for (const size of sizes) {
    const out = path.join(buildDir, `icon-${size}.png`)
    await resizePng(size, out)
    pngPaths.push(out)
  }

  const ico = await pngToIco(pngPaths.filter((_, i) => [16, 24, 32, 48, 64, 128, 256].includes(sizes[i])))
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico)

  await resizePng(512, path.join(buildDir, 'icon.png'))
  await resizePng(192, path.join(publicDir, 'app-icon-192.png'))
  await resizePng(512, path.join(publicDir, 'app-icon-512.png'))

  console.log('Created build/icon.ico, build/icon.png, and public app icons')
}

await main()
