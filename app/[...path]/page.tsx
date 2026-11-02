import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BuilderRecordPage } from '@/components/artin-builder/page';
import { mediaUrl } from '@/lib/artin-media';
import * as pages from '@/lib/artin-pages';
import { getBuilderPage } from '@/lib/artin-pages';

/**
 * Pages made with the Artin page builder, at any address the rest of this
 * app does not already use. Added by Artin; this file belongs to your project.
 */

type Props = { params: Promise<{ path: string[] }> };

/** The page's address in each language, when lib/artin-pages.ts says them (yours may not). */
const languageAlternates = (Reflect.get(pages, 'languageAlternates') ?? (async () => null)) as () => Promise<Metadata['alternates'] | null>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getBuilderPage((await params).path.join('/'));
  if (!page) return {};
  const alternates = await languageAlternates();
  return {
    title: page.seo?.title || page.title,
    ...(page.seo?.description ? { description: page.seo.description } : {}),
    ...(page.seo?.image ? { openGraph: { images: [mediaUrl(page.seo.image)] } } : {}),
    ...(page.seo?.noindex ? { robots: { index: false } } : {}),
    ...(alternates ? { alternates } : {}),
  };
}

export default async function BuilderRoute({ params }: Props) {
  const page = await getBuilderPage((await params).path.join('/'));
  if (!page) notFound();
  return <BuilderRecordPage record={page} media={mediaUrl} />;
}
