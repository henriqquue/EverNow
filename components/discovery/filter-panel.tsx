'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronDown, ChevronUp, Filter, Save, RotateCcw,
  User, Heart, Eye, Baby, Church, Sparkles, Coffee, Music,
  Dog, Calendar, Settings, Crown, Check, Sliders, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FILTER_CATEGORIES,
  GENDER_OPTIONS,
  ORIENTATION_OPTIONS,
  INTENTION_OPTIONS,
  RELATIONSHIP_STATUS_OPTIONS,
  BODY_TYPE_OPTIONS,
  CHILDREN_OPTIONS,
  RELIGION_OPTIONS,
  LIFESTYLE_OPTIONS,
  PET_OPTIONS,
  EDUCATION_OPTIONS,
  MEETING_TYPE_OPTIONS
} from '@/lib/filter-options';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onSaveFilters?: (name: string) => void;
  savedFilters?: Array<{ id: string; name: string; filters: Record<string, any> }>;
  onLoadFilter?: (filters: Record<string, any>) => void;
  isPremium?: boolean;
}

const iconMap: Record<string, any> = {
  User, Heart, Eye, Baby, Church, Sparkles, Coffee, Music, Dog, Calendar, Settings, MapPin
};

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onSaveFilters,
  savedFilters = [],
  onLoadFilter,
  isPremium = false
}: FilterPanelProps) {
  const t = useTranslations('Filters');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic']);
  const [localFilters, setLocalFilters] = useState(filters);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const updateFilter = (key: string, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const current = localFilters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const resetFilters = () => {
    setLocalFilters({});
  };

  const countActiveFilters = () => {
    return Object.values(localFilters).filter(v =>
      v !== undefined && v !== null && v !== '' &&
      !(Array.isArray(v) && v.length === 0)
    ).length;
  };

  const handleSaveFilters = () => {
    if (saveFilterName.trim() && onSaveFilters) {
      onSaveFilters(saveFilterName.trim());
      setSaveFilterName('');
      setShowSaveModal(false);
    }
  };

  const renderMultiSelect = (
    options: Array<{ value: string; label: string }>,
    filterKey: string,
    isPremiumFeature = false
  ) => {
    const selected = localFilters[filterKey] || [];

    return (
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isSelected = selected.includes(option.value);
          const isLocked = isPremiumFeature && !isPremium;
          const translatedLabel = t.has(`opt_${option.value}` as any) ? t(`opt_${option.value}` as any) : option.label;

          return (
            <button
              key={option.value}
              onClick={() => !isLocked && toggleArrayFilter(filterKey, option.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-all',
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-muted hover:bg-muted/80 text-foreground',
                isLocked && 'opacity-50 cursor-not-allowed'
              )}
            >
              {translatedLabel}
              {isLocked && <Crown className="inline-block w-3 h-3 ml-1" />}
            </button>
          );
        })}
      </div>
    );
  };

  const renderRangeFilter = (
    minKey: string,
    maxKey: string,
    minDefault: number,
    maxDefault: number,
    unit = ''
  ) => (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        placeholder={t('min')}
        value={localFilters[minKey] || ''}
        onChange={e => updateFilter(minKey, e.target.value ? parseInt(e.target.value) : undefined)}
        className="w-20"
      />
      <span className="text-muted-foreground">{t('to')}</span>
      <Input
        type="number"
        placeholder={t('max')}
        value={localFilters[maxKey] || ''}
        onChange={e => updateFilter(maxKey, e.target.value ? parseInt(e.target.value) : undefined)}
        className="w-20"
      />
      {unit && <span className="text-muted-foreground text-sm">{unit}</span>}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                <h2 className="text-lg font-semibold">{t('title')}</h2>
                {countActiveFilters() > 0 && (
                  <Badge variant="secondary" className="bg-indigo-600 text-white">
                    {countActiveFilters()}
                  </Badge>
                )}
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="p-4 border-b flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t('reset')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSaveModal(true)}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('save')}
              </Button>
            </div>

            {/* Saved filters */}
            {savedFilters.length > 0 && (
              <div className="p-4 border-b">
                <p className="text-sm text-muted-foreground mb-2">{t('saved_filters')}</p>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map(sf => (
                    <button
                      key={sf.id}
                      onClick={() => onLoadFilter?.(sf.filters)}
                      className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-sm"
                    >
                      {sf.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter categories */}
            <div className="flex-1 overflow-y-auto">
              {Object.entries(FILTER_CATEGORIES).map(([key, category]) => {
                const Icon = iconMap[category.icon] || Filter;
                const isExpanded = expandedCategories.includes(key);
                const translatedCatName = t.has(`cat_${key}` as any) ? t(`cat_${key}` as any) : category.name;

                return (
                  <div key={key} className="border-b">
                    <button
                      onClick={() => toggleCategory(key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-indigo-600" />
                        <span className="font-medium">{translatedCatName}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 space-y-4">
                            {key === 'basic' && (
                              <>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('age')}</label>
                                  {renderRangeFilter('minAge', 'maxAge', 18, 100, t('years'))}
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('distance')}</label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      placeholder={t('max')}
                                      value={localFilters.maxDistance || ''}
                                      onChange={e => updateFilter('maxDistance', e.target.value ? parseInt(e.target.value) : undefined)}
                                      className="w-24"
                                    />
                                    <span className="text-muted-foreground text-sm">km</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('gender')}</label>
                                  {renderMultiSelect(GENDER_OPTIONS, 'genders')}
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('orientation')}</label>
                                  {renderMultiSelect(ORIENTATION_OPTIONS, 'orientations')}
                                </div>
                              </>
                            )}

                            {key === 'intention' && (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('intention')}</label>
                                  {renderMultiSelect(INTENTION_OPTIONS, 'intentions')}
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('relationship_status')}</label>
                                  {renderMultiSelect(RELATIONSHIP_STATUS_OPTIONS, 'relationshipStatuses')}
                                </div>
                              </div>
                            )}

                            {key === 'appearance' && (
                              <>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('body_type')}</label>
                                  {renderMultiSelect(BODY_TYPE_OPTIONS, 'bodyTypes')}
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('height')}</label>
                                  {renderRangeFilter('minHeight', 'maxHeight', 140, 220, 'cm')}
                                </div>
                              </>
                            )}

                            {key === 'family' && (
                              <>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('has_children')}</label>
                                  {renderMultiSelect(CHILDREN_OPTIONS, 'hasChildren')}
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('wants_children')}</label>
                                  {renderMultiSelect(CHILDREN_OPTIONS, 'wantsChildren')}
                                </div>
                              </>
                            )}

                            {key === 'religion' && (
                              <div>
                                <label className="text-sm font-medium mb-2 block">{t('religion')}</label>
                                {renderMultiSelect(RELIGION_OPTIONS, 'religions')}
                              </div>
                            )}

                            {key === 'lifestyle' && (
                              <>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('lifestyle')}</label>
                                  {renderMultiSelect(LIFESTYLE_OPTIONS, 'lifestyles')}
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">{t('education')}</label>
                                  {renderMultiSelect(EDUCATION_OPTIONS, 'education')}
                                </div>
                              </>
                            )}

                            {key === 'pets' && (
                              <div>
                                <label className="text-sm font-medium mb-2 block">{t('pets')}</label>
                                {renderMultiSelect(PET_OPTIONS, 'pets')}
                              </div>
                            )}

                            {key === 'meeting' && (
                              <div>
                                <label className="text-sm font-medium mb-2 block">{t('meeting')}</label>
                                {renderMultiSelect(MEETING_TYPE_OPTIONS, 'meetingTypes')}
                              </div>
                            )}

                              {key === 'location' && (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">País</label>
                                    <Input 
                                      placeholder="Ex: Brasil"
                                      value={localFilters.countries || ''}
                                      onChange={e => updateFilter('countries', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Estado</label>
                                    <Input 
                                      placeholder="Ex: Rio de Janeiro"
                                      value={localFilters.states || ''}
                                      onChange={e => updateFilter('states', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Cidade</label>
                                    <Input 
                                      placeholder="Ex: Rio de Janeiro"
                                      value={localFilters.cities || ''}
                                      onChange={e => updateFilter('cities', e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Bairro</label>
                                    <Input 
                                      placeholder="Ex: Copacabana"
                                      value={localFilters.neighborhoods || ''}
                                      onChange={e => updateFilter('neighborhoods', e.target.value)}
                                    />
                                  </div>
                                </div>
                              )}

                            {key === 'advanced' && (
                              <>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    {t('min_compatibility')}
                                    {!isPremium && <Crown className="inline-block w-3 h-3 ml-1 text-amber-500" />}
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      placeholder="Ex: 70"
                                      value={localFilters.minCompatibility || ''}
                                      onChange={e => updateFilter('minCompatibility', e.target.value ? parseInt(e.target.value) : undefined)}
                                      className="w-24"
                                      disabled={!isPremium}
                                    />
                                    <span className="text-muted-foreground text-sm">%</span>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={localFilters.verifiedOnly || false}
                                      onChange={e => updateFilter('verifiedOnly', e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">{t('verified_only')}</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={localFilters.onlineRecently || false}
                                      onChange={e => updateFilter('onlineRecently', e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">{t('online_recently')}</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={localFilters.withPhotos !== false}
                                      onChange={e => updateFilter('withPhotos', e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">{t('with_photos')}</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={localFilters.premiumOnly || false}
                                      onChange={e => updateFilter('premiumOnly', e.target.checked)}
                                      className="rounded"
                                      disabled={!isPremium}
                                    />
                                    <span className="text-sm">
                                      {t('premium_only')}
                                      {!isPremium && <Crown className="inline-block w-3 h-3 ml-1 text-amber-500" />}
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={localFilters.meetingMode || false}
                                      onChange={e => updateFilter('meetingMode', e.target.checked)}
                                      className="rounded"
                                    />
                                    <span className="text-sm">{t('meeting_mode')}</span>
                                  </label>
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <Button onClick={applyFilters} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {t('apply')}
              </Button>
            </div>

            {/* Save filter modal */}
            <AnimatePresence>
              {showSaveModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    className="bg-background rounded-lg p-6 w-full max-w-sm"
                  >
                    <h3 className="text-lg font-semibold mb-4">{t('save_filters_title')}</h3>
                    <Input
                      placeholder={t('filter_name_placeholder')}
                      value={saveFilterName}
                      onChange={e => setSaveFilterName(e.target.value)}
                      className="mb-4"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowSaveModal(false)}
                        className="flex-1"
                      >
                        {t('cancel')}
                      </Button>
                      <Button
                        onClick={handleSaveFilters}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                      >
                        {t('save')}
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
