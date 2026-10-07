import { r2Fetch } from "@/lib/storage/r2";

// Removes the image under `key`. Deleting something that is already gone is not an error.
export async function deleteImage(key: string) {
  const response = await r2Fetch(key, { method: "DELETE" });
  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 could not delete ${key} (${response.status})`);
  }
}
