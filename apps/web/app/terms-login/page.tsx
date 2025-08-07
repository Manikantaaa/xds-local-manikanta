"use client";
import TermsLoginForm from "@/components/termsLoginForm";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { useRouter } from "next/navigation";

function TermsLogin() {
  const router = useRouter();
  const { user } = useUserContext();

  if (user) {
    if(user.checkedTerms) {
      if (user.userRoles) {
        user.userRoles[0].roleCode;
        if (user.userRoles[0].roleCode == "admin") {
          router.push(PATH.REGISTRATIONS.path);
        } else {
          router.push(PATH.OTHERS_HOME.path);
        }
      }
    }
  }

  return (
    <div className="mx-auto">
      {
        !user && <TermsLoginForm />
      }
    </div>
  );
}

export default TermsLogin;
