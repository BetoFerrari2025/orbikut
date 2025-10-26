
import React, { useState } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Flame, MoreVertical, UserPlus, UserCheck, Music, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CommentSection from "./CommentSection";
import ShareDialog from "./ShareDialog";
import MusicPlayer from "../MusicPlayer";
import LikesModal from "./LikesModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PostCard({ post, currentUser, isLiked, index }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [showLikesModal, setShowLikesModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);

  const isAdmin = currentUser?.email === 'ferraribetoferrari@gmail.com';

  // SOLUÇÃO FINAL: Usar dados salvos no post
  const displayUser = {
    email: post.created_by,
    full_name: post.author_name || post.created_by?.split('@')[0] || 'Usuário',
    avatar_url: post.author_avatar || null,
    level: post.author_level || 1
  };

  const { data: isFollowing = false, refetch: refetchFollowing } = useQuery({
    queryKey: ['is-following', currentUser?.email, post.created_by],
    queryFn: async () => {
      if (!currentUser || currentUser.email === post.created_by) return false;
      const follows = await base44.entities.Follow.filter({
        created_by: currentUser.email,
        following_user_email: post.created_by
      });
      return follows.length > 0;
    },
    enabled: !!currentUser && currentUser?.email !== post.created_by,
    initialData: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const targetUserEmail = post.created_by;

      // The outline provided removes the logic to update target user's followers_count.
      // Adhering to the outline.

      if (isFollowing) {
        const follows = await base44.entities.Follow.filter({
          created_by: currentUser.email,
          following_user_email: targetUserEmail
        });
        if (follows.length > 0) {
          await base44.entities.Follow.delete(follows[0].id);
        }

        await base44.auth.updateMe({
          following_count: Math.max(0, (currentUser.following_count || 0) - 1)
        });
      } else {
        await base44.entities.Follow.create({ following_user_email: targetUserEmail });

        await base44.auth.updateMe({
          following_count: (currentUser.following_count || 0) + 1
        });

        await base44.entities.Notification.create({
          user_email: targetUserEmail,
          type: 'follow',
          from_user_email: currentUser.email,
          from_user_name: currentUser.full_name,
          from_user_avatar: currentUser.avatar_url,
          message: `${currentUser.full_name} começou a seguir você`
        });
      }
    },
    onSuccess: () => {
      refetchFollowing();
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        const likes = await base44.entities.Like.filter({
          created_by: currentUser.email,
          post_id: post.id
        });
        if (likes.length > 0) {
          await base44.entities.Like.delete(likes[0].id);
        }
        await base44.entities.Post.update(post.id, {
          likes_count: Math.max(0, (post.likes_count || 0) - 1)
        });
      } else {
        await base44.entities.Like.create({ post_id: post.id });
        await base44.entities.Post.update(post.id, {
          likes_count: (post.likes_count || 0) + 1
        });

        const newPoints = (currentUser.points || 0) + 5;
        const newLevel = Math.floor(newPoints / 100) + 1;
        
        await base44.auth.updateMe({
          points: newPoints,
          level: newLevel
        });

        if (post.created_by !== currentUser.email) {
          await base44.entities.Notification.create({
            user_email: post.created_by,
            type: 'like',
            from_user_email: currentUser.email,
            from_user_name: currentUser.full_name,
            from_user_avatar: currentUser.avatar_url,
            message: `${currentUser.full_name} curtiu seu post`,
            post_id: post.id
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-likes'] });
      queryClient.invalidateQueries({ queryKey: ['post-likes', post.id] }); // Invalidate likes modal data
      if (!isLiked) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600);
      }
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async (newContent) => {
      await base44.entities.Post.update(post.id, { content: newContent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Post.delete(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Post.update(post.id, {
        shares_count: (post.shares_count || 0) + 1
      });
      
      const newPoints = (currentUser.points || 0) + 3;
      const newLevel = Math.floor(newPoints / 100) + 1;
      
      await base44.auth.updateMe({
        points: newPoints,
        level: newLevel
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setShowShareDialog(true);
    },
  });

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

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `há ${diffInWeeks}sem`;

    const diffInMonths = Math.floor(diffInDays / 30);
    return `há ${diffInMonths}m`;
  };

  const handleLike = () => {
    if (currentUser) {
      likeMutation.mutate();
    }
  };

  const handleShare = () => {
    if (currentUser) {
      shareMutation.mutate();
    }
  };

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      updatePostMutation.mutate(editedContent);
    }
  };

  const navigateToProfile = (userEmail) => {
    if (currentUser && userEmail === currentUser.email) {
      navigate(createPageUrl("Profile"));
    } else {
      navigate(createPageUrl("UserProfile") + `?email=${userEmail}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-purple-100"
    >
      <div className="flex items-center justify-between p-4 md:p-6 pb-3 md:pb-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigateToProfile(post.created_by)}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md relative hover:scale-105 transition-transform flex-shrink-0 overflow-hidden"
          >
            {displayUser.avatar_url ? (
              <img 
                src={displayUser.avatar_url} 
                alt={displayUser.full_name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.avatar-initials-fallback')) {
                    const initialsDiv = document.createElement('div');
                    initialsDiv.className = 'avatar-initials-fallback absolute inset-0 flex items-center justify-center text-white font-semibold';
                    initialsDiv.textContent = (displayUser.full_name?.[0] || 'U').toUpperCase();
                    parent.appendChild(initialsDiv);
                  }
                }}
              />
            ) : (
              (displayUser.full_name?.[0] || 'U').toUpperCase()
            )}
            {(displayUser.level || 1) > 1 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold border-2 border-white">
                {displayUser.level || 1}
              </div>
            )}
          </button>
          <div className="min-w-0 flex-1">
            <button
              onClick={() => navigateToProfile(post.created_by)}
              className="font-semibold text-sm md:text-base text-gray-900 hover:text-purple-600 transition-colors block truncate text-left w-full"
            >
              {displayUser.full_name}
            </button>
            <p className="text-xs md:text-sm text-gray-500 truncate">
              {getTimeAgo(post.created_date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {currentUser && currentUser.email !== post.created_by && (
            <Button
              onClick={() => followMutation.mutate()}
              disabled={followMutation.isPending}
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              className={`rounded-full text-xs md:text-sm h-7 md:h-8 px-2 md:px-3 ${!isFollowing ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
            >
              {isFollowing ? (
                <>
                  <UserCheck className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                  <span className="hidden sm:inline">Seguindo</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                  <span className="hidden sm:inline">Seguir</span>
                </>
              )}
            </Button>
          )}
          {(currentUser?.email === post.created_by || isAdmin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentUser?.email === post.created_by && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar post
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => deleteMutation.mutate()}
                  className="text-red-600"
                >
                  {isAdmin && currentUser.email !== post.created_by ? '🛡️ Excluir (Admin)' : 'Excluir post'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 pb-4">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[100px] rounded-2xl"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleSaveEdit}
                disabled={updatePostMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(post.content);
                }}
                variant="outline"
                className="rounded-xl"
                size="sm"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-gray-900 text-sm md:text-base lg:text-lg leading-relaxed break-words overflow-wrap-anywhere whitespace-pre-wrap">
            {post.content}
          </p>
        )}
      </div>

      {post.music_url && (
        <div className="mx-4 md:mx-6 mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
          <button
            onClick={() => setShowMusicPlayer(true)}
            className="w-full flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {post.music_title || 'Música'}
              </p>
              <p className="text-xs text-purple-600">Clique para ouvir</p>
            </div>
          </button>
        </div>
      )}

      {post.media_type === 'image' && post.image_url && (
        <div className="relative w-full bg-gray-100 max-h-[500px] overflow-hidden flex items-center justify-center">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full h-auto max-h-[500px] object-contain"
          />
        </div>
      )}

      {post.media_type === 'video' && post.video_url && (
        <div className="relative w-full bg-gray-100 max-h-[500px] overflow-hidden flex items-center justify-center">
          <video
            src={post.video_url}
            controls
            className="w-full h-auto max-h-[500px] object-contain"
          />
        </div>
      )}

      <div className="p-4 md:p-6 pt-3 md:pt-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 md:gap-6">
            <motion.button
              onClick={handleLike}
              disabled={!currentUser || isEditing}
              className="flex items-center gap-2 group relative"
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isLiked
                    ? "bg-gradient-to-br from-pink-500 to-red-500 shadow-lg shadow-pink-500/50"
                    : "bg-gray-100 group-hover:bg-pink-50"
                }`}
              >
                <Heart
                  className={`w-4 h-4 md:w-5 md:h-5 transition-all duration-300 ${
                    isLiked ? "fill-white text-white" : "text-gray-600 group-hover:text-pink-500"
                  }`}
                />
              </motion.div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the parent motion.button's onClick (handleLike) from firing
                  setShowLikesModal(true);
                }}
                className={`text-sm md:text-base font-semibold hover:underline ${isLiked ? "text-pink-600" : "text-gray-600"}`}
              >
                {post.likes_count || 0}
              </button>
              {isAnimating && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Heart className="w-6 h-6 md:w-8 md:h-8 fill-pink-500 text-pink-500" />
                </motion.div>
              )}
            </motion.button>

            <button
              onClick={() => setShowComments(!showComments)}
              disabled={isEditing}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 group-hover:bg-purple-50 flex items-center justify-center transition-all duration-300">
                <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-purple-500 transition-colors" />
              </div>
              <span className="text-sm md:text-base font-semibold text-gray-600">{post.comments_count || 0}</span>
            </button>

            <button
              onClick={handleShare}
              disabled={!currentUser || isEditing}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 group-hover:bg-orange-50 flex items-center justify-center transition-all duration-300">
                <Share2 className="w-4 h-4 md:w-5 md:h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
              </div>
              <span className="text-sm md:text-base font-semibold text-gray-600">{post.shares_count || 0}</span>
            </button>
          </div>

          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-1 px-2 md:px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 rounded-full"
          >
            <Flame className="w-3 h-3 md:w-4 md:h-4 text-orange-500" />
            <span className="text-xs md:text-sm font-semibold text-orange-700">+10</span>
          </motion.div>
        </div>

        {showComments && (
          <CommentSection postId={post.id} currentUser={currentUser} post={post} />
        )}
      </div>

      {showShareDialog && (
        <ShareDialog
          post={post}
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      {showMusicPlayer && (
        <MusicPlayer
          isOpen={showMusicPlayer}
          onClose={() => setShowMusicPlayer(false)}
          musicUrl={post.music_url}
          musicTitle={post.music_title}
        />
      )}

      {showLikesModal && (
        <LikesModal
          postId={post.id}
          isOpen={showLikesModal}
          onClose={() => setShowLikesModal(false)}
          currentUser={currentUser}
        />
      )}
    </motion.div>
  );
}
