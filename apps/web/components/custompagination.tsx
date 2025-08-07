import React from "react";

interface PaginationProps {
  page: number;
  pages: number;
  pageSize: number;
  totalrecords: number;
  perPageRecords: number;
  onClick: (pageNumber: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  pages,
  pageSize,
  totalrecords,
  perPageRecords,
  onClick,
}) => {
  const pageNumbers: number[] = [];

  // Calculate the starting page for the current range
  const startPage = Math.max(1, page - 1);

  // Calculate the ending page for the current range
  const endPage = Math.min(pages, startPage + 3);

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  return (
    <div className="py-6 flex justify-between">
      <div>
        {
          <>
            {/* <span className={` rounded-sm  py-2 px-2 mr-2`}>
            Page {page} of {pages}
          </span> */}
            <span className={` rounded-sm  py-2 px-2 mr-2 text-sm`}>
              Showing {(+page - 1) * +pageSize + 1} to{" "}
              {+perPageRecords + (page - 1) * +pageSize} of {totalrecords}{" "}
              entries
            </span>
          </>
        }
      </div>
      <div className="pagination_numbers">
        {pages > 4 ? (
          <button
            className="bg-gray-500 rounded-sm text-white arrow_left_r"
            onClick={() => onClick(1)}
            disabled={page === 1}
          >
            <svg
              className="w-6 h-6 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m17 16-4-4 4-4m-6 8-4-4 4-4"
              />
            </svg>
          </button>
        ) : (
          ""
        )}
        {pages > 1 ? (
          <button
            className="bg-gray-500 rounded-sm text-white arrow_left_r"
            onClick={() => onClick(page - 1)}
            disabled={page === 1}
          >
            <svg
              className="w-6 h-6 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m15 19-7-7 7-7"
              />
            </svg>
          </button>
        ) : (
          ""
        )}
        {pages > 1
          ? pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                className={`${
                  pageNumber === page ? "bg-blue-300" : "bg-gray-500"
                } rounded-sm text-white number_box`}
                onClick={() => onClick(pageNumber)}
              >
                {pageNumber}
              </button>
            ))
          : ""}

        {pages > 1 ? (
          <button
            className="bg-gray-500 rounded-sm text-white arrow_left_r"
            onClick={() => onClick(page + 1)}
            disabled={page === pages}
          >
            <svg
              className="w-6 h-6 text-white"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m9 5 7 7-7 7"
              />
            </svg>
          </button>
        ) : (
          ""
        )}
        {pages > 4 ? (
          <button
            className="bg-gray-500 rounded-sm text-white arrow_left_r"
            onClick={() => onClick(pages)}
            disabled={page === pages}
          >
            <svg
              className="w-6 h-6 "
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m7 16 4-4-4-4m6 8 4-4-4-4"
              />
            </svg>
          </button>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default Pagination;
