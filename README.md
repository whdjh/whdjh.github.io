# whdjh.github.io

Next.js 15 SSG 기반 개인 블로그

## Tech Stack

- **Framework**: Next.js 15 (App Router, `output: 'export'`)
- **Style**: Tailwind CSS v4
- **UI**: shadcn/ui (Sidebar, Card, Collapsible 등)
- **Animation**: Magic UI + Framer Motion (About 페이지)
- **Markdown**: gray-matter + react-markdown
- **Deploy**: GitHub Pages (GitHub Actions)

## Getting Started

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인

## Build

```bash
npm run build
```

`out/` 디렉토리에 정적 HTML 생성

## Structure

```
app/
  page.tsx            # About (메인)
  dev/[slug]/page.tsx # 블로그 글 상세
  layout.tsx          # Sidebar 레이아웃
components/
  ui/                 # shadcn/ui
  magic-ui/           # Magic UI (blur-fade, text-animate, shine-border)
lib/
  posts.ts            # 마크다운 파싱 (getAllPosts, getPostBySlug 등)
_posts/               # 사이드프로젝트 글
_pages/               # 리액트 / 회고 글
_others/              # 기술 글
public/assets/img/    # 이미지 (114개)
```

## Design Tokens

| Name | HEX | Usage |
|------|-----|-------|
| cream | `#EAE4D3` | 배경 |
| lightBrown | `#C29F74` | 강조, 링크 |
| darkBrown | `#7C4F2B` | 텍스트, 사이드바 배경 |
