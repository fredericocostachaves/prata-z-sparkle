import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, Link2, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { posts, getPostBySlug, formatDate } from "@/data/blog";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = getPostBySlug(params.slug);
    const title = post ? `${post.title} — Blog Prata Z` : "Artigo — Blog Prata Z";
    const desc = post?.excerpt ?? "Artigo do blog Prata Z Joias.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: BlogPostPage,
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <PageShell eyebrow="Blog" title="Artigo não encontrado">
        <div className="text-center py-16">
          <Link to="/blog" className="story-link text-[12px] tracking-[0.3em] uppercase">
            Voltar ao blog
          </Link>
        </div>
      </PageShell>
    );
  }

  const related = posts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);
  const fallbackRelated = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const relatedPosts = related.length > 0 ? related : fallbackRelated;

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  };

  return (
    <PageShell hideHero>
      <article className="pb-16">
        {/* Cabeçalho centralizado */}
        <header className="mx-auto max-w-3xl px-6 sm:px-10 pt-10 md:pt-14 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase text-nude-deep"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Blog
          </Link>
          <p className="mt-8">
            <span className="rounded-full bg-nude-soft px-4 py-1.5 text-[10px] tracking-[0.25em] uppercase text-nude-deep">
              {post.category}
            </span>
          </p>
          <h1 className="mt-5 font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] text-foreground">
            {post.title}
          </h1>
          <div className="mt-5 flex items-center justify-center gap-5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> {post.readTime} min de leitura
            </span>
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-6 sm:px-10 mt-10">
          <img
            src={post.cover}
            alt={post.title}
            width={1600}
            height={900}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full aspect-[16/9] object-cover rounded-lg"
          />
        </div>

        {/* Corpo do texto */}
        <div className="mx-auto max-w-2xl px-6 sm:px-10 mt-12 space-y-7 text-[17px] leading-[1.85] text-foreground/90">
          <p className="text-lg text-muted-foreground">{post.excerpt}</p>
          {post.body.map((block, i) => {
            switch (block.type) {
              case "h2":
                return (
                  <h2 key={i} className="font-serif text-3xl text-foreground pt-4">
                    {block.text}
                  </h2>
                );
              case "h3":
                return (
                  <h3 key={i} className="font-serif text-2xl text-foreground pt-2">
                    {block.text}
                  </h3>
                );
              case "quote":
                return (
                  <blockquote
                    key={i}
                    className="border-l-2 border-nude-deep pl-6 py-1 font-serif text-2xl leading-snug text-foreground"
                  >
                    “{block.text}”
                    {block.author && (
                      <footer className="mt-3 text-[11px] tracking-[0.25em] uppercase text-nude-deep font-sans">
                        {block.author}
                      </footer>
                    )}
                  </blockquote>
                );
              case "list":
                return (
                  <ul key={i} className="list-disc pl-6 space-y-2">
                    {block.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                );
              case "image":
                return (
                  <figure key={i} className="py-2">
                    <img
                      src={block.src}
                      alt={block.alt}
                      width={1200}
                      height={800}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[3/2] object-cover rounded-lg"
                    />
                    {block.caption && (
                      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
                        {block.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              default:
                return <p key={i}>{block.text}</p>;
            }
          })}
        </div>

        {/* Rodapé: compartilhamento */}
        <div className="mx-auto max-w-2xl px-6 sm:px-10 mt-14 border-t border-border pt-8">
          <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep">Compartilhar</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartilhar no Facebook"
              className="border border-border px-5 py-2.5 hover:bg-foreground hover:text-background transition"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Compartilhar no X"
              className="border border-border px-5 py-2.5 hover:bg-foreground hover:text-background transition"
            >
              <Twitter className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-[11px] tracking-[0.2em] uppercase hover:bg-foreground hover:text-background transition"
            >
              <Link2 className="h-4 w-4" /> Copiar link
            </button>
          </div>
        </div>

        {/* Posts relacionados */}
        <section className="mx-auto max-w-7xl px-6 sm:px-10 mt-16 md:mt-20">
          <p className="text-[11px] tracking-[0.3em] uppercase text-nude-deep text-center">
            Continue lendo
          </p>
          <h2 className="mt-3 text-center font-serif text-3xl text-foreground">
            Mais sobre {post.category}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {relatedPosts.map((p) => (
              <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group block">
                <div className="overflow-hidden rounded-lg bg-secondary aspect-[4/3]">
                  <img
                    src={p.cover}
                    alt={p.title}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <span className="mt-4 inline-block rounded-full bg-nude-soft px-3 py-1 text-[10px] tracking-[0.25em] uppercase text-nude-deep">
                  {p.category}
                </span>
                <h3 className="mt-3 font-serif text-xl text-foreground group-hover:text-nude-deep transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      </article>
    </PageShell>
  );
}
