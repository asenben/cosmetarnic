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
  images: string[];
  title: string;
  categories: string[];
  seller: "private" | "business";
  sellerProfile: SellerProfile;
  shippingPaidBy: "buyer" | "seller";
  color: string;
  phone: string;
  description: string;
  features: string[];
  views: number;
};

// Sample listings for styling the pages until real products are published.
export const products: ProductDetails[] = [
  {
    id: "1",
    brand: "Charlotte Tilbury",
    price: 44,
    city: "Варна",
    postedAgo: "преди 12 часа",
    condition: "new",
    delivery: ["pickup", "speedy", "econt"],
    images: [1, 2, 3, 4, 5].map((n) => `/images/samples/sample-${n}.svg`),
    title: "Pillow Talk молив за устни",
    categories: ["Красота и козметика", "Грим"],
    seller: "private",
    sellerProfile: { name: "Ивана Петрова", handle: "ivana_beauty", memberSince: "март 2024", listings: 12 },
    shippingPaidBy: "buyer",
    color: "Розово-кафяв",
    phone: "0888 123 456",
    description: "Оригинален молив за устни Charlotte Tilbury – Pillow Talk.",
    features: [
      "Чисто нов, неразопакован",
      "Наситен розово-кафяв нюанс",
      "Подходящ за ежедневна и вечерна визия",
      "Дълготрайна формула",
      "С оригинална опаковка",
    ],
    views: 671,
  },
  {
    id: "2",
    brand: "Dior",
    price: 68,
    city: "София",
    postedAgo: "преди 2 дни",
    condition: "used",
    delivery: ["econt", "pickup"],
    images: [],
    title: "Addict Lip Glow балсам за устни",
    categories: ["Красота и козметика", "Грим"],
    seller: "private",
    sellerProfile: { name: "Мария Георгиева", handle: "maria_g", memberSince: "януари 2025", listings: 3 },
    shippingPaidBy: "seller",
    color: "Розов",
    phone: "0899 654 321",
    description: "Балсам за устни Dior Addict Lip Glow, използван няколко пъти.",
    features: ["Нюанс 001 Pink", "Остава около 90% от продукта", "С оригинална кутия"],
    views: 128,
  },
];
