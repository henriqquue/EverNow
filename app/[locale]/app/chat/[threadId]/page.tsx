'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, MoreVertical, Circle, Check, CheckCheck,
  Flag, Ban, Info, Smile, Reply, Trash2, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Loading } from '@/components/ui/loading';
import { cn, formatRelativeTime } from '@/lib/utils';

const ALLOWED_REACTIONS = ['\u2764\uFE0F', '\uD83D\uDE02', '\uD83D\uDE2E', '\uD83D\uDC4D', '\uD83D\uDE22', '\uD83D\uDD25'];

interface ReplyTo {
  id: string;
  content: string;
  senderName: string;
}

interface Message {
  id: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  readAt?: string;
  reactions?: Record<string, string[]>;
  deletedForAll?: boolean;
  replyTo?: {
    id: string;
    content: string;
    sender: { id: string; name: string };
  } | null;
  sender: {
    id: string;
    name: string;
    userPhotos: Array<{ url: string }>;
  };
}

interface ThreadData {
  thread: {
    id: string;
    matchId: string;
    otherUser: {
      id: string;
      name: string;
      nickname?: string;
      photo: string | null;
      isOnline: boolean;
    };
  };
  messages: Message[];
  hasMore: boolean;
}

export default function ChatPage() {
  const { data: session, status } = useSession() || {};
  const t = useTranslations('Chat');
  const router = useRouter();
  const params = useParams();
  const threadId = params?.threadId as string;

  const [threadData, setThreadData] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [contextMsg, setContextMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${threadId}`);
      const data = await res.json();
      if (data.thread) {
        setThreadData(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    if (session?.user && threadId) {
      fetchMessages();
    }
  }, [session?.user, threadId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [threadData?.messages, scrollToBottom]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Send message
  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    const content = message.trim();
    setMessage('');
    const currentReply = replyTo;
    setReplyTo(null);

    try {
      const body: Record<string, string> = { content };
      if (currentReply) body.replyToId = currentReply.id;
      const res = await fetch(`/api/chat/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(content);
      setReplyTo(currentReply);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    setShowReactions(null);
    try {
      await fetch(`/api/chat/${threadId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, emoji })
      });
      fetchMessages();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Delete message
  const handleDelete = async (messageId: string, forAll: boolean) => {
    setContextMsg(null);
    try {
      const url = `/api/chat/${threadId}/messages/${messageId}?type=${forAll ? 'all' : 'me'}`;
      await fetch(url, { method: 'DELETE' });
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Block user
  const handleBlock = async () => {
    if (!threadData?.thread.otherUser.id) return;
    if (!confirm(t('block_confirm'))) return;

    try {
      await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: threadData.thread.otherUser.id })
      });
      router.push('/app/conversas');
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleReport = async () => {
    const reason = prompt(t('report_reason'));
    if (!reason || !threadData?.thread.otherUser.id) return;
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: threadData.thread.otherUser.id,
          reason: 'OTHER',
          description: reason,
        }),
      });
      alert(t('report_success'));
    } catch {
      alert(t('report_error'));
    }
  };

  const getMessageStatusIcon = (msgStatus: string) => {
    switch (msgStatus) {
      case 'READ':
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case 'DELIVERED':
        return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Check className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const canDeleteForAll = (msg: Message) => {
    if (msg.sender.id !== session?.user?.id) return false;
    const created = new Date(msg.createdAt).getTime();
    return Date.now() - created < 60 * 60 * 1000; // 1 hour
  };

  if (status === 'loading' || loading) {
    return <Loading />;
  }

  if (!threadData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('no_chat_found')}</p>
      </div>
    );
  }

  const { thread, messages } = threadData;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Header */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/app/conversas')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <Link href={`/app/perfil/${thread.otherUser.id}`} className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar
                src={thread.otherUser.photo}
                name={thread.otherUser.name}
                size="md"
                className="w-10 h-10"
              />
              {thread.otherUser.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-purple-500 rounded-full border-2 border-background" />
              )}
            </div>

            <div>
              <h2 className="font-semibold">{thread.otherUser.name}</h2>
              <p className="text-xs text-muted-foreground">
                {thread.otherUser.isOnline ? t('online') : t('offline')}
              </p>
            </div>
          </Link>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-5 h-5" />
            </Button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-background rounded-lg shadow-xl border z-50"
                >
                   <Link
                    href={`/app/perfil/${thread.otherUser.id}`}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-muted"
                    onClick={() => setShowMenu(false)}
                  >
                    <Info className="w-4 h-4" />
                    {t('view_profile')}
                  </Link>
                  <button
                    onClick={handleBlock}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted text-left"
                  >
                    <Ban className="w-4 h-4" />
                    {t('block')}
                  </button>
                  <button
                    onClick={handleReport}
                    className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted text-left text-red-500"
                  >
                    <Flag className="w-4 h-4" />
                    {t('report')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t('say_hi', { name: thread.otherUser.name })}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.sender.id === session?.user?.id;
            const showAvatar = !isOwn && (index === 0 || messages[index - 1].sender.id !== msg.sender.id);
            const isDeleted = msg.deletedForAll;
            const reactions = msg.reactions || {};
            const reactionEntries = Object.entries(reactions).filter(([, users]) => (users as string[]).length > 0);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-2 group relative', isOwn && 'justify-end')}
              >
                {!isOwn && showAvatar && (
                  <Avatar
                    src={msg.sender.userPhotos[0]?.url}
                    name={msg.sender.name}
                    size="sm"
                    className="w-8 h-8 flex-shrink-0"
                  />
                )}
                {!isOwn && !showAvatar && <div className="w-8" />}

                <div className="max-w-[85%] lg:max-w-[75%] relative">
                  {/* Reply reference */}
                  {msg.replyTo && !isDeleted && (
                    <div className={cn(
                      'text-xs px-3 py-1 mb-0.5 rounded-t-xl border-l-2',
                      isOwn
                        ? 'bg-purple-400/30 border-purple-300 text-purple-100'
                        : 'bg-muted/80 border-primary-400 text-muted-foreground'
                    )}>
                      <span className="font-medium">{msg.replyTo.sender.name}</span>
                      <p className="truncate">{msg.replyTo.content}</p>
                    </div>
                  )}

                  <div
                    className={cn(
                      'px-4 py-2',
                      isOwn
                        ? 'bg-purple-600 text-white rounded-2xl rounded-br-md'
                        : 'bg-muted rounded-2xl rounded-bl-md',
                      msg.replyTo && !isDeleted && 'rounded-t-none'
                    )}
                  >
                    {isDeleted ? (
                      <p className="italic text-sm opacity-60">{t('message_deleted')}</p>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    <div className={cn(
                      'flex items-center gap-1 mt-1 text-xs',
                      isOwn ? 'text-white/70 justify-end' : 'text-muted-foreground'
                    )}>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isOwn && getMessageStatusIcon(msg.status)}
                    </div>
                  </div>

                  {/* Reactions display */}
                  {reactionEntries.length > 0 && (
                    <div className={cn('flex gap-1 mt-0.5 flex-wrap', isOwn ? 'justify-end' : 'justify-start')}>
                      {reactionEntries.map(([emoji, users]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(msg.id, emoji)}
                          className="text-xs bg-muted/80 hover:bg-muted rounded-full px-1.5 py-0.5 border shadow-sm"
                        >
                          {emoji} {(users as string[]).length > 1 ? (users as string[]).length : ''}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Action bar (hover) */}
                  {!isDeleted && (
                    <div className={cn(
                      'absolute top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-opacity -translate-y-1/2',
                      // No mobile, mostramos as ações ao clicar (contextMsg ou showReactions) ou mantemos sutil
                      isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
                    )}>
                      <button
                        onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                        className="p-1 rounded-full hover:bg-muted bg-background border shadow-sm"
                        title="Reagir"
                      >
                        <Smile className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          setReplyTo({ id: msg.id, content: msg.content, senderName: msg.sender.name });
                          inputRef.current?.focus();
                        }}
                        className="p-1 rounded-full hover:bg-muted bg-background border shadow-sm"
                        title="Responder"
                      >
                        <Reply className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => setContextMsg(contextMsg === msg.id ? null : msg.id)}
                        className="p-1 rounded-full hover:bg-muted bg-background border shadow-sm"
                        title="Mais"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Reaction picker */}
                  <AnimatePresence>
                    {showReactions === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          'absolute z-20 flex gap-1 bg-background rounded-full shadow-xl border px-2 py-1',
                          isOwn ? 'right-0 bottom-full mb-1' : 'left-0 bottom-full mb-1'
                        )}
                      >
                        {ALLOWED_REACTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="text-lg hover:scale-125 transition-transform p-0.5"
                          >
                            {emoji}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Delete context menu */}
                  <AnimatePresence>
                    {contextMsg === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn(
                          'absolute z-20 bg-background rounded-lg shadow-xl border py-1 min-w-[180px]',
                          isOwn ? 'right-0 top-full mt-1' : 'left-0 top-full mt-1'
                        )}
                      >
                        <button
                          onClick={() => handleDelete(msg.id, false)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> {t('delete_for_me')}
                        </button>
                        {isOwn && canDeleteForAll(msg) && (
                          <button
                            onClick={() => handleDelete(msg.id, true)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {t('delete_for_all')}
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply bar */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-muted/50 border-t border-b px-4 py-2 flex items-center gap-3"
          >
            <Reply className="w-4 h-4 text-primary-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-primary-500">{replyTo.senderName}</p>
              <p className="text-xs text-muted-foreground truncate">{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-muted rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="sticky bottom-0 bg-background border-t p-3 lg:p-4">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('type_message')}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="icon"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
