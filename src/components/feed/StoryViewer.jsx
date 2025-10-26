
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StoryViewer({ userStories, currentUser, onClose, allGroupedStories }) {
  const queryClient = useQueryClient();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(
    allGroupedStories.findIndex(g => g.user.email === userStories.user.email)
  );
  const [progress, setProgress] = useState(0);
  const [showReactions, setShowReactions] = useState(false);

  const currentGroupedStory = allGroupedStories[currentUserIndex];
  const currentStory = currentGroupedStory.stories[currentStoryIndex];

  // Buscar reações do story atual
  const { data: storyReactions = [] } = useQuery({
    queryKey: ['story-reactions', currentStory?.id],
    queryFn: () => currentStory ? base44.entities.StoryReaction.filter({ story_id: currentStory.id }) : [],
    enabled: !!currentStory,
    initialData: [],
  });

  // Contar reações por tipo
  const reactionCounts = storyReactions.reduce((acc, reaction) => {
    acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1;
    return acc;
  }, {});

  const markAsViewedMutation = useMutation({
    mutationFn: async (storyId) => {
      const existingView = await base44.entities.StoryView.filter({
        story_id: storyId,
        viewer_email: currentUser.email
      });
      
      if (existingView.length === 0) {
        await base44.entities.StoryView.create({
          story_id: storyId,
          viewer_email: currentUser.email
        });
        
        await base44.entities.Story.update(storyId, {
          views_count: (currentStory.views_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      queryClient.invalidateQueries({ queryKey: ['my-story-views'] });
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async (reactionType) => {
      // Verificar se já reagiu
      const existing = await base44.entities.StoryReaction.filter({
        story_id: currentStory.id,
        created_by: currentUser.email
      });

      if (existing.length > 0) {
        // Atualizar reação existente
        await base44.entities.StoryReaction.update(existing[0].id, {
          reaction_type: reactionType
        });
      } else {
        // Criar nova reação
        await base44.entities.StoryReaction.create({
          story_id: currentStory.id,
          reaction_type: reactionType
        });

        // Notificar o criador do story (se não for o próprio usuário)
        if (currentStory.created_by !== currentUser.email) {
          await base44.entities.Notification.create({
            user_email: currentStory.created_by,
            type: 'like',
            from_user_email: currentUser.email,
            from_user_name: currentUser.full_name,
            message: `${currentUser.full_name} reagiu ao seu story com ${reactionType}`
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-reactions'] });
      setShowReactions(false);
    },
  });

  useEffect(() => {
    if (currentUser && currentStory?.created_by !== currentUser.email) {
      markAsViewedMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  useEffect(() => {
    const duration = currentStory?.media_type === 'video' ? 10000 : 5000;
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, currentUserIndex]);

  const handleNext = () => {
    if (currentStoryIndex < currentGroupedStory.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentUserIndex < allGroupedStories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevGroup = allGroupedStories[currentUserIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const reactions = [
    { emoji: '❤️', type: 'heart' },
    { emoji: '🔥', type: 'fire' },
    { emoji: '😂', type: 'laugh' },
    { emoji: '👏', type: 'clap' },
    { emoji: '😍', type: 'love' },
    { emoji: '😮', type: 'wow' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full h-full max-w-lg mx-auto" onClick={(e) => e.stopPropagation()}>
        {/* Progress Bars */}
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
          {currentGroupedStory.stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: index < currentStoryIndex ? '100%' : '0%' }}
                animate={{ 
                  width: index === currentStoryIndex ? `${progress}%` : 
                         index < currentStoryIndex ? '100%' : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-lg overflow-hidden">
              {currentGroupedStory.user.avatar_url ? (
                <img src={currentGroupedStory.user.avatar_url} alt={currentGroupedStory.user.full_name} className="w-full h-full object-cover" />
              ) : (
                currentGroupedStory.user.full_name?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">{currentGroupedStory.user.full_name}</p>
              <p className="text-white/70 text-xs">
                {Math.round((Date.now() - new Date(currentStory.created_date)) / 3600000)}h atrás
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Story Content */}
        <div className="relative w-full h-full flex items-center justify-center">
          {currentStory.media_type === 'image' ? (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              src={currentStory.media_url}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Link (se houver) */}
        {currentStory.link_url && (
          <div className="absolute bottom-32 left-4 right-4 z-20">
            <a
              href={currentStory.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center font-semibold text-gray-900 hover:bg-white transition-colors"
            >
              {currentStory.link_text || 'Ver mais'}
            </a>
          </div>
        )}

        {/* Reações do Story */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="absolute bottom-24 left-4 right-4 z-20">
            <div className="flex gap-2 items-center justify-center">
              {Object.entries(reactionCounts).map(([type, count]) => {
                const reaction = reactions.find(r => r.type === type);
                return reaction ? (
                  <div key={type} className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <span className="text-lg">{reaction.emoji}</span>
                    <span className="text-white text-sm font-semibold">{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

        {/* Reaction Buttons */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 right-4 z-20"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-4 shadow-2xl">
                <div className="grid grid-cols-6 gap-3">
                  {reactions.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => addReactionMutation.mutate(reaction.type)}
                      className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110"
                    >
                      {reaction.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Controls */}
        <div className="absolute bottom-8 left-4 right-4 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex-1 bg-white/20 backdrop-blur-sm rounded-full p-3 text-white font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <Heart className="w-5 h-5" />
              <span>Reagir</span>
            </button>
          </div>
        </div>

        {/* Navigation Areas */}
        <button
          onClick={handlePrevious}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
          disabled={currentUserIndex === 0 && currentStoryIndex === 0}
        />
        <button
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        />
      </div>
    </motion.div>
  );
}
