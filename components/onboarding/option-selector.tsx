'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Option {
  name: string;
  slug: string;
  icon?: string;
  children?: Option[];
}

interface OptionSelectorProps {
  options: Option[];
  selected: string[];
  onSelect: (values: string[]) => void;
  multiple?: boolean;
  showSearch?: boolean;
  maxSelections?: number;
  columns?: 2 | 3 | 4;
}

export function OptionSelector({
  options,
  selected,
  onSelect,
  multiple = true,
  showSearch = false,
  maxSelections,
  columns = 3,
}: OptionSelectorProps) {
  const [search, setSearch] = useState('');
  const [expandedOptions, setExpandedOptions] = useState<string[]>([]);

  const filteredOptions = search
    ? options.filter(
        (opt) =>
          opt.name.toLowerCase().includes(search.toLowerCase()) ||
          opt.children?.some((c) =>
            c.name.toLowerCase().includes(search.toLowerCase())
          )
      )
    : options;

  const toggleOption = (slug: string) => {
    if (multiple) {
      if (selected.includes(slug)) {
        onSelect(selected.filter((s) => s !== slug));
      } else {
        if (maxSelections && selected.length >= maxSelections) {
          return;
        }
        onSelect([...selected, slug]);
      }
    } else {
      onSelect([slug]);
    }
  };

  const toggleExpand = (slug: string) => {
    setExpandedOptions((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  };

  return (
    <div className="space-y-4">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {maxSelections && (
        <p className="text-sm text-muted-foreground">
          Selecionados: {selected.length}/{maxSelections}
        </p>
      )}

      <div className={cn('grid gap-3', gridCols[columns])}>
        {filteredOptions.map((option) => {
          const isSelected = selected.includes(option.slug);
          const hasChildren = option.children && option.children.length > 0;
          const isExpanded = expandedOptions.includes(option.slug);

          return (
            <div key={option.slug}>
              <motion.button
                type="button"
                onClick={() => (hasChildren ? toggleExpand(option.slug) : toggleOption(option.slug))}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  'flex items-center justify-between gap-2',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card hover:border-primary/50'
                )}
              >
                <div className="flex items-center gap-2">
                  {option.icon && <span className="text-xl">{option.icon}</span>}
                  <span className="font-medium">{option.name}</span>
                </div>
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )
                ) : isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                ) : null}
              </motion.button>

              {/* Children options */}
              <AnimatePresence>
                {hasChildren && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pt-2 space-y-2">
                      {option.children?.map((child) => {
                        const childSelected = selected.includes(child.slug);
                        return (
                          <motion.button
                            key={child.slug}
                            type="button"
                            onClick={() => toggleOption(child.slug)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              'w-full p-3 rounded-lg border text-left transition-all',
                              'flex items-center justify-between gap-2',
                              childSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card/50 hover:border-primary/50'
                            )}
                          >
                            <span className="text-sm">{child.name}</span>
                            {childSelected && (
                              <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selected.map((slug) => {
            const option = findOption(options, slug);
            return (
              <Badge
                key={slug}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => toggleOption(slug)}
              >
                {option?.name || slug}
                <span className="ml-1">×</span>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

function findOption(options: Option[], slug: string): Option | undefined {
  for (const opt of options) {
    if (opt.slug === slug) return opt;
    if (opt.children) {
      const found = findOption(opt.children, slug);
      if (found) return found;
    }
  }
  return undefined;
}
