import { getCurrentUser } from "@/lib/auth/session";
import { newToken } from "@/lib/auth/tokens";
import { listingImageKey } from "@/lib/listings/images";
import { uploadImage } from "@/lib/storage/uploadImage";

// The browser shrinks every photo to a JPEG before sending it, so anything bigger than this did
// not come from the site's own form.
const MAX_BYTES = 2 * 1024 * 1024;

const isJpeg = (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

// Stores one photo for a listing that is about to be published and answers with its file name.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("photo");
  } catch {
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  }
  if (!(file instanceof File)) return Response.json({ message: "Избери снимка." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ message: "Снимката е твърде голяма." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isJpeg(bytes)) return Response.json({ message: "Снимката трябва да е JPEG." }, { status: 400 });

  try {
    const name = `${newToken()}.jpg`;
    await uploadImage(listingImageKey(name), bytes, "image/jpeg");
    return Response.json({ file: name }, { status: 201 });
  } catch (error) {
    console.error("Listing photo upload failed", error);
    return Response.json({ message: "Не успяхме да качим снимката. Опитай отново." }, { status: 500 });
  }
}
