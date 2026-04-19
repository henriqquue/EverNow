'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, MessageCircle, Search, Filter, Crown,
  Trash2, Users, Star, MessageSquare, ChevronRight, MapPin
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { RadixTabs as Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn, formatRelativeTime } from '@/lib/utils';

interface Match {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  otherUser: {
    id: string;
    name: string;
    nickname?: string;
    age: number | null;
    city?: string;
    photo: string | null;
    isOnline: boolean;
  };
  chatThread: {
    id: string;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
  } | null;
}

interface Like {
  id: string;
  type: string;
  createdAt: string;
  fromUser: {
    id: string;
    name: string;
    birthDate: string;
    city?: string;
    userPhotos: Array<{ url: string }>;
  };
}

export default function MatchesPage() {
  const { data: session, status } = useSession() || {};
  const t = useTranslations('Connections');
  const common = useTranslations('Common');
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState<Match[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'new'>('all');

  // Fetch matches and likes
  useEffect(() => {
    if (session?.user) {
      const loadData = async () => {
        setLoading(true);
        try {
          // Premium check
          const profileRes = await fetch(`/api/profile/${session.user.id}`);
          const profileData = await profileRes.json();
          const planSlug = profileData.profile?.plan || (session.user as any)?.planSlug;
          setIsPremium(!!planSlug && planSlug !== 'gratuito');

          const [mRes, lRes] = await Promise.all([
            fetch('/api/matches'),
            fetch('/api/likes?type=received')
          ]);
          const mData = await mRes.json();
          const lData = await lRes.json();
          
          if (Array.isArray(mData)) setMatches(mData);
          if (Array.isArray(lData)) setLikes(lData);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [session?.user]);

  const handleUnmatch = async (matchId: string) => {
    if (!confirm(t('unmatch_confirm'))) return;
    try {
      await fetch(`/api/matches?id=${matchId}`, { method: 'DELETE' });
      setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (error) {
      console.error('Error unmatching:', error);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (search) {
      const name = match.otherUser.name?.toLowerCase() || '';
      if (!name.includes(search.toLowerCase())) return false;
    }
    if (filterStatus === 'unread' && (!match.chatThread || match.chatThread.unreadCount === 0)) return false;
    if (filterStatus === 'new' && match.chatThread?.lastMessage) return false;
    return true;
  });

  if (status === 'loading' || loading) return <Loading />;

  return (
    <div className="min-h-screen pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="p-4 pb-2">
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            <Heart className="w-7 h-7 text-purple-600" />
            {t('title')}
          </h1>
          <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
            {t('subtitle')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start px-4 bg-transparent h-auto py-3 gap-2 border-none">
            <TabsTrigger
              value="matches"
              className="flex-1 rounded-full data-[state=active]:bg-purple-600/10 data-[state=active]:text-purple-600 data-[state=active]:shadow-none px-4 py-2 text-xs font-black uppercase tracking-widest transition-all bg-transparent border border-transparent hover:bg-neutral-100 dark:hover:bg-white/5"
            >
              {t('matches')} ({matches.length})
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex-1 rounded-full data-[state=active]:bg-purple-600/10 data-[state=active]:text-purple-600 data-[state=active]:shadow-none px-4 py-2 text-xs font-black uppercase tracking-widest transition-all bg-transparent border border-transparent hover:bg-neutral-100 dark:hover:bg-white/5"
            >
              {t('likes')} ({likes.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'matches' ? (
          <>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('search_placeholder')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {(['all', 'unread', 'new'] as const).map(s => (
                  <Button
                    key={s}
                    variant={filterStatus === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(s)}
                    className={cn("rounded-full", filterStatus === s && "bg-purple-600 hover:bg-purple-700 text-white")}
                  >
                    {s === 'all' ? common('all') : s === 'unread' ? t('filter_unread') : t('filter_new')}
                  </Button>
                ))}
              </div>
            </div>

            {filteredMatches.length === 0 ? (
              <EmptyState
                icon={Users}
                title={t('no_connections')}
                description={t('no_connections_desc')}
                action={{
                  label: common('discover'),
                  onClick: () => router.push('/app/descobrir')
                }}
              />
            ) : (
              <div className="space-y-3">
                {filteredMatches.map(match => (
                  <Card key={match.id} className="p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/app/chat/${match.chatThread?.id || match.id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar 
                          src={match.otherUser.photo} 
                          name={match.otherUser.name} 
                          size="lg"
                          className="w-14 h-14"
                        />
                        {match.otherUser.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-500 border-2 border-background rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold truncate">{match.otherUser.name}</h4>
                          {match.chatThread?.unreadCount ? (
                            <Badge className="bg-purple-600 text-white border-none">{match.chatThread.unreadCount}</Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {match.chatThread?.lastMessage || (match.chatThread?.lastMessage === null ? t('new_connection_say_hi') : '...')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-500 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmatch(match.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            {!isPremium && likes.length > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{t('see_who_liked')}</h3>
                  <p className="text-xs opacity-90">{t('premium_blur_desc')}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => router.push('/app/planos')}>{common('upgrade') || 'Upgrade'}</Button>
              </div>
            )}

            {likes.length === 0 ? (
              <EmptyState
                icon={Heart}
                title={t('no_likes_yet')}
                description={t('no_likes_desc')}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {likes.map(like => (
                  <Card 
                    key={like.id} 
                    className={cn("relative aspect-[3/4] overflow-hidden group cursor-pointer", !isPremium && "blur-sm")}
                    onClick={() => isPremium && router.push(`/app/perfil/${like.fromUser.id}`)}
                  >
                    <img 
                      src={like.fromUser.userPhotos?.[0]?.url || '/placeholder-avatar.png'} 
                      className="w-full h-full object-cover" 
                      alt="Like" 
                    />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                      <p className="text-sm font-medium truncate">{isPremium ? like.fromUser.name : t('someone')}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
