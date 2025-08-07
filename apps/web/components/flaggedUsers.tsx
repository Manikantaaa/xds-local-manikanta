"use client";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authPutWithData } from "@/hooks/fetcher";
import { formatDate } from "@/services/common-methods";
import { Company } from "@/types/user.type";
import { Button, Label, Modal, Textarea, Tooltip } from "flowbite-react";
import Link from "next/link";
import { useState } from "react";
import DataTable from "react-data-table-component";
import ButtonSpinner from "./ui/buttonspinner";
import Breadcrumbs from "./breadcrumb";
import { PATH } from "@/constants/path";
import Spinner from "./spinner";

interface FlaggedUsers {
  createdAt: Date,
  reportedCompany: Company,
  company: Company,
  details: string,
  isReportResolved: boolean;
  id: number;
}

const FlaggedUsers = (props: { flaggedUsers: any, reportsRender: boolean, setReportsRender: (val: boolean) => void }) => {

  const [openModal, setOpenModal] = useState(false);
  const [openDisplayModel, setOpenDisplayModel] = useState(false);
  const [theDescription, setTheDescription] = useState("");
  const [loader, setLoader] = useState(false);
  const [reportId, setReportId] = useState<number>(0);
  const [reportStatus, setReportStatus] = useState<boolean>(false);
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.REPORTS.name,
      path: PATH.REPORTS.path,
    },
    {
      label: "Reported Companies",
      path: "Reported Companies",
    },
  ];

  const flaggedUserColumns = [
    {
      id: "date",
      name: "Date",
      cell: (row: FlaggedUsers) => formatDate(row.createdAt),
      sortable: true,
      sortFunction: (a: FlaggedUsers, b: FlaggedUsers) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime(),
    },
    {
      id: "reportedCompany",
      name: "Reported Company",
      cell: (row: FlaggedUsers) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.reportedCompany?.id}`} passHref>
            {" "}
            {row.reportedCompany?.name}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: FlaggedUsers, b: FlaggedUsers) =>
        a.reportedCompany?.name.localeCompare(b.reportedCompany?.name),
    },
    {
      id: "reportingName",
      name: "Reporting Name",
      cell: (row: FlaggedUsers) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`mailto:${row.company?.user?.email}`} passHref>
            {" "}
            {row.company?.user?.firstName + " " + row.company?.user?.lastName}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: FlaggedUsers, b: FlaggedUsers) =>
        a.company?.name.localeCompare(b.company?.name),
    },
    {
      id: "reportingCompany",
      name: "Reporting Company",
      cell: (row: FlaggedUsers) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.company?.id}`} passHref>
            {" "}
            {row.company?.name}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: FlaggedUsers, b: FlaggedUsers) =>
        a.company?.name.localeCompare(b.company?.name),
    },
    {
      id: "details",
      name: "Details",
      cell: (row: FlaggedUsers) => (
        <div className="link_color">
          <button onClick={(e) => { e.preventDefault(); onClickDescription(row.details) }}>View Details</button>
        </div>
      ),
    },
    {
      id: "actions",
      name: "Actions",
      cell: (row: FlaggedUsers) => (
        <div>
          {row.isReportResolved ?
            <button onClick={() => { setOpenDisplayModel(true); setReportId(row.id); setReportStatus(row.isReportResolved) }}>
              <Tooltip content="Mark as Unresolved">
                {" "}
                <svg
                  className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
              </Tooltip>
            </button>
            :
            <button onClick={() => { setOpenDisplayModel(true); setReportId(row.id); setReportStatus(row.isReportResolved) }}>
              <Tooltip content="Mark as Resolved">
                {" "}
                <svg
                  className={`w-4 h-4 me-2 flex-shrink-0 `}
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                </svg>
              </Tooltip>
            </button>
          }


        </div>
      ),
    }
  ]

  const markAsResolved = (id: number) => {
    setLoader(true);
    authPutWithData(`${getEndpointUrl(ENDPOINTS.updateCompanyReport(id))}`, null)
      .then((result) => {
        if (result) {
          setLoader(false);
          setOpenDisplayModel(false);
          props.setReportsRender(!props.reportsRender)
        }
      }).catch((err) => {
        setLoader(false);
        console.log(err);
        setOpenDisplayModel(false);
      });
  }

  function onClickDescription(description: string) {
    setOpenModal(true);
    setTheDescription(description);
  }

  return (
    <div className="lg:col-span-4 border-l ps-8 most_active">
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left">
          <h1 className="font-bold default_text_color header-font">
            Reported Companies
          </h1>
        </div>
      </div>
      <div className="py-6 datatable_style">
        <DataTable
          columns={flaggedUserColumns}
          data={props.flaggedUsers}
          highlightOnHover
          pagination={true}
          paginationPerPage={10}
          defaultSortFieldId="date" // Specify the default sorted column (e.g., 'name')
          defaultSortAsc={true}
          paginationTotalRows={props.flaggedUsers.length}
          paginationRowsPerPageOptions={[10, 20, 50, 100]}
          paginationComponentOptions={{
            rowsPerPageText: "Records per page:",
            rangeSeparatorText: "out of",
          }}
        />
      </div>
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="modal_header">
          <b>Details</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <div className="mb-2 block">
                <Label
                  htmlFor="comment"
                  className="font-bold text-xs"
                />
              </div>
              <Textarea
                id="comment"
                placeholder=""
                required
                rows={8}
                readOnly
                className="w-full focus:border-blue-500"
                value={theDescription}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px] button_blue"
            onClick={(e) => {
              e.preventDefault();
              setOpenModal(false);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={openDisplayModel}
        onClose={() => { setOpenDisplayModel(false); }}
        size="sm"
      >
        <Modal.Header className="modal_header">
          <b>Are you sure?</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                Are you sure you want to {reportStatus ? 'mark as unresolved' : 'mark as resolved'}
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            className="h-[40px] button_cancel"
            onClick={() => {
              setOpenDisplayModel(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="h-[40px] button_blue"
            disabled={loader}
            onClick={() => markAsResolved(reportId)}
          >
            {loader ? <ButtonSpinner></ButtonSpinner> : 'Yes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default FlaggedUsers;
