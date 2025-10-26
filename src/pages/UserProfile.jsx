import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, UserPlus, UserCheck, Link as LinkIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import PostCard from "../components/feed/PostCard";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function UserProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const profileEmail = urlParams.get('email');
  const [currentUser, setCurrentUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(user => {
      setCurrentUser(user);
      if (user.email === profileEmail) {
        navigate(createPageUrl("Profile"));
      }
    }).catch(() => {});
  }, [profileEmail, navigate]);

  // CORREÇÃO: Buscar posts do usuário para extrair dados do perfil
  const { data: userPosts = [] } = useQuery({
    queryKey: ['user-posts', profileEmail],
    queryFn: () => base44.entities.Post.filter({ created_by: profileEmail }, '-created_date'),
    enabled: !!profileEmail,
    initialData: [],
  });

  // SOLUÇÃO: Usar dados do primeiro post para montar o perfil
  const profileUser = React.useMemo(() => {
    if (!profileEmail) return null;
    
    // Se tiver posts, pegar dados do post mais recente
    if (userPosts.length > 0) {
      const latestPost = userPosts[0];
      return {
        email: profileEmail,
        full_name: latestPost.author_name || profileEmail.split('@')[0] || 'Usuário',
        avatar_url: latestPost.author_avatar || null,
        level: latestPost.author_level || 1,
        posts_count: userPosts.length,
        followers_count: 0,
        following_count: 0
      };
    }
    
    // Se não tiver posts, usar dados básicos
    return {
      email: profileEmail,
      full_name: profileEmail.split('@')[0] || 'Usuário',
      avatar_url: null,
      level: 1,
      posts_count: 0,
      followers_count: 0,
      following_count: 0
    };
  }, [userPosts, profileEmail]);

  const { data: myLikes = [] } = useQuery({
    queryKey: ['my-likes', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.Like.filter({ created_by: currentUser.email }) : [],
    enabled: !!currentUser,
    initialData: [],
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ['is-following', currentUser?.email, profileEmail],
    queryFn: async () => {
      if (!currentUser) return false;
      const follows = await base44.entities.Follow.filter({ 
        created_by: currentUser.email, 
        following_user_email: profileEmail 
      });
      return follows.length > 0;
    },
    enabled: !!currentUser && !!profileEmail,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({ 
          created_by: currentUser.email, 
          following_user_email: profileEmail 
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }
        
        await base44.auth.updateMe({
          following_count: Math.max(0, (currentUser.following_count || 0) - 1)
        });
      } else {
        await base44.entities.Follow.create({ following_user_email: profileEmail });
        
        await base44.auth.updateMe({
          following_count: (currentUser.following_count || 0) + 1
        });

        await base44.entities.Notification.create({
          user_email: profileEmail,
          type: 'follow',
          from_user_email: currentUser.email,
          from_user_name: currentUser.full_name,
          from_user_avatar: currentUser.avatar_url,
          message: `${currentUser.full_name} começou a seguir você`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
    },
  });

  if (!profileEmail) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:ml-64 py-12 text-center">
        <p className="text-gray-500">Usuário não encontrado</p>
        <Button onClick={() => navigate(createPageUrl("Feed"))} className="mt-4">
          Voltar ao Feed
        </Button>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:ml-64 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-3xl" />
          <div className="h-32 bg-gray-200 rounded-3xl" />
        </div>
      </div>
    );
  }

  const level = profileUser.level || 1;
  const currentPoints = 0;
  const pointsForNextLevel = level * 100;
  const progress = (currentPoints / pointsForNextLevel) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 md:ml-64 pb-20 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="relative h-48 md:h-64 rounded-3xl overflow-hidden mb-6 shadow-lg bg-gradient-to-br from-purple-400 to-pink-400">
        </div>

        <Card className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-purple-100 -mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold shadow-2xl border-4 border-white overflow-hidden">
                {profileUser.avatar_url ? (
                  <img src={profileUser.avatar_url} alt={profileUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  profileUser.full_name?.[0]?.toUpperCase()
                )}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{profileUser.full_name}</h1>
                  <p className="text-gray-500">{profileUser.email}</p>
                </div>
                {currentUser && (
                  <Button
                    onClick={() => followMutation.mutate()}
                    disabled={followMutation.isPending}
                    variant={isFollowing ? "outline" : "default"}
                    className={`rounded-xl ${!isFollowing ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Seguir
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 bg-purple-50 rounded-2xl">
                  <p className="text-2xl font-bold text-purple-600">{profileUser.posts_count || 0}</p>
                  <p className="text-sm text-gray-600">Posts</p>
                </div>
                <div className="text-center p-3 bg-pink-50 rounded-2xl">
                  <p className="text-2xl font-bold text-pink-600">{profileUser.followers_count || 0}</p>
                  <p className="text-sm text-gray-600">Seguidores</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-2xl">
                  <p className="text-2xl font-bold text-orange-600">{profileUser.following_count || 0}</p>
                  <p className="text-sm text-gray-600">Seguindo</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-gray-900">Nível {level}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Posts de {profileUser.full_name}</h2>
          <div className="space-y-6">
            {userPosts.length === 0 ? (
              <Card className="bg-white rounded-3xl p-12 text-center shadow-lg">
                <p className="text-gray-500">{profileUser.full_name} ainda não publicou nada</p>
              </Card>
            ) : (
              userPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  isLiked={myLikes.some(like => like.post_id === post.id)}
                  index={index}
                />
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}