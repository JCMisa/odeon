"use client";

import { usePathname } from "next/navigation";
import { BreadcrumbPage } from "../ui/breadcrumb";

const BreadCrumbPageClient = () => {
  const path = usePathname();

  return (
    <BreadcrumbPage>
      {path === "/" && "Home"} {path === "/create" && "Create"}
    </BreadcrumbPage>
  );
};

export default BreadCrumbPageClient;
