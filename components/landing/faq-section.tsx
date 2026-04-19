'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackCommercialEvent } from '@/lib/commercial-events';

interface FAQSectionProps {
  faqs: any[];
}

export default function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    if (openIndex !== index) {
      trackCommercialEvent({
        eventType: 'faq_expand',
        metadata: { question: faqs[index]?.question }
      });
    }
    setOpenIndex(openIndex === index ? null : index);
  };

  if (faqs.length === 0) return null;

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={faq.id || index}
          className="bg-neutral-50 dark:bg-neutral-800 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => toggleFaq(index)}
            className="w-full px-6 py-4 flex items-center justify-between text-left"
          >
            <span className="font-medium text-neutral-900 dark:text-white pr-4">
              {faq.question}
            </span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-neutral-500 transition-transform flex-shrink-0',
                openIndex === index && 'rotate-180'
              )}
            />
          </button>
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              openIndex === index ? 'max-h-96' : 'max-h-0'
            )}
          >
            <div className="px-6 pb-4 text-neutral-600 dark:text-neutral-400">
              {faq.answer}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
