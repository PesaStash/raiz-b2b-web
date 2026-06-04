"use client";

type Props = {
  title: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
};

const MobileSheetHeader = ({ title, onBack, rightSlot }: Props) => {
  return (
    <header className="grid grid-cols-[40px_1fr_40px] items-center gap-2 mb-4 shrink-0">
      <button
        type="button"
        onClick={onBack}
        className="size-10 flex items-center justify-center rounded-xl bg-raiz-gray-50 border border-raiz-gray-100 active:scale-95 transition-transform"
        aria-label="Go back"
      >
        <svg width="18" height="18" viewBox="0 0 19 19" fill="none" aria-hidden>
          <path
            d="M18.48 8.43332V10.7667H4.48L10.8967 17.1833L9.24 18.84L0 9.59999L9.24 0.359985L10.8967 2.01665L4.48 8.43332H18.48Z"
            fill="#19151E"
          />
        </svg>
      </button>
      <h1 className="text-center text-base font-bold text-raiz-gray-950 truncate">
        {title}
      </h1>
      <div className="flex justify-end">{rightSlot}</div>
    </header>
  );
};

export default MobileSheetHeader;
