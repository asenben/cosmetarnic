// Photos are shrunk to this many pixels on their longer side before they are sent.
const PHOTO_SIDE = 1600;

// Shrinks the photo and turns it into a JPEG, so uploads are small whatever the camera produced.
export async function toJpeg(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d")!;
  // JPEG has no transparency; see-through parts of a PNG become white instead of black.
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", 0.85),
  );
}

// Sends one photo to the bucket and answers with its file name there, or with what went wrong.
export async function uploadPhoto(file: File): Promise<{ file: string } | { message: string }> {
  const body = new FormData();
  body.set("photo", await toJpeg(file), "photo.jpg");
  const response = await fetch("/api/listings/images", { method: "POST", body });
  const result = await response.json();
  return response.ok ? { file: result.file } : { message: result.message };
}
