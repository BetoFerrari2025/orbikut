import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function SuggestedUsers({ currentUser }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = React.useState(false);

  // CORREÇÃO: Buscar usuários dos posts recentes ao invés de list()
  const { data: allUsers = [] } = useQuery({
    queryKey: ['suggested-users-pool'],
    queryFn: async () => {
      const recentPosts = await base44.entities.Post.list('-created_date', 50);
      const uniqueEmails = [...new Set(recentPosts.map(p => p.created_by).filter(Boolean))];
      
      const usersPromises = uniqueEmails.slice(0, 20).map(async email => {
        try {
          const users = await base44.entities.User.filter({ email });
          return users[0];
        } catch {
          return null;
        }
      });
      
      const users = await Promise.all(usersPromises);
      return users.filter(u => u && u.email !== currentUser?.email);
    },
    initialData: [],
    enabled: !!currentUser,
  });

  const { data: myFollowing = [] } = useQuery({
    queryKey: ['my-following', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.Follow.filter({ created_by: currentUser.email }) : [],
    enabled: !!currentUser,
    initialData: [],
  });

  const followMutation = useMutation({
    mutationFn: async (targetEmail) => {
      await base44.entities.Follow.create({ following_user_email: targetEmail });
      
      const targetUser = await base44.entities.User.filter({ email: targetEmail });
      if (targetUser[0]) {
        await base44.entities.User.update(targetUser[0].id, {
          followers_count: (targetUser[0].followers_count || 0) + 1
        });
      }
      
      await base44.auth.updateMe({
        following_count: (currentUser.following_count || 0) + 1
      });

      await base44.entities.Notification.create({
        user_email: targetEmail,
        type: 'follow',
        from_user_email: currentUser.email,
        from_user_name: currentUser.full_name,
        message: `${currentUser.full_name} começou a seguir você`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-following'] });
      queryClient.invalidateQueries({ queryKey: ['suggested-users'] });
      queryClient.invalidateQueries({ queryKey: ['my-following-count'] });
    },
  });

  if (!currentUser || dismissed || myFollowing.length >= 5000) return null;

  const followingEmails = myFollowing.map(f => f.following_user_email);
  const suggestedUsers = allUsers
    .filter(u => u.email !== currentUser.email && !followingEmails.includes(u.email))
    .slice(0, 3);

  if (suggestedUsers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Card className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base md:text-lg text-gray-900">Sugestões para você</h3>
          <button
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="space-y-3 md:space-y-4">
          {suggestedUsers.map((user) => (
            <div key={user.email} className="flex items-center justify-between gap-2">
              <button
                onClick={() => navigate(createPageUrl("UserProfile") + `?email=${user.email}`)}
                className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md flex-shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs md:text-sm text-gray-500 truncate">
                    {user.followers_count || 0} seguidores
                  </p>
                </div>
              </button>
              <Button
                onClick={() => followMutation.mutate(user.email)}
                disabled={followMutation.isPending}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full flex-shrink-0 text-xs md:text-sm px-3 md:px-4"
              >
                <UserPlus className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                <span className="hidden md:inline">Seguir</span>
              </Button>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate(createPageUrl("Explore"))}
          className="w-full mt-4 text-center text-purple-600 font-semibold hover:text-purple-700 transition-colors text-sm md:text-base"
        >
          Ver tudo
        </button>
      </Card>
    </motion.div>
  );
}