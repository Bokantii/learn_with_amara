import { Card, CardContent } from './ui/card';
import { Star } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const testimonials = [
  {
    name: 'Sarah Johnson',
    image: 'https://images.unsplash.com/photo-1581065178026-390bc4e78dad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTc1NDY0MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    quote: 'ICLP helped me pass my TCF exam with flying colors! The interactive lessons and mock exams were exactly what I needed.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    image: 'https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBwb3J0cmFpdHxlbnwxfHx8fDE3NTk2NDQ4NTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    quote: "The tutors are amazing and the platform is so easy to use. I've learned more in 3 months than I did in a year of traditional classes.",
    rating: 5,
  },
  {
    name: 'Emma Rodriguez',
    image: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHBvcnRyYWl0fGVufDF8fHx8MTc1OTY3MjU4Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    quote: 'Fantastic platform! The progress tracking keeps me motivated and the certificates are recognized by employers worldwide.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-12 lg:py-20 bg-slate-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl lg:text-4xl mb-4">
            What Our Students Say
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of successful language learners who achieved their goals with ICLP.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 lg:p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                    <ImageWithFallback
                      src={testimonial.image}
                      alt={`${testimonial.name} profile photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div>{testimonial.name}</div>
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-accent text-accent"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.quote}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
