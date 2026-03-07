import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import { MarkdownContent } from "@/components/markdown-content";
import { Separator } from "@/components/ui/separator";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return { title: `${post.title} | 이주훈` };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  return (
    <article className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-dark-brown">{post.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{post.date}</p>
      </header>
      <Separator className="mb-8" />
      <MarkdownContent content={post.content} />
    </article>
  );
}
