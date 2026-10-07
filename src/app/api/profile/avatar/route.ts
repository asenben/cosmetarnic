import { avatarKey, avatarUrl } from "@/lib/auth/avatar";
import { getCurrentUser } from "@/lib/auth/session";
import { newToken } from "@/lib/auth/tokens";
import { sql } from "@/lib/db";
import { deleteImage } from "@/lib/storage/deleteImage";
import { uploadImage } from "@/lib/storage/uploadImage";

// The browser shrinks the photo to a small square JPEG before sending it, so anything bigger than
// this did not come from the site's own form.
const MAX_BYTES = 512 * 1024;

const isJpeg = (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

// Removes the previous picture from the bucket. A leftover file is harmless, so a failure here is
// only logged and does not undo the change the user asked for.
async function discard(file: string | null) {
  if (!file) return;
  try {
    await deleteImage(avatarKey(file));
  } catch (error) {
    console.error("Old avatar could not be deleted", error);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("avatar");
  } catch {
    return Response.json({ message: "Невалидна заявка." }, { status: 400 });
  }
  if (!(file instanceof File)) return Response.json({ message: "Избери снимка." }, { status: 400 });
  if (file.size > MAX_BYTES) return Response.json({ message: "Снимката е твърде голяма." }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isJpeg(bytes)) return Response.json({ message: "Снимката трябва да е JPEG." }, { status: 400 });

  try {
    const name = `${newToken()}.jpg`;
    await uploadImage(avatarKey(name), bytes, "image/jpeg");

    const [previous] = await sql`select avatar from users where id = ${user.id}`;
    await sql`update users set avatar = ${name} where id = ${user.id}`;
    await discard(previous?.avatar ?? null);

    return Response.json({ avatar: avatarUrl(name) });
  } catch (error) {
    console.error("Avatar upload failed", error);
    return Response.json({ message: "Не успяхме да качим снимката. Опитай отново." }, { status: 500 });
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "Влез в профила си." }, { status: 401 });

  try {
    const [previous] = await sql`select avatar from users where id = ${user.id}`;
    await sql`update users set avatar = null where id = ${user.id}`;
    await discard(previous?.avatar ?? null);
    return Response.json({ avatar: null });
  } catch (error) {
    console.error("Avatar removal failed", error);
    return Response.json({ message: "Не успяхме да махнем снимката. Опитай отново." }, { status: 500 });
  }
}
