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

const CONTENT_DIRS = ["_posts", "_pages", "_others"];

export type ContentDir = "_posts" | "_pages" | "_others";

function getMarkdownFiles(): { slug: string; filePath: string; dir: ContentDir }[] {
  const root = process.cwd();
  const files: { slug: string; filePath: string; dir: ContentDir }[] = [];

  for (const dir of CONTENT_DIRS) {
    const dirPath = path.join(root, dir);
    if (!fs.existsSync(dirPath)) continue;

    const entries = fs.readdirSync(dirPath).filter((f) => f.endsWith(".markdown") || f.endsWith(".md"));
    for (const entry of entries) {
      const slug = entry.replace(/\.(markdown|md)$/, "");
      files.push({ slug, filePath: path.join(dirPath, entry), dir: dir as ContentDir });
    }
  }

  return files;
}

export function getAllSlugs(): string[] {
  return getMarkdownFiles().map((f) => f.slug);
}

export function getAllPosts(): Post[] {
  const files = getMarkdownFiles();
  const posts = files.map(({ slug, filePath }) => {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    return {
      slug,
      title: (data.title as string) || slug,
      date: data.date ? new Date(data.date as string).toISOString().split("T")[0] : "",
      categories: (data.categories as string) || "",
      content,
    };
  });

  return posts.sort((a, b) => (a.date > b.date ? 1 : -1));
}

export type Category = "sideProjects" | "retrospect" | "react" | "skills";

const REACT_HOOKS = ["usestate", "useeffect", "usereducer", "memo-usememo-usecallback", "useref", "usecontext"];

function classifyPost(slug: string, dir: ContentDir): Category {
  if (dir === "_posts") return "sideProjects";
  if (dir === "_others") return "skills";
  // _pages: React hooks → react, 나머지(vue-react-migration, i18n) → retrospect
  const isReactHook = REACT_HOOKS.some((hook) => slug.includes(hook));
  return isReactHook ? "react" : "retrospect";
}

export function getPostsByCategory(): Record<Category, Post[]> {
  const files = getMarkdownFiles();
  const result: Record<Category, Post[]> = {
    sideProjects: [],
    retrospect: [],
    react: [],
    skills: [],
  };

  for (const { slug, filePath, dir } of files) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(raw);
    const category = classifyPost(slug, dir);
    result[category].push({
      slug,
      title: (data.title as string) || slug,
      date: data.date ? new Date(data.date as string).toISOString().split("T")[0] : "",
      categories: (data.categories as string) || "",
      content,
    });
  }

  for (const cat of Object.keys(result) as Category[]) {
    result[cat].sort((a, b) => (a.date > b.date ? 1 : -1));
  }

  return result;
}

export function getPostBySlug(slug: string): Post {
  const files = getMarkdownFiles();
  const file = files.find((f) => f.slug === slug);
  if (!file) throw new Error(`Post not found: ${slug}`);

  const raw = fs.readFileSync(file.filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: (data.title as string) || slug,
    date: data.date ? new Date(data.date as string).toISOString().split("T")[0] : "",
    categories: (data.categories as string) || "",
    content,
  };
}
