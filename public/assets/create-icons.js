const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create Joule Icon
function createJouleIcon() {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Purple background
  ctx.fillStyle = '#cc00dc';
  ctx.fillRect(0, 0, 200, 200);
  
  // Diamond shape
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(100, 40);
  ctx.lineTo(160, 100);
  ctx.lineTo(100, 160);
  ctx.lineTo(40, 100);
  ctx.closePath();
  ctx.stroke();
  
  // Lightning bolt
  ctx.beginPath();
  ctx.moveTo(100, 70);
  ctx.lineTo(80, 110);
  ctx.lineTo(100, 110);
  ctx.lineTo(100, 140);
  ctx.lineTo(120, 100);
  ctx.lineTo(100, 100);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'JouleIcon.png'), buffer);
  console.log('JouleIcon.png created');
}

// Create Perplexity Icon
function createPerplexityIcon() {
  const canvas = createCanvas(200, 200);
  const ctx = canvas.getContext('2d');
  
  // Purple background
  ctx.fillStyle = '#5436D6';
  ctx.fillRect(0, 0, 200, 200);
  
  // P shape
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(60, 60);
  ctx.lineTo(140, 60);
  ctx.lineTo(140, 100);
  ctx.lineTo(100, 100);
  ctx.lineTo(100, 140);
  ctx.lineTo(60, 140);
  ctx.closePath();
  ctx.fill();
  
  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(__dirname, 'perplexity.png'), buffer);
  console.log('perplexity.png created');
}

createJouleIcon();
createPerplexityIcon();
