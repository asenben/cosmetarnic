// Sample account data for styling the profile pages until real accounts exist.

export const profile = {
  name: "Ивана Петрова",
  handle: "ivana_beauty",
  city: "София",
  memberSince: "март 2024",
  about:
    "Любител на качествена козметика. Продавам както нови, така и малко използвани продукти в отлично състояние.",
  stats: { active: 12, sold: 3, archived: 5, favorites: 18, purchases: 7 },
  unreadMessages: 2,
};

export type ProfileListing = {
  id: string;
  title: string;
  price: number;
  views: number;
  messages: number;
  status: "active" | "sold" | "archived";
  image?: string;
};

export const profileListings: ProfileListing[] = [
  { id: "1", title: "YSL Libre Eau de Parfum", price: 120, views: 48, messages: 5, status: "active" },
  { id: "2", title: "Laneige Lip Sleeping Mask", price: 45, views: 32, messages: 3, status: "active" },
  { id: "3", title: "Dior Addict Lip Glow", price: 65, views: 27, messages: 1, status: "active" },
  { id: "4", title: "Olaplex No.3 Hair Perfector", price: 50, views: 61, messages: 4, status: "active" },
];

export const profilePurchases = [
  { id: "1", title: "The Ordinary Niacinamide 10%", price: 28, date: "12.03.2024", status: "Доставена" },
  { id: "2", title: "Charlotte Tilbury Powder", price: 95, date: "02.03.2024", status: "Доставена" },
  { id: "3", title: "Kérastase Elixir Ultime", price: 78, date: "15.02.2024", status: "Доставена" },
];

export const profileMessages = [
  { id: "1", name: "Мария Георгиева", text: "Здравей, наличен ли е още?", time: "10:24", unread: 1 },
  { id: "2", name: "Даниел Иванов", text: "Благодаря!", time: "Вчера", unread: 0 },
  { id: "3", name: "Елена Стоянова", text: "Може ли още снимки?", time: "Вчера", unread: 0 },
  { id: "4", name: "Николай Димитров", text: "Интересувам се от продукта.", time: "12.03.2024", unread: 0 },
];

export type ProfileNotification = {
  id: string;
  kind: "message" | "views" | "order" | "approved";
  text: string;
  time: string;
  unread: boolean;
};

export const profileNotifications: ProfileNotification[] = [
  { id: "1", kind: "message", text: "Ново съобщение от Мария Георгиева", time: "преди 5 минути", unread: true },
  { id: "2", kind: "views", text: "Вашата обява е прегледана 50 пъти", time: "преди 2 часа", unread: false },
  { id: "3", kind: "order", text: "Нова заявка за покупка", time: "преди 1 ден", unread: false },
  { id: "4", kind: "approved", text: "Обявата е одобрена", time: "преди 2 дни", unread: false },
];
