"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GetActivityStats } from "@/services/transactions";
import { useUser } from "@/lib/hooks/useUser";
import Skeleton from "react-loading-skeleton";
import { findWalletByCurrency, getCurrencySymbol } from "@/utils/helpers";
import { useCurrencyStore } from "@/store/useCurrencyStore";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const ActivityTypesChart = () => {
  const { user } = useUser();
  const NGNAcct = findWalletByCurrency(user, "NGN");
  const USDAcct = findWalletByCurrency(user, "USD");
  const { selectedCurrency } = useCurrencyStore();
  const [numberOfDays, setNumberOfDays] = useState(30);

  const getCurrentWallet = () => {
    if (selectedCurrency.name === "NGN") {
      return NGNAcct;
    } else if (selectedCurrency.name === "USD") {
      return USDAcct;
    }
  };

  const currentWallet = getCurrentWallet();

  const { data, isLoading } = useQuery({
    queryKey: ["activity-stats", currentWallet?.wallet_id],
    queryFn: () => GetActivityStats(currentWallet?.wallet_id || ""),
    enabled: !!currentWallet?.wallet_id,
  });

  // Show skeleton while loading
  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-white rounded-lg p-6">
        <Skeleton height={250} />
      </div>
    );
  }

  // Extract month labels from activity data
  const labels = data?.activity?.map((item) => {
    const month = item.month.split(" ")[0];
    return month;
  }) || [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Top Up",
        data: data?.activity?.map((item) => item.top_up) || [],
        backgroundColor: "#B8D9EC",
        borderRadius: 4,
      },
      {
        label: "Send",
        data: data?.activity?.map((item) => item.transfer) || [],
        backgroundColor: "#4A9AC7",
        borderRadius: 4,
      },
      {
        label: "Swap",
        data: data?.activity?.map((item) => item.swap) || [],
        backgroundColor: "#0F5B82",
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          color: "#6B7280",
          font: {
            size: 14,
            weight: 400,
            family: "Inter",
          },
          padding: 12,
          boxWidth: 8,
          boxHeight: 8,
          generateLabels: (chart) => {
            const { data } = chart;
            // Reverse order to match design: Top Up, Send, Swap
            const customColors = ["#B8D9EC", "#4A9AC7", "#0F5B82"];
            const labels = ["Top Up", "Send", "Swap"];

            return labels.map((label, i) => ({
              text: label,
              fillStyle: customColors[i],
              strokeStyle: customColors[i],
              lineWidth: 0,
              pointStyle: "circle",
              hidden: false,
              index: i,
            }));
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "#1F2937",
        titleColor: "#F9FAFB",
        bodyColor: "#F9FAFB",
        borderColor: "#374151",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        callbacks: {
          label: (ctx: TooltipItem<"bar">) =>
            `${ctx.dataset.label}: ${getCurrencySymbol(
              currentWallet?.wallet_type?.currency || "",
            )}${Number(ctx.raw).toLocaleString()}`,
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: false,
        },
        ticks: {
          color: "#9CA3AF",
          font: {
            size: 12,
            weight: 400,
          },
        },
        grid: {
          display: false,
          // drawBorder: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked: true,
        display: false,
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
    },
  };

  const periodOptions = [
    { label: "Last 7 days", value: 7 },
    { label: "Last 30 days", value: 30 },
    { label: "Last 90 days", value: 90 },
    { label: "Last 365 days", value: 365 },
  ];

  return (
    <div className="bg-white rounded-lg">
      {/* Header with dropdown */}
      <div className="flex items-center justify-between -mb-[35px] px-4">
        <div className="relative">
          <select
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(Number(e.target.value))}
            className="appearance-none bg-transparent text-raiz-gray-600 text-[13px] font-brSonoma font-medium pr-8 pl-0 py-1 cursor-pointer focus:outline-none"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="#9CA3AF"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[300px] ">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ActivityTypesChart;

// "use client";

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
//   ChartOptions,
//   TooltipItem,
// } from "chart.js";
// import { Bar } from "react-chartjs-2";
// import React, { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { GetActivityStats } from "@/services/transactions";
// import { useUser } from "@/lib/hooks/useUser";
// import Skeleton from "react-loading-skeleton";
// import { findWalletByCurrency, getCurrencySymbol } from "@/utils/helpers";
// import { useCurrencyStore } from "@/store/useCurrencyStore";
// import dayjs from "dayjs";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// );

// const ActivityTypesChart = () => {
//   const { user } = useUser();
//   const NGNAcct = findWalletByCurrency(user, "NGN");
//   const USDAcct = findWalletByCurrency(user, "USD");
//   const { selectedCurrency } = useCurrencyStore();
//   const [numberOfDays, setNumberOfDays] = useState(30);

//   const getCurrentWallet = () => {
//     if (selectedCurrency.name === "NGN") {
//       return NGNAcct;
//     } else if (selectedCurrency.name === "USD") {
//       return USDAcct;
//     }
//   };

//   const currentWallet = getCurrentWallet();

//   const { data, isLoading } = useQuery({
//     queryKey: ["activity-stats", currentWallet?.wallet_id, numberOfDays],
//     queryFn: () => GetActivityStats(currentWallet?.wallet_id || "", numberOfDays),
//     enabled: !!currentWallet?.wallet_id,
//   });

//   // Show skeleton while loading
//   if (isLoading) {
//     return (
//       <div className="w-full h-[300px] bg-white rounded-lg p-6">
//         <Skeleton height={250} />
//       </div>
//     );
//   }

//   // Generate labels based on number of days
//   const getLabels = () => {
//     if (!data?.activity || data.activity.length === 0) {
//       // Fallback: generate date range based on numberOfDays
//       const labels = [];
//       const today = dayjs();

//       if (numberOfDays <= 7) {
//         // Show daily for 7 days
//         for (let i = numberOfDays - 1; i >= 0; i--) {
//           labels.push(today.subtract(i, 'day').format('MMM D'));
//         }
//       } else if (numberOfDays <= 31) {
//         // Show weekly for 30 days
//         const weeks = Math.ceil(numberOfDays / 7);
//         for (let i = weeks - 1; i >= 0; i--) {
//           labels.push(today.subtract(i * 7, 'day').format('MMM D'));
//         }
//       } else {
//         // Show monthly for longer periods
//         const months = Math.ceil(numberOfDays / 30);
//         for (let i = months - 1; i >= 0; i--) {
//           labels.push(today.subtract(i, 'month').format('MMM'));
//         }
//       }

//       return labels;
//     }

//     // Use API data if available
//     return data.activity.map((item) => {
//       // If item has a date field, format it appropriately
//       if (item.date) {
//         if (numberOfDays <= 7) {
//           return dayjs(item.date).format('MMM D');
//         } else if (numberOfDays <= 31) {
//           return dayjs(item.date).format('MMM D');
//         } else {
//           return dayjs(item.date).format('MMM');
//         }
//       }
//       // Fallback to month field if no date
//       return item.month ? item.month.split(" ")[0] : '';
//     });
//   };

//   const labels = getLabels();

//   const chartData = {
//     labels,
//     datasets: [
//       {
//         label: "Top Up",
//         data: data?.activity?.map((item) => item.top_up) || [],
//         backgroundColor: "#B8D9EC",
//         borderRadius: 4,
//       },
//       {
//         label: "Send",
//         data: data?.activity?.map((item) => item.transfer) || [],
//         backgroundColor: "#4A9AC7",
//         borderRadius: 4,
//       },
//       {
//         label: "Swap",
//         data: data?.activity?.map((item) => item.swap) || [],
//         backgroundColor: "#0F5B82",
//         borderRadius: 4,
//       },
//     ],
//   };

//   const options: ChartOptions<"bar"> = {
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//       legend: {
//         position: "top",
//         align: "end",
//         labels: {
//           usePointStyle: true,
//           pointStyle: "circle",
//           color: "#6B7280",
//           font: {
//             size: 14,
//             weight: 400,
//             family: "Inter",
//           },
//           padding: 12,
//           boxWidth: 8,
//           boxHeight: 8,
//           generateLabels: (chart) => {
//             const customColors = ["#B8D9EC", "#4A9AC7", "#0F5B82"];
//             const labels = ["Top Up", "Send", "Swap"];

//             return labels.map((label, i) => ({
//               text: label,
//               fillStyle: customColors[i],
//               strokeStyle: customColors[i],
//               lineWidth: 0,
//               pointStyle: "circle",
//               hidden: false,
//               index: i,
//             }));
//           },
//         },
//       },
//       title: {
//         display: false,
//       },
//       tooltip: {
//         enabled: true,
//         backgroundColor: "#1F2937",
//         titleColor: "#F9FAFB",
//         bodyColor: "#F9FAFB",
//         borderColor: "#374151",
//         borderWidth: 1,
//         padding: 12,
//         displayColors: true,
//         boxWidth: 8,
//         boxHeight: 8,
//         usePointStyle: true,
//         callbacks: {
//           label: (ctx: TooltipItem<"bar">) =>
//             `${ctx.dataset.label}: ${getCurrencySymbol(
//               currentWallet?.wallet_type?.currency || "",
//             )}${Number(ctx.raw).toLocaleString()}`,
//         },
//       },
//     },
//     scales: {
//       x: {
//         stacked: true,
//         title: {
//           display: false,
//         },
//         ticks: {
//           color: "#9CA3AF",
//           font: {
//             size: 12,
//             weight: 400,
//           },
//           autoSkip: numberOfDays > 90, // Auto-skip for longer periods
//           maxTicksLimit: numberOfDays <= 7 ? 7 : numberOfDays <= 31 ? 5 : 12,
//         },
//         grid: {
//           display: false,
//           drawBorder: false,
//         },
//         border: {
//           display: false,
//         },
//       },
//       y: {
//         stacked: true,
//         display: false,
//         grid: {
//           display: false,
//         },
//         border: {
//           display: false,
//         },
//       },
//     },
//   };

//   const periodOptions = [
//     { label: "Last 7 days", value: 7 },
//     { label: "Last 30 days", value: 30 },
//     { label: "Last 90 days", value: 90 },
//     { label: "Last 365 days", value: 365 },
//   ];

//   return (
//     <div className="bg-white rounded-lg p-6">
//       {/* Header with dropdown */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="relative">
//           <select
//             value={numberOfDays}
//             onChange={(e) => setNumberOfDays(Number(e.target.value))}
//             className="appearance-none bg-transparent text-gray-600 text-sm font-medium pr-8 pl-0 py-1 cursor-pointer focus:outline-none"
//           >
//             {periodOptions.map((option) => (
//               <option key={option.value} value={option.value}>
//                 {option.label}
//               </option>
//             ))}
//           </select>
//           <svg
//             className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none"
//             width="16"
//             height="16"
//             viewBox="0 0 16 16"
//             fill="none"
//           >
//             <path
//               d="M4 6L8 10L12 6"
//               stroke="#9CA3AF"
//               strokeWidth="1.5"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             />
//           </svg>
//         </div>
//       </div>

//       {/* Chart */}
//       <div className="w-full h-[280px]">
//         <Bar data={chartData} options={options} />
//       </div>
//     </div>
//   );
// };

// export default ActivityTypesChart;
