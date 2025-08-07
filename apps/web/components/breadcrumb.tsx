import { ReactNode } from "react";
import Link from "next/link";

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <div className="flex gap-2 items-start">
      {items.map((crumb, i) => {
        const isLastItem = i === items.length - 1;
        if (isLastItem)
          return (
            <p className="font-bold text-sm" key={i}>
              {crumb.label}
            </p>
          );
        return (
          <div key={i}>
            <Link
              href={crumb.path}
              key={i}
              className="text-gray-500 hover:underline text-sm"
            >
              {crumb.label}
            </Link>
            <span className="text-gray-150"> / </span>
          </div>
        );
      })}
    </div>
  );
};
export default Breadcrumbs;

export type CrumbItem = {
  label: ReactNode;
  path: string;
};

export type BreadcrumbsProps = {
  items: CrumbItem[];
};
