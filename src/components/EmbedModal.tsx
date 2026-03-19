"use client";

import { useEffect } from "react";

interface EmbedModalProps {
  embedUrl: string;
  title: string;
  onClose: () => void;
}

export function EmbedModal({ embedUrl, title, onClose }: EmbedModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm font-medium"
          aria-label="Close"
        >
          ✕ Close
        </button>
        <div className="aspect-video w-full overflow-hidden rounded-xl shadow-2xl">
          <iframe
            src={embedUrl}
            title={title}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
