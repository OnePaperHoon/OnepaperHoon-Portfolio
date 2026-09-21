/** 종이 위에 인쇄되는 내용을 2D 캔버스로 그립니다. */

export type SheetContent = {
  label: string;
  title: string;
  body: string;
  /** 하단 왼쪽의 작은 쪽번호 같은 글자 */
  foot: string;
};

const W = 768;
const H = Math.round(W * 1.414);
const SANS = '"Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif';
const INK = "#1b1a2e";
const MUTED = "#6d6a80";
const ACCENT = "#ff5a36";

export const contentKey = (c: SheetContent) => `${c.label}|${c.title}|${c.body}|${c.foot}`;

/** 한글은 어절 단위로, 어절이 너무 길면 글자 단위로 줄을 나눕니다. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const ch of word) {
        if (ctx.measureText(line + ch).width > maxWidth) {
          lines.push(line);
          line = ch;
        } else line += ch;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function loadSheetFonts(sample: string) {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`800 64px ${SANS}`, sample),
    document.fonts.load(`500 28px ${SANS}`, sample),
  ]).catch(() => undefined);
}

export function drawSheet(canvas: HTMLCanvasElement, content: SheetContent) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // 종이 바탕: 아주 옅은 그라데이션 + 섬유 결
  const base = ctx.createLinearGradient(0, 0, W, H);
  base.addColorStop(0, "#fffdf8");
  base.addColorStop(1, "#f6f1e6");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "#8a7d64";
  for (let i = 0; i < 900; i++) {
    const x = rand() * W, y = rand() * H, a = rand() * Math.PI, l = 3 + rand() * 9;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const pad = 72;
  ctx.textBaseline = "top";

  // 머리: 라벨과 도장 같은 빨간 점
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(pad + 9, pad + 13, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `700 24px ${SANS}`;
  ctx.fillStyle = INK;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "4px";
  ctx.fillText(content.label.toUpperCase(), pad + 32, pad);
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";
  ctx.fillStyle = "rgba(27,26,46,.16)";
  ctx.fillRect(pad, pad + 56, W - pad * 2, 2);

  // 제목: 길이에 맞춰 크기를 줄입니다
  const maxWidth = W - pad * 2;
  let size = content.title.length <= 4 ? 210 : content.title.length <= 12 ? 104 : 80;
  let lines: string[] = [];
  for (; size >= 48; size -= 6) {
    ctx.font = `800 ${size}px ${SANS}`;
    lines = wrap(ctx, content.title, maxWidth);
    if (lines.length <= (size > 150 ? 2 : 5)) break;
  }
  ctx.fillStyle = INK;
  let y = pad + 118;
  const leading = size * 1.14;
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${-size * 0.035}px`;
  for (const line of lines) {
    ctx.fillText(line, pad - size * 0.02, y);
    y += leading;
  }
  if ("letterSpacing" in ctx) (ctx as unknown as { letterSpacing: string }).letterSpacing = "0px";

  // 본문
  if (content.body) {
    y += 34;
    ctx.font = `500 30px ${SANS}`;
    ctx.fillStyle = MUTED;
    for (const line of wrap(ctx, content.body, maxWidth)) {
      ctx.fillText(line, pad, y);
      y += 46;
    }
  }

  // 꼬리
  ctx.fillStyle = "rgba(27,26,46,.16)";
  ctx.fillRect(pad, H - pad - 50, W - pad * 2, 2);
  ctx.font = `600 22px ${SANS}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(content.foot, pad, H - pad - 26);
  ctx.textAlign = "right";
  ctx.fillText("onepaperhoon", W - pad, H - pad - 26);
  ctx.textAlign = "left";
}
