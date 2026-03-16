import React from "react";

interface ErrorModalProps {
  open: boolean;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

export default function ErrorModal({
  open,
  message,
  onClose,
  onRetry,
}: ErrorModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-[#07111A] shadow-[0_0_40px_rgba(0,255,200,0.08)]">
        <div className="p-6">
          <div className="mb-3 text-xl font-bold text-white">해석 중 오류가 났다</div>
          <div className="mb-6 whitespace-pre-line text-sm leading-6 text-gray-300">
            {message}
          </div>

          <div className="flex gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 rounded-xl bg-[#13F1A7] px-4 py-3 font-semibold text-black transition hover:opacity-90"
              >
                다시 시도
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
