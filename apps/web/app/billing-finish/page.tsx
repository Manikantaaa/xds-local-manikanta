"use client";
import { PATH } from "@/constants/path";
import { useRouter } from "next/navigation";
const BillingFinish = () => {
  const router = useRouter();
  async function onClickGotoXds(e: any) {
    e.preventDefault();
    // const response = await axios.post(getEndpointUrl(ENDPOINTS.verifyToken), {
    //   idToken: token,
    // });
    // console.log(response);
    router.push(PATH.HOME.path);
  }
  return (
    <div className="w-full px-5">
      <div className="py-9">
        <div className="text-center">
          <h1 className="font-bold text-gray-900 header-font">
            👏 Well done 👏
          </h1>
        </div>
      </div>
      <div className="clear-left">
        <hr />
      </div>
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
          onClick={(e) => onClickGotoXds(e)}
        >
          Let’s go to XDS Spark
        </button>
      </div>
    </div>
  );
};
export default BillingFinish;
