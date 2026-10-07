import { r2Fetch } from "@/lib/storage/r2";

// Stores the image under `key` in the bucket, replacing anything already there.
export async function uploadImage(key: string, body: Uint8Array<ArrayBuffer>, contentType: string) {
  const response = await r2Fetch(key, {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType },
  });
  if (!response.ok) throw new Error(`R2 rejected the upload of ${key} (${response.status})`);
}

// The stored image, or null when there is nothing under that key.
export async function getImage(key: string) {
  const response = await r2Fetch(key);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`R2 could not return ${key} (${response.status})`);
  return response;
}
