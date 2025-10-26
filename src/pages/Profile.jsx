
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Edit2, Save, X, Flame, LogOut, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import PostCard from "../components/feed/PostCard";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setEditedData({
        bio: u.bio || '',
        avatar_url: u.avatar_url || '',
        cover_url: u.cover_url || '',
        bio_links: u.bio_links || []
      });
    }).catch(() => {});
  }, []);

  const { data: myPosts = [] } = useQuery({
    queryKey: ['my-posts', user?.email],
    queryFn: () => user ? base44.entities.Post.filter({ created_by: user.email }, '-created_date') : [],
    enabled: !!user,
    initialData: [],
  });

  const { data: myLikes = [] } = useQuery({
    queryKey: ['my-likes', user?.email],
    queryFn: () => user ? base44.entities.Like.filter({ created_by: user.email }) : [],
    enabled: !!user,
    initialData: [],
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const uploadCoverMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      let finalData = { ...data };
      
      if (avatarFile) {
        const avatar_url = await uploadAvatarMutation.mutateAsync(avatarFile);
        finalData.avatar_url = avatar_url;
      }
      
      if (coverFile) {
        const cover_url = await uploadCoverMutation.mutateAsync(coverFile);
        finalData.cover_url = cover_url;
      }
      
      await base44.auth.updateMe(finalData);
      
      // Buscar dados atualizados do usuário
      const updatedUser = await base44.auth.me();
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setEditedData({
        bio: updatedUser.bio || '',
        avatar_url: updatedUser.avatar_url || '',
        cover_url: updatedUser.cover_url || '',
        bio_links: updatedUser.bio_links || []
      });
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      setCoverFile(null);
      setCoverPreview(null);
      
      // CORREÇÃO: Invalidar TODAS as queries de usuário para sincronizar em TODOS OS LUGARES
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile-live'] }); // NOVO
      queryClient.invalidateQueries({ queryKey: ['post-user'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      queryClient.invalidateQueries({ queryKey: ['comment-users'] }); // NOVO
      
      // Forçar reload completo de todos os dados na tela
      queryClient.refetchQueries();
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addBioLink = () => {
    const currentLinks = editedData.bio_links || [];
    setEditedData({
      ...editedData,
      bio_links: [...currentLinks, { title: '', url: '' }]
    });
  };

  const updateBioLink = (index, field, value) => {
    const currentLinks = [...(editedData.bio_links || [])];
    currentLinks[index] = { ...currentLinks[index], [field]: value };
    setEditedData({ ...editedData, bio_links: currentLinks });
  };

  const removeBioLink = (index) => {
    const currentLinks = [...(editedData.bio_links || [])];
    currentLinks.splice(index, 1);
    setEditedData({ ...editedData, bio_links: currentLinks });
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editedData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      bio: user.bio || '',
      avatar_url: user.avatar_url || '',
      cover_url: user.cover_url || '',
      bio_links: user.bio_links || []
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) return null;

  const level = user.level || 1;
  const currentPoints = user.points || 0;
  const progress = (currentPoints % 100);
  const progressPercent = progress; // This is already a percentage from 0-99 for the bar

  const displayAvatar = avatarPreview || editedData.avatar_url || user.avatar_url;
  const displayCover = coverPreview || editedData.cover_url || user.cover_url;

  return (
    <div className="max-w-4xl mx-auto px-4 md:ml-64 pb-20 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Cover Image */}
        <div className="relative h-32 md:h-48 lg:h-64 rounded-3xl overflow-hidden mb-6 shadow-lg">
          {isEditing ? (
            <div className="relative w-full h-full">
              <img
                src={displayCover || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 cursor-pointer hover:bg-black/60 transition-colors">
                <Camera className="w-10 h-10 text-white mb-2" />
                <span className="text-white text-sm">Alterar capa</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <img
              src={displayCover || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809'}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info */}
        <Card className="bg-white rounded-3xl p-4 md:p-6 lg:p-8 shadow-lg border border-purple-100 -mt-16 md:-mt-20 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-3xl md:text-4xl font-bold shadow-2xl border-4 border-white overflow-hidden">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  user.full_name?.[0]?.toUpperCase()
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 w-full">
              <div className="flex items-start justify-between mb-3 md:mb-4 gap-2">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 truncate">{user.full_name}</h1>
                  <p className="text-sm md:text-base text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending || uploadAvatarMutation.isPending || uploadCoverMutation.isPending}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-xs md:text-sm"
                      >
                        {updateProfileMutation.isPending || uploadAvatarMutation.isPending || uploadCoverMutation.isPending ? "..." : <><Save className="w-3 h-3 md:w-4 md:h-4 md:mr-2" /> <span className="hidden md:inline">Salvar</span></>}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                      >
                        <X className="w-3 h-3 md:w-4 md:h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs md:text-sm"
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                      <span className="hidden md:inline">Editar</span>
                    </Button>
                  )}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <Textarea
                  value={editedData.bio}
                  onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                  placeholder="Conte algo sobre você..."
                  className="rounded-xl mb-4"
                />
              ) : (
                <p className="text-gray-700 mb-4">
                  {user.bio || 'Ainda sem biografia...'}
                </p>
              )}

              {/* Bio Links */}
              {isEditing && (
                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-900 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Links da Bio
                    </label>
                    <Button
                      type="button"
                      onClick={addBioLink}
                      size="sm"
                      variant="outline"
                      className="rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  {(editedData.bio_links || []).map((link, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Título"
                        value={link.title}
                        onChange={(e) => updateBioLink(index, 'title', e.target.value)}
                        className="rounded-xl flex-1"
                      />
                      <Input
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => updateBioLink(index, 'url', e.target.value)}
                        className="rounded-xl flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => removeBioLink(index)}
                        size="icon"
                        variant="ghost"
                        className="rounded-xl text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!isEditing && (user.bio_links || []).length > 0 && (
                <div className="mb-4 space-y-2">
                  {(user.bio_links || []).map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-sm"
                    >
                      <LinkIcon className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-600">{link.title}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 md:gap-4 mt-4 md:mt-6">
                <div className="text-center p-2 md:p-3 bg-purple-50 rounded-2xl">
                  <p className="text-lg md:text-2xl font-bold text-purple-600">{user.posts_count || 0}</p>
                  <p className="text-[10px] md:text-sm text-gray-600">Posts</p>
                </div>
                <div className="text-center p-2 md:p-3 bg-pink-50 rounded-2xl">
                  <p className="text-lg md:text-2xl font-bold text-pink-600">{user.followers_count || 0}</p>
                  <p className="text-[10px] md:text-sm text-gray-600 truncate">Seguidores</p>
                </div>
                <div className="text-center p-2 md:p-3 bg-orange-50 rounded-2xl">
                  <p className="text-lg md:text-2xl font-bold text-orange-600">{user.following_count || 0}</p>
                  <p className="text-[10px] md:text-sm text-gray-600 truncate">Seguindo</p>
                </div>
              </div>

              {/* Level Progress */}
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-gray-900">Nível {level}</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {currentPoints} / {level * 100} pts
                  </span>
                </div>
                <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Faltam {100 - progress} pontos para o nível {level + 1}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* My Posts */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Meus Posts</h2>
          <div className="space-y-6">
            {myPosts.length === 0 ? (
              <Card className="bg-white rounded-3xl p-12 text-center shadow-lg">
                <p className="text-gray-500 mb-4">Você ainda não publicou nada</p>
                <Button
                  onClick={() => navigate(createPageUrl("CreatePost"))}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Criar Primeiro Post
                </Button>
              </Card>
            ) : (
              myPosts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  postUser={user}
                  currentUser={user}
                  isLiked={myLikes.some(like => like.post_id === post.id)}
                  index={index}
                />
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
