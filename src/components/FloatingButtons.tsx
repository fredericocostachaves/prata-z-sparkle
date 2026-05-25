import { Instagram } from "lucide-react";

export function FloatingButtons() {
  return (
    <div className="fixed right-5 bottom-5 sm:right-7 sm:bottom-7 z-50 flex flex-col gap-4">
      <a
        href="https://instagram.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        className="h-12 w-12 rounded-full bg-background border border-border shadow-soft flex items-center justify-center hover:scale-110 transition-transform text-nude-deep"
      >
        <Instagram className="h-5 w-5" />
      </a>
      <a
        href="https://wa.me/5500000000000"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="animate-pulse-cta h-14 w-14 rounded-full bg-whatsapp text-white flex items-center justify-center hover:scale-110 transition-transform"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zM12.05 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.17.25-.64.8-.78.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.41-.56-.42l-.48-.01c-.17 0-.43.06-.66.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.55.12.17 1.74 2.66 4.22 3.73.59.25 1.05.4 1.41.51.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.66-1.17.21-.58.21-1.07.14-1.17-.06-.11-.23-.17-.48-.29z"/>
        </svg>
      </a>
    </div>
  );
}
