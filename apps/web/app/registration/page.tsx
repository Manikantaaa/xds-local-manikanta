"use client";

import RegistrationForm from "@/components/registrationForm";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect, useSearchParams } from "next/navigation";
import { USER_TYPE } from '@/types/user.type';

const RegistrationPage = () => {
  const { user } = useUserContext();
  const searchParams = useSearchParams();
  let userType: USER_TYPE = "init";
  if(searchParams.get("userType") && searchParams.get("userType") != "" && searchParams.get("userType") == "foundational") {
    userType = "free";
  }
  if (user) {
    redirect(PATH.HOME.path);
  }

  return (
    <div className="mx-auto">
      <RegistrationForm type={userType} />
    </div>
  );
};

export default RegistrationPage;
