import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function StoryViewer({ userStories, currentUser, onClose, allGroupedStories }) {
  const queryClient = useQueryClient();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(
    allGroupedStories.findIndex(g => g.user.email === userStories.user.email)
  );
  const [progress, setProgress] = useState(0);

  const currentGroupedStory = allGroupedStories[currentUserIndex];
  const currentStory = currentGroupedStory.stories[currentStoryIndex];

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
      queryClient.invalidateQueries({ queryKey: ['my-story-views'] });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
    },
  });

  useEffect(() => {
    if (currentUser && currentStory) {
      markAsViewedMutation.mutate(currentStory.id);
    }
  }, [currentStory?.id]);

  useEffect(() => {
    setProgress(0);
    const duration = currentStory?.media_type === 'video' ? 15000 : 5000;
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
      setCurrentStoryIndex(0);
    }
  };

  const handleLinkClick = () => {
    if (currentStory.link_url) {
      window.open(currentStory.link_url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
    >
      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
        {currentGroupedStory.stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentStoryIndex ? '100%' : index === currentStoryIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
            {currentGroupedStory.user.avatar_url ? (
              <img src={currentGroupedStory.user.avatar_url} alt={currentGroupedStory.user.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-white font-bold">
                {currentGroupedStory.user.full_name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{currentGroupedStory.user.full_name}</p>
            <p className="text-white/70 text-xs">
              {formatDistanceToNow(new Date(currentStory.created_date), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Story Content */}
      <div className="relative w-full max-w-lg h-full max-h-[90vh] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentUserIndex}-${currentStoryIndex}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
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

            {/* Link Button */}
            {currentStory.link_url && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleLinkClick}
                className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full flex items-center gap-2 shadow-lg hover:bg-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="font-semibold">
                  {currentStory.link_text || 'Ver mais'}
                </span>
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Click areas for navigation */}
      <div className="absolute inset-0 flex">
        <div className="flex-1" onClick={handlePrevious} />
        <div className="flex-1" onClick={handleNext} />
      </div>
    </motion.div>
  );
}