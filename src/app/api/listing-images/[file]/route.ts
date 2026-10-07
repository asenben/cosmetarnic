import { LISTING_IMAGE_PATTERN, listingImageKey } from "@/lib/listings/images";
import { getImage } from "@/lib/storage/uploadImage";

// Serves a listing's photo from the private bucket. Listings are public, so this is too.
export async function GET(_request: Request, { params }: RouteContext<"/api/listing-images/[file]">) {
  const { file } = await params;
  if (!LISTING_IMAGE_PATTERN.test(file)) return new Response(null, { status: 404 });

  try {
    const image = await getImage(listingImageKey(file));
    if (!image) return new Response(null, { status: 404 });

    return new Response(image.body, {
      headers: {
        "Content-Type": "image/jpeg",
        // The file name changes with every upload, so what a URL shows never changes.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Listing photo could not be loaded", error);
    return new Response(null, { status: 502 });
  }
}
