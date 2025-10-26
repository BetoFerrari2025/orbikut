
import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload, X, Loader2, Sparkles, Video, Music } from "lucide-react";
import { Card } from "@/components/ui/card";

const getEmbedUrl = (url) => {
  let embedUrl = null;
  let type = null;

  const youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/);
  if (youtubeMatch && youtubeMatch[1]) {
    embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    type = 'youtube';
  }

  const spotifyTrackMatch = url.match(/(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  if (spotifyTrackMatch && spotifyTrackMatch[1]) {
    embedUrl = `https://open.spotify.com/embed/track/${spotifyTrackMatch[1]}?utm_source=generator`;
    type = 'spotify';
  } else {
    const spotifyAlbumMatch = url.match(/(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/album\/([a-zA-Z0-9]+)/);
    if (spotifyAlbumMatch && spotifyAlbumMatch[1]) {
      embedUrl = `https://open.spotify.com/embed/album/${spotifyAlbumMatch[1]}?utm_source=generator`;
      type = 'spotify';
    } else {
      const spotifyPlaylistMatch = url.match(/(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/);
      if (spotifyPlaylistMatch && spotifyPlaylistMatch[1]) {
        embedUrl = `https://open.spotify.com/embed/playlist/${spotifyPlaylistMatch[1]}?utm_source=generator`;
        type = 'spotify';
      }
    }
  }

  const soundcloudMatch = url.match(/(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/);
  if (soundcloudMatch) {
    embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=true`;
    type = 'soundcloud';
  }

  return embedUrl ? { type, url: embedUrl } : null;
};

export default function CreatePost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [mediaType, setMediaType] = useState("none");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        if (isMountedRef.current) {
          setUser(userData);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        if (isMountedRef.current) {
          navigate(createPageUrl("Feed"));
        }
      }
    };
    
    loadUser();

    return () => {
      isMountedRef.current = false;
    };
  }, [navigate]);

  const uploadMediaMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      let image_url = null;
      let video_url = null;

      if (imageFile) {
        image_url = await uploadMediaMutation.mutateAsync(imageFile);
      }
      if (videoFile) {
        video_url = await uploadMediaMutation.mutateAsync(videoFile);
      }

      // CORREÇÃO: Salvar nome e avatar do autor no post
      await base44.entities.Post.create({
        ...postData,
        image_url,
        video_url,
        media_type: mediaType,
        music_url: musicUrl || null,
        music_title: musicTitle || null,
        author_name: user.full_name,
        author_avatar: user.avatar_url,
        author_level: user.level || 1
      });

      await base44.auth.updateMe({
        posts_count: (user.posts_count || 0) + 1,
        points: (user.points || 0) + 10
      });

      if ((user.posts_count || 0) === 0) {
        await base44.entities.Achievement.create({
          user_email: user.email,
          achievement_type: 'first_post',
          title: 'Primeiro Post',
          icon: '🎉'
        });
      }
    },
    onSuccess: () => {
      if (isMountedRef.current) {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['my-posts'] });
        navigate(createPageUrl("Feed"));
      }
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file && isMountedRef.current) {
      setImageFile(file);
      setVideoFile(null);
      setVideoPreview(null);
      setMediaType("image");
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMountedRef.current) {
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file && isMountedRef.current) {
      setVideoFile(file);
      setImageFile(null);
      setImagePreview(null);
      setMediaType("video");
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isMountedRef.current) {
          setVideoPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    if (isMountedRef.current) {
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);
      setMediaType("none");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (content.trim() || imageFile || videoFile || musicUrl) {
      try {
        setIsSubmitting(true);
        await createPostMutation.mutateAsync({ content });
      } catch (error) {
        console.error("Submit error:", error);
        if (isMountedRef.current) {
          setIsSubmitting(false);
          alert("Erro ao criar post. Tente novamente.");
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center p-4">
          <p className="text-gray-600 mb-4">Você precisa estar logado para criar um post.</p>
          <Button onClick={() => navigate(createPageUrl("Feed"))}>
            Voltar ao Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-2xl mx-auto px-4 md:ml-64 pb-24 md:pb-8 pt-20 md:pt-24">
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("Feed"))}
              className="rounded-full"
              type="button"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Criar Post
            </h1>
          </div>

          <Card className="bg-white rounded-3xl p-4 md:p-6 shadow-lg border border-purple-100">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{user.full_name}</p>
                  <p className="text-xs md:text-sm text-gray-500">Público</p>
                </div>
              </div>

              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="No que você está pensando?"
                className="min-h-[120px] md:min-h-[200px] text-base md:text-lg border-none focus:ring-0 resize-none"
                disabled={isSubmitting}
              />

              <AnimatePresence mode="wait">
                {imagePreview && (
                  <motion.div
                    key="image-preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative rounded-2xl overflow-hidden"
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-96 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeMedia}
                      disabled={isSubmitting}
                      className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </button>
                  </motion.div>
                )}

                {videoPreview && (
                  <motion.div
                    key="video-preview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative rounded-2xl overflow-hidden"
                  >
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-96 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeMedia}
                      disabled={isSubmitting}
                      className="absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {musicUrl && (
                <div className="p-3 md:p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                      <span className="font-semibold text-purple-900 text-sm md:text-base">Música adicionada</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMusicUrl("");
                        setMusicTitle("");
                      }}
                      disabled={isSubmitting}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {(() => {
                    const embedInfo = getEmbedUrl(musicUrl);
                    if (embedInfo) {
                      return (
                        <iframe
                          width="100%"
                          height={embedInfo.type === 'youtube' ? "315" : "152"}
                          src={embedInfo.url}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          loading="lazy"
                          title={musicTitle || "Música"}
                          className="rounded-xl w-full"
                        />
                      );
                    } else {
                      return (
                        <p className="text-red-500 text-xs md:text-sm">Link de música não suportado para embed. Exibindo link:</p>
                      );
                    }
                  })()}
                  {musicTitle && <p className="text-xs md:text-sm text-gray-600 mt-1">Título: {musicTitle}</p>}
                  <a href={musicUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs md:text-sm block truncate">
                    {musicUrl}
                  </a>
                </div>
              )}

              <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t border-purple-100">
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer flex-1 min-w-[100px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                      <Upload className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                      <span className="font-medium text-purple-600 text-sm md:text-base">Foto</span>
                    </div>
                  </label>

                  <label className="cursor-pointer flex-1 min-w-[100px]">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                    <div className="flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors">
                      <Video className="w-4 h-4 md:w-5 md:h-5 text-pink-600" />
                      <span className="font-medium text-pink-600 text-sm md:text-base">Vídeo</span>
                    </div>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      if (isSubmitting) return;
                      const url = prompt("Cole o link do YouTube, Spotify ou SoundCloud:");
                      if (url) {
                        setMusicUrl(url);
                        const title = prompt("Nome da música (opcional):");
                        setMusicTitle(title || "");
                      }
                    }}
                    disabled={isSubmitting}
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors disabled:opacity-50"
                  >
                    <Music className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                    <span className="font-medium text-orange-600 text-sm md:text-base">Música</span>
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={!(content.trim() || imageFile || videoFile || musicUrl) || isSubmitting}
                  className="w-full px-6 md:px-8 py-5 md:py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-semibold shadow-lg shadow-purple-500/30 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 p-3 md:p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl border border-orange-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm md:text-base">Ganhe +10 pontos!</p>
                <p className="text-xs md:text-sm text-gray-600">Publique posts para subir de nível</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
