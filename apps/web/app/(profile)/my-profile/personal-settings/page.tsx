"use client";

import Breadcrumbs from "@/components/breadcrumb";
import PersonalSettingsCompanyAdmin from "@/components/companyAdmin/components/personalSettingsCompanyAdmin";
import PersonalSettingsForm from "@/components/personalContactForm";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";

const breadcrumbItems = [
  {
    label: PATH.HOME.name,
    path: PATH.HOME.path,
  },
  {
    label: PATH.MY_PROFILE.name,
    path: PATH.MY_PROFILE.path,
  },
  {
    label: PATH.PERSONAL_SETTINGS.name,
    path: PATH.PERSONAL_SETTINGS.path,
  },
];

const PersonalSettings = () => {
  const { user } = useUserContext();

  if (!user) {
    redirect(PATH.HOME.path);
  }

  return (
    <div>
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      {user.isCompanyUser ? <PersonalSettingsCompanyAdmin></PersonalSettingsCompanyAdmin> :
        <PersonalSettingsForm />}
      <br />
      <br />
    </div>
  );
};

export default PersonalSettings;
