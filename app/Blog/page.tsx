'use client';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

const blogPosts = [
  {
    title: '10 Tips to Pass Your TCF Canada Exam on the First Try',
    excerpt: 'Preparing for the TCF Canada exam? Here are proven strategies from successful test-takers to help you hit the score Express Entry needs.',
    category: 'Exam Prep',
    date: 'Oct 1, 2025',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
  },
  {
    title: 'How French Proficiency Boosts Your Express Entry CRS Score',
    excerpt: 'A strong TEF or TCF result can add thousands of Comprehensive Ranking System points. Here\'s how French fits into your PR strategy.',
    category: 'Immigration',
    date: 'Sep 28, 2025',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
  },
  {
    title: 'The Science Behind Learning French Effectively',
    excerpt: 'Understanding how your brain processes a new language can help you learn French more efficiently and retain what you study.',
    category: 'Learning Tips',
    date: 'Sep 25, 2025',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
  },
  {
    title: 'TEF Canada vs. TCF Canada: Which Exam Should You Take?',
    excerpt: 'Both are accepted for Express Entry, but they differ in format and scoring. Here\'s how to choose the right one for your PR application.',
    category: 'Exam Comparison',
    date: 'Sep 20, 2025',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
  },
  {
    title: 'DELF vs. DALF: Which French Diploma Do You Need?',
    excerpt: "Not applying for Canadian PR? DELF and DALF are the internationally recognized French diplomas for university, work, and general certification — here's how to pick your level.",
    category: 'Exam Comparison',
    date: 'Sep 18, 2025',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  },
  {
    title: 'Staying Motivated on Your Path to French Fluency and PR',
    excerpt: 'Practical strategies to maintain your enthusiasm and push through plateaus when your French level stands between you and permanent residency.',
    category: 'Motivation',
    date: 'Sep 15, 2025',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
  },
  {
    title: 'The Best Apps and Tools to Learn French for Your Canadian Immigration Journey',
    excerpt: 'A curated list of complementary resources to enhance your ICLP learning experience as you work toward your TCF/TEF goal.',
    category: 'Resources',
    date: 'Sep 10, 2025',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
  },
];

export default function Blog() {
  return (
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
          {blogPosts.map((post, index) => (
            <Card
              key={index}
              className="border-2 hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer group"
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
          ))}
        </div>
      </div>
    </div>
  );
}
