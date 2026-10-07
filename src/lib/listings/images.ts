// Listing photos are stored in the bucket as listings/<file>, and listings.images keeps just the
// file names, cover first. The bucket is private, so the browser gets them through
// /api/listing-images/<file>.

// Every upload gets a new random name, so a URL never changes what it shows and can be cached for good.
export const LISTING_IMAGE_PATTERN = /^[A-Za-z0-9_-]{20,}\.jpg$/;

export const MAX_LISTING_PHOTOS = 6;

export const listingImageKey = (file: string) => `listings/${file}`;

export const listingImageUrl = (file: string) => `/api/listing-images/${file}`;
