"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetcher } from "@/hooks/fetcher";
import { string } from "yup";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";

type StripePricingTableProps = {
  customerEmail: string;
  token: string;
};

const Payments = ({ customerEmail, token }: StripePricingTableProps) => {
  const router = useRouter();
  const [subscriptionType, setSubscriptionType] = useState("monthly");
  const [monthlySubs, setMonthlySubs] = useState<{
    price: number;
    productId: string;
  }>();
  const [yearlySubs, setYearlySubs] = useState<{
    price: number;
    productId: string;
  }>();

  useEffect(() => {
    fetchPrices();
  }, []);

  async function fetchPrices() {
    await authFetcher(`${getEndpointUrl(ENDPOINTS.getStripeProducts)}`)
    .then((result) => {
      const priceList = result.data?.data;
      priceList.forEach((item: any) => {
        if (item.active && item.nickname == "xds_spark") {
          if (item.recurring.interval == "year") {
            const yearlyPriceString = item.unit_amount / 100;
            setYearlySubs({ price: yearlyPriceString, productId: item.id });
          } else if (item.recurring.interval == "month") {
            const monthlyPriceString = item.unit_amount / 100;
            setMonthlySubs({ price: monthlyPriceString, productId: item.id });
          }
        }
      });
    })
    .catch((err) => {
      console.log(err);
    });
  }

  function onChangeSubscriptionType(type: string) {
    setSubscriptionType(type);
  }

  function encodeEmail(email: string, key: string|undefined): string {
    const emailBytes = new TextEncoder().encode(email);
    const keyBytes = new TextEncoder().encode(key);
  
    const encodedBytes = emailBytes.map((byte, index) => byte ^ keyBytes[index % keyBytes.length]);
  
    return btoa(String.fromCharCode(...encodedBytes));
  }

  function onClickSubscribeButton(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    const checkMail = encodeEmail(customerEmail, process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY);
    if (subscriptionType == "monthly") {
      if (monthlySubs) {
        authFetcher(
          `${getEndpointUrl(
            ENDPOINTS.getCheckoutForm(
              customerEmail,
              monthlySubs.productId,
              token,
              checkMail,
            ),
          )}`,
        )
          .then((result) => {
            console.log(result.data);
            if (result && result.data && result.data != "") {
              router.push(result.data);
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    } else if (yearlySubs) {
      authFetcher(
        `${getEndpointUrl(
          ENDPOINTS.getCheckoutForm(customerEmail, yearlySubs.productId, token, checkMail),
        )}`,
      ).then((result) => {
        console.log(result.data);
        if (result && result.data && result.data != "") {
          router.push(result.data);
        }
      })
      .catch((err) => {
        console.log(err);
      });
    }
  }

  return (
    <>
      <div className="w-[280px] m-auto py-6">
        <div className="mb-6 text-center">
          <select
            id="subscriptionType"
            onChange={(e) => onChangeSubscriptionType(e.target.value)}
            className=" bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500  w-52 p-2.5 "
          >
            <option selected value="monthly">
              Monthly
            </option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="billing_card_bg w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700">
        {subscriptionType !== "monthly" && 
            <div className="pb-6">
              
              <button
                type="button"
                className="px-3 py-2 text-xs font-medium text-center text-gray-900 bg-white rounded-sm hover:bg-gray-200"
              >Best Value
              </button>
              
              {/* <button
                type="button"
                className="px-3 py-2 text-xs font-medium text-center text-red-800 subscribe_btn_color rounded-sm hover:bg-yellow-400 ms-1"
              >
                Test Mode
              </button> */}
            </div>
          }
          <h5 className="mb-4 text-xl font-medium text-gray-900">
            Premium Membership</h5>
          {/* <p className="mb-4  font-medium text-gray-900">Premium Membership</p> */}
          <div className={`flex items-baseline text-gray-900 relative  ${subscriptionType == "monthly" ? 'pb-8' : 'pb-8'} `}>
            <span className="text-5xl font-semibold flex items-end">$
              {subscriptionType == "monthly"
                ?  process.env.NEXT_PUBLIC_XDS_STRIPE_PRODUCT_PRICE_MONTHLY
                : process.env.NEXT_PUBLIC_XDS_STRIPE_PRODUCT_PRICE_YEARLY} 
                <abbr className=" ms-2 font_1rem font-medium text-gray-500 ml-[-2px] " >
                {
                  subscriptionType == "monthly" ? 
                  <span className="relative -top-2">USD / billed monthly</span>
                  :
                  <span className="leading-4 w-32 inline-block relative top-2">USD / per month, billed annually</span>
                }
              </abbr>{" "}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => onClickSubscribeButton(e)}
            className="text-dark subscribe_btn_color hover:bg-yellow-400  focus:outline-none  font-medium rounded-lg  px-5 py-3 inline-flex justify-center w-full text-center h-12"
          >
            Subscribe
          </button>
        </div>
      </div>
    </>
  );
};

export default Payments;
