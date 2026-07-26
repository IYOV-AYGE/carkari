import { notFound } from "next/navigation";
import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { POSTS } from "@/lib/blog/posts";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = POSTS.find((p) => p.slug === slug);
  if (!found) return {};
  return { title: found.title, description: found.description };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <ContentPage title={post.title} subtitle={post.date}>
      {post.body.map((para, i) => (
        <p key={i}>{para}</p>
      ))}
      <p className="pt-4">
        <Link href="/search" className="font-semibold text-accent-600 hover:underline">
          Trouver une voiture au meilleur prix →
        </Link>
      </p>
    </ContentPage>
  );
}
