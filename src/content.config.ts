import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * 작업물: src/content/work/<slug>.md 파일 하나 = /work/<slug> 페이지 하나.
 * 본문은 마크다운으로 자유롭게 쓰고, 아래 frontmatter만 채우면 홈 카드·숫자·사이트맵에 자동 반영됩니다.
 */
const work = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/work" }),
  schema: z.object({
    title: z.string(),
    kind: z.string(),
    year: z.number(),
    summary: z.string(),
    /** 종이 위에 적히는 한 줄. 이 작업의 핵심 원칙. */
    paper: z.string(),
    status: z.enum(["live", "shipped", "wip"]),
    role: z.string(),
    timeline: z.string(),
    stack: z.array(z.string()).default([]),
    links: z
      .object({
        live: z.url().optional(),
        repo: z.url().optional(),
        npm: z.url().optional(),
      })
      .default({}),
    /** public/ 기준 이미지 경로. 없으면 terminal 줄로 커버를 그립니다. */
    cover: z.string().optional(),
    terminal: z.array(z.string()).optional(),
    /** 카드 배경색 (커버가 터미널일 때). */
    tint: z.string().default("#1b1a2e"),
    order: z.number().default(99),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

/** 노트: src/content/notes/<slug>.md 파일 하나 = /notes/<slug> 글 하나. */
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { work, notes };
