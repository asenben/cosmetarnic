import {
  CreditCard,
  FileLock,
  FileUp,
  Heart,
  Image as ImageIcon,
  Inbox,
  Mail,
  MessageCircleQuestionMark,
  MessageSquare,
  Newspaper,
  PanelsTopLeft,
  Search,
  Settings,
  Shapes,
  Star,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminSection = {
  // The last part of the section's address: /admin/<slug>.
  slug: string;
  label: string;
  icon: LucideIcon;
};

// The sections of the administration panel, in the groups and the order its sidebar shows them.
export const adminGroups: { title: string; sections: AdminSection[] }[] = [
  {
    title: "Основни",
    sections: [
      { slug: "users", label: "Потребители", icon: Users },
      { slug: "listings", label: "Обяви", icon: FileUp },
      { slug: "requests", label: "Търся", icon: Search },
      { slug: "categories", label: "Категории", icon: Shapes },
      { slug: "brands", label: "Марки", icon: Heart },
      { slug: "messages", label: "Съобщения", icon: MessageSquare },
      { slug: "payments", label: "Плащания", icon: CreditCard },
      { slug: "reviews", label: "Ревюта и сигнали", icon: Star },
    ],
  },
  {
    title: "Поддръжка",
    sections: [
      { slug: "inquiries", label: "Запитвания", icon: MessageCircleQuestionMark },
      { slug: "user-messages", label: "Съобщения от потребители", icon: Inbox },
    ],
  },
  {
    title: "Съдържание",
    sections: [
      { slug: "pages", label: "Страници", icon: PanelsTopLeft },
      { slug: "blog", label: "Блог / Новини", icon: Newspaper },
      { slug: "banners", label: "Банери", icon: ImageIcon },
    ],
  },
  {
    title: "Настройки",
    sections: [
      { slug: "settings", label: "Настройки на сайта", icon: Settings },
      { slug: "emails", label: "Имейл известия", icon: Mail },
      { slug: "roles", label: "Потребителски роли", icon: UserCog },
      { slug: "logs", label: "Логове и сигурност", icon: FileLock },
    ],
  },
];

export const adminSections = adminGroups.flatMap(({ sections }) => sections);

// The section the panel opens on.
export const FIRST_ADMIN_SECTION = adminSections[0].slug;
