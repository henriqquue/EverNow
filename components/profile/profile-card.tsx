'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Heart,
  Sparkles,
  Edit,
  Camera,
  CheckCircle,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProfileCardProps {
  profile: {
    id: string;
    name?: string | null;
    nickname?: string | null;
    bio?: string | null;
    age?: number | null;
    gender?: string | null;
    lookingFor?: string | null;
    city?: string | null;
    state?: string | null;
    photos?: string[];
    interests?: string[];
    profileComplete: number;
    plan?: { name: string; slug: string } | null;
    profileByCategory?: Record<string, { name: string; values: string[] }>;
  };
  isOwnProfile?: boolean;
  compatibility?: number;
  onEdit?: () => void;
}

export function ProfileCard({ profile, isOwnProfile, compatibility, onEdit }: ProfileCardProps) {
  const mainPhoto = profile.photos?.[0];
  const isPremium = profile.plan?.slug === 'premium';

  const getLookingForLabel = (value: string | null | undefined) => {
    const labels: Record<string, string> = {
      SERIOUS: 'Relacionamento sério',
      CASUAL: 'Casual',
      FRIENDSHIP: 'Amizade',
      OPEN: 'Aberto a conhecer',
    };
    return value ? labels[value] || value : null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden">
        {/* Header com foto */}
        <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
          {mainPhoto ? (
            <img
              src={mainPhoto}
              alt={profile.name || 'Perfil'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-20 h-20 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {isPremium && (
              <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            {compatibility !== undefined && (
              <Badge 
                className={cn(
                  'text-white',
                  compatibility >= 80 ? 'bg-green-500' :
                  compatibility >= 60 ? 'bg-blue-500' :
                  compatibility >= 40 ? 'bg-yellow-500' : 'bg-gray-500'
                )}
              >
                <Heart className="w-3 h-3 mr-1" />
                {compatibility}% compatível
              </Badge>
            )}
          </div>

          {/* Edit button */}
          {isOwnProfile && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}

          {/* Add photo button */}
          {isOwnProfile && !mainPhoto && (
            <Link href="/app/onboarding">
              <Button className="absolute bottom-4 right-4 gap-2">
                <Camera className="w-4 h-4" />
                Adicionar foto
              </Button>
            </Link>
          )}
        </div>

        {/* Info */}
        <div className="p-6 space-y-4">
          {/* Nome e idade */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {profile.name || 'Sem nome'}
                {profile.age && <span className="font-normal">, {profile.age}</span>}
              </h2>
              {profile.nickname && (
                <p className="text-muted-foreground">@{profile.nickname}</p>
              )}
            </div>
          </div>

          {/* Localização */}
          {(profile.city || profile.state) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{[profile.city, profile.state].filter(Boolean).join(', ')}</span>
            </div>
          )}

          {/* Intenção */}
          {profile.lookingFor && (
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <span>{getLookingForLabel(profile.lookingFor)}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground">{profile.bio}</p>
          )}

          {/* Progresso do perfil (apenas próprio perfil) */}
          {isOwnProfile && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Perfil completo</span>
                <span className="text-sm text-muted-foreground">{profile.profileComplete}%</span>
              </div>
              <Progress value={profile.profileComplete} className="h-2" />
              {profile.profileComplete < 100 && (
                <Link href="/app/onboarding">
                  <Button variant="outline" size="sm" className="mt-3 w-full">
                    Completar perfil
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Interesses */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-2">Interesses</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 8).map((interest) => (
                  <Badge key={interest} variant="secondary">
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 8 && (
                  <Badge variant="outline">+{profile.interests.length - 8}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Categorias preenchidas */}
          {profile.profileByCategory && Object.keys(profile.profileByCategory).length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="text-sm font-medium mb-3">Sobre mim</h3>
              <div className="space-y-3">
                {Object.entries(profile.profileByCategory).slice(0, 5).map(([slug, cat]) => (
                  <div key={slug}>
                    <p className="text-xs text-muted-foreground">{cat.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cat.values.slice(0, 4).map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">
                          {v}
                        </Badge>
                      ))}
                      {cat.values.length > 4 && (
                        <Badge variant="outline" className="text-xs">+{cat.values.length - 4}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
