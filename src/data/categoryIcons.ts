import {
  Bath,
  Brush,
  Droplet,
  Eye,
  Flower2,
  Gem,
  Gift,
  Hand,
  Heart,
  Leaf,
  Palette,
  Scissors,
  ShoppingBag,
  Smile,
  Sparkles,
  SprayCan,
  Star,
  Sun,
  Tag,
  type LucideIcon,
} from "lucide-react";

// The pictures a category can have, by the name stored with it. The administrator picks one of
// these when adding a category.
export const categoryIcons: Record<string, LucideIcon> = {
  Brush,
  Droplet,
  Scissors,
  Hand,
  SprayCan,
  Gem,
  Sparkles,
  Palette,
  Flower2,
  Leaf,
  Bath,
  Sun,
  Eye,
  Smile,
  Heart,
  Star,
  Gift,
  ShoppingBag,
  Tag,
};

// Used when a category names a picture that is not offered any more.
export const DEFAULT_CATEGORY_ICON = "Tag";

export const categoryIcon = (name: string) => categoryIcons[name] ?? categoryIcons[DEFAULT_CATEGORY_ICON];
