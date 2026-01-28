import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell, AlertTriangle, Package, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lido: boolean;
  created_at: string;
  referencia_id?: string;
  referencia_tipo?: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.lido).length);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ lido: true })
      .eq('id', id);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lido: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.lido).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('notifications')
      .update({ lido: true })
      .in('id', unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, lido: true })));
      setUnreadCount(0);
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'ESTOQUE_BAIXO':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'LEAD_TIME_ALERTA':
        return <Package className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="mr-1 h-3 w-3" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex cursor-pointer gap-3 p-3 transition-colors hover:bg-muted/50 ${
                    !notification.lido ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => !notification.lido && markAsRead(notification.id)}
                >
                  <div className="mt-0.5">{getIcon(notification.tipo)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-tight">
                      {notification.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.mensagem}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {!notification.lido && (
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
