"use client";

import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import { Modal } from "flowbite-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname, redirect } from "next/navigation";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import "../public/css/detatable.css";
import Spinner from "./spinner";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";

interface SharedProject {
  id: number;
  name: string;
  description: string;
  MyIntrestedProjectsList: {
    list: {
      id: number;
      name: string;
      description: string;
    }
  }[]
}

interface ListType {
  list: {
    id: number;
    name: string;
    description: string;
  }
}

const SharedProjectComponent = () => {
  const route = useRouter();
  const {user}=useUserContext();
  const searchParams = useSearchParams();
  const currentUrl = usePathname();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(true);
  const [sharedProjectLists, setSharedProjectLists] = useState<SharedProject>();
  const [isValidLink, setIsValidLink] = useState<boolean>(false);
  const [openInvalidLinkModal, setOpenInvalidLinkModal] = useState<boolean>(false);

  const columns = [
    {
      name: "List Name",
      cell: (row: ListType) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/shared-list?token=${token}&list=${row.list.id}`}>
            {row.list.name}
          </Link>
        </div>
      )
    },
    {
      name: "Description",
      cell: (row: ListType) => row.list.description,
    }
  ];

  useEffect(() => {
    setTimeout(() => {
      getPublicLists();
    }, 1000);
  }, []);

  const getPublicLists = async() => {
    await authFetcher(`${getEndpointUrl(ENDPOINTS.getPublicListInProject(token))}`).then((result) => {
      if(result.success && result.data) {
        document.title = "XDS Spark - " + result.data?.name;
        setIsValidLink(true);
        setSharedProjectLists(result.data);
        setIsLoading(false);
      }
    }).catch((err) => {
      setOpenInvalidLinkModal(true);
      console.log(err);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  return(
    <>
      {
        !isLoading ?
          isValidLink ?
          <div className="w-full lg:container px-5 pos_r">
            <div className={`flex justify-between ${ user ? 'py-6' : 'pt-28 pb-6' }`}>
              <div className="text-left">
                <h1 className="default_text_color header-font">{sharedProjectLists?.name}</h1>
                <p className="pt-2">{sharedProjectLists?.description}</p>
              </div>            
            </div>
            <div className="pt-2"><hr/></div>
            <div className="card pt-6">
              <h3 className="text-base font-bold pb-6">Service Provider List</h3>
              <div className="mylists_table">
                <DataTable
                  columns={columns}
                  data={ sharedProjectLists?.MyIntrestedProjectsList ? sharedProjectLists?.MyIntrestedProjectsList : []}
                  highlightOnHover={true}
                />
              </div>
            </div>
          </div>
          :
          <Modal show={openInvalidLinkModal} size="md" onClose={() => { setOpenInvalidLinkModal(false); route.push("/login")}} popup>
            <Modal.Header className="z-10" />
            <Modal.Body>
              <div className="text-center pt-12 pb-12">
                <h2 className="mb-3 text-xl font-semibold text-gray-90">
                  Invalid URL
                </h2>
              </div>
            </Modal.Body>
          </Modal>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      } 
    </>
  );
}

export default SharedProjectComponent;