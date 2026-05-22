import { TEMPLATE_COMPONENTS } from '@/components/templates';

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const Template =
    TEMPLATE_COMPONENTS[slug as keyof typeof TEMPLATE_COMPONENTS];

  if (!Template) {
    return <div>Template not found</div>;
  }

  return <Template />;
}
