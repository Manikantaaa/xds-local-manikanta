 "use client";

import PasswordForm from "@/components/passwordForm";
import Spinner from "@/components/spinner";
import { redirect, useSearchParams } from "next/navigation";
import CompleteSetupProgressBar from "@/components/completeSetupAccountProgressBar";
import { APPROVAL_STATUS } from "@/constants/approvalStatus";
import StripePricingTable from "@/components/stripePricingTable";
import { useCompleteSetupTokenValidate } from "@/hooks/useCompleteSetupTokenValidate";
import { useUserContext } from "@/context/store";
import { PATH } from "@/constants/path";
import { useRouter } from "next/navigation";
import Payments from "@/components/payment";
import { Suspense } from "react";

const PasswordPage = () => {
  const { user: loggedInUser } = useUserContext();
  const router = useRouter();

  if (loggedInUser) {
    redirect(PATH.HOME.path);
  }

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useCompleteSetupTokenValidate(token as string);

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return <div className="m-auto">{error.message}</div>;
  }
  if (user.approvalStatus === APPROVAL_STATUS.approved)
    return (
      <div className="w-full">
        <p className="font-bold text-2xl mt-9 text-center">
          👋 Hello {user.firstName}, let&apos;s finish your sign-up
        </p>
        <div className="mt-6 items-center justify-center">
          <CompleteSetupProgressBar step={1} />
        </div>
        <hr className="w-full mt-6" />
        <div className="lg:w-[25rem] mx-auto lg:px-0 px-2.5">
          <PasswordForm token={token as string} user={user} mutate={mutate} />
        </div>
      </div>
    );
  if (user.approvalStatus === APPROVAL_STATUS.pwdCreated) {
    return (
      <div className="w-full">
        <p className="font-bold text-2xl mt-9 text-center">
          👋 Hello {user.firstName}, let&apos;s finish your sign-up{" "}
          {user.isPaidUser}
        </p>
        <div className="mt-6 items-center justify-center">
          <CompleteSetupProgressBar step={2} />
        </div>
        <hr className="w-full mt-6" />
        <div className="w-full mx-auto mt-6 space-y-6">
          {/* <StripePricingTable customerEmail={user.email} /> */}
          <Payments
            customerEmail={user.email}
            token={token as string}
          ></Payments>
          <div className="flex justify-center">
            <p className="w-[20rem] italic text-sm">
              ** Note: we use Stripe for payments. The next step will take you
              to a Stripe form to process your payment. Don&apos;t worry,
              you&apos;ll be redirected back here when you&apos;re finished.
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (user.approvalStatus === APPROVAL_STATUS.completed && user.isPaidUser) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <div className="w-full">
          <p className="font-bold text-2xl mt-9 text-center">
            👋 Hello {user.firstName}, let&apos;s finish your sign-up{" "}
            {user.isPaidUser}
          </p>
          <div className="mt-6 items-center justify-center">
            <CompleteSetupProgressBar step={3} />
          </div>
          <hr className="w-full mt-6" />
          <div className="lg:w-[25rem] m-auto py-6">
            <h1 className="font-bold text-gray-900 heading-sub-font text-center">
              Thank you and congratulations!
            </h1>
            <p className="py-6 text-base">
              You’re now part of the best place to connect with creative companies
              all over the world.
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  bg-primary text-primary-foreground hover:bg-primary/90 h-10 p-5 w-full"
              type="button"
              onClick={() => router.push(PATH.HOME.path)}
            >
              Let’s go to XDS Spark
            </button>
          </div>
        </div>
      </Suspense>
    );
  }
};


export default PasswordPage;
