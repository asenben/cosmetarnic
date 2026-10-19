"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useAuth } from "@/components/auth/AuthProvider";

// The avatar is stored as a square of this many pixels a side.
const SIZE = 256;
const MAX_SOURCE_MB = 5;
const GENERIC_ERROR = "Не успяхме да качим снимката. Опитай отново.";

// Crops the photo to a centred square and shrinks it, so uploads are small and all the same shape.
async function toSquareJpeg(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", 0.9),
  );
}

// The "profile picture" part of the settings: the picture with its camera button, and next to it
// the heading and the button for choosing a new one. The picture is saved as soon as it is chosen.
export default function AvatarUpload() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  if (!user) return null;

  // Shows the new picture everywhere it appears: here, in the navigation, and in server-rendered parts.
  const applied = (avatar: string | null) => {
    updateUser({ avatar });
    router.refresh();
  };

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Lets the same file be picked again after an error.
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_SOURCE_MB * 1024 * 1024) {
      setError(`Снимката е твърде голяма. Избери до ${MAX_SOURCE_MB} MB.`);
      return;
    }

    setPending(true);
    setError(undefined);
    try {
      let square: Blob;
      try {
        square = await toSquareJpeg(file);
      } catch {
        setError("Този файл не може да се отвори като снимка.");
        return;
      }

      const body = new FormData();
      body.set("avatar", square, "avatar.jpg");
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      const result = await response.json();
      if (response.ok) applied(result.avatar);
      else setError(result.message ?? GENERIC_ERROR);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  };

  const onRemove = async () => {
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (response.ok) applied(null);
      else setError((await response.json()).message ?? GENERIC_ERROR);
    } catch {
      setError("Не успяхме да махнем снимката. Опитай отново.");
    } finally {
      setPending(false);
    }
  };

  const pick = () => inputRef.current?.click();

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-4">
      <div className="relative shrink-0">
        <Avatar name={user.username} src={user.avatar} className="size-20 text-3xl" />
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70 text-brand-rose">
            <LoaderCircle className="size-6 animate-spin" aria-hidden />
          </span>
        )}
        <button
          type="button"
          aria-label="Промени снимката"
          disabled={pending}
          onClick={pick}
          className="absolute -right-1 -bottom-1 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand-rose text-white transition-colors hover:bg-brand disabled:cursor-wait"
        >
          <Camera className="size-4" aria-hidden />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onPick}
          className="hidden"
          tabIndex={-1}
        />
      </div>

      <div className="min-w-0 flex-1 basis-56">
        <h2 className="text-base font-bold text-brand-ink">Профилна снимка</h2>
        <p className="text-xs text-brand-ink/60">Добави снимка, която да те представя пред другите потребители.</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            disabled={pending}
            onClick={pick}
            className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-brand-rose/10 px-4 text-sm font-semibold text-brand-rose transition-colors hover:bg-brand-rose/20 disabled:cursor-wait"
          >
            <Camera className="size-4" aria-hidden />
            Промени снимката
          </button>
          {user.avatar && (
            <button
              type="button"
              disabled={pending}
              onClick={onRemove}
              className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-brand-ink/60 transition-colors hover:text-red-600 disabled:cursor-wait"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Премахни
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-brand-ink/50">JPG, PNG или WEBP до {MAX_SOURCE_MB} MB</p>
        {error && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
