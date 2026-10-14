import {
  CreditCard,
  FileUp,
  Inbox,
  Mail,
  MessageCircleQuestionMark,
  MessageSquare,
  Search,
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
    title: "Настройки",
    sections: [
      { slug: "emails", label: "Имейл известия", icon: Mail },
      { slug: "roles", label: "Потребителски роли", icon: UserCog },
    ],
  },
];

export const adminSections = adminGroups.flatMap(({ sections }) => sections);
