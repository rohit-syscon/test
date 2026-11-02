"use client";

type Plan = {
  name: string;
  price: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
};

const plans: Plan[] = [
  {
    name: "Basic",
    price: "$19/mo",
    features: [
      "1 Project",
      "5 GB Storage",
      "Email Support",
    ],
    ctaLabel: "Choose Basic",
    ctaHref: "#contact",
  },
  {
    name: "Pro",
    price: "$49/mo",
    features: [
      "Unlimited Projects",
      "50 GB Storage",
      "Priority Email Support",
      "Analytics Dashboard",
    ],
    ctaLabel: "Choose Pro",
    ctaHref: "#contact",
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    features: [
      "Custom Solutions",
      "Unlimited Storage",
      "24/7 Phone Support",
      "Dedicated Account Manager",
    ],
    ctaLabel: "Contact Sales",
    ctaHref: "#contact",
  },
];

export default function Pricing() {
  return (
    <section className="bg-subtle py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-ink text-center mb-12">Pricing Plans</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="flex flex-col border border-muted rounded-lg p-6 bg-surface"
            >
              <h3 className="text-xl font-semibold text-ink mb-4 text-center">
                {plan.name}
              </h3>
              <p className="text-4xl font-bold text-brand text-center mb-4">
                {plan.price}
              </p>
              <ul className="flex-1 space-y-2 text-muted mb-6">
                {plan.features.map((feat) => (
                  <li key={feat}>• {feat}</li>
                ))}
              </ul>
              <a
                href={plan.ctaHref}
                className="mt-auto inline-block w-full text-center rounded-md bg-brand px-4 py-2 font-semibold text-brand-ink"
              >
                {plan.ctaLabel}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
