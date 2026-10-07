import { Brush, Droplet, Gem, Hand, Scissors, SprayCan } from "lucide-react";

// The choices shared by the search filters and the listing form.
export const categories = [
  { value: "makeup", label: "Грим", icon: Brush },
  { value: "skincare", label: "Грижа за кожата", icon: Droplet },
  { value: "hair", label: "Коса", icon: Scissors },
  { value: "nails", label: "Нокти", icon: Hand },
  { value: "perfumes", label: "Парфюми", icon: SprayCan },
  { value: "accessories", label: "Аксесоари", icon: Gem },
];

export const cities = [
  "София",
  "Пловдив",
  "Варна",
  "Бургас",
  "Русе",
  "Стара Загора",
  "Плевен",
  "Сливен",
  "Добрич",
  "Шумен",
];
