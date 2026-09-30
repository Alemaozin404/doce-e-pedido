import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ProductCard from "@/components/product/ProductCard";
import { getCategories, getFeaturedProducts, getReviews } from "@/services/catalog";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, categories, reviews, settings] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getReviews(),
    getSettings(),
  ]);

  const city = settings.seo_city;
  const heroImage =
    "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?auto=format&fit=crop&w=1600&q=80";

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image
            src={heroImage}
            alt="Bolo artesanal decorado com flores"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-chocolate-deepest/70 via-chocolate-deepest/45 to-cream" />
        </div>

        <div className="container-site flex min-h-[88svh] flex-col items-center justify-center py-24 text-center">
          <p className="animate-fade-in rounded-full border border-gold/50 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-soft backdrop-blur-sm">
            Confeitaria artesanal{city ? ` · ${city}` : ""}
          </p>
          <h1 className="mt-6 max-w-3xl animate-fade-in-up font-display text-4xl leading-tight text-white sm:text-5xl lg:text-6xl text-balance">
            Doces feitos para transformar momentos em memórias.
          </h1>
          <p className="mt-5 max-w-xl animate-fade-in-up text-base text-white/85 sm:text-lg">
            Doces artesanais, bolos e kits preparados com carinho para deixar sua comemoração ainda mais especial.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/cardapio" size="lg" variant="gold">
              Ver cardápio
            </Button>
            <Button href="/checkout" size="lg" variant="outline" className="!border-white/60 !text-white hover:!bg-white hover:!text-chocolate">
              Fazer pedido
            </Button>
          </div>

          <ul className="mt-12 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-white/90 sm:text-sm">
            {["100% artesanal", "Pedidos personalizados", "Feito sob encomenda"].map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-sm"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
        {/* fruta decorativa flutuante */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-24 hidden select-none text-7xl opacity-20 lg:block">
          🍓
        </div>
      </section>

      {/* ---------- DESTAQUES ---------- */}
      <section className="container-site py-16 sm:py-20" aria-labelledby="destaques">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Favoritos da casa</p>
            <h2 id="destaques" className="mt-1 font-display text-3xl text-chocolate-dark sm:text-4xl">
              Produtos em destaque
            </h2>
          </div>
          <Link href="/cardapio" className="hidden shrink-0 text-sm font-medium text-chocolate underline-offset-4 hover:underline sm:block">
            Ver cardápio completo →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Button href="/cardapio" variant="outline" size="sm">
            Ver cardápio completo
          </Button>
        </div>
      </section>

      {/* ---------- CATEGORIAS ---------- */}
      <section className="bg-white/70 py-16 sm:py-20" aria-labelledby="categorias">
        <div className="container-site">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Explore</p>
            <h2 id="categorias" className="mt-1 font-display text-3xl text-chocolate-dark sm:text-4xl">
              Categorias
            </h2>
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/cardapio?cat=${cat.slug}`}
                  className="group flex h-full flex-col items-center justify-center gap-2 rounded-3xl bg-white p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card"
                >
                  <span aria-hidden="true" className="text-3xl transition-transform duration-300 group-hover:scale-110">
                    {CATEGORY_EMOJIS[cat.slug] ?? "🍰"}
                  </span>
                  <span className="font-medium text-chocolate-dark">{cat.name}</span>
                  {cat.description ? (
                    <span className="line-clamp-2 text-xs text-chocolate-light">{cat.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- COMO FUNCIONA ---------- */}
      <section className="container-site py-16 sm:py-20" aria-labelledby="como-funciona">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Simples assim</p>
          <h2 id="como-funciona" className="mt-1 font-display text-3xl text-chocolate-dark sm:text-4xl">
            Como funciona
          </h2>
        </div>
        <ol className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: "📖", title: "1. Escolha", text: "Navegue pelo cardápio e monte seu pedido com as opções que preferir." },
            { icon: "📝", title: "2. Finalize", text: "Informe data, horário e tipo de entrega. A mensagem é gerada automaticamente." },
            { icon: "💬", title: "3. Envie", text: "O pedido chega organizado no WhatsApp e confirmamos tudo com você." },
          ].map((step) => (
            <li key={step.title} className="rounded-3xl bg-white p-7 shadow-soft">
              <span aria-hidden="true" className="text-3xl">{step.icon}</span>
              <h3 className="mt-3 font-display text-xl text-chocolate-dark">{step.title}</h3>
              <p className="mt-2 text-sm text-chocolate-light">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- KITS PARA FESTAS ---------- */}
      <section className="bg-gradient-to-b from-rose-soft/40 to-cream py-16 sm:py-20" aria-labelledby="kits">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=1200&q=80"
              alt="Mesa de doces decorada para festa"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Para comemorar</p>
            <h2 id="kits" className="mt-1 font-display text-3xl text-chocolate-dark sm:text-4xl">
              Kits para festas
            </h2>
            <p className="mt-4 text-chocolate-light">
              Aniversário, chá de bebê, casamento ou aquele encontro especial: montamos o combo perfeito
              para o número de convidados. Você escolhe, nós calculamos.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-chocolate">
              <li className="flex items-center gap-2"><span aria-hidden="true">✓</span> Doces e bolos proporcionais aos convidados</li>
              <li className="flex items-center gap-2"><span aria-hidden="true">✓</span> Estimativa de valores na hora</li>
              <li className="flex items-center gap-2"><span aria-hidden="true">✓</span> Orçamento final enviado no WhatsApp</li>
            </ul>
            <div className="mt-7">
              <Button href="/monte-sua-festa" variant="primary">Montar minha festa</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- DEPOIMENTOS ---------- */}
      <section className="container-site py-16 sm:py-20" aria-labelledby="depoimentos">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">Quem prova, ama</p>
          <h2 id="depoimentos" className="mt-1 font-display text-3xl text-chocolate-dark sm:text-4xl">
            Depoimentos
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <figure key={review.id} className="flex flex-col gap-3 rounded-3xl bg-white p-7 shadow-soft">
              <div aria-label={`${review.rating} de 5 estrelas`} className="text-gold-dark" title={`${review.rating}/5`}>
                {"★".repeat(review.rating)}
                <span className="text-chocolate/20">{"★".repeat(5 - review.rating)}</span>
              </div>
              <blockquote className="flex-1 text-sm text-chocolate">“{review.text}”</blockquote>
              <figcaption className="text-xs font-medium uppercase tracking-wide text-chocolate-light">
                {review.customer_name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- INSTAGRAM ---------- */}
      <section className="bg-white/70 py-16 sm:py-20" aria-labelledby="instagram">
        <div className="container-site text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-deep">@{settings.instagram_handle || "instagram"}</p>
          <h2 id="instagram" className="mt-1 font-display text-3xl text-chocolate-dark sm:text-4xl">
            Siga no Instagram
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-chocolate-light">
            Bastidores, novidades e doces saindo do forno todos os dias.
          </p>
          {settings.instagram_handle ? (
            <div className="mt-6">
              <Button href={`https://instagram.com/${settings.instagram_handle}`} external variant="secondary">
                Abrir Instagram
              </Button>
            </div>
          ) : (
            <p className="mt-4 text-xs text-chocolate-light">
              Configure o handle do Instagram nas configurações para exibir o feed.
            </p>
          )}
        </div>
      </section>

      {/* ---------- CTA FINAL ---------- */}
      <section className="container-site pb-4 pt-16 sm:pt-20" aria-labelledby="cta-final">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-chocolate px-6 py-14 text-center shadow-lifted sm:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute -left-6 -top-6 text-8xl opacity-10">🎂</div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 -right-4 text-8xl opacity-10">🧁</div>
          <h2 id="cta-final" className="font-display text-3xl text-cream sm:text-4xl">
            Pronto para adoçar o seu dia?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-cream/80">
            Monte seu pedido agora e receba tudo fresquinho na data que você escolher.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button href="/cardapio" variant="gold" size="lg">Ver cardápio</Button>
            <Button href="/contato" variant="outline" size="lg" className="!border-cream/50 !text-cream hover:!bg-cream hover:!text-chocolate">
              Falar conosco
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

const CATEGORY_EMOJIS: Record<string, string> = {
  bolos: "🎂",
  brigadeiros: "🍫",
  "doces-gourmet": "🍮",
  kits: "🎁",
  festa: "🎉",
  personalizados: "✨",
  combos: "💰",
};
