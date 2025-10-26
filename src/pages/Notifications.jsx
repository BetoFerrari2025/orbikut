
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Award, Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => user ? base44.entities.Notification.filter({ user_email: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: [],
  });

  // The 'notificationUsers' query and 'getUserForNotification' function are removed
  // as the outline implies 'from_user_avatar' and 'from_user_name' will be available
  // directly on the notification object, making separate user fetching redundant for display.

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.update(notificationId, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => base44.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 fill-pink-500 text-pink-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case 'achievement':
        return <Award className="w-5 h-5 text-orange-500" />;
      default:
        return <Heart className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'like':
        return 'from-pink-400 to-red-400';
      case 'comment':
        return 'from-purple-400 to-pink-400';
      case 'follow':
        return 'from-blue-400 to-cyan-400';
      case 'achievement':
        return 'from-orange-400 to-yellow-400';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    // CORREÇÃO: Navegar para o perfil do usuário ou para o post
    if (notification.from_user_email) {
      if (notification.from_user_email === user.email) {
        navigate(createPageUrl("Profile"));
      } else {
        navigate(createPageUrl("UserProfile") + `?email=${notification.from_user_email}`);
      }
    } else if (notification.post_id) {
      navigate(createPageUrl("Feed"));
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 10) return 'agora';
    if (diffInSeconds < 60) return `há ${diffInSeconds}s`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `há ${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `há ${diffInDays}d`;
    
    return `há ${Math.floor(diffInDays / 7)}sem`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 md:ml-64 pb-20 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {unreadCount} {unreadCount === 1 ? 'nova notificação' : 'novas notificações'}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              variant="outline"
              size="sm"
              className="rounded-xl text-xs md:text-sm"
            >
              <Check className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Marcar todas como lidas</span>
              <span className="sm:hidden">Ler todas</span>
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Card key={i} className="p-4 rounded-2xl">
                <div className="flex items-start gap-3 md:gap-4">
                  <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </Card>
            ))
          ) : notifications.length === 0 ? (
            <Card className="p-8 md:p-12 text-center rounded-3xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8 md:w-10 md:h-10 text-purple-500" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Nenhuma notificação</h3>
              <p className="text-sm md:text-base text-gray-600">
                Você receberá notificações quando alguém interagir com você
              </p>
            </Card>
          ) : (
            <AnimatePresence>
              {notifications.map((notification, index) => {
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={`p-3 md:p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg group ${
                        notification.read
                          ? 'bg-white border border-gray-100'
                          : 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-md'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden`}>
                          {notification.from_user_avatar ? (
                            <img src={notification.from_user_avatar} alt={notification.from_user_name || 'Usuário'} className="w-full h-full object-cover" />
                          ) : (
                            getNotificationIcon(notification.type)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm md:text-base text-gray-900 font-medium mb-1 break-words">
                            {notification.message}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500">
                            {getTimeAgo(notification.created_date)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-500" />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}
