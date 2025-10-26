import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Music, Play, Pause, Volume2, VolumeX, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MusicPlayer({ isOpen, onClose, musicUrl, musicTitle }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const iframeRef = useRef(null);

  const getEmbedUrl = (url) => {
    if (!url) return null;

    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`;
    }

    // Spotify
    if (url.includes('spotify.com')) {
      const trackId = url.split('track/')[1]?.split('?')[0];
      return `https://open.spotify.com/embed/track/${trackId}`;
    }

    // SoundCloud
    if (url.includes('soundcloud.com')) {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&color=%23a855f7`;
    }

    return url;
  };

  if (!isOpen) return null;

  const embedUrl = getEmbedUrl(musicUrl);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          height: isMinimized ? 80 : 'auto'
        }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl p-4 backdrop-blur-xl border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate text-sm">
                  {musicTitle || 'Reproduzindo...'}
                </p>
                <p className="text-white/70 text-xs">Orbikut Player</p>
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-8 w-8"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 rounded-full h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && embedUrl && (
            <div className="rounded-2xl overflow-hidden bg-black/20">
              <iframe
                ref={iframeRef}
                src={embedUrl}
                width="100%"
                height="120"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-2xl"
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}