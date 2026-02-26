import Image from "next/image";
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getPageNumbers = (current: number, total: number) => {
  const pages = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", total);
    } else if (current >= total - 3) {
      pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
  }
  return pages;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = getPageNumbers(currentPage, totalPages);
  return (
    <nav className="flex items-center justify-between w-full px-4 py-6 select-none">
      <button
        className="flex items-center gap-2 text-raiz-gray-700 text-sm disabled:font-normal font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.97502 4.94165L2.91669 9.99998L7.97502 15.0583"
            stroke="#3C2875"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.0833 10H3.05835"
            stroke="#3C2875"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Previous
      </button>
      <div className="flex items-center gap-4">
        {pages.map((page, idx) =>
          typeof page === "number" ? (
            <button
              key={`page-${page}-${idx}`}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-[13px]  transition-colors ${
                page === currentPage
                  ? "bg-[#F7F7F8] text-raiz-gray-950 font-bold"
                  : "text-raiz-gray-700 hover:bg-raiz-gray-100"
              }`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`} className="px-2 text-raiz-gray-700">
              ...
            </span>
          ),
        )}
      </div>
      <button
        className="flex items-center gap-2 text-raiz-gray-700 text-sm disabled:font-normal font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next{" "}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.025 15.0583L17.0834 10L12.025 4.94168"
            stroke="#3C2875"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2.91665 10L16.9417 10"
            stroke="#3C2875"
            strokeWidth="1.5"
            strokeMiterlimit="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </nav>
  );
};

export default Pagination;
