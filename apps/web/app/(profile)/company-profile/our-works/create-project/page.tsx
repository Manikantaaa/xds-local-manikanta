"use client";
import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import ProjectComponent from "@/components/ProjectComponent";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
const PersonalSettings = () => {
  const { user } = useUserContext();

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  if (!user.isPaidUser) {
    redirect("/company-profile/about");
  }

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.COMPANY_PROFILE.name,
      path: PATH.COMPANY_PROFILE.path,
    },
    {
      label: PATH.PROJECTS.name,
      path: PATH.PROJECTS.path,
    },
    {
      label: "Create Project",
      path: "Create Project",
    },
  ];

  return (
    <>
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <ProjectComponent params={{ companyId: "" }}></ProjectComponent>
    </>
  );
};
export default PersonalSettings;
