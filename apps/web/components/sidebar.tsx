"use client";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ReactNode } from "react";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";

const Sidebar = () => {
  const { user } = useUserContext();

  const topMenu = {
    title: "My Profile",
    items: [
      {
        children: PATH.PERSONAL_SETTINGS.name,
        href: PATH.PERSONAL_SETTINGS.path,
      },
      { children: PATH.CHANGE_PASSWORD.name, href: PATH.CHANGE_PASSWORD.path },
      {
        children: (
          <div className="flex items-center justify-between">
            <p>{PATH.SUBSCRIPTION.name}</p>
            <ExternalLink className="w-[1.1rem]" />
          </div>
        ),
        href: PATH.SUBSCRIPTION.path(user?.email),
        hasExternalLink: true,
      },
    ],
  };

  const bottomMenu = {
    title: "Company Profile",
    items: [
      { children: PATH.GENERAL_INFO.name, href: PATH.GENERAL_INFO.path },
      { children: PATH.OUR_WORK.name, href: PATH.OUR_WORK.path },
      {
        children: PATH.DUE_DILIGENCE.name,
        href: PATH.DUE_DILIGENCE.path,
      },
      { children: PATH.ABOUT.name, href: PATH.ABOUT.path },
      { children: PATH.CONTACT.name, href: PATH.CONTACT.path },
      { children: PATH.REVIEW_PUBLISH.name, href: PATH.REVIEW_PUBLISH.path },
    ],
  };
  return (
    <div className="space-y-[0.62rem] py-6 px-5">
      <SidebarMenu {...topMenu} />
      <SidebarMenu {...bottomMenu} />
    </div>
  );
};

const SidebarMenu = ({ title, items }: Menu) => {
  return (
    <div className="space-y-[0.62rem] pb-[0.62rem]">
      <h4 className="font-bold">{title}</h4>
      {items.map((item, idx) => (
        <Link
        prefetch={false}
          target={item.hasExternalLink ? "_blank" : ""}
          className="text-blue-350 hover:text-black block text-sm"
          key={idx}
          href={item.href}
        >
          {item.children}
        </Link>
      ))}
    </div>
  );
};

type Menu = {
  title: string;
  items: SidebarMenuItem[];
};
type SidebarMenuItem = {
  hasExternalLink?: boolean;
  children: ReactNode;
  href: string;
};
export default Sidebar;
