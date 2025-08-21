// src/app/projects/[id]/chat-widget.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { subscribeToMessages, sendMessage } from '@/lib/chat';
import type { Message } from '@/lib/types';
import { format } from 'date-fns';

interface ChatWidgetProps {
  projectId: string;
}

export function ChatWidget({ projectId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      projectId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load chat messages:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading chat',
          description: 'Could not fetch messages for this project.',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, toast]);
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
        // A bit of a hack to scroll to the bottom. A better solution might use a dedicated library.
        setTimeout(() => {
            if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      await sendMessage(projectId, newMessage);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message.',
      });
    }
  };

  return (
    <Card className="flex flex-col h-[70vh]">
      <CardHeader>
        <CardTitle>Project Chat</CardTitle>
        <CardDescription>Real-time discussion with your project team.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-grow pr-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person" />
                    <AvatarFallback>{msg.senderName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-sm">{msg.senderName}</p>
                        <p className="text-xs text-muted-foreground">
                            {format(msg.createdAt.toDate(), 'p, MMM d')}
                        </p>
                    </div>
                    <p className="text-sm text-foreground/90">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t pt-4">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message... (Use @ to mention teammates)"
            className="flex-grow"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
