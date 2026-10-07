import { AVATAR_FILE_PATTERN, avatarKey } from "@/lib/auth/avatar";
import { getImage } from "@/lib/storage/uploadImage";

// Serves an avatar from the private bucket. Avatars are shown next to listings, so this is public.
export async function GET(_request: Request, { params }: RouteContext<"/api/avatars/[file]">) {
  const { file } = await params;
  if (!AVATAR_FILE_PATTERN.test(file)) return new Response(null, { status: 404 });

  try {
    const image = await getImage(avatarKey(file));
    if (!image) return new Response(null, { status: 404 });

    return new Response(image.body, {
      headers: {
        "Content-Type": "image/jpeg",
        // The file name changes with every upload, so what a URL shows never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Avatar could not be loaded", error);
    return new Response(null, { status: 502 });
  }
}
