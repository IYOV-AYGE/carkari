import Link from "next/link";
import { ContentPage } from "@/components/ContentPage";
import { POSTS } from "@/lib/blog/posts";

export const metadata = {
  title: "Blog",
  description: "Guides et conseils pour louer une voiture et voyager au Maroc.",
};

export default function BlogPage() {
  return (
    <ContentPage
      title="Le blog CarKari"
      subtitle="Guides, prix et itinéraires pour rouler au Maroc."
    >
      <div className="space-y-6">
        {POSTS.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="block rounded-2xl border border-ink/10 p-6 transition hover:border-accent-400 hover:shadow"
          >
            <p className="text-xs text-ink/50">{p.date}</p>
            <h2 className="mt-1 text-xl font-bold text-ink">{p.title}</h2>
            <p className="mt-2 text-sm text-ink/70">{p.description}</p>
          </Link>
        ))}
      </div>
    </ContentPage>
  );
}
