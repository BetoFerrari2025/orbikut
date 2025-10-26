import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, MessageCircle, Facebook, Twitter, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function ShareDialog({ post, isOpen, onClose }) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = `${window.location.origin}/post/${post.id}`;
  const shareText = post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '');

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartilhar Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Social Media Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">WhatsApp</span>
            </button>

            <button
              onClick={handleFacebook}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Facebook className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Facebook</span>
            </button>

            <button
              onClick={handleTwitter}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Twitter className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Twitter</span>
            </button>

            <button
              onClick={handleTelegram}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Send className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">Telegram</span>
            </button>
          </div>

          {/* Copy Link Section */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Ou copie o link:</p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent border-none outline-none text-sm text-gray-600 truncate"
              />
              <Button
                onClick={handleCopy}
                size="sm"
                className={`${copied ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'} flex-shrink-0`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>

          {copied && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-green-600 text-center"
            >
              ✓ Link copiado para a área de transferência!
            </motion.p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}