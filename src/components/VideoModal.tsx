import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VideoPlayer } from "./VideoPlayer";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  streamUrl: string;
  poster?: string;
}

export function VideoModal({
  isOpen,
  onClose,
  title,
  streamUrl,
  poster
}: VideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-xl w-full p-0 gap-0 bg-black">
        <DialogHeader className="p-4">
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        <div className="relative w-full aspect-video">
          <VideoPlayer
            src={streamUrl}
            poster={poster}
            autoplay={true}
            controls={true}
            className="w-full h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 