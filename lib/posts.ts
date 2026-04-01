import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  categories: string;
}

export interface Post extends PostMeta {
  content: string;
}

export type Category =
  | "yepbuddy"
  | "tamsul-dictionary"
  | "poc"
  | "others"
  | "react"
  | "designPattern";

const CATEGORY_DIRS: Record<Category, string> = {
  yepbuddy: "_yepbuddy",
  "tamsul-dictionary": "_tamsul-dictionary",
  poc: "_poc",
  others: "_others",
  react: "_react",
  designPattern: "_designPattern",
};

function getMarkdownFiles(): { slug: string; filePath: string; category: Category }[] {
  const root = process.cwd();
  const files: { slug: string; filePath: string; category: Category }[] = [];

  for (const [category, dir] of Object.entries(CATEGORY_DIRS) as [Category, string][]) {
    const dirPath = path.join(root, dir);
    if (!fs.existsSync(dirPath)) continue;

    const entries = fs.readdirSync(dirPath).filter((f) => f.endsWith(".markdown") || f.endsWith(".md"));
    for (const entry of entries) {
      const slug = entry.replace(/\.(markdown|md)$/, "");
      files.push({ slug, filePath: path.join(dirPath, entry), category });
    }
  }

  return files;
}

function parsePost(slug: string, filePath: string): Post {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: (data.title as string) || slug,
    date: data.date ? new Date(data.date as string).toISOString().split("T")[0] : "",
    categories: (data.categories as string) || "",
    content,
  };
}

export function getAllSlugs(): string[] {
  return getMarkdownFiles().map((f) => f.slug);
}

export function getAllPosts(): Post[] {
  return getMarkdownFiles()
    .map(({ slug, filePath }) => parsePost(slug, filePath))
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

export function getPostsByCategory(): Record<Category, Post[]> {
  const files = getMarkdownFiles();
  const result = Object.fromEntries(
    Object.keys(CATEGORY_DIRS).map((cat) => [cat, [] as Post[]])
  ) as Record<Category, Post[]>;

  for (const { slug, filePath, category } of files) {
    result[category].push(parsePost(slug, filePath));
  }

  for (const posts of Object.values(result)) {
    posts.sort((a, b) => (a.date > b.date ? 1 : -1));
  }

  return result;
}

export function getPostBySlug(slug: string): Post {
  const file = getMarkdownFiles().find((f) => f.slug === slug);
  if (!file) throw new Error(`Post not found: ${slug}`);
  return parsePost(file.slug, file.filePath);
}
