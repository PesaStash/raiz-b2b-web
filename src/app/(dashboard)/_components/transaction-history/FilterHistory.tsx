import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import InputLabel from "@/components/ui/InputLabel";
import { convertField } from "@/utils/helpers";
import React, { Dispatch, SetStateAction, useState } from "react";
import Image from "next/image";
import { ITransactionCategory, ITransactionClass } from "@/types/transactions";
import dayjs from "dayjs";

import { z } from "zod";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { toast } from "sonner";
import { customDateType } from "./TxnHistory";
import { useCurrentWallet } from "@/lib/hooks/useCurrentWallet";
import { useUser } from "@/lib/hooks/useUser";
import { GenerateStatementApi } from "@/services/transactions";
import SelectField from "@/components/ui/SelectField";
import { monthsData } from "@/constants/misc";
import { FilterParams } from "../TransactionTable";

interface Props {
  close: () => void;
  period: string;
  activity: number;
  status: { label: string; id: number };
  category: number;
  customStartDate: customDateType;
  customEndDate: customDateType;
  setActivity: Dispatch<SetStateAction<number>>;
  setPeriod: Dispatch<SetStateAction<string>>;
  setStatus: Dispatch<SetStateAction<{ label: string; id: number }>>;
  setCategory: Dispatch<SetStateAction<number>>;
  setCustomStartDate: Dispatch<SetStateAction<customDateType>>;
  setCustomEndDate: Dispatch<SetStateAction<customDateType>>;
  activities: ITransactionClass[];
  categories: ITransactionCategory[];
  setParams: Dispatch<SetStateAction<FilterParams>>;
  clearAll: () => void;
}

const dateComponentSchema = z.object({
  day: z
    .string()
    .regex(/^\d{1,2}$/)
    .transform(Number)
    .refine((val) => val >= 1 && val <= 31, "Invalid day"),
  month: z
    .string()
    .regex(/^\d{1,2}$/)
    .transform(Number)
    .refine((val) => val >= 1 && val <= 12, "Invalid month"),
  year: z
    .string()
    .regex(/^\d{4}$/)
    .transform(Number)
    .refine((val) => val >= 1900 && val <= 9999, "Invalid year"),
});

const dateOutputSchema = z
  .object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine(
    (data) => dayjs(data.end).isAfter(dayjs(data.start)),
    "End date must be after start date"
  );

const FilterHistory = ({
  close,
  // activities,
  setParams,
  customEndDate,
  customStartDate,
  activity,
  period,
  setActivity,
  setPeriod,
  setCustomEndDate,
  setCustomStartDate,
  status,
  setStatus,
  clearAll,
  category,
  categories,
  setCategory,
}: Props) => {
  // const [modal, setModal] = useState<"start" | "end" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const periods = ["Custom", "Current week", "Last week", "Current month"];
  const statuses = [
    {
      label: "Completed",
      id: 2,
    },
    {
      label: "Pending",
      id: 1,
    },
    {
      label: "Failed",
      id: 3,
    },
  ];

  const validateCustomDate = (date: typeof customStartDate, prefix: string) => {
    try {
      dateComponentSchema.parse(date);
      const formattedDate = `${date.year}-${date.month.padStart(
        2,
        "0"
      )}-${date.day.padStart(2, "0")}`;
      if (!dayjs(formattedDate).isValid()) {
        throw new Error("Invalid date");
      }
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${prefix}Date`];
        return newErrors;
      });
      return true;
    } catch (error) {
      const zodError = error as z.ZodError;
      setErrors((prev) => ({
        ...prev,
        [`${prefix}Date`]: zodError?.errors[0]?.message || "Invalid date",
      }));
      return false;
    }
  };

  const getPeriodDates = () => {
    const today = dayjs();
    let startDate: dayjs.Dayjs | undefined;
    let endDate: dayjs.Dayjs | undefined;

    switch (period) {
      case "Current week":
        startDate = today.startOf("week");
        endDate = today.endOf("week");
        break;
      case "Last week":
        startDate = today.subtract(1, "week").startOf("week");
        endDate = today.subtract(1, "week").endOf("week");
        break;
      case "Current month":
        startDate = today.startOf("month");
        endDate = today.endOf("month");
        break;
      case "Custom":
        const startFilled =
          customStartDate.day && customStartDate.month && customStartDate.year;
        const endFilled =
          customEndDate.day && customEndDate.month && customEndDate.year;

        if (!startFilled || !endFilled) return undefined;

        const startFormatted = `${
          customStartDate.year
        }-${customStartDate.month.padStart(
          2,
          "0"
        )}-${customStartDate.day.padStart(2, "0")}`;

        const endFormatted = `${
          customEndDate.year
        }-${customEndDate.month.padStart(2, "0")}-${customEndDate.day.padStart(
          2,
          "0"
        )}`;

        startDate = dayjs(startFormatted);
        endDate = dayjs(endFormatted);

        if (!startDate.isValid() || !endDate.isValid()) return undefined;
        break;
      default:
        return undefined;
    }

    return {
      start: startDate?.format("YYYY-MM-DD"),
      end: endDate?.format("YYYY-MM-DD"),
    };
  };

  const clearFilter = () => {
    setActivity(0);
    setPeriod("");
    setCategory(0);
    setStatus({ label: "", id: 0 });
    setCustomStartDate({ day: "", month: "", year: "" });
    setCustomEndDate({ day: "", month: "", year: "" });
    setErrors({});
    clearAll();
  };

  const dates = getPeriodDates();
  const handleApply = () => {
    // If Custom is selected, validate custom dates first
    if (period === "Custom") {
      const isStartValid = validateCustomDate(customStartDate, "start");
      const isEndValid = validateCustomDate(customEndDate, "end");

      if (!isStartValid || !isEndValid) {
        toast.error("Please enter valid custom dates.");
        return;
      }
    }

    // Try to get dates (may be undefined)
    const dates = getPeriodDates();

    // Start forming payload
    const paramPayload: FilterParams = {
      transaction_class_id: activity,
      transaction_category_id: category,
      transaction_status_id: status.id,
    };

    // Add dates if valid
    if (dates) {
      const parsed = dateOutputSchema.safeParse(dates);
      if (parsed.success) {
        paramPayload.start_date = new Date(parsed.data.start).toISOString();
        paramPayload.end_date = new Date(parsed.data.end).toISOString();
      } else {
        toast.error("Invalid date range. Please fix your custom date.");
        return;
      }
    }

    setParams(paramPayload);
    close();
  };

  const { user } = useUser();
  const currentWallet = useCurrentWallet(user);
  const handleDownloadStatement = async () => {
    if (!currentWallet?.wallet_id) {
      toast.error("No wallet");
      return;
    }

    if (!dates) {
      toast.error("Please select a valid date range");
      return;
    }

    setDownloading(true);
    const params = {
      wallet_id: currentWallet.wallet_id,
      startDate: new Date(dates.start).toISOString(),
      endDate: new Date(dates.end).toISOString(),
    };

    try {
      const response = await GenerateStatementApi(params);
      toast.success(
        response?.message || "Bank statement generated successfully"
      );
      clearFilter();
      clearAll();
      close();
    } catch (error) {
      toast.error("Failed to generate bank statement");
      console.log(error);
    } finally {
      setDownloading(false);
    }
  };

  const monthsOpts = monthsData.map((a) => ({
    label: a.value,
    value: a.id,
  }));

  return (
    <div className="flex flex-col h-full">
      <SideWrapperHeader
        title="Transaction History"
        close={close}
        titleColor="text-zinc-900"
      />
      <div className="flex flex-col justify-between h-full">
        <div>
          {/* activity */}
          {/* <div className="">
            <h4 className="text-zinc-900 text-xs font-bold leading-tight mb-[9px]">
              Activity
            </h4>
            <div className="flex items-center gap-4 overflow-x-scroll no-scrollbar">
              {activities.map((each, index) => (
                <button
                  onClick={() => setActivity(each.transaction_class_id)}
                  className={`p-2 rounded-lg whitespace-nowrap  border-[0.5px] leading-tight text-xs ${
                    each.transaction_class_id === activity
                      ? "border-indigo-900 text-indigo-900 bg-indigo-100/60 "
                      : "border-zinc-400 text-zinc-800   "
                  } `}
                  key={index}
                >
                  {convertField(each.transaction_class)}
                </button>
              ))}
            </div>
          </div> */}
          {/* Categoty */}
          <div className="">
            <h4 className="text-zinc-900 text-xs font-bold leading-tight mb-[9px]">
              Category
            </h4>
            <div className="flex items-center gap-4 overflow-x-scroll no-scrollbar">
              {categories.map((each, index) => (
                <button
                  onClick={() => setCategory(each.transaction_category_id)}
                  className={`p-2 rounded-lg whitespace-nowrap  border-[0.5px] leading-tight text-xs ${
                    each.transaction_category_id === category
                      ? "border-indigo-900 text-indigo-900 bg-indigo-100/60 "
                      : "border-zinc-400 text-zinc-800   "
                  } `}
                  key={index}
                >
                  {convertField(each.transaction_category)}
                </button>
              ))}
            </div>
          </div>
          {/* Statuses */}
          <div className="mt-[30px]">
            <h4 className="text-zinc-900 text-xs font-bold leading-tight mb-[9px]">
              Status
            </h4>
            <div className="flex items-center gap-4 overflow-x-scroll no-scrollbar">
              {statuses.map((each, index) => (
                <button
                  onClick={() => setStatus(each)}
                  className={`p-2 rounded-lg whitespace-nowrap  border-[0.5px] leading-tight text-xs ${
                    each.id === status.id
                      ? "border-indigo-900 text-indigo-900 bg-indigo-100/60 "
                      : "border-zinc-400 text-zinc-800   "
                  } `}
                  key={index}
                >
                  {each.label}
                </button>
              ))}
            </div>
          </div>
          {/* Period */}
          <div className="mt-[30px]">
            <h4 className="text-zinc-900 text-xs font-bold leading-tight mb-[9px]">
              Period
            </h4>
            <div className="flex items-center gap-4 overflow-x-scroll no-scrollbar">
              {periods.map((each, index) => (
                <button
                  onClick={() => setPeriod(each)}
                  className={`p-2 rounded-lg whitespace-nowrap  border-[0.5px] leading-tight text-xs ${
                    each === period
                      ? "border-indigo-900 text-indigo-900 bg-indigo-100/60 "
                      : "border-zinc-400 text-zinc-800   "
                  } `}
                  key={index}
                >
                  {each}
                </button>
              ))}
            </div>
            {/* Custom */}
            {period === "Custom" && (
              <div
                className={`${
                  period === "Custom" ? "h-auto opacity-100" : "h-0 opacity-0"
                } transition-all ease-in-out mt-5`}
              >
                <InputLabel content="Start Date" labelClass=" !text-xs" />
                <div className="grid grid-cols-3 gap-[15px] mt-2 mb-4">
                  <InputField
                    name="startDay"
                    placeholder="Day"
                    value={customStartDate.day}
                    onChange={(e) =>
                      setCustomStartDate({
                        ...customStartDate,
                        day: e.target.value,
                      })
                    }
                  />
                  <SelectField
                    name="startMonth"
                    options={monthsOpts}
                    onChange={(i) =>
                      setCustomStartDate((prev) => ({
                        ...prev,
                        month: i?.value as string,
                      }))
                    }
                    value={
                      customStartDate.month
                        ? monthsOpts.find(
                            (o) => o.value === customStartDate.month
                          )
                        : null
                    }
                    placeholder="Month"
                    controlPadding="0 5px"
                  />
                  <InputField
                    name="startYear"
                    placeholder="Year"
                    value={customStartDate.year}
                    onChange={(e) =>
                      setCustomStartDate({
                        ...customStartDate,
                        year: e.target.value,
                      })
                    }
                  />
                </div>
                {errors.startDate && (
                  <ErrorMessage message={errors.startDate} />
                )}

                <InputLabel content="End Date" labelClass=" !text-xs" />
                <div className="grid grid-cols-3 gap-[15px] mt-2  mb-4">
                  <InputField
                    name="endDay"
                    placeholder="Day"
                    value={customEndDate.day}
                    onChange={(e) =>
                      setCustomEndDate({
                        ...customEndDate,
                        day: e.target.value,
                      })
                    }
                  />
                  <SelectField
                    name="endMonth"
                    options={monthsData.map((a) => ({
                      label: a.value,
                      value: a.id,
                    }))}
                    onChange={(i) =>
                      setCustomEndDate((prev) => ({
                        ...prev,
                        month: i?.value as string,
                      }))
                    }
                    value={
                      customStartDate.month
                        ? monthsOpts.find(
                            (o) => o.value === customEndDate.month
                          )
                        : null
                    }
                    placeholder="Month"
                    controlPadding="0 5px"
                  />
                  <InputField
                    name="endYear"
                    placeholder="Year"
                    value={customEndDate.year}
                    onChange={(e) =>
                      setCustomEndDate({
                        ...customEndDate,
                        year: e.target.value,
                      })
                    }
                  />
                </div>
                {errors.endDate && <ErrorMessage message={errors.endDate} />}

                <Button
                  type="button"
                  loading={downloading}
                  onClick={handleDownloadStatement}
                  variant="tertiary"
                  className="!border-[#6F5B86] gap-2"
                >
                  <Image
                    src={"/icons/docs-download.svg"}
                    alt="download"
                    width={16}
                    height={16}
                  />
                  {downloading ? "Downlloading..." : "Bank Statement"}
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-[15px]">
          <Button onClick={handleApply}>Apply</Button>
          <Button onClick={clearFilter} variant="secondary">
            Clear all
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterHistory;
