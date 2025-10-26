
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

export default function CommentSection({ postId, currentUser, post }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => base44.entities.Comment.filter({ post_id: postId }, '-created_date'),
    initialData: [],
  });

  // CORREÇÃO: Buscar dados dos usuários SEM CACHE
  const { data: commentUsers = {} } = useQuery({
    queryKey: ['comment-users-live', comments.length, Date.now()],
    queryFn: async () => {
      const uniqueEmails = [...new Set(comments.map(c => c.created_by).filter(Boolean))];
      if (uniqueEmails.length === 0) return {};

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
    enabled: comments.length > 0,
    staleTime: 0, // SEM CACHE
    cacheTime: 0, // NÃO mantém em cache
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    initialData: {},
  });

  const createCommentMutation = useMutation({
    mutationFn: async (content) => {
      await base44.entities.Comment.create({ post_id: postId, content });
      await base44.entities.Post.update(postId, {
        comments_count: (post.comments_count || 0) + 1
      });

      if (post.created_by !== currentUser.email) {
        await base44.entities.Notification.create({
          user_email: post.created_by,
          type: 'comment',
          from_user_email: currentUser.email,
          from_user_name: currentUser.full_name,
          message: `${currentUser.full_name} comentou no seu post`,
          post_id: postId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['comment-users-live'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setNewComment("");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment.trim() && currentUser) {
      createCommentMutation.mutate(newComment);
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
    return `há ${diffInDays}d`;
  };

  return (
    <div className="mt-4 pt-4 border-t border-purple-100">
      {/* Comment Form */}
      {currentUser && (
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="flex-1 rounded-xl text-sm resize-none"
              rows={2}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || createCommentMutation.isPending}
              size="icon"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Seja o primeiro a comentar!
          </p>
        ) : (
          comments.map((comment) => {
            const commentUser = commentUsers[comment.created_by] || {
              email: comment.created_by,
              full_name: comment.created_by?.split('@')[0] || 'Usuário',
              avatar_url: null
            };

            return (
              <div key={comment.id} className="flex gap-2 p-3 rounded-xl bg-purple-50/50 hover:bg-purple-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden">
                  {commentUser.avatar_url ? (
                    <img 
                      src={commentUser.avatar_url} 
                      alt={commentUser.full_name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    commentUser.full_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {commentUser.full_name}
                    </p>
                    <span className="text-xs text-gray-500">
                      {getTimeAgo(comment.created_date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 break-words">{comment.content}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
