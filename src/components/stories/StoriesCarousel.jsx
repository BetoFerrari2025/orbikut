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

  const groupedStories = storyUsers.map(user => ({
    user,
    stories: allStories.filter(s => s.created_by === user.email),
    hasUnviewed: allStories
      .filter(s => s.created_by === user.email)
      .some(story => !myStoryViews.some(view => view.story_id === story.id))
  }));

  const myStories = allStories.filter(s => s.created_by === currentUser?.email);

  return (
    <>
      <div className="bg-white border-b border-purple-100 py-4 px-4 md:px-6 overflow-x-auto">
        <div className="flex gap-4 max-w-6xl mx-auto">
          {/* Add Story */}
          {currentUser && (
            <button
              onClick={() => navigate(createPageUrl("CreateStory"))}
              className="flex-shrink-0"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">
                      {currentUser.full_name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xs text-center mt-2 font-medium text-gray-700 max-w-[64px] truncate">
                Seu story
              </p>
            </button>
          )}

          {/* Stories */}
          {groupedStories.map(({ user, stories, hasUnviewed }) => (
            <motion.button
              key={user.email}
              onClick={() => setSelectedUserStories({ user, stories })}
              className="flex-shrink-0"
              whileTap={{ scale: 0.95 }}
            >
              <div className={`relative p-1 rounded-full ${hasUnviewed ? 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500' : 'bg-gray-300'}`}>
                <div className="w-16 h-16 rounded-full bg-white p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xl">
                        {user.full_name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-center mt-2 font-medium text-gray-700 max-w-[64px] truncate">
                {user.full_name}
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
          allGroupedStories={groupedStories}
        />
      )}
    </>
  );
}