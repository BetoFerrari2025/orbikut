import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ImageIcon, Sparkles } from "lucide-react";

export default function CreatePostQuick({ user }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-purple-100"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold shadow-md">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            user.full_name?.[0]?.toUpperCase()
          )}
        </div>
        <button
          onClick={() => navigate(createPageUrl("CreatePost"))}
          className="flex-1 text-left px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-full text-gray-500 transition-all duration-300"
        >
          No que você está pensando?
        </button>
      </div>
      <div className="flex gap-4 mt-4 pt-4 border-t border-purple-100">
        <button
          onClick={() => navigate(createPageUrl("CreatePost"))}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl hover:bg-purple-50 transition-colors group"
        >
          <ImageIcon className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-gray-700">Foto</span>
        </button>
        <button
          onClick={() => navigate(createPageUrl("CreatePost"))}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl hover:bg-pink-50 transition-colors group"
        >
          <Sparkles className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
          <span className="font-medium text-gray-700">Sentimento</span>
        </button>
      </div>
    </motion.div>
  );
}