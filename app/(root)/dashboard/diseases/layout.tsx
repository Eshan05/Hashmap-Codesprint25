import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Disease Explorer',
  description: 'Generate approachable briefings on diseases, syndromes, and conditions.',
};

export default function DiseasesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div>{children}</div>;
}
