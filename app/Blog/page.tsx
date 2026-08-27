import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { PublicShell } from '../../components/PublicShell';
import { blogPosts } from '../../lib/content/blog';

export const metadata: Metadata = {
  title: 'Blog | International Center for Language Proficiency',
  description: 'Tips, strategies, and insights on French learning and TCF/TEF/DELF/DALF exam prep.',
};

export default function Blog() {
  return (
    <PublicShell>
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl mb-4">
            French & Canadian PR Blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Tips, strategies, and insights to help you reach the French level — and TCF/TEF score —
            your Canadian immigration goals need.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {blogPosts.map((post) => (
            <Link key={post.slug} href={`/Blog/${post.slug}`} className="block h-full">
              <Card
                className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer group h-full"
              >
                <div className="aspect-video overflow-hidden">
                  <ImageWithFallback
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader className="p-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>
                  <h3 className="text-xl group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {post.readTime}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
