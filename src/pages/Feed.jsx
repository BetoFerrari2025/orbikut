import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import PostCard from "../components/feed/PostCard";
import CreatePostQuick from "../components/feed/CreatePostQuick";
import StoriesCarousel from "../components/feed/StoriesCarousel";
import SuggestedUsers from "../components/feed/SuggestedUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Flame } from "lucide-react";

export default function Feed() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 50),
    initialData: [],
  });

  const { data: myLikes = [] } = useQuery({
    queryKey: ['my-likes', user?.email],
    queryFn: () => user ? base44.entities.Like.filter({ created_by: user.email }) : [],
    enabled: !!user,
    initialData: [],
  });

  // CORREÇÃO: Buscar apenas top users usando filter ao invés de list
  const { data: topUsers = [] } = useQuery({
    queryKey: ['top-users'],
    queryFn: async () => {
      // Buscar posts recentes para pegar emails de usuários ativos
      const recentPosts = await base44.entities.Post.list('-created_date', 50);
      const uniqueEmails = [...new Set(recentPosts.map(p => p.created_by).filter(Boolean))];
      
      // Buscar dados de cada usuário
      const usersPromises = uniqueEmails.slice(0, 10).map(async email => {
        try {
          const users = await base44.entities.User.filter({ email });
          return users[0];
        } catch {
          return null;
        }
      });
      
      const users = await Promise.all(usersPromises);
      const validUsers = users.filter(u => u && (u.points || 0) > 0);
      
      // Ordenar por pontos
      return validUsers.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5);
    },
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ['my-following-count', user?.email],
    queryFn: () => user ? base44.entities.Follow.filter({ created_by: user.email }) : [],
    enabled: !!user,
    initialData: [],
  });

  const shouldShowSuggestions = user && myFollowing.length < 5000;

  return (
    <div className="max-w-6xl mx-auto px-0 md:px-6 md:ml-64">
      {/* Stories Carousel */}
      {user && <StoriesCarousel currentUser={user} />}

      <div className="px-4 md:px-0">
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6 overflow-hidden">
            {/* Welcome Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-3xl p-8 text-white shadow-2xl shadow-purple-500/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Bem-vindo ao Orbikut! 🔥
                </h1>
                <p className="text-purple-100 text-lg">
                  Compartilhe momentos, ganhe pontos e evolua!
                </p>
              </div>
            </motion.div>

            {/* Create Post */}
            {user && <CreatePostQuick user={user} />}

            {/* Suggested Users - Mobile */}
            {shouldShowSuggestions && (
              <>
                <div className="lg:hidden">
                  <SuggestedUsers currentUser={user} />
                </div>
                {posts.length > 3 && (
                  <div className="lg:hidden">
                    <SuggestedUsers currentUser={user} key="suggested-2" />
                  </div>
                )}
                {posts.length > 6 && (
                  <div className="lg:hidden">
                    <SuggestedUsers currentUser={user} key="suggested-3" />
                  </div>
                )}
              </>
            )}

            {/* Posts */}
            <div className="space-y-6 overflow-hidden">
              <AnimatePresence>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-64 w-full rounded-2xl mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))
                ) : posts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-12 text-center shadow-lg"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum post ainda</h3>
                    <p className="text-gray-500">Seja o primeiro a compartilhar algo incrível!</p>
                  </motion.div>
                ) : (
                  posts.map((post, index) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUser={user}
                      isLiked={myLikes.some(like => like.post_id === post.id)}
                      index={index}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block space-y-6">
            {/* Suggested Users */}
            {shouldShowSuggestions && <SuggestedUsers currentUser={user} />}

            {/* Top Users */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-lg border border-purple-100"
            >
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-lg">Top do Ranking</h3>
              </div>
              <div className="space-y-3">
                {topUsers.map((topUser, index) => (
                  <div key={topUser.email} className="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-50 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md">
                        {topUser.avatar_url ? (
                          <img src={topUser.avatar_url} alt={topUser.full_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          topUser.full_name?.[0]?.toUpperCase()
                        )}
                      </div>
                      {index < 3 && (
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          'bg-orange-400 text-orange-900'
                        }`}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{topUser.full_name}</p>
                      <p className="text-xs text-purple-600">Nível {topUser.level || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-500">{topUser.points}</p>
                      <p className="text-xs text-gray-500">pts</p>
                    </div>
                  </div>
                ))}
                {topUsers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Seja o primeiro no ranking!
                  </p>
                )}
              </div>
            </motion.div>

            {/* Quick Stats */}
            {user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 shadow-lg text-white"
              >
                <h3 className="font-bold text-lg mb-4">Suas Estatísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">Posts</span>
                    <span className="font-bold text-xl">{user.posts_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">Seguidores</span>
                    <span className="font-bold text-xl">{user.followers_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-purple-100">Seguindo</span>
                    <span className="font-bold text-xl">{user.following_count || 0}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}