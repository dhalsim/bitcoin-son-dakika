import fs from "node:fs";
import { Readable, Writable } from "node:stream";
import { fileURLToPath } from "node:url";

import * as PImage from "pureimage";

export const config = {
  runtime: "nodejs",
};

export async function generateTwitterImage() {
  // Register font (ensure the font file exists at the given path)
  const fontPath = fileURLToPath(
    new URL("../public/fonts/dejavu-sans/DejaVuSans.ttf", import.meta.url),
  );

  console.log(fontPath);

  const font = PImage.registerFont(fontPath, "DejaVuSans");
  await font.load();

  // Create image
  const img = PImage.make(800, 400);
  const ctx = img.getContext("2d");

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 800, 400);

  // Draw remote image
  const res = await fetch("https://pbs.twimg.com/media/GxyvSxrWMAANr2D?format=jpg&name=large");
  const arrayBuffer = await res.arrayBuffer();
  const nodeReadable = Readable.from(Buffer.from(arrayBuffer));
  const loadedImg = await PImage.decodeJPEGFromStream(nodeReadable);
  // Scale the image to fit within 800x400 (contain) and center it
  const canvasW = 800;
  const canvasH = 400;
  const imgW = loadedImg.width;
  const imgH = loadedImg.height;
  const scale = Math.min(canvasW / imgW, canvasH / imgH);
  const drawW = Math.floor(imgW * scale);
  const drawH = Math.floor(imgH * scale);
  const dx = Math.floor((canvasW - drawW) / 2);
  const dy = Math.floor((canvasH - drawH) / 2);
  ctx.drawImage(loadedImg, dx, dy, drawW, drawH);

  // Add text
  ctx.fillStyle = "#000000";
  ctx.font = "24pt DejaVuSans";
  ctx.fillText("El Salvador'dan Yeni Adım: Bitcoin Bankaları Yolda", 50, 350);

  // Output as PNG
  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    },
  });
  await PImage.encodePNGToStream(img, writable);
  const pngData = Buffer.concat(chunks);

  fs.writeFileSync("test.png", pngData);

  // return new Response(pngData, {
  //   headers: { "Content-Type": "image/png" },
  // });
}

generateTwitterImage();
