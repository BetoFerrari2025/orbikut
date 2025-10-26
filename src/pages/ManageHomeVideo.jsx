import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Loader2, Video, Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ManageHomeVideo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Apenas administradores podem acessar
      if (u.email !== 'ferraribetoferrari@gmail.com') {
        navigate(createPageUrl("Feed"));
      }
    }).catch(() => navigate(createPageUrl("Home")));
  }, [navigate]);

  const { data: activeVideo } = useQuery({
    queryKey: ['home-video'],
    queryFn: async () => {
      const videos = await base44.entities.HomeVideo.filter({ is_active: true });
      return videos[0] || null;
    },
    initialData: null,
  });

  const uploadVideoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const createVideoMutation = useMutation({
    mutationFn: async (data) => {
      // Desativar vídeo anterior
      if (activeVideo) {
        await base44.entities.HomeVideo.update(activeVideo.id, { is_active: false });
      }
      
      const video_url = await uploadVideoMutation.mutateAsync(videoFile);
      await base44.entities.HomeVideo.create({
        ...data,
        video_url,
        is_active: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-video'] });
      setVideoFile(null);
      setVideoPreview(null);
      setFormData({ title: '', description: '' });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: () => base44.entities.HomeVideo.update(activeVideo.id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-video'] });
    },
  });

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (videoFile) {
      createVideoMutation.mutate(formData);
    }
  };

  if (!user || user.email !== 'ferraribetoferrari@gmail.com') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-4xl mx-auto">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gerenciar Vídeo da Home
            </h1>
          </div>

          {/* Vídeo Atual */}
          {activeVideo && (
            <Card className="p-6 mb-6 bg-white rounded-3xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Vídeo Atual</h2>
                <Button
                  onClick={() => deleteVideoMutation.mutate()}
                  disabled={deleteVideoMutation.isPending}
                  variant="destructive"
                  size="sm"
                  className="rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover
                </Button>
              </div>
              <video
                src={activeVideo.video_url}
                controls
                className="w-full rounded-2xl mb-4"
              />
              {activeVideo.title && (
                <h3 className="font-semibold text-gray-900 mb-2">{activeVideo.title}</h3>
              )}
              {activeVideo.description && (
                <p className="text-gray-600">{activeVideo.description}</p>
              )}
            </Card>
          )}

          {/* Upload Novo Vídeo */}
          <Card className="p-6 bg-white rounded-3xl shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {activeVideo ? 'Substituir Vídeo' : 'Adicionar Vídeo'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Preview */}
              {videoPreview ? (
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                    }}
                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-purple-200 rounded-2xl p-12 text-center hover:border-purple-400 transition-colors">
                    <Video className="w-12 h-12 mx-auto mb-4 text-purple-500" />
                    <p className="text-gray-700 font-medium mb-2">Clique para fazer upload do vídeo</p>
                    <p className="text-sm text-gray-500">MP4, MOV, AVI (máx. 100MB)</p>
                  </div>
                </label>
              )}

              {videoFile && (
                <>
                  <Input
                    placeholder="Título do vídeo (opcional)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="rounded-xl"
                  />
                  
                  <Textarea
                    placeholder="Descrição do vídeo (opcional)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="rounded-xl min-h-[100px]"
                  />

                  <Button
                    type="submit"
                    disabled={createVideoMutation.isPending || uploadVideoMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl py-6 font-semibold"
                  >
                    {createVideoMutation.isPending || uploadVideoMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        {activeVideo ? 'Substituir Vídeo' : 'Publicar Vídeo'}
                      </>
                    )}
                  </Button>
                </>
              )}
            </form>
          </Card>

          {/* Preview da Home */}
          <Card className="p-6 mt-6 bg-white rounded-3xl shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Preview</h2>
              <Button
                onClick={() => window.open(createPageUrl("Home"), '_blank')}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Home
              </Button>
            </div>
            <p className="text-gray-600">
              O vídeo aparecerá na página inicial do Orbikut para todos os visitantes.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}