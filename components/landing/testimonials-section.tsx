'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface TestimonialsSectionProps {
  testimonials: any[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + testimonials.length) % testimonials.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % testimonials.length);
    setIsAutoPlaying(false);
  };

  if (testimonials.length === 0) return null;

  // Desktop: show 3 cards, Mobile: show 1
  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = 0; i < Math.min(3, testimonials.length); i++) {
      const index = (currentIndex + i) % testimonials.length;
      result.push({ ...testimonials[index], displayIndex: i });
    }
    return result;
  };

  return (
    <div className="relative">
      {/* Desktop view */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {getVisibleTestimonials().map((testimonial, i) => (
          <Card
            key={`${testimonial.id || i}-${currentIndex}`}
            className={cn(
              'p-6 bg-white dark:bg-neutral-800 border-0 shadow-lg transition-all duration-500',
              i === 1 ? 'scale-105 shadow-xl' : 'opacity-90'
            )}
          >
            <Quote className="h-8 w-8 text-rose-200 mb-4" />
            <p className="text-neutral-700 dark:text-neutral-300 mb-6 line-clamp-4">
              "{testimonial.content}"
            </p>
            <div className="flex items-center gap-3">
              <Avatar 
                src={testimonial.photo} 
                alt={testimonial.name} 
                name={testimonial.name}
                size="lg"
              />
              <div>
                <p className="font-semibold text-neutral-900 dark:text-white">
                  {testimonial.name}{testimonial.age ? `, ${testimonial.age}` : ''}
                </p>
                {testimonial.city && (
                  <p className="text-sm text-neutral-500">{testimonial.city}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1 mt-4">
              {[...Array(5)].map((_, j) => (
                <Star
                  key={j}
                  className={cn(
                    'h-4 w-4',
                    j < (testimonial.rating || 5)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-neutral-200'
                  )}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Mobile view */}
      <div className="md:hidden">
        <Card className="p-6 bg-white dark:bg-neutral-800 border-0 shadow-lg">
          <Quote className="h-8 w-8 text-rose-200 mb-4" />
          <p className="text-neutral-700 dark:text-neutral-300 mb-6">
            "{testimonials[currentIndex]?.content}"
          </p>
          <div className="flex items-center gap-3">
            <Avatar 
              src={testimonials[currentIndex]?.photo} 
              alt={testimonials[currentIndex]?.name} 
              name={testimonials[currentIndex]?.name}
              size="lg"
            />
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">
                {testimonials[currentIndex]?.name}
                {testimonials[currentIndex]?.age ? `, ${testimonials[currentIndex]?.age}` : ''}
              </p>
              {testimonials[currentIndex]?.city && (
                <p className="text-sm text-neutral-500">{testimonials[currentIndex]?.city}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 mt-4">
            {[...Array(5)].map((_, j) => (
              <Star
                key={j}
                className={cn(
                  'h-4 w-4',
                  j < (testimonials[currentIndex]?.rating || 5)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-neutral-200'
                )}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Navigation */}
      {testimonials.length > 1 && (
        <>
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i === currentIndex
                    ? 'bg-rose-500 w-6'
                    : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400'
                )}
              />
            ))}
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrev}
              className="pointer-events-auto -ml-4 bg-white/80 dark:bg-neutral-800/80 shadow-lg hover:bg-white dark:hover:bg-neutral-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="pointer-events-auto -mr-4 bg-white/80 dark:bg-neutral-800/80 shadow-lg hover:bg-white dark:hover:bg-neutral-800"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
