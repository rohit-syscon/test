import Hero from '@/components/sections/Hero';

export default function HomePage() {
  return (
    <main>
      <Hero
        heading="Your new website"
        text="Describe what you want to Artin, or start editing this page."
        ctaLabel="Get in touch"
        ctaHref="#contact"
      />
    </main>
  );
}
