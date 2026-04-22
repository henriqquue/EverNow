'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  MessageCircle, Search, Circle, Archive, Volume2, VolumeX
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelativeTime, cn } from '@/lib/utils';

interface ChatThread {
  id: string;
  matchId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  otherUser: {
    id: string;
    name: string;
    nickname?: string;
    photo: string | null;
    isOnline: boolean;
  };
}

export default function ConversasPage() {
  const { data: session, status } = useSession() || {};
  const t = useTranslations('Conversations');
  const common = useTranslations('Common');
  const router = useRouter();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'new'>('all');

  // Fetch threads
  const fetchThreads = async () => {
    try {
      const res = await fetch(`/api/chat?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setThreads(data);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchThreads();
    }
  }, [session?.user, search]);

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    if (filterStatus === 'unread') return thread.unreadCount > 0;
    if (filterStatus === 'new') return !thread.lastMessage;
    return true;
  });

  // Calculate total unread
  const totalUnread = threads.reduce((acc, t) => acc + t.unreadCount, 0);

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pb-20 max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              <MessageCircle className="w-7 h-7 text-purple-600" />
              {t('title')}
              {totalUnread > 0 && (
                <Badge className="bg-purple-600 text-white border-none ml-1">{totalUnread}</Badge>
              )}
            </h1>
            <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-1">
              {t('subtitle')}
            </p>
          </div>

          {/* Search & Filters */}
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

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {(['all', 'unread', 'new'] as const).map(s => (
                <Button
                  key={s}
                  variant={filterStatus === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "rounded-full px-5 text-xs font-bold transition-all", 
                    filterStatus === s && "bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/20"
                  )}
                >
                  {s === 'all' ? t('filter_all') : s === 'unread' ? t('filter_unread') : t('filter_new')}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conversations list */}
      <div className="p-4">
        {filteredThreads.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title={search || filterStatus !== 'all' ? t('none_found') : t('no_conversations')}
            description={
              search || filterStatus !== 'all'
                ? t('none_found_desc')
                : t('no_conversations_desc')
            }
            action={!search && filterStatus === 'all' ? {
              label: t('view_matches'),
              onClick: () => router.push('/app/matches')
            } : undefined}
          />
        ) : (
          <div className="space-y-2">
            {filteredThreads.map((thread, index) => (
              <motion.div
                key={thread.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={`/app/chat/${thread.id}`}>
                  <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar
                          src={thread.otherUser.photo}
                          name={thread.otherUser.name || thread.otherUser.nickname}
                          size="lg"
                          className="w-14 h-14"
                        />
                        {thread.otherUser.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-500 rounded-full border-2 border-background" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold truncate">
                            {thread.otherUser.name || thread.otherUser.nickname}
                          </h3>
                          {thread.lastMessageAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(new Date(thread.lastMessageAt))}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-sm truncate ${thread.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                            {thread.lastMessage || t('start_chat')}
                          </p>
                          {thread.unreadCount > 0 && (
                            <Badge className="bg-purple-600 text-white border-none h-5 min-w-[20px] flex items-center justify-center">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
