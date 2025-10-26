import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, UserPlus, UserCheck, Eye, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LikesModal({ postId, isOpen, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: likes = [], isLoading } = useQuery({
    queryKey: ['post-likes', postId],
    queryFn: () => base44.entities.Like.filter({ post_id: postId }),
    enabled: isOpen && !!postId,
    initialData: [],
  });

  const { data: likeUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['like-users', postId, likes.length],
    queryFn: async () => {
      if (likes.length === 0) return [];
      
      const uniqueEmails = [...new Set(likes.map(l => l.created_by).filter(Boolean))];
      
      const usersWithData = await Promise.all(
        uniqueEmails.map(async email => {
          try {
            const posts = await base44.entities.Post.filter({ created_by: email }, '-created_date', 1);
            if (posts.length > 0) {
              return {
                email,
                full_name: posts[0].author_name || email.split('@')[0],
                avatar_url: posts[0].author_avatar || null,
                level: posts[0].author_level || 1
              };
            }
            return {
              email,
              full_name: email.split('@')[0],
              avatar_url: null,
              level: 1
            };
          } catch {
            return {
              email,
              full_name: email.split('@')[0],
              avatar_url: null,
              level: 1
            };
          }
        })
      );
      
      return usersWithData;
    },
    enabled: likes.length > 0 && isOpen,
    initialData: [],
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ['my-following-list', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.Follow.filter({ created_by: currentUser.email }) : [],
    enabled: !!currentUser && isOpen,
    initialData: [],
  });

  const followMutation = useMutation({
    mutationFn: async ({ targetEmail, isCurrentlyFollowing }) => {
      if (isCurrentlyFollowing) {
        const follows = await base44.entities.Follow.filter({
          created_by: currentUser.email,
          following_user_email: targetEmail
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
        await base44.auth.updateMe({
          following_count: Math.max(0, (currentUser.following_count || 0) - 1)
        });
      } else {
        await base44.entities.Follow.create({ following_user_email: targetEmail });
        await base44.auth.updateMe({
          following_count: (currentUser.following_count || 0) + 1
        });
        await base44.entities.Notification.create({
          user_email: targetEmail,
          type: 'follow',
          from_user_email: currentUser.email,
          from_user_name: currentUser.full_name,
          from_user_avatar: currentUser.avatar_url,
          message: `${currentUser.full_name} começou a seguir você`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-following-list'] });
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
    },
  });

  const handleUserClick = (userEmail) => {
    onClose();
    if (currentUser && userEmail === currentUser.email) {
      navigate(createPageUrl("Profile"));
    } else {
      navigate(createPageUrl("UserProfile") + `?email=${userEmail}`);
    }
  };

  const filteredUsers = likeUsers.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const followingEmails = myFollowing.map(f => f.following_user_email);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            Reações
          </DialogTitle>
          <div className="flex items-center gap-4 pt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
              <span className="font-semibold">{likes.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>Visualizações</span>
            </div>
          </div>
        </DialogHeader>

        <div className="px-1 pb-2">
          <h3 className="font-semibold text-gray-900 mb-3">Curtido por</h3>
          
          <Input
            placeholder="Pesquisar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />

          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2">
            {isLoading || usersLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma curtida ainda</p>
              </div>
            ) : (
              filteredUsers.map((user, index) => {
                const isFollowing = followingEmails.includes(user.email);
                const isCurrentUser = currentUser?.email === user.email;

                return (
                  <motion.div
                    key={user.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <button
                      onClick={() => handleUserClick(user.email)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md relative flex-shrink-0 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          user.full_name?.[0]?.toUpperCase()
                        )}
                        {user.level > 1 && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                            {user.level}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email.split('@')[0]}</p>
                      </div>
                    </button>

                    {!isCurrentUser && currentUser && (
                      <Button
                        onClick={() => followMutation.mutate({ targetEmail: user.email, isCurrentlyFollowing: isFollowing })}
                        disabled={followMutation.isPending}
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        className={`rounded-full flex-shrink-0 ${!isFollowing ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Seguindo
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Seguir
                          </>
                        )}
                      </Button>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}