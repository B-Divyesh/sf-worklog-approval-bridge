import sharp from "sharp";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

await mkdir("public/assets", { recursive: true });
await mkdir("src-tauri/icons", { recursive: true });

const source = "assets/src/night-market-bridge.png";
await sharp(source).resize(768, 512).webp({ quality: 76, effort: 6 }).toFile("dist/site/assets/night-market-bridge-768.webp");
await sharp(source).resize(1280, 853).webp({ quality: 78, effort: 6 }).toFile("dist/site/assets/night-market-bridge-1280.webp");

const socialOverlay = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="rgba(9,11,16,.28)"/><rect x="54" y="48" width="620" height="186" rx="8" fill="#090b10" stroke="#63e6ff" stroke-width="2"/><text x="86" y="115" fill="#63e6ff" font-size="24" font-family="Arial" font-weight="700">WORKLOG BRIDGE</text><text x="86" y="174" fill="#f7f1df" font-size="42" font-family="Arial" font-weight="800">ACTIVITY → APPROVAL</text><rect x="86" y="196" width="210" height="7" fill="#ffbd4a"/><rect x="306" y="196" width="210" height="7" fill="#75efb3"/></svg>`);
await sharp(source).resize(1200, 800, { fit: "cover" }).extract({ left: 0, top: 85, width: 1200, height: 630 }).composite([{ input: socialOverlay }]).jpeg({ quality: 82, mozjpeg: true }).toFile("dist/site/assets/social-card.jpg");

const iconSvg = Buffer.from(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg"><rect width="512" height="512" rx="96" fill="#090b10"/><path d="M88 148h145v78H88zm191 139h145v78H279z" fill="#63e6ff"/><path d="M220 183h85v147h-85" fill="none" stroke="#ffbd4a" stroke-width="38"/><path d="m329 186 34 34 72-88" fill="none" stroke="#75efb3" stroke-width="32"/></svg>`);
await sharp(iconSvg).png().toFile("src-tauri/icons/icon.png");
await sharp(iconSvg).resize(180, 180).png().toFile("dist/site/assets/apple-touch-icon.png");
await copyFile("dist/site/index.html", "dist/site/404.html");

// The source service worker stays readable, while every deployed shell gets a
// content-derived cache namespace and therefore retires the previous release.
const buildId = createHash("sha256").update(await readFile("dist/site/index.html")).digest("hex").slice(0, 12);
const worker = await readFile("dist/site/service-worker.js", "utf8");
await writeFile("dist/site/service-worker.js", worker.replace("__BUILD_ID__", buildId));

for (const file of ["install.sh", "install.ps1"]) await copyFile(`public/${file}`, `dist/site/${file}`);
