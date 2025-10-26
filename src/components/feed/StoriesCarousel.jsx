import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StoryViewer from "./StoryViewer";

export default function StoriesCarousel({ currentUser }) {
  const navigate = useNavigate();
  const [selectedUserStories, setSelectedUserStories] = useState(null);

  const { data: allStories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      const now = new Date();
      const stories = await base44.entities.Story.list('-created_date', 100);
      return stories.filter(story => {
        const expiresAt = new Date(story.expires_at);
        return expiresAt > now;
      });
    },
    initialData: [],
    refetchInterval: 30000,
  });

  const { data: storyUsers = [] } = useQuery({
    queryKey: ['story-users'],
    queryFn: async () => {
      const uniqueEmails = [...new Set(allStories.map(s => s.created_by))];
      const users = await Promise.all(
        uniqueEmails.map(email => 
          base44.entities.User.filter({ email }).then(u => u[0] || { email, full_name: 'Usuário' })
        )
      );
      return users;
    },
    enabled: allStories.length > 0,
    initialData: [],
  });

  const { data: myStoryViews = [] } = useQuery({
    queryKey: ['my-story-views', currentUser?.email],
    queryFn: () => currentUser ? base44.entities.StoryView.filter({ viewer_email: currentUser.email }) : [],
    enabled: !!currentUser,
    initialData: [],
  });

  // Filtrar stories do próprio usuário
  const myStories = currentUser ? allStories.filter(s => s.created_by === currentUser.email) : [];
  
  // Criar objeto de usuário com stories
  const myUser = currentUser && myStories.length > 0 ? {
    user: currentUser,
    stories: myStories,
    hasUnviewed: false
  } : null;

  // Agrupar stories de outros usuários
  const groupedStories = storyUsers
    .filter(user => user.email !== currentUser?.email)
    .map(user => ({
      user,
      stories: allStories.filter(s => s.created_by === user.email),
      hasUnviewed: allStories
        .filter(s => s.created_by === user.email)
        .some(story => !myStoryViews.some(view => view.story_id === story.id))
    }));

  const handleMyStoryClick = () => {
    if (myStories.length > 0 && myUser) {
      setSelectedUserStories(myUser);
    } else {
      navigate(createPageUrl("CreateStory"));
    }
  };

  return (
    <>
      <div className="bg-white border-b border-purple-100 py-4 px-4 md:px-6 overflow-x-auto">
        <div className="flex gap-4 max-w-6xl mx-auto">
          {/* Add/View My Story */}
          {currentUser && (
            <button
              onClick={handleMyStoryClick}
              className="flex-shrink-0"
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full ${myStories.length > 0 ? 'p-1 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500' : 'bg-gradient-to-br from-purple-400 to-pink-400'} flex items-center justify-center shadow-lg`}>
                  {myStories.length > 0 ? (
                    <div className="w-full h-full rounded-full bg-white p-0.5">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden">
                        {currentUser.avatar_url ? (
                          <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {currentUser.full_name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {currentUser.avatar_url ? (
                        <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-xl">
                          {currentUser.full_name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {myStories.length === 0 && (
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs text-center mt-2 font-medium text-gray-700 max-w-[64px] truncate">
                {myStories.length > 0 ? 'Seu story' : 'Adicionar'}
              </p>
            </button>
          )}

          {/* Other Users Stories */}
          {groupedStories.map((group) => (
            <motion.button
              key={group.user.email}
              onClick={() => setSelectedUserStories(group)}
              className="flex-shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <div className={`relative p-1 rounded-full ${group.hasUnviewed ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500' : 'bg-gray-300'}`}>
                <div className="w-16 h-16 rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden">
                    {group.user.avatar_url ? (
                      <img src={group.user.avatar_url} alt={group.user.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {group.user.full_name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-center mt-2 font-medium text-gray-700 max-w-[64px] truncate">
                {group.user.full_name}
              </p>
            </motion.button>
          ))}
        </div>
      </div>

      {selectedUserStories && (
        <StoryViewer
          userStories={selectedUserStories}
          currentUser={currentUser}
          onClose={() => setSelectedUserStories(null)}
          allGroupedStories={[myUser, ...groupedStories].filter(Boolean)}
        />
      )}
    </>
  );
}