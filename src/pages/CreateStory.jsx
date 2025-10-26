import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, X, Loader2, Sparkles, Video, Link as LinkIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CreateStory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState("image");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("Feed")));
  }, []);

  const uploadMediaMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (storyData) => {
      if (!mediaFile) return;
      
      const media_url = await uploadMediaMutation.mutateAsync(mediaFile);
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      await base44.entities.Story.create({
        media_url,
        media_type: mediaType,
        link_url: linkUrl || null,
        link_text: linkText || null,
        expires_at: expiresAt.toISOString()
      });

      await base44.auth.updateMe({
        points: (user.points || 0) + 5
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] });
      navigate(createPageUrl("Feed"));
    },
  });

  const handleMediaChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaType(type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mediaFile) {
      createStoryMutation.mutate();
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 md:ml-64">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Feed"))}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Criar Story
          </h1>
        </div>

        <Card className="bg-white rounded-3xl p-6 shadow-lg border border-purple-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Media Preview */}
            {mediaPreview ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden bg-black"
              >
                {mediaType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full max-h-[500px] object-contain mx-auto"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full max-h-[500px] object-contain mx-auto"
                  />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </motion.div>
            ) : (
              <div className="border-2 border-dashed border-purple-200 rounded-2xl p-12 text-center">
                <p className="text-gray-500 mb-4">Selecione uma foto ou vídeo para seu story</p>
                <div className="flex gap-3 justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleMediaChange(e, 'image')}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                      <Upload className="w-5 h-5 text-purple-600" />
                      <span className="font-medium text-purple-600">Foto</span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleMediaChange(e, 'video')}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors">
                      <Video className="w-5 h-5 text-pink-600" />
                      <span className="font-medium text-pink-600">Vídeo</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Link Fields */}
            {mediaPreview && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-2xl">
                <div className="flex items-center gap-2 text-purple-700 font-semibold">
                  <LinkIcon className="w-5 h-5" />
                  <span>Adicionar Link (opcional)</span>
                </div>
                <Input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://exemplo.com"
                  className="rounded-xl"
                />
                <Input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Texto do link (ex: Ver mais)"
                  className="rounded-xl"
                />
              </div>
            )}

            {/* Submit Button */}
            {mediaPreview && (
              <Button
                type="submit"
                disabled={createStoryMutation.isPending}
                className="w-full px-8 py-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-semibold shadow-lg shadow-purple-500/30"
              >
                {createStoryMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Publicar Story
                  </>
                )}
              </Button>
            )}
          </form>
        </Card>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Seu story ficará disponível por 24 horas</p>
              <p className="text-sm text-gray-600">Ganhe +5 pontos ao publicar!</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}