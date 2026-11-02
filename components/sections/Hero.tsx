type HeroProps = {
  heading: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function Hero({ heading, text, ctaLabel, ctaHref }: HeroProps) {
  return (
    <section className="bg-subtle px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">{heading}</h1>
        <p className="mt-6 text-lg text-muted">{text}</p>
        <a
          href={ctaHref}
          className="mt-10 inline-block rounded-md bg-brand px-6 py-3 font-semibold text-brand-ink"
        >
          {ctaLabel}
        </a>
      </div>
    </section>
  );
}
