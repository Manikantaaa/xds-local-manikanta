"use client";

import Breadcrumbs from "@/components/breadcrumb";
import GeneralInfoForm from "@/components/generalInfoForm";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";

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
    label: PATH.GENERAL_INFO.name,
    path: PATH.GENERAL_INFO.path,
  },
];

const GeneralInfo = () => {
  const { user } = useUserContext();

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  if (!user.isPaidUser && user?.userRoles[0].roleCode === 'buyer') {
    redirect("/company-profile/about");
  }

  return (
    <div>
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <GeneralInfoForm />
    </div>
  );
};

export default GeneralInfo;
