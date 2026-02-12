import AuBeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/AuBeneficiaryForm";
import BeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/BeneficiaryForm";
// import CNBeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/CNBeneficiaryForm";
import FrBeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/FrBeneficiaryForm";
// import GbBeneficiaryForm from "@/app/(dashboard)/_components/send/usd/bankTransfer/toGlobal/GbBeneficiaryForm";
import { IUSDSendOptions } from "@/types/misc";
import { FormField, IntCountryType, IntCurrencyCode } from "@/types/services";
import { ComponentType, ReactNode } from "react";
import Image from "next/image";

interface Options {
  title: string;
  subtitle: string;
  icon: ReactNode;
  key: IUSDSendOptions;
}

export interface IBankDetailField {
  name: string;
  label: string;
  pattern?: string;
}

export interface BeneficiaryFormProps {
  fields: FormField[];
  countryCode: string;
  countryName: string;
  bankDetailsFields?: IBankDetailField[];
  banks?: { id: number; code: string; name: string }[];
  reset?: () => void;
}

export interface CountryConfig {
  countryName: string;
  bankDetailsFields: IBankDetailField[];
  banks?: { id: number; code: string; name: string }[];
  formComponent: ComponentType<BeneficiaryFormProps>;
}

export interface IIntCountry {
  name: string;
  value: IntCountryType;
  logo: string;
  currency?: IntCurrencyCode;
}

export const usdSendOptions: Options[] = [
  {
    title: "Send to Raizer",
    subtitle: "Send money to raizers on the app",
    icon: (
      <svg width="30" height="31" viewBox="0 0 30 31" fill="none">
        <path
          opacity="0.35"
          d="M22.5 17.23V4.73001C22.5 3.34876 21.3813 2.23001 20 2.23001H10C8.61875 2.23001 7.5 3.34876 7.5 4.73001V17.23L15 20.98L22.5 17.23Z"
          fill="#B7A4EB"
        />
        <path
          d="M15 17.23C17.7614 17.23 20 15.5511 20 13.48C20 11.4089 17.7614 9.73001 15 9.73001C12.2386 9.73001 10 11.4089 10 13.48C10 15.5511 12.2386 17.23 15 17.23Z"
          fill="#3C2875"
        />
        <path
          d="M15 7.23001C15.6904 7.23001 16.25 6.67037 16.25 5.98001C16.25 5.28966 15.6904 4.73001 15 4.73001C14.3096 4.73001 13.75 5.28966 13.75 5.98001C13.75 6.67037 14.3096 7.23001 15 7.23001Z"
          fill="#3C2875"
        />
        <path
          d="M25.0725 8.69251L22.5 7.14876V17.23L15 20.98L7.5 17.23V7.14876L4.9275 8.69251C3.42125 9.59626 2.5 11.2238 2.5 12.98V23.48C2.5 25.5513 4.17875 27.23 6.25 27.23H23.75C25.8212 27.23 27.5 25.5513 27.5 23.48V12.98C27.5 11.2238 26.5788 9.59626 25.0725 8.69251Z"
          fill="#3C2875"
        />
      </svg>
    ),
    key: "to Raizer",
  },
  {
    title: "US Bank",
    subtitle: "Send to a US bank",
    icon: (
      <Image
        width={30}
        height={30}
        src={"/icons/us-bank.svg"}
        alt="USA banks"
      />
    ),
    key: "usBank",
  },
  {
    title: "International Remittance",
    subtitle: "Send to an International bank",
    icon: (
      <Image
        width={30}
        height={30}
        src={"/icons/glo-bank.svg"}
        alt="International remittance"
      />
    ),
    key: "internationalRemittance",
  },
  // {
  //   title: "Send to Debit Card",
  //   subtitle: "Transfer funds to your debit cards.",
  //   icon: (
  //     <svg
  //       width="30"
  //       height="31"
  //       viewBox="0 0 30 31"
  //       fill="none"
  //       xmlns="http://www.w3.org/2000/svg"
  //     >
  //       <path
  //         opacity="0.35"
  //         d="M23.75 25.98H6.25C4.17875 25.98 2.5 24.3013 2.5 22.23V9.73001C2.5 7.65876 4.17875 5.98001 6.25 5.98001H23.75C25.8212 5.98001 27.5 7.65876 27.5 9.73001V22.23C27.5 24.3013 25.8212 25.98 23.75 25.98Z"
  //         fill="#A033E3"
  //       />
  //       <path
  //         d="M12.5 17.23C12.2675 17.23 7.7325 17.23 7.5 17.23C6.81 17.23 6.25 17.79 6.25 18.48C6.25 19.17 6.81 19.73 7.5 19.73C7.7325 19.73 12.2675 19.73 12.5 19.73C13.19 19.73 13.75 19.17 13.75 18.48C13.75 17.79 13.19 17.23 12.5 17.23Z"
  //         fill="#26264F"
  //       />
  //       <path d="M27.5 10.98H2.5V14.73H27.5V10.98Z" fill="#26264F" />
  //     </svg>
  //   ),
  //   key: "to debit card",
  // },
  // {
  //   title: "Send to Paypal",
  //   subtitle: "Send money via our paypal feature",
  //   icon: (
  //     <svg
  //       width="21"
  //       height="26"
  //       viewBox="0 0 21 26"
  //       fill="none"
  //       xmlns="http://www.w3.org/2000/svg"
  //     >
  //       <g clipPath="url(#clip0_25532_23337)">
  //         <path
  //           d="M17.9117 6.22998C17.9117 9.32665 15.0195 12.98 10.6437 12.98H6.42859L6.22169 14.27L5.23834 20.48H0L3.15132 0.47998H11.6383C14.4961 0.47998 16.7445 2.05387 17.5726 4.24109C17.8115 4.87702 17.9265 5.55183 17.9117 6.22998Z"
  //           fill="#002991"
  //         />
  //         <path
  //           d="M20.9309 11.98C20.6513 13.6585 19.7763 15.184 18.4624 16.2833C17.1486 17.3827 15.4817 17.9841 13.7601 17.98H10.8331L9.61477 25.48H4.40454L5.23833 20.48L6.22224 14.27L6.42859 12.98H10.6437C15.0139 12.98 17.9117 9.32665 17.9117 6.22998C20.0622 7.32665 21.316 9.54276 20.9309 11.98Z"
  //           fill="#60CDFF"
  //         />
  //         <path
  //           d="M17.9118 6.22998C17.01 5.76387 15.9164 5.47998 14.7262 5.47998H7.61952L6.42871 12.98H10.6438C15.014 12.98 17.9118 9.32665 17.9118 6.22998Z"
  //           fill="#008CFF"
  //         />
  //       </g>
  //       <defs>
  //         <clipPath id="clip0_25532_23337">
  //           <rect
  //             width="21"
  //             height="25"
  //             fill="white"
  //             transform="translate(0 0.47998)"
  //           />
  //         </clipPath>
  //       </defs>
  //     </svg>
  //   ),
  //   key: "to paypal",
  // },
  // {
  //   title: "Send to Canada",
  //   subtitle: "Send money via different options",
  //   icon: (
  //     <svg
  //       width="25"
  //       height="26"
  //       viewBox="0 0 25 26"
  //       fill="none"
  //       xmlns="http://www.w3.org/2000/svg"
  //       xmlnsXlink="http://www.w3.org/1999/xlink"
  //     >
  //       <rect
  //         y="0.47998"
  //         width="25"
  //         height="25"
  //         rx="4"
  //         fill="url(#pattern0_25665_9892)"
  //       />
  //       <defs>
  //         <pattern
  //           id="pattern0_25665_9892"
  //           patternContentUnits="objectBoundingBox"
  //           width="1"
  //           height="1"
  //         >
  //           <use xlinkHref="#image0_25665_9892" transform="scale(0.00444444)" />
  //         </pattern>
  //         <image
  //           id="image0_25665_9892"
  //           width="225"
  //           height="225"
  //           preserveAspectRatio="none"
  //           xlinkHref="data:image/png;base64,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"
  //         />
  //       </defs>
  //     </svg>
  //   ),
  //   key: "to canada",
  // },
  // {
  //   title: "Send to Zelle",
  //   subtitle: "Send money via our Zelle feature",
  //   icon: (
  //     <svg
  //       width="32"
  //       height="14"
  //       viewBox="0 0 32 14"
  //       fill="none"
  //       xmlns="http://www.w3.org/2000/svg"
  //     >
  //       <g clipPath="url(#clip0_23941_4141)">
  //         <path
  //           d="M18.8889 11.1342C18.6928 10.8144 18.5752 10.4577 18.5229 10.0395C18.5098 9.97804 18.4837 9.92884 18.4314 9.89194C18.3922 9.86734 18.3399 9.85504 18.3007 9.85504C18.2876 9.85504 18.2745 9.85504 18.2615 9.85504C18.183 9.86734 18.0915 9.87964 18.0131 9.87964C17.7517 9.87964 17.5556 9.84274 17.5556 9.32614V8.83414V1.88464C17.5556 1.77394 17.4641 1.68784 17.3464 1.68784H15.8562C15.7386 1.68784 15.6471 1.77394 15.6471 1.88464V9.48604C15.6471 10.0518 15.6994 10.4823 15.987 10.8759C16.3268 11.3187 17.0066 11.577 17.634 11.577C17.6602 11.577 17.6994 11.577 17.7255 11.577C18.1046 11.577 18.4706 11.5401 18.7713 11.4417C18.8366 11.4171 18.8889 11.3802 18.902 11.3187C18.9281 11.2572 18.9151 11.1957 18.8889 11.1342Z"
  //           fill="#6D1ED4"
  //         />
  //         <path
  //           d="M22.9412 10.8882C22.6667 10.5069 22.5752 10.4454 22.3922 10.0395C22.366 9.99034 22.353 9.92884 22.3007 9.89194C22.2615 9.86734 22.2222 9.85504 22.17 9.85504C22.1569 9.85504 22.1438 9.85504 22.1307 9.85504C22.0523 9.86734 21.9608 9.87964 21.8824 9.87964C21.6209 9.87964 21.4249 9.84274 21.4249 9.32614V8.83414V1.88464C21.4249 1.77394 21.3334 1.68784 21.2157 1.68784H19.7255C19.6079 1.68784 19.5164 1.77394 19.5164 1.88464V9.48604C19.5164 10.0518 19.5686 10.4823 19.8562 10.8759C20.1961 11.3187 20.8758 11.577 21.5033 11.577C21.5294 11.577 21.5686 11.577 21.5948 11.577C21.9739 11.577 22.3399 11.5401 22.6405 11.4417C22.7059 11.4171 22.9281 11.3187 22.9804 11.2695C23.1242 11.1219 22.9673 10.9374 22.9412 10.8882Z"
  //           fill="#6D1ED4"
  //         />
  //         <path
  //           d="M9.37262 7.01372C9.52948 6.21422 10.1831 5.69762 11.1112 5.69762C12.0393 5.69762 12.6667 6.17732 12.8236 7.01372H9.37262ZM11.085 4.18472C9.94778 4.18472 8.99354 4.55372 8.30073 5.26712C7.64713 5.93132 7.29419 6.87842 7.29419 7.91162C7.29419 8.96942 7.64713 9.86732 8.3138 10.5192C9.01968 11.208 10.0262 11.577 11.2288 11.577C12.5229 11.577 13.621 11.1465 14.4707 10.3101C14.5491 10.2363 14.5491 10.0887 14.4576 10.0395C14.3661 9.99032 13.9216 9.70742 13.4772 9.15392C13.4249 9.11702 13.3857 9.10472 13.3334 9.10472C13.2811 9.10472 13.2288 9.12932 13.1896 9.16622C12.6798 9.68282 12.0262 9.89192 11.268 9.89192C10.1439 9.89192 9.45105 9.39992 9.32033 8.42822H14.5229C14.6275 8.42822 14.719 8.35442 14.7321 8.25602C14.7452 8.09612 14.7582 7.92392 14.7582 7.75172C14.7582 6.75542 14.4053 5.84522 13.7779 5.21792C13.1243 4.52912 12.1831 4.18472 11.085 4.18472Z"
  //           fill="#6D1ED4"
  //         />
  //         <path
  //           d="M24.8758 7.01372C25.0327 6.21422 25.6863 5.69762 26.6144 5.69762C27.5425 5.69762 28.1699 6.17732 28.3268 7.01372H24.8758ZM26.5882 4.18472C25.451 4.18472 24.4967 4.55372 23.8039 5.26712C23.1503 5.93132 22.7974 6.87842 22.7974 7.91162C22.7974 8.96942 23.1503 9.86732 23.817 10.5192C24.5229 11.208 25.5294 11.577 26.732 11.577C28.0261 11.577 29.1242 11.1465 29.9738 10.3101C30.0523 10.2363 30.0523 10.0887 29.9608 10.0395C29.8693 9.99032 29.4248 9.70742 28.9804 9.15392C28.9281 9.11702 28.8889 9.10472 28.8366 9.10472C28.7843 9.10472 28.732 9.12932 28.6928 9.16622C28.183 9.68282 27.5294 9.89192 26.7712 9.89192C25.647 9.89192 24.9542 9.39992 24.8235 8.42822H30.0261C30.1307 8.42822 30.2222 8.35442 30.2353 8.25602C30.2483 8.09612 30.2614 7.92392 30.2614 7.75172C30.2614 6.75542 29.9085 5.84522 29.281 5.21792C28.6144 4.52912 27.6863 4.18472 26.5882 4.18472Z"
  //           fill="#6D1ED4"
  //         />
  //         <path
  //           d="M7.6732 11.0851C7.66013 11.0728 7.66013 11.0728 7.64706 11.0605L7.63399 11.0482C7.28105 10.7038 7.00654 10.2979 6.79739 9.8428C6.77124 9.769 6.69281 9.7198 6.61438 9.7198H6.44444H5.68628H2.69281L7.47712 3.9511C7.50327 3.9142 7.51634 3.8773 7.51634 3.8281V2.7088C7.51634 2.5981 7.42484 2.512 7.30719 2.512H5.0719H4.98039H4.71895V0.925304C4.71895 0.876104 4.66667 0.826904 4.61438 0.826904H4.57516H4.53595H3.12418H3.0719H3.03268C2.98039 0.826904 2.9281 0.876104 2.9281 0.925304V2.5366H2.56209H2.48366H0.405229C0.287582 2.5366 0.196078 2.6227 0.196078 2.7334V4.0249C0.196078 4.1356 0.287582 4.2217 0.405229 4.2217H4.79739L0.0392157 9.9289C0.0130719 9.9658 0 10.015 0 10.0519V11.2204C0 11.3311 0.0915033 11.4172 0.20915 11.4172H2.94118V13.0285C2.94118 13.0777 2.99346 13.1269 3.04575 13.1269H3.08497H3.13726H4.54902H4.57516H4.62745C4.67974 13.1269 4.73203 13.0777 4.73203 13.0285V11.4172H5.88235H7.35948H7.52941C7.60784 11.4172 7.68628 11.368 7.71242 11.2942C7.75163 11.2327 7.72549 11.1466 7.6732 11.0851Z"
  //           fill="#6D1ED4"
  //         />
  //         <path
  //           d="M30.9282 3.31119H31.0981C31.1373 3.31119 31.1635 3.31119 31.2027 3.31119C31.2419 3.31119 31.268 3.29889 31.2942 3.28659C31.3203 3.27429 31.3334 3.26199 31.3595 3.23739C31.3726 3.21279 31.3857 3.18819 31.3857 3.15129C31.3857 3.11439 31.3726 3.08979 31.3595 3.07749C31.3465 3.05289 31.3334 3.04059 31.3072 3.02829C31.2811 3.01599 31.255 3.01599 31.2288 3.00369C31.2027 3.00369 31.1765 3.00369 31.1504 3.00369H30.9282V3.31119ZM30.7974 2.88069H31.1635C31.2811 2.88069 31.3726 2.90529 31.438 2.94219C31.4903 2.99139 31.5295 3.05289 31.5295 3.15129C31.5295 3.23739 31.5033 3.29889 31.451 3.33579C31.3988 3.37269 31.3334 3.39729 31.255 3.40959L31.5425 3.82779H31.3857L31.1112 3.42189H30.9282V3.82779H30.7844V2.88069H30.7974ZM30.3791 3.36039C30.3791 3.45879 30.3922 3.54489 30.4314 3.63099C30.4706 3.71709 30.5229 3.79089 30.5883 3.85239C30.6537 3.91389 30.7321 3.96309 30.8236 3.99999C30.9151 4.03689 31.0066 4.04919 31.1112 4.04919C31.2157 4.04919 31.3072 4.03689 31.3987 3.99999C31.4903 3.96309 31.5687 3.91389 31.634 3.85239C31.6994 3.79089 31.7517 3.71709 31.7909 3.63099C31.8301 3.54489 31.8432 3.44649 31.8432 3.34809C31.8432 3.24969 31.817 3.15129 31.7909 3.07749C31.7517 2.99139 31.6994 2.91759 31.634 2.85609C31.5687 2.79459 31.4903 2.74539 31.3987 2.70849C31.3072 2.67159 31.2157 2.65929 31.1112 2.65929C31.0066 2.65929 30.9151 2.68389 30.8236 2.70849C30.7321 2.74539 30.6537 2.79459 30.5883 2.85609C30.5229 2.91759 30.4706 2.99139 30.4314 3.07749C30.4053 3.16359 30.3791 3.26199 30.3791 3.36039ZM30.2354 3.36039C30.2354 3.23739 30.2615 3.13899 30.3007 3.02829C30.353 2.92989 30.4053 2.84379 30.4968 2.76999C30.5752 2.69619 30.6667 2.63469 30.7713 2.59779C30.8759 2.56089 30.9935 2.53629 31.1112 2.53629C31.2288 2.53629 31.3465 2.56089 31.451 2.59779C31.5556 2.63469 31.6471 2.69619 31.7255 2.76999C31.804 2.84379 31.8693 2.92989 31.9216 3.02829C31.9739 3.12669 31.987 3.23739 31.987 3.34809C31.987 3.47109 31.9608 3.56949 31.9216 3.68019C31.8693 3.77859 31.817 3.86469 31.7255 3.93849C31.6471 4.01229 31.5556 4.07379 31.451 4.11069C31.3465 4.14759 31.2288 4.17219 31.1112 4.17219C30.9935 4.17219 30.8759 4.14759 30.7713 4.11069C30.6667 4.07379 30.5752 4.01229 30.4968 3.93849C30.4184 3.86469 30.353 3.77859 30.3007 3.68019C30.2615 3.58179 30.2354 3.47109 30.2354 3.36039Z"
  //           fill="#6D1ED4"
  //         />
  //       </g>
  //       <defs>
  //         <clipPath id="clip0_23941_4141">
  //           <rect
  //             width="32"
  //             height="12.3"
  //             fill="white"
  //             transform="translate(0 0.830017)"
  //           />
  //         </clipPath>
  //       </defs>
  //     </svg>
  //   ),
  //   key: "to zelle",
  // },
  // {
  //   title: "Send to CashApp",
  //   subtitle: "Send money via our cashapp feature",
  //   icon: (
  //     <svg
  //       width="30"
  //       height="31"
  //       viewBox="0 0 30 31"
  //       fill="none"
  //       xmlns="http://www.w3.org/2000/svg"
  //     >
  //       <rect
  //         y="0.97998"
  //         width="30"
  //         height="30"
  //         rx="6"
  //         fill="url(#pattern0_23941_4161)"
  //       />
  //       <defs>
  //         <pattern
  //           id="pattern0_23941_4161"
  //           patternContentUnits="objectBoundingBox"
  //           width="1"
  //           height="1"
  //         >
  //           <use xlinkHref="#image0_23941_4161" transform="scale(0.0025)" />
  //         </pattern>
  //         <image
  //           id="image0_23941_4161"
  //           width="400"
  //           height="400"
  //           xlinkHref="data:image/jpeg;base64,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JUrK4tPjY8xD2D97TgwIblKEYTOk0uAZzrQhwvI0ENLB93pKVSuPj/WvjaJQ13M3bF5xCxq3AAc96g/zamALuOtN1eQHvwuaTgvMw+dsIBJWIf2rVPsHn+tMlIyThCeRKKYLBfk7mDczi/ephD6x3/tJMrqDg639bzNaFoKvJukEvU2vlipAeYbnUpngrpN6tcEEyfh3RSJo2PWrKuhhwVhnZuKoboqt3oRJGd2jKnc51dR5j4MwDvU/48qhla2NI3Lm3WII4tGgNiMnByZFmoqOHm7Peru9Kz1o2QTluAC/JyrLhNpJqudqYCnwzP1RCTjtAjhkujGW6bRhc3jxV5m5Ctat6a8sAw/C25lb5m0PPHjjAewKBXGZivw5PkOY6lKCdLl13UY4I6uu1q2jxoLaz0FER65l2EIEkqZ8pxeVSCh88pEYbbIMANDG4kP0KAsCANqTlj5j99fGxa1jtuO6VFZk+UvesiusVmx0Cn55Cse1XNrWL7eEUKdmZjxpyAMTJNKulEXPBBIsBjV772OrXx74b4Sg4WHoeulGkEczfvA3CtTaYH04cCgGqXT/ACo5/Sd6gDDmO7WMaOfp/GugkwD98FdnojanF0CSHawYOrXqtUmsYyM1YTzT4/2vaQSseDxoMWGy0Sjtm/L9zwyexeb2SawCmSxd4XypVRZRomyqmITmvDWaJ4mJ22ZznGX1GBgHl/1V/9oADAMBAAIAAwAAABDzzzzzzx3zzzzzzzzyzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzPrHrzzzzzzzzzzzzzzzzzzzzfDzxHzzzzzzzzzzzzzzzzzzYWRzzzh3/zzzzzzzzzzzzzzzO3zzzzzzxN/wA8888888888888988g/Fi186688888888888888K88N8888US888888888888888m88ZH08888888888888888888088883yT888888888888888888pd8888/N888888888888888888rKfZ88uS88888888888888888888wp88/88888888888888Z5a888858898888888888888gW8obpbwi8wW8888888888888hzR888888iR8888888888888888g088oZEi888888888888888888z88t988888888888888888888XDDE8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888//EACoRAQABAQUHBQADAAAAAAAAAAERACExQVFhEEBxkaHB0SAwgbHhYPDx/9oACAEDAQE/EPXL/KVI3rFBZTFVt61peb5qJZJvbdGd1VgUosBmUYstv26qA79tztxs3A4tDC6Vx5aMgjgFRtGyWWkNHrfdyx+Kdgh3CwTzcjOjQQHXV9hNDJTvnR12nviyLX0LPudscs2bj9pibHACn5F0aRgB5PSzpTYXRezc7HqQHNcih0jJkFh74CP6bdpJelfhu6egUuqwulzMJprVzgLjA3Aj4yHt02zCw3D6cymF4wt6X0ih3QVWL3RwaEEnouEXO55lOTJ0fP5U3617OO5gGm5nk0qBcf289LwAc6VvTmaPnczTFmMVAiOdz4qHDSNnW6hBJtLCUQlMO4bODduoS2yNp+VdcOGTibRBx+i+/dIF7noeasCjutUdGZpepHpHOMpws2kV/o+87MKZ+LY+aFBAuDZHOPrg0hYGj5PFJwA8HzFKQg4p2mjNiYF3y40AAIDYzeAtaTDVs4XHvBXhLmgxdXB8NCCT1gJaEL6mehpuMDoBtPjEp2diMTntC00PYuKUIk3pYc3tNTjdE7uO5xjwL277XEb08v8AaVb91cSAhi/jWhyftaHJ+0IGgQTfx/mP/8QAKREBAAECBAQFBQAAAAAAAAAAAREAITFAQVEQIDChYXGBkbFgwdHh8P/aAAgBAgEBPxD6wYA1oMMmv4zRAwmVRhSGkTOG3GeN0Pvk48auFztREAcmyGtDHekRhyAM/wAUfO3QKnDdSLFOuLLF+DiDhnsKf0eVBXnWBx7VjyHZ4PXpFWvXMeXx8Y3LECHevYIbZAfAW4iS2d6ucSblRGOUHU3blBqUv6D+agRDk4C93FShk5YAyU7j/DJzZhqyn4NWUg7PI6CzSbDlV7MmzhQHU4ibw6+Egd/KrLQ1HOHlvvVnjLsDrYZFGggOBcM0y/vUPAH1pGIHrTEs+GlABBwAKwKXeesjEhKJLbvo/joLF2iubau+RswybNEmhfbkwMPWrZeq2TBsZO9bE/bjAur8VOVFkSNeb7fuvN9v3QmhAYfWP//EACsQAQACAQMCBQUAAwEBAAAAAAEAESExQVFhcSBQgZGhEDBAscHR8PGA4f/aAAgBAQABPxD73/dT5QH8RVbVXr/6FGpW8pmwsD1bHzD6qYYKdPYrEYAtpqKalbJx5Xyj1FhRyXmBtQADt9MzMF1iqYvrxq3xflN/R6Ey5JelGPlJt4GBoVL3rykCEvDOF/SF2JzY/cKG2vKLf6Hh3lf2C9KLflfJS9oQNu4jB3dCFBHVD3Fgeww5QSl7vXOD0IAFBRQQDQPaUceE2gaeYnt+Ku86OH3j86pFXzAtlpNfIXTtQLVhWL0lTXX/AD3mhRoQE9cfSnxjnSVZ3id9KNQ7OpMBDVpV/po+8eulLAezHH57rUN+AS1OgQzh2XkHB/maPvra4Uau2/yKVMo+DoNn4icRVK/NNHnaMA8gGnPdsSiBW34De9BWI7JNYlrLsVjtkqafmhcbNPBu+0KqWRsB4SLHCWXvsDMrEBqsE5AF/UTO1xb3p+octGB/tpvCq67AP78QUPQbUPRgjoj2h9XGCbZ03iVhKVgqD4PvNH80SxEDwtHxAc14R0wgyDujpt1jAotdrPmXxiXHeZ2hJQaI0kYdXCt0dNR+uksjRlQb6tP9YgiWN/T9cwGKlOsHB/qo7Yq0bVmTXH5p0f6NR+0Cj08LoNa8Yt+WOh9hayLA0jEXqqV/1HXWFmigUTm4TMlewcX/AKItRVpbV/PoVVeX2jfwlZVjgYk9qYfZrd0mowFjuBrDdDLZr+feTHp0A/qHh2GRTRaB2SXDnrhX6MK4uCmsTycmGTU98n8PWGnh2jYiFImI6irOFp66faoqLka7XXVMMSmgnp5QygZzkYbhDp7h7wj4kHUj5/SDoL4GSboiPYwZDuQ+EXGf9TT1qGukxWC538jc6ektiCMr6A/ZxBXqBLEdEfsuYoAJKt04n6mjMENnSXu+pemag0IlbPkt0daEz1Dk6QqbWuz/AOPSGk0fZSzJZGEsU1Do376xE6+couRmmfI3LiWGDdx3TnrDGCY1F6f5SroObN/shjSOk0F7u7sHZjULKowOHh6R8k0ckNAnPwRrq3EtG+E5nvqepCyLmxZiekInhcSiAC687SRTrzuSV5HvmLjBN85iB8sSh9IqUAK0/Z/Rgg1Y0y9NH6ekAuWiruX4cYm2JWJNFwMvaz0Jy8pCp3VrfVjeGbwLbfi93fHWIYQO5OfCoi2peKZt5Sq6YiEexbNanFeniNPR/XNz83SWiFl/ULNzwlMve6jWhedBcjO0y6P2Ucun0lf8hx4WU1i98Tj83EH1U7hhwr0m7xf0bQI2kZ0NkmzLrisHI6Nu+kwvH2bS6F56n6hz4NoVxQU5Lt+B/M3ztDnpqjG4v+N51GreqYYen1YCQpHJEGD5a2vXZ3PZj3UgY5xk9QiAFGomSXMRDmaQ04uAC1gA9VCg4DZ1fSGXYBgJzD6VDWtodlUge0dwj+flubeJmYXXnHHzf0Tj6hWGvoglIMYtTLY3bvcGbIbt/haP+AL+QNdWpSrK4Y+BKINrO2HVgGhiesxXgZEHIbrsHdl7gF77djSbL+W62TQ0BO6RxMbMlMnU5JdXCJ93b6IDAtLVEzB0A0/k4/NGsMp1I4PLekZo5saO23fEIG1iWV3l/dYOrrGgJtIJ4ejp+01xt5CURfeQ9t12gjSYp5vT/KABZgSPtN68WPo43mYAVAdYKwcCXT10EdNW26us8ur8eRt7zG+IT6Ya3c0g/LcxNjDXx4bjtdnCFWH0yAjDYVfs6fMyGOKXwh1BP/hGvrHK9IfPkqTWcNuhl/kPAqF4mOfQKihfyhVbfKnSCpT3w4+K8Lh0pXoFx8creqr5XnIj+VbbAEfbwhTUO84GPmGUFx5WLoThx/F7rHr4YQgIXhRUdgME7/8Aqn//2Q=="
  //         />
  //       </defs>
  //     </svg>
  //   ),
  //   key: "to cashapp",
  // },
];

export const IntCountries: IIntCountry[] = [
  { name: "Ghana", value: "GH", logo: "/icons/flag-gh.png" },
  { name: "Australia", value: "AU", logo: "/icons/flag-au.png" },
  { name: "Kenya", value: "KE", logo: "/icons/flag-ke.png" },
  { name: "Uganda", value: "UG", logo: "/icons/flag-ug.png" },
  { name: "Nigeria", value: "NG", logo: "/icons/flag-ng.png" },
  { name: "Tanzania", value: "TZ", logo: "/icons/flag-tz.png" },
  { name: "Zambia", value: "ZM", logo: "/icons/flag-zm.png" },
  { name: "Malawi", value: "MW", logo: "/icons/flag-mw.png" },
  { name: "United Kingdom", value: "GB", logo: "/icons/flag-gb.png" },
  { name: "Burkina Faso", value: "BF", logo: "/icons/flag-bf.png" },
  { name: "Cameroon", value: "CM", logo: "/icons/flag-cm.png" },
  { name: "Senegal", value: "SN", logo: "/icons/flag-sn.png" },
  { name: "Rwanda", value: "RW", logo: "/icons/flag-rw.png" },
  { name: "Guinea", value: "GN", logo: "/icons/flag-gn.png" },
  { name: "Mali", value: "ML", logo: "/icons/flag-ml.png" },
  { name: "Togo", value: "TG", logo: "/icons/flag-tg.png" },
  { name: "United Arab Emirates", value: "AE", logo: "/icons/flag-ae.png" },
  { name: "France", value: "FR", logo: "/icons/flag-fr.png" },
  { name: "Ivory Coast", value: "CI", logo: "/icons/flag-ci.png" },
  { name: "Benin", value: "BJ", logo: "/icons/flag-bj.png" },
  {
    name: "Democratic Republic of Congo",
    value: "CD",
    logo: "/icons/flag-cd.png",
  },
  { name: "Austria", value: "AT", logo: "/icons/flag-at.png" },
  { name: "Andorra", value: "AD", logo: "/icons/flag-ad.png" },
  { name: "Belgium", value: "BE", logo: "/icons/flag-be.png" },
  { name: "Bulgaria", value: "BG", logo: "/icons/flag-bg.png" },
  { name: "Czech Republic", value: "CZ", logo: "/icons/flag-cz.png" },
  { name: "Germany", value: "DE", logo: "/icons/flag-de.png" },
  { name: "Denmark", value: "DK", logo: "/icons/flag-dk.png" },
  { name: "Estonia", value: "EE", logo: "/icons/flag-ee.png" },
  { name: "Spain", value: "ES", logo: "/icons/flag-es.png" },
  { name: "Finland", value: "FI", logo: "/icons/flag-fi.png" },
  { name: "Greece", value: "GR", logo: "/icons/flag-gr.png" },
  { name: "Croatia", value: "HR", logo: "/icons/flag-hr.png" },
  { name: "Hungary", value: "HU", logo: "/icons/flag-hu.png" },
  { name: "Ireland", value: "IE", logo: "/icons/flag-ie.png" },
  { name: "Iceland", value: "IS", logo: "/icons/flag-is.png" },
  { name: "Italy", value: "IT", logo: "/icons/flag-it.png" },
  { name: "Latvia", value: "LV", logo: "/icons/flag-lv.png" },
  { name: "Lithuania", value: "LT", logo: "/icons/flag-lt.png" },
  { name: "Liechtenstein", value: "LI", logo: "/icons/flag-li.png" },
  { name: "Luxembourg", value: "LU", logo: "/icons/flag-lu.png" },
  { name: "Monaco", value: "MC", logo: "/icons/flag-mc.png" },
  { name: "Malta", value: "MT", logo: "/icons/flag-mt.png" },
  { name: "Netherlands", value: "NL", logo: "/icons/flag-nl.png" },
  { name: "Norway", value: "NO", logo: "/icons/flag-no.png" },
  { name: "Poland", value: "PL", logo: "/icons/flag-pl.png" },
  { name: "Portugal", value: "PT", logo: "/icons/flag-pt.png" },
  { name: "Romania", value: "RO", logo: "/icons/flag-ro.png" },
  { name: "Slovakia", value: "SK", logo: "/icons/flag-sk.png" },
  { name: "Slovenia", value: "SI", logo: "/icons/flag-si.png" },
  { name: "Sweden", value: "SE", logo: "/icons/flag-se.png" },
  { name: "Singapore", value: "SG", logo: "/icons/flag-sg.png" },
  { name: "San Marino", value: "SM", logo: "/icons/flag-sm.png" },
  { name: "Vatican City", value: "VA", logo: "/icons/flag-va.png" },
  { name: "China", value: "CN", logo: "/icons/flag-cn.png" },
];

export const GlobalCountryConfig: Record<string, CountryConfig> = {
  AE: {
    countryName: "United Arab Emirates",
    bankDetailsFields: [
      { name: "bank_code", label: "Bank" },
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{23}$",
      },
    ],
    banks: [],
    formComponent: BeneficiaryForm,
  },
  AD: {
    countryName: "Andorra",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  AT: {
    countryName: "Austria",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  AU: {
    countryName: "Australia",
    bankDetailsFields: [
      { name: "bank_code", label: "Bank Code" },
      {
        name: "BSB_number",
        label: "BSB Number",
        pattern: "^[0-9]{6}$",
      },
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[0-9]{6,9}$",
      },
    ],
    banks: [],
    formComponent: AuBeneficiaryForm,
  },
  FR: {
    countryName: "France",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: FrBeneficiaryForm,
  },
  BE: {
    countryName: "Belgium",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{16}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  BG: {
    countryName: "Bulgaria",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  CZ: {
    countryName: "Czech Republic",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  DE: {
    countryName: "Germany",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  DK: {
    countryName: "Denmark",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{18}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  EE: {
    countryName: "Estonia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  ES: {
    countryName: "Spain",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  FI: {
    countryName: "Finland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{18}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  GR: {
    countryName: "Greece",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  HR: {
    countryName: "Croatia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{21}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  HU: {
    countryName: "Hungary",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{28}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  IE: {
    countryName: "Ireland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  IS: {
    countryName: "Iceland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{26}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  IT: {
    countryName: "Italy",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LV: {
    countryName: "Latvia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{21}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LT: {
    countryName: "Lithuania",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LI: {
    countryName: "Liechtenstein",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{21}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  LU: {
    countryName: "Luxembourg",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{20}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  MC: {
    countryName: "Monaco",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  MT: {
    countryName: "Malta",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{31}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  NL: {
    countryName: "Netherlands",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{18}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  NO: {
    countryName: "Norway",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{15}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  PL: {
    countryName: "Poland",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{28}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  PT: {
    countryName: "Portugal",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{25}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  RO: {
    countryName: "Romania",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SK: {
    countryName: "Slovakia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SI: {
    countryName: "Slovenia",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{19}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SE: {
    countryName: "Sweden",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{24}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  SG: {
    countryName: "Singapore",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[0-9]{7,16}$",
      },
      {
        name: "bank_code",
        label: "Bank",
      },
    ],
    banks: [],
    formComponent: BeneficiaryForm,
  },
  SM: {
    countryName: "San Marino",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{27}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  VA: {
    countryName: "Vatican City",
    bankDetailsFields: [
      {
        name: "account_number",
        label: "Account Number",
        pattern: "^[A-Za-z0-9]{22}$",
      },
    ],
    formComponent: BeneficiaryForm,
  },
  // CN: {
  //   countryName: "China",
  //   bankDetailsFields: [],
  //   formComponent: CNBeneficiaryForm,
  // },
};

export const GuestCurrencies: IIntCountry[] = [
  {
    name: "Nigeria (NGN)",
    value: "NG",
    logo: "/icons/flag-ng.png",
    currency: "NGN",
  },
  {
    name: "Ghana (GHS)",
    value: "GH",
    logo: "/icons/flag-gh.png",
    currency: "GHS",
  },
];
