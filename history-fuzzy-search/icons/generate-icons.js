import fs from 'fs';
import { createCanvas } from 'canvas';

const sizes = [16, 32, 48, 128];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#4A90E2');
  gradient.addColorStop(1, '#357ABD');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Draw search icon (magnifying glass)
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(2, size / 16);
  ctx.lineCap = 'round';
  
  // Circle
  const centerX = size * 0.4;
  const centerY = size * 0.4;
  const radius = size * 0.2;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Handle
  ctx.beginPath();
  ctx.moveTo(centerX + radius * 0.7, centerY + radius * 0.7);
  ctx.lineTo(size * 0.75, size * 0.75);
  ctx.stroke();
  
  // Save the icon
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon-${size}.png`, buffer);
  console.log(`Generated icon-${size}.png`);
}

// Generate all icon sizes
sizes.forEach(size => generateIcon(size));