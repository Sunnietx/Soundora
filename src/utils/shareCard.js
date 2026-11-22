// Vẽ ảnh kết quả (1080x1350) để đăng mạng xã hội
const W = 1080;
const H = 1350;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = fitText(ctx, `${lines[maxLines - 1]} …`, maxWidth);
  }
  return lines;
}

export async function createShareImage({
  photoUrl,
  color,
  accent = '#1ed760',
  songs = [],
  description = '',
}) {
  try {
    await Promise.all([
      document.fonts.load('800 40px "Bricolage Grotesque"'),
      document.fonts.load('700 30px "Bricolage Grotesque"'),
      document.fonts.load('500 28px "Instrument Sans"'),
    ]);
  } catch {
    // dùng font dự phòng
  }
  const display = '"Bricolage Grotesque", "Instrument Sans", system-ui, sans-serif';
  const body = '"Instrument Sans", system-ui, sans-serif';

  const img = await loadImage(photoUrl);
  const [r, g, b] = (color || '30 215 96').split(' ').map(Number);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Nền + vầng sáng theo màu ảnh
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.78, 0, 0, W * 0.78, 0, H * 0.85);
  glow.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
  glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Logo
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(96, 96, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  [8, 18, 26, 14, 9].forEach((h, i) => {
    ctx.fillRect(81 + i * 7, 96 - h / 2, 4, h);
  });
  ctx.fillStyle = '#fff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `800 38px ${display}`;
  ctx.fillText('Soundora', 136, 96);

  // Ảnh dạng polaroid
  const fw = 520;
  const fh = 564;
  ctx.save();
  ctx.translate(W / 2, 440);
  ctx.rotate((-2 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const side = Math.min(img.width, img.height);
  ctx.drawImage(
    img,
    (img.width - side) / 2,
    (img.height - side) / 2,
    side,
    side,
    -fw / 2 + 20,
    -fh / 2 + 20,
    480,
    480
  );
  ctx.restore();

  // Mô tả
  ctx.textAlign = 'center';
  let y = 800;
  if (description) {
    ctx.fillStyle = '#b3b3b3';
    ctx.font = `italic 500 28px ${body}`;
    const lines = wrapText(ctx, `“${description}”`, 800, 3);
    lines.forEach((line, i) => ctx.fillText(line, W / 2, y + i * 40));
    y += lines.length * 40 + 40;
  } else {
    y += 20;
  }

  // Top bài hát
  const top = [...songs]
    .sort((a, c) => Number(c.score ?? 0) - Number(a.score ?? 0))
    .slice(0, 5);
  const rowH = 62;
  top.forEach((song, i) => {
    const cy = y + i * rowH + rowH / 2;
    const pct = Math.min(100, Math.max(0, Number(song.score ?? 0) * 100));

    ctx.textAlign = 'left';
    ctx.fillStyle = accent;
    ctx.font = `800 30px ${display}`;
    ctx.fillText(String(i + 1), 96, cy);

    ctx.fillStyle = '#fff';
    ctx.font = `700 30px ${display}`;
    ctx.fillText(fitText(ctx, song.title, 640), 150, cy - 12);

    ctx.fillStyle = '#b3b3b3';
    ctx.font = `500 22px ${body}`;
    ctx.fillText(fitText(ctx, song.artist, 640), 150, cy + 16);

    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.font = `800 30px ${display}`;
    ctx.fillText(`${pct.toFixed(0)}%`, W - 96, cy);

    if (i < top.length - 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(96, y + (i + 1) * rowH);
      ctx.lineTo(W - 96, y + (i + 1) * rowH);
      ctx.stroke();
    }
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#b3b3b3';
  ctx.font = `500 22px ${body}`;
  ctx.fillText('Gợi ý bài hát từ hình ảnh với Soundora', W / 2, H - 36);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png')
  );
}
