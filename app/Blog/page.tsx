import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

const blogPosts = [
  {
    title: '10 Tips to Pass Your TCF Exam on the First Try',
    excerpt: 'Preparing for the TCF exam? Here are proven strategies from successful test-takers to help you achieve your target score.',
    category: 'Exam Prep',
    date: 'Oct 1, 2025',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
  },
  {
    title: 'Why Learning Languages Boosts Your Career',
    excerpt: 'Discover how multilingualism can open doors to international opportunities and increase your earning potential.',
    category: 'Career',
    date: 'Sep 28, 2025',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
  },
  {
    title: 'The Science Behind Language Learning',
    excerpt: 'Understanding how your brain processes new languages can help you learn more efficiently and retain information better.',
    category: 'Learning Tips',
    date: 'Sep 25, 2025',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
  },
  {
    title: 'French vs Spanish: Which Should You Learn First?',
    excerpt: 'Compare the difficulty, career opportunities, and cultural benefits of these two popular Romance languages.',
    category: 'Language Comparison',
    date: 'Sep 20, 2025',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
  },
  {
    title: 'How to Stay Motivated While Learning a Language',
    excerpt: 'Practical strategies to maintain your enthusiasm and overcome plateaus in your language learning journey.',
    category: 'Motivation',
    date: 'Sep 15, 2025',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800',
  },
  {
    title: 'The Best Apps and Tools for Language Learners',
    excerpt: 'A curated list of complementary resources to enhance your ICLP learning experience.',
    category: 'Resources',
    date: 'Sep 10, 2025',
    readTime: '10 min read',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
  },
];

export function Blog() {
  return (
    <div className="py-12 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h1 className="text-4xl lg:text-5xl mb-4">
            Language Learning Blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Tips, strategies, and insights to help you succeed in your language learning journey.
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
