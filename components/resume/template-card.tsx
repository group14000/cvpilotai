import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Props = {
  slug: string;
  title: string;
  description: string;
  image: string;
};

export function ResumeTemplateCard({ slug, title, description, image }: Props) {
  return (
    <Card className="group hover:border-primary/50 h-full overflow-hidden transition-all duration-200 hover:shadow-lg">
      {/* Template preview image */}
      <div className="bg-muted relative aspect-[9/12] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Template info */}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      {/* Action */}
      <CardFooter className="pt-0">
        <Button asChild className="w-full">
          <Link href={`/resumes/create-resume/${slug}`}>Use this template</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
