"use client";
import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/breadcrumb";
import { useRouter } from "next/navigation";
import { authFetcher, authPostdata } from "@/hooks/fetcher";
import { useUserContext } from "@/context/store";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import MobileSideMenus from "@/components/mobileSideMenus";
import { formatDate } from "@/services/common-methods";
import Link from "next/link";
import Spinner from "@/components/spinner";

import { Button, Label, Modal, Select, Textarea, Tooltip } from "flowbite-react";

const PersonalSettings = () => {

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
      label: PATH.SUBSCRIPTION_IN_MY_PROFILE.name,
      path: PATH.SUBSCRIPTION_IN_MY_PROFILE.path,
    },
  ];

  const router = useRouter();
  const { user } = useUserContext();
  if (!user || user.isCompanyUser) {
    router.push(PATH.HOME.path);
  }

  const [subscriptionDetails, setSubscriptionDetails] = useState<{ type: string, amount: number, expireDate: Date }>();
  const [isPaidUser, setisPaidUser] = useState<boolean>(false);
  const [isManualPaidUser, setIsManualPaidUser] = useState<boolean>(false);
  const [isTrailUser, setIsTrailUser] = useState<boolean>(false);
  const [isSubscriptionCancelled, setIsSubscriptionCancelled] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [benefitsPage, setBenefitsPage] = useState<string>('');
  const [openCancellationModel, setOpenCancellationModel] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [othersDescription, setOthersDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (user && user.isPaidUser) {
      // if ((!user.stripeSubscriptionId || user.stripeSubscriptionId == "") && user.isAddedFromCsv) {
      if (user.userType == 'trial') {
        setIsTrailUser(true);
      } else if(user.userType == 'paid' && (!user.stripeSubscriptionId || user.stripeSubscriptionId == "")) {
        setIsManualPaidUser(true);
      } else {
        setisPaidUser(true);
      }
      if (user.userRoles[0].roleCode == 'service_provider') {
        setBenefitsPage('/benefits?gotoPage=subscription');
      } else if (user.userRoles[0].roleCode == 'buyer') {
        setBenefitsPage('/buyer-benefits?gotoPage=subscription')
      }
    } else if(user) {
      if (user.userRoles[0].roleCode == 'service_provider') {
        setBenefitsPage('/benefits?gotoPage=subscription');
      } else if (user.userRoles[0].roleCode == 'buyer') {
        setBenefitsPage('/buyer-benefits?gotoPage=subscription')
      }
      
    }
    else {
      setisPaidUser(false);
    }
    fetchSubscriptionDetails();
  }, []);

  async function fetchSubscriptionDetails() {
    if (user) {
      await authFetcher(`${getEndpointUrl(ENDPOINTS.fetchSubscriptionDetails(user.id))}`).then((result) => {
        if (result.success===false) {
          router.push(PATH.HOME.path);  
          return;
      }
          else{
          const subscriptionDetails = result.data.subscriptionDetails;
          if (subscriptionDetails) {
            let sType = "";
            if (subscriptionDetails.subscriptionType && subscriptionDetails.subscriptionType == "month") {
              sType = "Monthly";
            } else {
              sType = "Yearly";
            }
            const subscription = {
              type: sType,
              amount: subscriptionDetails.subscriptionAmount,
              expireDate: new Date(subscriptionDetails.stripeExpireDate)
            }
            setSubscriptionDetails(subscription);
            setIsSubscriptionCancelled(subscriptionDetails.isSubscriptionCancelled);
          }
                  setCanRender(true);

        }
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  async function onClickCancelSubscription() {
    if (user) {
      const postData = {
        userId: user.id,
        cancellationReason: cancellationReason,
        reasonDescription: othersDescription
      }
      setIsLoading(true);
      authPostdata<{userId: number, cancellationReason: string, reasonDescription: string}>(`${getEndpointUrl(ENDPOINTS.cancelSubscription)}`, postData).then((result) => {
        setIsLoading(false);
        if (result.success) {
          setIsSubscriptionCancelled(true);
          setCancellationReason(""); 
          setOpenCancellationModel(false)
          // alert("Subscription cancelled successfully");
        }
      }).catch((err) => {
        setIsLoading(false);
        console.log(err);
      });
    }
  }

  const getRenewalDate = (date: Date): Date => {
    const renewalDate = new Date(date);
    renewalDate.setDate(renewalDate.getDate() - 1);
    return renewalDate
  }

  const onClickChangeSubscription = () => {
    window.open(process.env.NEXT_PUBLIC_XDS_STRIPE_CUSTOMER_PORTAL_LINK, '_blank', 'noopener,noreferrer');
  }

  
  return (
    <>
      {
        canRender ?
          <section>
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left flex align-middle items-cente">
                <MobileSideMenus></MobileSideMenus>
                <h1 className="font-bold  header-font">Subscription Details</h1>
              </div>
            </div>

            {
              isTrailUser ?
                <>
                  <div className="sm:text-left py-6">
                    <h2 className="font-bold  heading-sub-font">Billing Cycle</h2>
                  </div>
                  {
                    (user && user.accessExpirationDate && (new Date(new Date(user.accessExpirationDate).setHours(23, 59, 59, 999)) < new Date())) ?
                      <div>
                        <p>
                        You are a Foundational member.
                      </p>
                      <p className="text-sm pt-4"><button className="link_color" onClick={(e) => { e.preventDefault(); router.push(benefitsPage); }}><b>Click here</b></button> to review the benefits of being a Premium member.</p>
                      </div>
                      :
                      user?.accessExpirationDate ?
                        <>
                          <p className="text-sm">Your complimentary Premium membership expires on {formatDate(user?.accessExpirationDate)}</p>
                          <br></br>
                          <p className="text-sm">To avoid any delays, subscribe to maintain your Premium member benefits.</p>
                          <br></br>
                          <p className="text-sm"><button className="link_color" onClick={(e) => { e.preventDefault(); router.push(benefitsPage); }}><b>Click here</b></button> to review the benefits of being a Premium member.</p>
                        </>
                        :
                        ""
                  }

                  <div className="">
                    <div className="flex max-w-md flex-col gap-6">
                      <div className="firstname">
                        <div className="flex flex-wrap justify-group gap-2 py-6">
                          {
                            isSubscriptionCancelled ? "Your Subscription has been cancelled"
                              :
                              <button className="inline-block shrink-0 rounded-md subscribe_top_btn_2"  onClick={(e) => { e.preventDefault(); router.push("/billing-payment"); }}>
                                <svg style={{top:'-1px'}} className="mr-0.5" fill="#fff" id="Capa_1" enable-background="new 0 0 511.883 511.883" height="14" viewBox="0 0 511.883 511.883" width="14" xmlns="http://www.w3.org/2000/svg"><g><path d="m511.883 148.305-126.977 45.249 7.559 15.117c10.759 21.546.39 48.153-27.466 55.898-.352.117-38.936 10.474-50.654-24.624l-11.294-33.926 32.139-32.153-79.307-118.945-79.307 118.945 32.139 32.153-11.294 33.926c-7.31 21.899-22.998 29.282-50.801 23.994-3.036-1.479-18.891-2.166-27.861-21.694-4.951-10.752-4.746-22.983.542-33.574l7.544-15.103-126.845-45.278 56.593 218.672h133.079l66.211-66.211 66.211 66.211h133.109z"/><path d="m228.455 354.534h54.856v54.856h-54.856z" transform="matrix(.707 -.707 .707 .707 -195.142 292.811)"/><path d="m189.672 396.962h-128.789v60h188.789z"/><path d="m450.883 396.962h-128.789l-60 60h188.789z"/></g></svg> {user?.userRoles[0].roleCode == "buyer" ? 'Upgrade' : 'Subscribe' } 
                              </button>
                          }
                        </div>
                      </div>
                      <div></div>
                    </div>
                  </div>
                </>
                :
                isPaidUser ?
                  <>
                    <div className="sm:text-left py-6">
                      <h2 className="font-bold  heading-sub-font">Billing Cycle</h2>
                    </div>
                    {
                      (subscriptionDetails?.expireDate && (new Date(new Date(subscriptionDetails?.expireDate).setHours(23, 59, 59, 999)) < new Date())) ?
                        <p className="text-sm">Your Premium membership ended on {formatDate(subscriptionDetails?.expireDate)}</p>
                        :
                        <>
                          <p className="text-sm">Your Premium membership {isSubscriptionCancelled ? 'ends' : 'will auto-renew'} on {formatDate((subscriptionDetails?.expireDate) ? getRenewalDate(subscriptionDetails?.expireDate) : undefined)}</p>
                        </>
                    }
                    <div className="py-6">
                      <div className="flex max-w-md flex-col gap-6">
                        <div className="firstname">

                          <div className="link_color relative flex">
                            <Link prefetch={false} href="" onClick={onClickChangeSubscription} className="text-sky-600">
                              Manage Subscription
                            </Link>
                            <Tooltip
                              content="Change your subscription type and/or billing info."
                              className="tier_tooltip">
                              <svg
                                className="w-[18px] h-[18px] text-gray-600 ml-2"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {" "}
                            </Tooltip>
                          </div>
                          <div className="flex flex-wrap justify-group gap-2 py-6">
                            {
                              isSubscriptionCancelled ? "Your Subscription has been cancelled"
                                :
                                <div className="link_color">
                                  <button onClick={(e) => { e.preventDefault(); setOpenCancellationModel(true) }}>Cancel Subscription</button>
                                </div>
                            }
                          </div>
                        </div>
                        <div></div>
                      </div>
                    </div>

                    <Modal size="lg" show={openCancellationModel} onClose={() => { setCancellationReason(""); setOpenCancellationModel(false) }}>
                      <Modal.Header className="modal_header">
                        <b>Subscription Cancellation</b>
                      </Modal.Header>
                      <Modal.Body>
                        <div className="space-y-6">
                          <div className="">
                            <div className="mb-2 block">
                              <Label
                                htmlFor="cancellation-options"
                                className="font-bold text-xs"
                              />
                            </div>
                            <p style={{marginBottom: '15px'}}>Please share the reason you are cancelling.</p>
                            <Select id="cancellation-options" value={ cancellationReason } onChange={(e) => setCancellationReason(e.target.value)}>
                              <option value="">Select Reason</option>
                              <option value="temperory">I'm pausing my membership for now</option>
                              <option value="better_fit">I've chosen a different platform that better fits my needs</option>
                              <option value="high_cost">The cost doesn’t feel justifiable for my needs</option>
                              <option value="not_required">I no longer need Spark for my business</option>
                              <option value="payment_issue">I had billing or payment issues</option>
                              <option value="others">Other</option>
                            </Select>
                          </div>
                          {
                            cancellationReason == "others" &&
                            <div className="">
                              <div className="mb-2 block">
                                <Label
                                  htmlFor="comment"
                                  className="font-bold text-xs"
                                />
                              </div>
                              <Textarea
                                id="comment"
                                placeholder="Please leave a comment."
                                required
                                rows={8}
                                className="w-full focus:border-blue-500"
                                onChange={(e) => setOthersDescription(e.target.value)}
                                value={othersDescription}
                              />
                            </div>
                          }
                        </div>
                      </Modal.Body>
                      <Modal.Footer className="modal_footer">
                        <Button color="gray" onClick={() => { setCancellationReason(""); setOpenCancellationModel(false); setIsLoading(false); }}> Cancel</Button>
                        <Button isProcessing={isLoading} type="submit" onClick={() => onClickCancelSubscription()} >Continue</Button>
                      </Modal.Footer>
                    </Modal>
                  </>
                :
                isManualPaidUser ?
                <>
                  <div className="sm:text-left py-6">
                    <h2 className="font-bold  heading-sub-font">Billing Cycle</h2>
                  </div>
                  {
                    user?.accessExpirationDate &&
                    <p className="text-sm">
                      Your Premium membership ends on { formatDate(user?.accessExpirationDate) }
                    </p>
                  }
                  {/* <div className="py-6">
                    <div className="flex max-w-md flex-col gap-6">
                      <div className="firstname">
                        <div className="link_color relative flex">
                          <Link prefetch={false} href="mailto:info@xds-spark.com" className="text-sky-600">
                            Manage Subscription
                          </Link>
                          <Tooltip
                            content="Change your subscription type and/or billing info."
                            className="tier_tooltip">
                            <svg
                              className="w-[18px] h-[18px] text-gray-600 ml-2"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fillRule="evenodd"
                                d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {" "}
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </>
                :
                <>
                  <div className="py-4">
                    <p>
                      You are a Foundational member.
                    </p>
                    <p className="text-sm pt-4"><button className="link_color" onClick={(e) => { e.preventDefault(); router.push(benefitsPage); }}><b>Click here</b></button> to review the benefits of being a Premium member.</p>

                    <p style={{marginTop: '20px'}}>
                      <button className="inline-block shrink-0 rounded-md subscribe_top_btn_2"  onClick={(e) => { e.preventDefault(); router.push("/billing-payment"); }}>
                        <svg style={{top:'-1px'}} className="mr-0.5" fill="#fff" id="Capa_1" enable-background="new 0 0 511.883 511.883" height="14" viewBox="0 0 511.883 511.883" width="14" xmlns="http://www.w3.org/2000/svg"><g><path d="m511.883 148.305-126.977 45.249 7.559 15.117c10.759 21.546.39 48.153-27.466 55.898-.352.117-38.936 10.474-50.654-24.624l-11.294-33.926 32.139-32.153-79.307-118.945-79.307 118.945 32.139 32.153-11.294 33.926c-7.31 21.899-22.998 29.282-50.801 23.994-3.036-1.479-18.891-2.166-27.861-21.694-4.951-10.752-4.746-22.983.542-33.574l7.544-15.103-126.845-45.278 56.593 218.672h133.079l66.211-66.211 66.211 66.211h133.109z"/><path d="m228.455 354.534h54.856v54.856h-54.856z" transform="matrix(.707 -.707 .707 .707 -195.142 292.811)"/><path d="m189.672 396.962h-128.789v60h188.789z"/><path d="m450.883 396.962h-128.789l-60 60h188.789z"/></g></svg> {user?.userRoles[0].roleCode == "buyer" ? 'Upgrade' : 'Subscribe' }
                      </button>
                    </p>
                  </div>
                </>
            }
          </section>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
    </>
  );
};
export default PersonalSettings;
