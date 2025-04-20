import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { FaChevronDown } from "react-icons/fa";
import { TrashIcon } from "lucide-react";

import { useUpdateChannel } from "@/features/channels/api/use-update-channel";
import { useRemoveChannel } from "@/features/channels/api/use-remove-channel";
import { useCurrentMember } from "@/features/members/api/use-current-members";

import { useChannelId } from "@/hooks/use-channel-id";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps) => {
  const router = useRouter();
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete channel",
    "Are you sure you want to delete this channel? This action cannot be undone."
  );

  const [value, setValue] = useState(title);
  const [editOpen, setEditOpen] = useState(false);

  const { data: member } = useCurrentMember({ workspaceId });
  const { mutate: updateChannel, isPending: isUpdatingChannel } =
    useUpdateChannel();
  const { mutate: removeChannel, isPending: isRemovingChannel } =
    useRemoveChannel();

  const handleEditOpen = (value: boolean) => {
    if (member?.role !== "admin") {
      toast.error("You are not authorized to edit this channel");
      return;
    }

    setEditOpen(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setValue(value);
  };

  const handleDelete = async () => {
    const ok = await confirm();
    if (!ok) return;

    removeChannel(
      { id: channelId },
      {
        onSuccess() {
          toast.success("Channel deleted successfully");
          router.replace(`/workspace/${workspaceId}`);
        },
      }
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateChannel(
      { name: value, id: channelId },
      {
        onSuccess: () => {
          toast.success("Channel updated successfully");
          setEditOpen(false);
        },
      }
    );
  };

  return (
    <div className="bg-white border-b h-[49px] flex items-center px-4 overflow-hidden">
      <>
        <ConfirmDialog />
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant={"ghost"}
              className="text-lg font-semibold px-2 overflow-hidden w-auto"
              size={"sm"}
            >
              <span className="truncate"># {title}</span>
              <FaChevronDown className="!size-2.5 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent className="p-0 bg-gray-50 overflow-hidden">
            <DialogHeader className="p-4 border-b bg-white">
              <DialogTitle># {title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Customize this channel, change its settings, or learn more about
                it here.
              </DialogDescription>
            </DialogHeader>
            <div className="px-4 pb-4 flex flex-col gap-y-2">
              <Dialog open={editOpen} onOpenChange={handleEditOpen}>
                <DialogTrigger asChild>
                  <div className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Channel name</p>
                      <p className="text-sm text-[#1264a3] hover:underline font-semibold">
                        Edit
                      </p>
                    </div>
                    <p className="text-sm"># {title}</p>
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Channel Name</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Update the name of this channel to better reflect its
                      purpose.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <Input
                      value={value}
                      disabled={isUpdatingChannel}
                      onChange={handleChange}
                      required
                      autoFocus
                      minLength={3}
                      maxLength={80}
                      placeholder="e.g. plan-budget"
                    />
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          variant={"outline"}
                          disabled={isUpdatingChannel}
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button disabled={isUpdatingChannel}>Save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                className="flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg cursor-pointer border hover:bg-gray-50 text-rose-600"
                disabled={isRemovingChannel}
                onClick={handleDelete}
              >
                <TrashIcon className="!size-4" />
                <p className="text-sm font-semibold">Delete channel</p>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    </div>
  );
};
