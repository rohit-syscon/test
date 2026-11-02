// import dynamic from 'next/dynamic';
import Pricing from '@/components/sections/Pricing';
import Hero from '@/components/sections/Hero';
// Dynamically import Hero to avoid server‑side rendering issues
// const Hero = dynamic(() => import('@/components/sections/Hero'), { ssr: false });



export default function HomePage() {
  return (
    <main>
      <Hero
        heading="Your new website"
        text="Describe what you want to Artin, or start editing this page."
        ctaLabel="Get in touch"
        ctaHref="#contact"
      />
      <Pricing />
    </main>
  );
}
