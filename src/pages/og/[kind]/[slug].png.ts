/**
 * 공유 이미지(OG). 작업·노트마다 "그 글의 한 줄이 적힌 종이 한 장"을 빌드할 때 그립니다.
 *   /og/work/<slug>.png   /og/notes/<slug>.png
 * satori가 아래 구조를 SVG로, resvg가 PNG로 바꿉니다. 글꼴은 src/assets/fonts의 Pretendard.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";

type Card = { heading: string; sub: string; label: string; line: string; foot: string };
type Node = { type: string; props: { style?: Record<string, string | number>; children?: (Node | string)[] | Node | string } };

export async function getStaticPaths() {
  const works = (await getCollection("work", ({ data }) => !data.draft)).sort((a, b) => a.data.order - b.data.order);
  const notes = await getCollection("notes", ({ data }) => !data.draft);
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    ...works.map((entry, index) => ({
      params: { kind: "work", slug: entry.id },
      props: { card: { heading: entry.data.title, sub: entry.data.kind, label: entry.data.title, line: entry.data.paper, foot: `${pad(index + 1)} / ${pad(works.length)}` } satisfies Card },
    })),
    ...notes.map((entry) => ({
      params: { kind: "notes", slug: entry.id },
      props: { card: { heading: "Notes", sub: entry.data.date.toISOString().slice(0, 10).replaceAll("-", "."), label: "Notes", line: entry.data.title, foot: "notes" } satisfies Card },
    })),
  ];
}

const h = (type: string, style: Record<string, string | number>, children?: Node["props"]["children"]): Node => ({ type, props: { style: { display: "flex", ...style }, children } });

let fonts: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]> | undefined;
const loadFonts = () => (fonts ??= Promise.all(([["Medium", 500], ["ExtraBold", 800]] as const).map(async ([file, weight]) => ({
  name: "Pretendard", weight, style: "normal" as const,
  data: await readFile(path.join(process.cwd(), "src/assets/fonts", `Pretendard-${file}.otf`)),
}))));

export async function GET({ props }: APIContext) {
  const card = props.card as Card;
  const ink = "#1b1a2e", muted = "#6d6a80";
  const lineSize = card.line.length > 34 ? 38 : card.line.length > 22 ? 44 : 52;

  const tree = h("div", { width: 1200, height: 630, position: "relative", fontFamily: "Pretendard", color: "#fff", backgroundImage: "linear-gradient(180deg, #3647c9 0%, #6d78ea 36%, #d89ddb 70%, #ffd6b3 100%)" }, [
    // 해의 빛무리와 언덕
    h("div", { position: "absolute", left: 250, top: 250, width: 700, height: 700, borderRadius: 350, backgroundImage: "radial-gradient(circle, rgba(255,176,214,0.95) 0%, rgba(255,176,214,0) 68%)" }),
    h("div", { position: "absolute", left: -150, top: 470, width: 1500, height: 1500, borderRadius: 750, backgroundColor: "#5a4bc0" }),
    h("div", { position: "absolute", left: -500, top: 540, width: 1500, height: 1500, borderRadius: 750, backgroundColor: "#3d3196" }),
    h("div", { position: "absolute", left: 300, top: 580, width: 1500, height: 1500, borderRadius: 750, backgroundColor: "#251e63" }),

    // 왼쪽: 제목
    h("div", { position: "absolute", left: 76, top: 64, width: 600, height: 502, flexDirection: "column", justifyContent: "space-between" }, [
      h("div", { fontSize: 28, fontWeight: 800, letterSpacing: -1 }, "onepaperhoon"),
      h("div", { flexDirection: "column" }, [
        h("div", { fontSize: 30, fontWeight: 500, opacity: 0.92 }, card.sub),
        h("div", { marginTop: 8, fontSize: card.heading.length > 12 ? 76 : 96, fontWeight: 800, letterSpacing: -4, lineHeight: 1.02 }, card.heading),
      ]),
      h("div", { fontSize: 24, fontWeight: 500, opacity: 0.9 }, "onepaperhoon.com"),
    ]),

    // 오른쪽: 종이 한 장
    h("div", { position: "absolute", left: 742, top: 50, width: 374, height: 529, flexDirection: "column", padding: "34px 36px 30px", borderRadius: 4, color: ink, backgroundImage: "linear-gradient(135deg, #fffdf8, #f6f1e6)", boxShadow: "0 40px 70px rgba(24,18,60,0.42)", transform: "rotate(5deg)" }, [
      h("div", { alignItems: "center", paddingBottom: 18, borderBottom: "2px solid rgba(27,26,46,0.15)" }, [
        h("div", { width: 12, height: 12, marginRight: 12, borderRadius: 6, backgroundColor: "#ff5a36" }),
        h("div", { fontSize: 15, fontWeight: 800, letterSpacing: 3 }, card.label.toUpperCase()),
      ]),
      h("div", { marginTop: 30, fontSize: lineSize, fontWeight: 800, letterSpacing: -1.6, lineHeight: 1.18, wordBreak: "keep-all" }, card.line),
      h("div", { marginTop: "auto", justifyContent: "space-between", paddingTop: 16, borderTop: "2px solid rgba(27,26,46,0.15)", fontSize: 14, fontWeight: 500, color: muted }, [
        h("div", {}, card.foot),
        h("div", {}, "onepaperhoon"),
      ]),
    ]),
  ]);

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: await loadFonts() });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable" } });
}
