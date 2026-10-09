import type { Product } from "@/components/ProductCard";

export type SellerProfile = {
  name: string;
  handle: string;
  memberSince: string;
  listings: number;
  avatar?: string;
};

// A listing as its own page shows it: what its card has, plus everything else about it.
export type ProductDetails = Omit<Product, "href" | "image"> & {
  id: string;
  // The listing's number in the order of publishing, shown as its ID.
  number: number;
  images: string[];
  title: string;
  // One of the category values from listingOptions.ts; the filters match on it.
  category: string;
  categories: string[];
  sellerProfile: SellerProfile;
  color: string;
  phone: string;
  // The description as HTML, cleaned when the listing was saved, so it is safe to show.
  descriptionHtml: string;
  views: number;
};
