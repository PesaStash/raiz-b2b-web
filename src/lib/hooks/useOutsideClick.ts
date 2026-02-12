import { RefObject, useEffect, useRef } from "react";

export const useOutsideClick = (
  callback: () => void,
  exceptionRef?: RefObject<HTMLElement | null>
) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isOutsideDropdown = ref.current && !ref.current.contains(target);
      const isOnException =
        exceptionRef?.current && exceptionRef.current.contains(target);

      if (isOutsideDropdown && !isOnException) {
        callback();
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [callback, exceptionRef]);

  return ref;
};
