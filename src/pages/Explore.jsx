import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Users, Zap, Award } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Explore() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('trending');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: trendingPosts = [], isLoading: trendingLoading } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: () => base44.entities.Post.list('-likes_count', 20),
    initialData: [],
    enabled: activeFilter === 'trending',
  });

  const { data: newPosts = [], isLoading: newLoading } = useQuery({
    queryKey: ['new-posts'],
    queryFn: () => base44.entities.Post.list('-created_date', 20),
    initialData: [],
    enabled: activeFilter === 'new',
  });

  const { data: activeUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['active-users'],
    queryFn: async () => {
      const recentPosts = await base44.entities.Post.list('-created_date', 50);
      const uniqueEmails = [...new Set(recentPosts.map(p => p.created_by).filter(Boolean))];
      
      const usersPromises = uniqueEmails.slice(0, 15).map(async email => {
        try {
          const users = await base44.entities.User.filter({ email });
          return users[0];
        } catch {
          return null;
        }
      });
      
      const users = await Promise.all(usersPromises);
      const validUsers = users.filter(u => u && (u.posts_count || 0) > 0);
      
      return validUsers.sort((a, b) => (b.posts_count || 0) - (a.posts_count || 0)).slice(0, 10);
    },
    initialData: [],
  });

  const { data: topCreators = [], isLoading: creatorsLoading } = useQuery({
    queryKey: ['top-creators'],
    queryFn: async () => {
      const recentPosts = await base44.entities.Post.list('-created_date', 50);
      const uniqueEmails = [...new Set(recentPosts.map(p => p.created_by).filter(Boolean))];
      
      const usersPromises = uniqueEmails.slice(0, 15).map(async email => {
        try {
          const users = await base44.entities.User.filter({ email });
          return users[0];
        } catch {
          return null;
        }
      });
      
      const users = await Promise.all(usersPromises);
      const validUsers = users.filter(u => u && (u.points || 0) > 0);
      
      return validUsers.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10);
    },
    initialData: [],
    enabled: activeFilter === 'top_creators',
  });

  const displayPosts = activeFilter === 'new' ? newPosts : trendingPosts;
  
  const { data: postUsers = {} } = useQuery({
    queryKey: ['explore-post-users', activeFilter, Date.now()],
    queryFn: async () => {
      const uniqueEmails = [...new Set(displayPosts.map(p => p.created_by).filter(Boolean))];
      const users = await Promise.all(
        uniqueEmails.map(async email => {
          try {
            const userData = await base44.entities.User.filter({ email });
            return userData[0] || { email, full_name: email.split('@')[0] || 'Usuário', avatar_url: null };
          } catch (error) {
            return { email, full_name: email.split('@')[0] || 'Usuário', avatar_url: null };
          }
        })
      );
      
      const usersMap = {};
      users.forEach(u => {
        if (u.email) usersMap[u.email] = u;
      });
      return usersMap;
    },
    enabled: displayPosts.length > 0,
    staleTime: 0,
    cacheTime: 0,
    initialData: {},
  });

  const handlePostClick = (post) => {
    navigate(createPageUrl("Feed"));
  };

  const handleUserClick = (userEmail) => {
    if (user && userEmail === user.email) {
      navigate(createPageUrl("Profile"));
    } else {
      navigate(createPageUrl("UserProfile") + `?email=${userEmail}`);
    }
  };

  const isLoading = activeFilter === 'trending' ? trendingLoading : 
                    activeFilter === 'new' ? newLoading : 
                    creatorsLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 md:ml-64 pb-20 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Explorar
          </h1>
          <p className="text-sm md:text-base lg:text-lg text-gray-600">
            Descubra conteúdos e pessoas incríveis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <button
            onClick={() => setActiveFilter('trending')}
            className="w-full"
          >
            <Card className={`${activeFilter === 'trending' ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-white hover:shadow-lg'} p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-md transition-all duration-300 cursor-pointer border-0`}>
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3" />
              <h3 className="text-lg md:text-xl font-bold mb-1">Em Alta</h3>
              <p className={`text-sm md:text-base ${activeFilter === 'trending' ? 'text-purple-100' : 'text-gray-600'}`}>
                Posts mais populares
              </p>
            </Card>
          </button>

          <button
            onClick={() => setActiveFilter('new')}
            className="w-full"
          >
            <Card className={`${activeFilter === 'new' ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-white hover:shadow-lg'} p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-md transition-all duration-300 cursor-pointer border-0`}>
              <Zap className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3" />
              <h3 className="text-lg md:text-xl font-bold mb-1">Novos</h3>
              <p className={`text-sm md:text-base ${activeFilter === 'new' ? 'text-orange-100' : 'text-gray-600'}`}>
                Conteúdo recente
              </p>
            </Card>
          </button>

          <button
            onClick={() => setActiveFilter('top_creators')}
            className="w-full"
          >
            <Card className={`${activeFilter === 'top_creators' ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' : 'bg-white hover:shadow-lg'} p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-md transition-all duration-300 cursor-pointer border-0`}>
              <Award className="w-6 h-6 md:w-8 md:h-8 mb-2 md:mb-3" />
              <h3 className="text-lg md:text-xl font-bold mb-1">Top Creators</h3>
              <p className={`text-sm md:text-base ${activeFilter === 'top_creators' ? 'text-blue-100' : 'text-gray-600'}`}>
                Melhores criadores
              </p>
            </Card>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeFilter === 'top_creators' ? (
            <motion.div
              key="top_creators"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
                Top Creators
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                {creatorsLoading ? (
                  Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  topCreators.map((creator, index) => (
                    <motion.button
                      key={creator.email}
                      onClick={() => handleUserClick(creator.email)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full"
                    >
                      <Card className="p-4 rounded-2xl hover:shadow-xl transition-all duration-300 border border-purple-100">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md relative flex-shrink-0 overflow-hidden">
                            {creator.avatar_url ? (
                              <img src={creator.avatar_url} alt={creator.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg md:text-xl">{creator.full_name?.[0]?.toUpperCase()}</span>
                            )}
                            {creator.level > 1 && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                                {creator.level}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-semibold text-sm md:text-base text-gray-900 truncate">
                              {creator.full_name}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500">
                              {creator.posts_count || 0} posts • {creator.followers_count || 0} seguidores
                            </p>
                          </div>
                          <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 flex-shrink-0 text-xs md:text-sm">
                            {creator.points || 0} pts
                          </Badge>
                        </div>
                      </Card>
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
                <div className="lg:col-span-2">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                    {activeFilter === 'trending' ? (
                      <>
                        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                        Posts em Alta
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                        Posts Novos
                      </>
                    )}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {isLoading ? (
                      Array(6).fill(0).map((_, i) => (
                        <Card key={i} className="p-3 md:p-4 rounded-2xl overflow-hidden">
                          <Skeleton className="h-40 md:h-48 w-full rounded-xl mb-3" />
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-1/2" />
                        </Card>
                      ))
                    ) : (
                      displayPosts.slice(0, 6).map((post, index) => {
                        const postUser = postUsers[post.created_by] || { 
                          email: post.created_by, 
                          full_name: post.created_by?.split('@')[0] || 'Usuário',
                          avatar_url: null 
                        };
                        
                        return (
                          <motion.button
                            key={post.id}
                            onClick={() => handlePostClick(post)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="w-full"
                          >
                            <Card className="overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border border-purple-100 h-full">
                              {post.image_url && (
                                <div className="relative h-40 md:h-48 overflow-hidden bg-gray-100">
                                  <img
                                    src={post.image_url}
                                    alt="Post"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                  <Badge className="absolute top-2 md:top-3 right-2 md:right-3 bg-white/90 text-purple-600 border-0 text-xs md:text-sm">
                                    {post.likes_count || 0} ❤️
                                  </Badge>
                                </div>
                              )}
                              <div className="p-3 md:p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {postUser.avatar_url ? (
                                      <img src={postUser.avatar_url} alt={postUser.full_name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-white text-xs md:text-sm font-semibold">
                                        {postUser.full_name?.[0]?.toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs md:text-sm font-semibold text-gray-700 truncate">
                                    {postUser.full_name}
                                  </span>
                                </div>
                                
                                <p className="text-sm md:text-base text-gray-900 line-clamp-2 font-medium mb-2 break-words">
                                  {post.content}
                                </p>
                                <div className="flex gap-3 md:gap-4 text-xs md:text-sm text-gray-500">
                                  <span>{post.comments_count || 0} comentários</span>
                                  <span>{post.shares_count || 0} shares</span>
                                </div>
                              </div>
                            </Card>
                          </motion.button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="hidden lg:block">
                  <h2 className="text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
                    Criadores Ativos
                  </h2>
                  <div className="space-y-3">
                    {usersLoading ? (
                      Array(5).fill(0).map((_, i) => (
                        <Card key={i} className="p-4 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <Skeleton className="h-4 w-24 mb-2" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      activeUsers.map((activeUser, index) => (
                        <motion.button
                          key={activeUser.email}
                          onClick={() => handleUserClick(activeUser.email)}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="w-full"
                        >
                          <Card className="p-4 rounded-2xl hover:shadow-lg transition-all duration-300 cursor-pointer border border-purple-100">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md relative flex-shrink-0 overflow-hidden">
                                {activeUser.avatar_url ? (
                                  <img src={activeUser.avatar_url} alt={activeUser.full_name} className="w-full h-full object-cover" />
                                ) : (
                                  activeUser.full_name?.[0]?.toUpperCase()
                                )}
                                {activeUser.level > 1 && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                                    {activeUser.level}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="font-semibold text-gray-900 truncate">
                                  {activeUser.full_name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {activeUser.posts_count || 0} posts
                                </p>
                              </div>
                              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 flex-shrink-0">
                                {activeUser.points || 0} pts
                              </Badge>
                            </div>
                          </Card>
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}