"use client";

import CompleteSetupProgressBar from "@/components/completeSetupAccountProgressBar";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import Link from "next/link";
import { redirect } from "next/navigation";

const CompleteSetup = () => {
  const { user } = useUserContext();

  if (user) {
    redirect(PATH.HOME.path);
  }

  return (
    <div className="w-full">
      <p className="font-bold text-2xl mt-9 text-center">👏 Well done 👏</p>
      <div className="mt-6 items-center justify-center">
        <CompleteSetupProgressBar step={3} />
      </div>
      <hr className="w-full mt-6" />
      <div className="w-[25rem] mx-auto space-y-6 mt-6">
        <p className="font-bold text-center">Thank you and congratulations!</p>
        <p>
          You&apos;re now part of the best place to connect with creative
          companies all over the world.
        </p>
        <Link prefetch={false} href={PATH.HOME.path}>
          <Button className="w-full">Let&apos;s go to XDS Spark</Button>
        </Link>
      </div>
    </div>
  );
};

export default CompleteSetup;
