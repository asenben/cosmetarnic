import type { Product } from "@/components/ProductCard";

export type SellerProfile = {
  name: string;
  handle: string;
  memberSince: string;
  listings: number;
  avatar?: string;
};

export type ProductDetails = Omit<Product, "href" | "image"> & {
  id: string;
  // The listing's number in the order of publishing, shown as its ID.
  number: number;
  // Sold listings keep their page, without the ways to contact the seller.
  sold: boolean;
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
