"use client";

import Payments from "@/components/payment";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";

const BillingPayment = () => {
  const { user } = useUserContext();
  if (!user) {
    redirect(PATH.HOME.path);
  }
  return (
    <div className="w-full px-5">
      <div className="py-9">
        <div className="text-center">
          <h1 className="font-bold text-gray-900 header-font">
            👋 Hello {user?.firstName}, let&apos;s complete your subscription{" "}
          </h1>
        </div>
      </div>
      <div className="clear-left">
        <hr />
      </div>
      <Payments customerEmail={user.email} token=""></Payments>
      <p className="lg:w-[23rem] m-auto italic text-sm leading-6 pb-6">
        ** Note: we use Stripe for payments. The next step will take you to a
        Stripe form to process your payment. Don’t worry, you’ll be redirected
        back here when you’re finished.
      </p>
    </div>
  );
};
export default BillingPayment;
