"use client";
import LoginForm from "@/components/loginForm";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect, useRouter } from "next/navigation";

function LoginPage() {
  const router = useRouter();
  const { user } = useUserContext();
  localStorage.removeItem("clickedLogout");
  localStorage.removeItem("marketpageCrousal");
  localStorage.removeItem("homepageCrousal");
  localStorage.removeItem("spsCrousal");
  if (user) {
    if (user.userRoles) {
      if(user.checkedTerms) {
        if(user.passwordNeedToChange == 'adChanged') {
          router.push(PATH.PASSWORD_CHANGE_FIRST.path);
        } else if(user.isCompanyUser && !user.isPasswordChanged) {
          router.push(PATH.PASSWORD_CHANGE_FIRST.path);
        }else {
          if (user.userRoles[0].roleCode == "admin") {
            router.push(PATH.REGISTRATIONS.path);
          } else {
            router.push(PATH.OTHERS_HOME.path);
          }
        }
      }
    }
  }


  return (
    <div className="mx-auto">
      {
        !user && <LoginForm />
      }
    </div>
  );
}

export default LoginPage;
