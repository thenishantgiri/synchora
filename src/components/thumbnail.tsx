/* eslint-disable @next/next/no-img-element */

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { Hint } from "./hint";

interface ThumbnailProps {
  url: string | null | undefined;
}

export const Thumbnail = ({ url }: ThumbnailProps) => {
  if (!url) return null;

  return (
    <Dialog>
      <DialogTrigger>
        <div className="relative overflow-hidden max-w-[360px] border rounded-lg my-2 cursor-zoom-in">
          <img
            src={url}
            alt="Message image"
            className="rounded-md object-cover w-full h-full"
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] border-none bg-transparent p-0 shadow-none">
        <div className="relative inline-block">
          <Hint label="Close image">
            <DialogClose asChild>
              <button className="absolute -top-2.5 -right-2.5 bg-black/70 hover:bg-black text-white rounded-full size-6 flex items-center justify-center z-[4] border-2 border-white transition-colors shadow-lg">
                <XIcon className="size-3.5" />
              </button>
            </DialogClose>
          </Hint>
          <img
            src={url}
            alt="Message image"
            className="rounded-md object-contain max-w-full max-h-[80vh] w-auto h-auto"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
