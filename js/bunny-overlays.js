const INK = '#22336e';

export const EYES = [[5, 21], [12, 20]];
export const EAR_TIPS = [[21, 1], [32, 2]];

export function drawClosedEyes(ctx, spriteW, spriteH, facing) {
  ctx.save();
  if (facing > 0) ctx.scale(-1, 1);
  for (const [ex, ey] of EYES) {
    const x = -spriteW / 2 + ex;
    const y = -spriteH + ey;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
    ctx.fillStyle = INK;
    ctx.fillRect(x - 1.5, y + 0.5, 3, 0.75);
  }
  ctx.restore();
}

export function drawEarGlints(ctx, spriteW, spriteH, facing, color, phase) {
  ctx.save();
  if (facing > 0) ctx.scale(-1, 1);
  ctx.fillStyle = color;
  EAR_TIPS.forEach(([ex, ey], i) => {
    if (Math.floor(phase * 6 + i * 3) % 4 === 0) return;
    const x = -spriteW / 2 + ex;
    const y = -spriteH + ey;
    ctx.fillRect(x - 0.5, y, 1, 1);
    ctx.fillRect(x - 1.5, y + 1, 3, 1);
  });
  ctx.restore();
}
