import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '../../../components/ui/badge';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';
import { PublicShell } from '../../../components/PublicShell';
import { blogPosts, getBlogPostBySlug } from '../../../lib/content/blog';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);
  if (!post) {
    return { title: 'Post not found | International Center for Language Proficiency' };
  }
  return {
    title: `${post.title} | International Center for Language Proficiency`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <PublicShell>
      <div className="py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto space-y-8">
            <Link href="/Blog" className="inline-flex items-center gap-2 text-primary hover:underline">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>

            <div className="space-y-4">
              <Badge variant="secondary">{post.category}</Badge>
              <h1 className="text-3xl lg:text-5xl">{post.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              </div>
            </div>

            <div className="aspect-video overflow-hidden rounded-2xl">
              <ImageWithFallback
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed">
              {post.content.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
