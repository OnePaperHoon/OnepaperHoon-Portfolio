/**
 * 종이 한 장의 메시와 접기.
 *
 * 종이비행기(다트)를 실제 접는 순서 그대로 흉내 냅니다.
 *  1. 격자 메시를 만들고, 접는 선마다 삼각형을 잘라서 어떤 삼각형도 접는 선에 걸치지 않게 합니다.
 *     (접는 선은 "그 시점까지 접힌 상태"의 좌표에서 정의되므로, 자를 때도 접힌 좌표를 함께 들고 다닙니다.)
 *  2. 자르면서 각 삼각형이 어느 접기에 딸려 움직이는지도 기록해 둡니다.
 *  3. 매 프레임, 펼친 좌표에서 시작해 접기를 순서대로 적용합니다. 각 접기는 접는 선을 축으로 한 회전입니다.
 */

export const SHEET_W = 1; // 반폭
export const SHEET_H = 1.414; // 반높이 (A4 비율)

type Vec2 = [number, number];

/** mask: 이 삼각형을 움직이는 접기들의 비트마스크 */
type Tri = { flat: [Vec2, Vec2, Vec2]; cur: [Vec2, Vec2, Vec2]; mask: number };

export type Fold = {
  /** 접는 선 위의 한 점과 단위 방향. 방향의 왼쪽이 움직이는 쪽입니다. */
  px: number;
  py: number;
  dx: number;
  dy: number;
  /** 다 접었을 때의 각도(라디안). 양수면 움직이는 쪽이 +z로 올라옵니다. */
  angle: number;
  /** 같은 stage끼리는 동시에 접힙니다. */
  stage: number;
};

const S225 = Math.sin(Math.PI / 8);
const C225 = Math.cos(Math.PI / 8);
const R2 = Math.SQRT1_2;
const KEEL = 0.2; // 몸통(용골) 높이
const FLAT = Math.PI;
/** 평평하게 접힌 층 사이의 간격. 겹친 층이 서로 파고들지 않도록 층 번호만큼 띄웁니다. */
const LAYER_GAP = 0.0045;
const FLAT_FOLDS = 4;
const KEEL_ANGLE = (Math.PI / 180) * 82;
const WING_ANGLE = (Math.PI / 180) * 90;

/** 적용 순서대로. 날개(4,5)를 용골(6,7)보다 먼저 적용해야 날개가 몸통을 따라 함께 돕니다. */
export const FOLDS: Fold[] = [
  { px: -SHEET_W, py: SHEET_H - SHEET_W, dx: R2, dy: R2, angle: FLAT, stage: 0 },
  { px: 0, py: SHEET_H, dx: R2, dy: -R2, angle: FLAT, stage: 0 },
  { px: 0, py: SHEET_H, dx: S225, dy: C225, angle: FLAT, stage: 1 },
  { px: 0, py: SHEET_H, dx: S225, dy: -C225, angle: FLAT, stage: 1 },
  { px: -KEEL, py: 0, dx: 0, dy: 1, angle: WING_ANGLE, stage: 3 },
  { px: KEEL, py: 0, dx: 0, dy: -1, angle: WING_ANGLE, stage: 3 },
  { px: 0, py: 0, dx: 0, dy: 1, angle: -KEEL_ANGLE, stage: 2 },
  { px: 0, py: 0, dx: 0, dy: -1, angle: -KEEL_ANGLE, stage: 2 },
];
export const STAGES = 4;

const side = (f: Fold, x: number, y: number) => f.dx * (y - f.py) - f.dy * (x - f.px);

function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** 삼각형들을 접는 선으로 자릅니다 (접힌 좌표 기준). */
function split(tris: Tri[], f: Fold): Tri[] {
  const EPS = 1e-7;
  const out: Tri[] = [];
  for (const tri of tris) {
    const s = tri.cur.map((p) => side(f, p[0], p[1]));
    const pos = s.filter((v) => v > EPS).length;
    const neg = s.filter((v) => v < -EPS).length;
    if (pos === 0 || neg === 0) {
      out.push(tri);
      continue;
    }
    // 한 점이 혼자 떨어진 쪽(lone)을 찾아 그 점을 0번으로 돌립니다.
    let lone = -1;
    for (let i = 0; i < 3; i++) {
      const a = s[i], b = s[(i + 1) % 3], c = s[(i + 2) % 3];
      if ((a > EPS && b <= EPS && c <= EPS) || (a < -EPS && b >= -EPS && c >= -EPS)) lone = i;
    }
    if (lone < 0) {
      out.push(tri);
      continue;
    }
    const i0 = lone, i1 = (lone + 1) % 3, i2 = (lone + 2) % 3;
    const cut = (ia: number, ib: number) => {
      const t = s[ia] / (s[ia] - s[ib]);
      return { flat: lerp2(tri.flat[ia], tri.flat[ib], t), cur: lerp2(tri.cur[ia], tri.cur[ib], t) };
    };
    const push = (a: { flat: Vec2; cur: Vec2 }, b: { flat: Vec2; cur: Vec2 }, c: { flat: Vec2; cur: Vec2 }) => {
      const area = (b.cur[0] - a.cur[0]) * (c.cur[1] - a.cur[1]) - (b.cur[1] - a.cur[1]) * (c.cur[0] - a.cur[0]);
      if (Math.abs(area) > 1e-10) out.push({ flat: [a.flat, b.flat, c.flat], cur: [a.cur, b.cur, c.cur], mask: tri.mask });
    };
    const v = (i: number) => ({ flat: tri.flat[i], cur: tri.cur[i] });
    const onLine1 = Math.abs(s[i1]) <= EPS, onLine2 = Math.abs(s[i2]) <= EPS;
    if (onLine1 || onLine2) {
      // 꼭짓점 하나가 선 위: 두 조각
      const m = onLine1 ? cut(i0, i2) : cut(i0, i1);
      if (onLine1) { push(v(i0), v(i1), m); push(m, v(i1), v(i2)); }
      else { push(v(i0), m, v(i2)); push(m, v(i1), v(i2)); }
      continue;
    }
    const m01 = cut(i0, i1), m02 = cut(i0, i2);
    push(v(i0), m01, m02);
    push(m01, v(i1), v(i2));
    push(m01, v(i2), m02);
  }
  return out;
}

/** 접는 선의 왼쪽 삼각형에 이 접기를 표시하고, 평평한 접기라면 선대칭(=180° 접기)시킵니다. */
function mark(tris: Tri[], f: Fold, index: number, flatFold: boolean) {
  for (const tri of tris) {
    const cx = (tri.cur[0][0] + tri.cur[1][0] + tri.cur[2][0]) / 3;
    const cy = (tri.cur[0][1] + tri.cur[1][1] + tri.cur[2][1]) / 3;
    if (side(f, cx, cy) <= 0) continue;
    tri.mask |= 1 << index;
    if (!flatFold) continue;
    tri.cur = tri.cur.map(([x, y]) => {
      const rx = x - f.px, ry = y - f.py;
      const d = rx * f.dx + ry * f.dy;
      return [f.px + 2 * d * f.dx - rx, f.py + 2 * d * f.dy - ry] as Vec2;
    }) as Tri["cur"];
  }
}

export type SheetMesh = {
  /** 펼친 좌표 (x, y) × 정점 수 */
  flat: Float32Array;
  uv: Float32Array;
  /** 정점이 속한 삼각형을 움직이는 접기들 */
  mask: Uint8Array;
  count: number;
};

export function buildSheet(nx = 12, ny = 17): SheetMesh {
  let tris: Tri[] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const x0 = -SHEET_W + (2 * SHEET_W * i) / nx, x1 = -SHEET_W + (2 * SHEET_W * (i + 1)) / nx;
      const y0 = -SHEET_H + (2 * SHEET_H * j) / ny, y1 = -SHEET_H + (2 * SHEET_H * (j + 1)) / ny;
      const a: Vec2 = [x0, y0], b: Vec2 = [x1, y0], c: Vec2 = [x1, y1], d: Vec2 = [x0, y1];
      tris.push({ flat: [a, b, c], cur: [a, b, c], mask: 0 }, { flat: [a, c, d], cur: [a, c, d], mask: 0 });
    }
  }
  // 0~3: 평평하게 접는 단계는 자르고 접습니다. 4~7: 마지막 단계는 같은 평면 상태에서 자르기만 합니다.
  FOLDS.forEach((f, index) => {
    tris = split(tris, f);
    mark(tris, f, index, index < FLAT_FOLDS);
  });

  const count = tris.length * 3;
  const flat = new Float32Array(count * 2);
  const uv = new Float32Array(count * 2);
  const mask = new Uint8Array(count);
  let k = 0;
  for (const tri of tris) {
    for (const [x, y] of tri.flat) {
      mask[k / 2] = tri.mask;
      flat[k] = x;
      flat[k + 1] = y;
      uv[k] = (x + SHEET_W) / (2 * SHEET_W);
      uv[k + 1] = (y + SHEET_H) / (2 * SHEET_H);
      k += 2;
    }
  }
  return { flat, uv, mask, count };
}

/**
 * 펼친 좌표에서 시작해 파동과 접기를 적용한 위치·법선을 씁니다.
 * @param stage 0..STAGES 사이의 접기 진행도. 정수마다 한 단계가 끝납니다.
 */
export function deform(mesh: SheetMesh, positions: Float32Array, normals: Float32Array, time: number, wave: number, stage: number) {
  const prog = FOLDS.map((f) => {
    const t = Math.min(1, Math.max(0, stage - f.stage));
    return t * t * (3 - 2 * t);
  });
  const unfolded = 1 - Math.min(1, stage);
  const amp = wave * unfolded;

  for (let v = 0; v < mesh.count; v++) {
    const fx = mesh.flat[v * 2], fy = mesh.flat[v * 2 + 1];
    // 느린 두 파동 + 아래쪽이 살짝 말리는 곡률
    const a1 = 1.7 * fx + 0.9 * fy + time * 0.9, a2 = 2.4 * fy - 0.6 * fx + time * 0.63;
    const curl = (fy / SHEET_H - 0.2) * (fy / SHEET_H - 0.2) * 0.35;
    let x = fx, y = fy, z = amp * (0.55 * Math.sin(a1) + 0.45 * Math.sin(a2) + curl);
    const dzdx = amp * (0.55 * 1.7 * Math.cos(a1) - 0.45 * 0.6 * Math.cos(a2));
    const dzdy = amp * (0.55 * 0.9 * Math.cos(a1) + 0.45 * 2.4 * Math.cos(a2) + (0.7 * (fy / SHEET_H - 0.2)) / SHEET_H);
    let nx = -dzdx, ny = -dzdy, nz = 1;
    // 접힐 때마다 쌓이는 순서가 뒤집힙니다: 새 층 = (2·단계+1) − 이전 층
    let layer = 0;

    for (let i = 0; i < FOLDS.length; i++) {
      if (i === FLAT_FOLDS) z += layer * LAYER_GAP;
      const t = prog[i];
      if (t <= 0 || !(mesh.mask[v] & (1 << i))) continue;
      const f = FOLDS[i];
      const th = f.angle * t, c = Math.cos(th), s = Math.sin(th);
      // 축 k = (dx, dy, 0)에 대한 로드리게스 회전
      const rx = x - f.px, ry = y - f.py, rz = z;
      const kd = rx * f.dx + ry * f.dy;
      x = f.px + rx * c + f.dy * rz * s + f.dx * kd * (1 - c);
      y = f.py + ry * c - f.dx * rz * s + f.dy * kd * (1 - c);
      z = rz * c + (f.dx * ry - f.dy * rx) * s;
      const nd = nx * f.dx + ny * f.dy;
      const mx = nx * c + f.dy * nz * s + f.dx * nd * (1 - c);
      const my = ny * c - f.dx * nz * s + f.dy * nd * (1 - c);
      nz = nz * c + (f.dx * ny - f.dy * nx) * s;
      nx = mx;
      ny = my;
      if (i < FLAT_FOLDS) layer += (2 * f.stage + 1 - 2 * layer) * t;
    }
    const len = Math.hypot(nx, ny, nz) || 1;
    positions[v * 3] = x;
    positions[v * 3 + 1] = y;
    positions[v * 3 + 2] = z;
    normals[v * 3] = nx / len;
    normals[v * 3 + 1] = ny / len;
    normals[v * 3 + 2] = nz / len;
  }
}
