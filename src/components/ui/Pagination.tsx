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
        className="flex items-center gap-2 text-[#3C2464] text-base font-medium disabled:opacity-40"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <span className="text-xl">&#8592;</span> Previous
      </button>
      <div className="flex items-center gap-4">
        {pages.map((page, idx) =>
          typeof page === "number" ? (
            <button
              key={`page-${page}-${idx}`}
              className={`w-10 h-10 flex items-center justify-center rounded-lg text-base font-medium transition-colors ${
                page === currentPage
                  ? "bg-[#F7F7F8] text-[#3C2464] font-bold"
                  : "text-[#3C2464] hover:bg-[#F7F7F8]"
              }`}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ) : (
            <span key={`ellipsis-${idx}`} className="px-2 text-[#3C2464]">
              ...
            </span>
          )
        )}
      </div>
      <button
        className="flex items-center gap-2 text-[#3C2464] text-base font-medium disabled:opacity-40"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next <span className="text-xl">&#8594;</span>
      </button>
    </nav>
  );
};

export default Pagination;
