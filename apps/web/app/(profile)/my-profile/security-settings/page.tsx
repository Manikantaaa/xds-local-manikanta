"use client";
import Breadcrumbs from "@/components/breadcrumb";
import SecuritySettingComponent from "@/components/securitySettingComponent";
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
    label: PATH.SECURITY_SETTINGS.name,
    path: PATH.SECURITY_SETTINGS.path,
  },
];
const SecuritySettings = () => {
  const { user } = useUserContext();
  if (!user) {
    redirect(PATH.HOME.path);
  }

  return(
    <div>
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <SecuritySettingComponent />
      <br />
      <br />
    </div>
  );

}

export default SecuritySettings;