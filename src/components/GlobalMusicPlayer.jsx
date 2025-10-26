import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Music, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MusicPlayer from "./MusicPlayer";

export default function GlobalMusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);

  const { data: postsWithMusic = [] } = useQuery({
    queryKey: ['posts-with-music'],
    queryFn: async () => {
      const posts = await base44.entities.Post.list('-created_date', 50);
      return posts.filter(p => p.music_url);
    },
    initialData: [],
  });

  const handlePlayMusic = (post) => {
    setSelectedMusic({
      url: post.music_url,
      title: post.music_title || 'Música'
    });
    setIsOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-purple-100 relative"
      >
        <Music className="w-5 h-5 text-purple-600" />
        {postsWithMusic.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            {postsWithMusic.length > 9 ? '9+' : postsWithMusic.length}
          </span>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              Músicas da Orbikut
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 overflow-y-auto flex-1 pr-2">
            {postsWithMusic.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma música disponível</p>
              </div>
            ) : (
              postsWithMusic.map((post) => (
                <button
                  key={post.id}
                  onClick={() => handlePlayMusic(post)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-gray-900 truncate">
                      {post.music_title || 'Música'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {post.content.substring(0, 40)}...
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {selectedMusic && (
        <MusicPlayer
          isOpen={!!selectedMusic}
          onClose={() => setSelectedMusic(null)}
          musicUrl={selectedMusic.url}
          musicTitle={selectedMusic.title}
        />
      )}
    </>
  );
}