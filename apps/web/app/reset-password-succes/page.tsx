"use client";
import { PATH } from "@/constants/path";
import { useRouter } from "next/navigation";
const ResetpasswordSuccess = () => {

  const router = useRouter();

  function onClickGotoXds(e: any) {
    e.preventDefault()
    router.push(PATH.HOME.path)
    console.log()
  }
  return (
      <>
        <div className="w-full lg:max-w-[440px] px-5 mx-auto">
          <div className="pt-6">
            <div className="flex justify-center">
              <h1 className="font-bold  header-font">Reset Password</h1>
            </div>
          </div>
          <div className="py-6">
            {" "}
            <hr />{" "}
          </div>
          <p className="text-sm">
            You have successfully reset your password. 👍
          </p>
          <p className="text-sm link_color py-6">
            <button onClick={(e) => onClickGotoXds(e) }>Click here to go to XDS Spark</button>
          </p>
        </div>
      </>
  );
};
export default ResetpasswordSuccess;
