"use client";
import React, { useRef, useState } from "react";
import { Formik, FormikProps } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import InputField from "@/components/ui/InputField";
import TextareaField from "@/components/ui/TextareaField";
import Button from "@/components/ui/Button";
import Image from "next/image";
import {
  formatAmount,
  getCurrencySymbol,
  // truncateString,
} from "@/utils/helpers";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import { CustomerSearchBox } from "../_components/CustomerSearchbox";
import InputLabel from "@/components/ui/InputLabel";
import Link from "next/link";
import TaxSelect from "../_components/TaxSelect";
// import DiscountInput from "../_components/DiscountInput";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import AddNewTax from "../_components/AddNewTax";
import { useUser } from "@/lib/hooks/useUser";
import InvoiceSettings from "../_components/InvoiceSettings";
import { AnimatePresence } from "motion/react";
import SideModalWrapper from "../../_components/SideModalWrapper";
import AddNewCustomer from "../../customers/_components/AddNewCustomer";
import { ICreateInvoicePayload, ICustomer } from "@/types/invoice";
import SelectField from "@/components/ui/SelectField";
import DiscountInput from "../_components/DiscountInput";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateInvoiceApi, FetchInvoiceIndexApi } from "@/services/invoice";
import { useRouter } from "next/navigation";

const invoiceSchema = z
  .object({
    customerName: z.string().min(1, "Customer name is required"),
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    dateIssued: z.string().min(1, "Date issued is required"),
    dueDate: z.string().min(1, "Due date is required"),
    currency: z.string().min(1, "Currency is required"),
    notes: z
      .string()
      .regex(
        /^[a-zA-Z0-9\s.,!?()-]*$/,
        "Notes can only contain letters, numbers, spaces, and basic punctuation (.,!?()-)"
      )
      .optional(),
    items: z
      .array(
        z.object({
          description: z.string().min(1, "Item description is required"),
          quantity: z.number().min(1, "Quantity must be at least 1"),
          unitPrice: z.number().min(0, "Unit price cannot be negative"),
        })
      )
      .min(1, "At least one item is required"),
    terms: z
      .string()
      .min(2, "Enter your terms and condition")
      .regex(
        /^[a-zA-Z0-9\s.,!?()-]+$/,
        "Terms can only contain letters, numbers, spaces, and basic punctuation (.,!?()-)"
      ),
    discount: z.number().min(0, "Discount cannot be negative").optional(),
    discountType: z.enum(["percent", "value"]).optional(),
    tax_amount: z.number().optional(),
    tax_rate_id: z.string().optional(),
  })
  .refine(
    (data) => {
      const issueDate = new Date(data.dateIssued);
      const dueDate = new Date(data.dueDate);
      return dueDate >= issueDate;
    },
    {
      message: "Due date cannot be before the issue date",
      path: ["dueDate"],
    }
  );

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const CreateInvoicePage = () => {
  const { selectedCurrency } = useCurrencyStore();
  const { user } = useUser();
  const router = useRouter();
  // const fileInputRef = useRef<HTMLInputElement | null>(null);
  // const fileListBtnRef = useRef<HTMLButtonElement>(null);
  const formikRef = useRef<FormikProps<InvoiceFormValues>>(null);
  const customerBtnRef = useRef<HTMLButtonElement>(null);
  const currencyBtnRef = useRef<HTMLButtonElement>(null);

  // const [files, setFiles] = useState<File[]>([]);
  // const [showUploadedFiles, setShowUploadedFiles] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currency, setCurrency] = useState(selectedCurrency?.name || "");
  const [selectedCustomer, setSelectedCustomer] = useState<ICustomer | null>(
    null
  );
  const [discountType, setDiscountType] = useState<"discount" | "noDiscount">(
    "noDiscount"
  );
  const [taxType, setTaxType] = useState<"tax" | "noTax">("noTax");
  const [showSideModal, setShowSideModal] = useState<
    "settings" | "customer" | null
  >(null);
  const [submitType, setSubmitType] = useState<"draft" | "preview" | null>(
    null
  );

  const today = new Date().toISOString().split("T")[0];

  // const dropDownRef = useOutsideClick(
  //   () => setShowUploadedFiles(false),
  //   fileListBtnRef
  // );
  const currencyDropdownRef = useOutsideClick(
    () => setShowCurrencyDropdown(false),
    currencyBtnRef
  );

  const currencyOpts =
    user?.business_account?.wallets?.map((each) => ({
      value: each?.wallet_type?.currency || "",
      label: each?.wallet_type?.currency || "",
    })) || [];

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
  //   setFiles((prev) => [...prev, ...selectedFiles]);
  //   e.target.value = "";
  // };

  // const handleRemoveFile = (index: number) => {
  //   setFiles((prev) => prev.filter((_, i) => i !== index));
  // };

  // const handleFileUploadClick = () => {
  //   fileInputRef.current?.click();
  // };

  const calculateTotals = (values: InvoiceFormValues) => {
    let subtotal = 0;

    // Calculate subtotal from items
    for (const item of values.items) {
      subtotal += item.unitPrice * item.quantity;
    }

    // Calculate discount (only if discount type is enabled)
    let totalDiscount = 0;
    if (discountType === "discount" && values.discount) {
      totalDiscount =
        values.discountType === "percent"
          ? (values.discount / 100) * subtotal
          : values.discount;
    }

    // Calculate tax (only if tax type is enabled)
    let totalTax = 0;
    if (taxType === "tax" && values.tax_amount) {
      const taxableBase = subtotal - totalDiscount;
      totalTax = (taxableBase * values.tax_amount) / 100;
    }

    const total = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  };

  const handleAddTax = () => {
    setShowAddTaxModal(true);
  };

  const discountOpts = [
    { label: "No Discount", value: "noDiscount" },
    { label: "Discount Included", value: "discount" },
  ];

  const taxOpts = [
    { label: "Tax Included", value: "tax" },
    { label: "No Tax", value: "noTax" },
  ];

  const qc = useQueryClient();
  const { data: indexNo, isLoading: indexLoading } = useQuery({
    queryKey: ["invoice-index"],
    queryFn: FetchInvoiceIndexApi,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
  });
  const initialValues: InvoiceFormValues = {
    customerName: "",
    invoiceNumber: indexNo || "",
    dateIssued: new Date().toISOString().split("T")[0],
    dueDate: "",
    currency: selectedCurrency?.name || "",
    notes: "Thank you for your business!",
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
      },
    ],
    terms: "",
    discount: 0,
    discountType: "percent",
    tax_amount: 0,
    tax_rate_id: "",
  };
  const CreateMutation = useMutation({
    mutationFn: ({
      payload,
      isDraft,
    }: {
      payload: ICreateInvoicePayload;
      isDraft: boolean;
    }) => CreateInvoiceApi(payload, isDraft),
    onSuccess: (response) => {
      const id = response?.invoice_id || "";
      qc.invalidateQueries({ queryKey: ["invoices-list"] });
      router.push(`/invoice/${id}`);
    },
  });

  const handleSubmit = (values: InvoiceFormValues) => {
    const { totalDiscount, totalTax, total } = calculateTotals(values);

    const payload: ICreateInvoicePayload = {
      invoice_number: values.invoiceNumber || null,
      issue_date: values.dateIssued || null,
      due_date: values.dueDate || null,
      total_amount: total || null,
      tax_amount: totalTax || null,
      ...(values.tax_rate_id && { tax_rate_id: values.tax_rate_id || null }),
      discount_amount: totalDiscount || null,
      currency: values.currency || null,
      customer_id: values.customerName || null,
      terms_and_conditions: values.terms || null,
      note: values.notes || null,
      invoice_items: values.items.map((item) => {
        const itemTotalPrice = item.unitPrice * item.quantity;
        return {
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: itemTotalPrice,
        };
      }),
    };

    console.log("Submitting payload:", payload);
    const isDraft = submitType === "draft";
    CreateMutation.mutate({ payload, isDraft });
  };

  const closeSideModal = () => setShowSideModal(null);

  const displayModal = () => {
    switch (showSideModal) {
      case "customer":
        return <AddNewCustomer close={closeSideModal} />;
      case "settings":
        return <InvoiceSettings close={closeSideModal} />;
      default:
        break;
    }
  };

  return (
    <section className="mt-10 h-full p-6 bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-zinc-900 text-2xl font-bold leading-7 mb-8">
          New Invoice
        </h2>
        <div className="relative">
          <button
            ref={currencyBtnRef}
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            type="button"
            className="px-3 py-1.5 bg-violet-100/60 rounded-3xl flex gap-2 items-center hover:bg-violet-200/60 transition-colors"
          >
            <span className="text-zinc-700 text-sm font-medium leading-tight font-brSonoma">
              {`Select Currency (${currency})`}
            </span>
            <Image
              src="/icons/arrow-down.svg"
              alt="arrow-down"
              width={16}
              height={16}
              className="transition-transform duration-200"
              style={{
                transform: showCurrencyDropdown
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            />
          </button>
          {showCurrencyDropdown && (
            <div
              ref={currencyDropdownRef}
              className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-20"
            >
              <ul className="py-1">
                {currencyOpts.length > 0 ? (
                  currencyOpts.map((option, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        formikRef.current?.setFieldValue(
                          "currency",
                          option.value
                        );
                        setCurrency(option.value);
                        setShowCurrencyDropdown(false);
                      }}
                      className="px-4 py-2 text-sm text-zinc-700 hover:bg-violet-100/60 cursor-pointer transition-colors"
                    >
                      {option.label}
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-2 text-sm text-zinc-500">
                    No currencies available
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={toFormikValidationSchema(invoiceSchema)}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {(formik) => {
          const { subtotal, totalTax, total } = calculateTotals(formik.values);

          return (
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-x-10">
                <div>
                  <InputLabel content="Customer Name*" />
                  <div className="relative">
                    <button
                      ref={customerBtnRef}
                      type="button"
                      onClick={() => setShowSearchBox(true)}
                      className="w-full mt-2 h-[50px] text-sm text-raiz-gray-950 border bg-raiz-gray-100 p-[15px] rounded-md flex"
                    >
                      {selectedCustomer
                        ? selectedCustomer?.business_name || selectedCustomer?.full_name
                        : "Select or add a customer"}
                    </button>
                    {showSearchBox && (
                      <CustomerSearchBox
                        setShowSearchBox={setShowSearchBox}
                        btnRef={customerBtnRef}
                        addNew={() => setShowSideModal("customer")}
                        onSelectCustomer={(customer) => {
                          setSelectedCustomer(customer);
                          formik.setFieldValue(
                            "customerName",
                            customer?.customer_id
                          );
                        }}
                        selectedCustomerId={selectedCustomer?.customer_id}
                        onUnselectCustomer={() => setSelectedCustomer(null)}
                      />
                    )}
                    {formik.touched.customerName &&
                      formik.errors.customerName && (
                        <ErrorMessage message={formik.errors.customerName} />
                      )}
                  </div>
                </div>
                <InputField
                  label="Invoice #*"
                  {...formik.getFieldProps("invoiceNumber")}
                  status={
                    formik.touched.invoiceNumber && formik.errors.invoiceNumber
                      ? "error"
                      : null
                  }
                  errorMessage={
                    formik.touched.invoiceNumber && formik.errors.invoiceNumber
                  }
                  disabled
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-x-10">
                <InputField
                  label="Date Issued*"
                  type="date"
                  // min={today}
                  {...formik.getFieldProps("dateIssued")}
                  status={
                    formik.touched.dateIssued && formik.errors.dateIssued
                      ? "error"
                      : null
                  }
                  errorMessage={
                    formik.touched.dateIssued && formik.errors.dateIssued
                  }
                />

                <InputField
                  label="Due Date*"
                  type="date"
                  min={formik.values.dateIssued || today}
                  {...formik.getFieldProps("dueDate")}
                  status={
                    formik.touched.dueDate && formik.errors.dueDate
                      ? "error"
                      : null
                  }
                  errorMessage={formik.touched.dueDate && formik.errors.dueDate}
                />
              </div>

              {/* Discount and Tax Type Selection */}
              <div className="grid grid-cols-2 gap-x-10 !mb-8">
                <div className="flex flex-col gap-2.5">
                  <InputLabel content="Discount" />
                  <div
                    className={`flex gap-2 items-center ${
                      discountType === "discount"
                    } ? "": "`}
                  >
                    <SelectField
                      height="44px"
                      minHeight="44px"
                      options={discountOpts}
                      value={
                        discountType
                          ? discountOpts.find(
                              (option) => option.value === discountType
                            ) || null
                          : null
                      }
                      onChange={(i) =>
                        setDiscountType(i?.value as "discount" | "noDiscount")
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <InputLabel content="Tax" />
                  <div className={`flex gap-3 items-center `}>
                    <SelectField
                      height="44px"
                      minHeight="44px"
                      options={taxOpts}
                      width={taxType === "noTax" ? "100%" : "50%"}
                      value={
                        taxType
                          ? taxOpts.find(
                              (option) => option.value === taxType
                            ) || null
                          : null
                      }
                      onChange={(i) => setTaxType(i?.value as "tax" | "noTax")}
                    />
                    {taxType === "tax" && (
                      <div className="w-1/2">
                        <TaxSelect
                          value={String(formik.values.tax_rate_id || "")}
                          onChange={(val) => {
                            formik.setFieldValue(
                              "tax_amount",
                              parseFloat(String(val.tax_percentage))
                            );
                            formik.setFieldValue(
                              "tax_rate_id",
                              val.tax_rate_id
                            );
                          }}
                          displayNewTax={handleAddTax}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <div className="flex w-full gap-4 mt-4 bg-violet-100/60 h-11 items-center">
                  <div className="w-[45%] pl-6">
                    <h5 className="text-xs text-zinc-700">Item Details</h5>
                  </div>
                  <div className="w-[15%]">
                    <h5 className="text-xs text-zinc-700">Qty</h5>
                  </div>
                  <div className="w-[20%]">
                    <h5 className="text-xs text-zinc-700">{`Unit Price ${
                      taxType === "tax" ? "(Incl. Tax)" : ""
                    }`}</h5>
                  </div>
                  <div className="w-[20%]">
                    <h5 className="text-xs text-zinc-700">Amount</h5>
                  </div>
                </div>
                {formik.values.items.map((item, index) => {
                  const itemAmount = item.unitPrice * item.quantity;

                  return (
                    <div
                      key={index}
                      className="flex w-full gap-4 mt-4 items-center"
                    >
                      <div className="w-[45%]">
                        <InputField
                          placeholder="type an item"
                          className="!bg-white"
                          {...formik.getFieldProps(
                            `items[${index}].description`
                          )}
                          status={
                            formik.touched.items?.[index]?.description &&
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (formik.errors.items?.[index] as any)?.description
                              ? "error"
                              : null
                          }
                          errorMessage={
                            formik.touched.items?.[index]?.description &&
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (formik.errors.items?.[index] as any)?.description
                          }
                        />
                      </div>
                      <div className="w-[15%]">
                        <InputField
                          className="!bg-white"
                          type="number"
                          min="1"
                          {...formik.getFieldProps(`items[${index}].quantity`)}
                        />
                      </div>
                      <div className="w-[20%]">
                        <InputField
                          className="!bg-white"
                          type="number"
                          min="0"
                          {...formik.getFieldProps(`items[${index}].unitPrice`)}
                        />
                      </div>
                      <div className={`w-[20%]`}>
                        <InputField
                          className="!bg-white"
                          disabled
                          type="number"
                          value={itemAmount.toFixed(2)}
                          name={`items[${index}].amount`}
                        />
                      </div>
                      {/* {index > 0 && ( */}
                      <button
                        type="button"
                        onClick={() =>
                          formik.setFieldValue(
                            "items",
                            formik.values.items.filter((_, i) => i !== index)
                          )
                        }
                        className=""
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M12 1.20857L10.7914 0L6 4.79143L1.20857 0L0 1.20857L4.79143 6L0 10.7914L1.20857 12L6 7.20857L10.7914 12L12 10.7914L7.20857 6L12 1.20857Z"
                            fill="#DC180D"
                          />
                        </svg>
                      </button>
                      {/* )} */}
                    </div>
                  );
                })}
                <Button
                  type="button"
                  onClick={() =>
                    formik.setFieldValue("items", [
                      ...formik.values.items,
                      {
                        description: "",
                        quantity: 1,
                        unitPrice: 0,
                      },
                    ])
                  }
                  icon={
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M7.99998 14.6667C11.6666 14.6667 14.6666 11.6667 14.6666 8.00004C14.6666 4.33337 11.6666 1.33337 7.99998 1.33337C4.33331 1.33337 1.33331 4.33337 1.33331 8.00004C1.33331 11.6667 4.33331 14.6667 7.99998 14.6667Z"
                        stroke="#3C2875"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5.33331 8H10.6666"
                        stroke="#3C2875"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 10.6667V5.33337"
                        stroke="#3C2875"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  }
                  iconPosition="left"
                  className="mt-8 !bg-violet-100/60 !text-sm w-[140px] h-9 text-zinc-900"
                >
                  Add Item
                </Button>
              </div>

              {/* Note, terms & Totals */}
              <div className="flex justify-between gap-8 items-end -mt-[36px]  pb-8">
                <div className="flex gap-4 items-center w-1/2">
                  <TextareaField
                    label="Terms and Conditions"
                    placeholder="Enter the terms and conditions of your business"
                    {...formik.getFieldProps("terms")}
                    status={
                      formik.touched.terms && formik.errors.terms
                        ? "error"
                        : null
                    }
                    errorMessage={formik.touched.terms && formik.errors.terms}
                    className=" !min-h-[91px]"
                  />
                  <TextareaField
                    label="Notes"
                    placeholder="Add notes about this invoice"
                    {...formik.getFieldProps("notes")}
                    status={
                      formik.touched.notes && formik.errors.notes
                        ? "error"
                        : null
                    }
                    errorMessage={formik.touched.notes && formik.errors.notes}
                    className=" !min-h-[91px]"
                  />
                </div>
                {/* Totals */}
                <div className="border-t pt-4 font-medium w-1/2 flex flex-col gap-5 text-zinc-700 font-brSonoma text-sm border  border-gray-100 max-w-96 p-6 bg-white/60 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>{`${getCurrencySymbol(currency)}${formatAmount(
                      subtotal
                    )}`}</span>
                  </div>
                  {discountType === "discount" && (
                    <div className="flex items-center justify-between gap-5">
                      <span>Discount:</span>
                      {/* <span>{`${getCurrencySymbol(currency)}${formatAmount(
                        totalDiscount
                      )}`}</span> */}

                      <div className="mt-2">
                        <DiscountInput
                          value={formik.values.discount || 0}
                          mode={formik.values.discountType || "percent"}
                          onChange={(val) =>
                            formik.setFieldValue("discount", val)
                          }
                          onModeChange={(mode) =>
                            formik.setFieldValue("discountType", mode)
                          }
                          currency={currency}
                        />
                      </div>
                    </div>
                  )}
                  {taxType === "tax" && (
                    <div className="flex items-center justify-between">
                      <span>Tax:</span>
                      <span>{`${getCurrencySymbol(currency)}${formatAmount(
                        totalTax
                      )}`}</span>
                    </div>
                  )}
                  <div className="font-semibold text-base mt-9 flex items-center justify-between">
                    <span>Total:</span>
                    <span>{`${getCurrencySymbol(currency)}${formatAmount(
                      total
                    )}`}</span>
                  </div>
                </div>
              </div>

              {/* File attachment */}
              {/* <div className="relative w-64">
                <h6 className="text-zinc-900 text-sm font-medium font-brSonoma mb-3">
                  Attach File(s) to your Invoice
                </h6>

                <div className="h-[50px] flex justify-between bg-gray-100 rounded-tl-lg rounded-bl-lg w-[219px]">
                  <button
                    type="button"
                    onClick={handleFileUploadClick}
                    className="flex justify-between items-center h-full p-3.5 w-full"
                  >
                    <div className="flex gap-1">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.00002 11.3334V7.33337L4.66669 8.66671"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 7.33337L7.33333 8.66671"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14.6666 6.66671V10C14.6666 13.3334 13.3333 14.6667 9.99998 14.6667H5.99998C2.66665 14.6667 1.33331 13.3334 1.33331 10V6.00004C1.33331 2.66671 2.66665 1.33337 5.99998 1.33337H9.33331"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M14.6666 6.66671H12C9.99998 6.66671 9.33331 6.00004 9.33331 4.00004V1.33337L14.6666 6.66671Z"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-zinc-900 text-sm font-normal leading-tight">
                        Upload files
                      </span>
                    </div>
                    <Image
                      src={"/icons/arrow-down.svg"}
                      alt=""
                      width={16}
                      height={16}
                    />
                  </button>

                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="sr-only"
                  />

                  <div className="relative">
                    <button
                      ref={fileListBtnRef}
                      type="button"
                      onClick={() => setShowUploadedFiles(!showUploadedFiles)}
                      className="h-[50px] flex items-center justify-center gap-1 w-12 p-3.5 bg-raiz-usd-primary rounded-tr-lg rounded-br-lg relative z-10"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M6.52998 5.46997C7.65498 6.59497 7.65498 8.41497 6.52998 9.53497C5.40498 10.655 3.58498 10.66 2.46498 9.53497C1.34498 8.40997 1.33998 6.58997 2.46498 5.46997"
                          stroke="#FCFCFD"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5.29498 6.70494C4.12498 5.53494 4.12498 3.63494 5.29498 2.45994C6.46498 1.28494 8.36498 1.28994 9.53998 2.45994C10.715 3.62994 10.71 5.52994 9.53998 6.70494"
                          stroke="#FCFCFD"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="font-brSonoma text-sm text-gray-50">
                        {files.length}
                      </span>
                    </button>

                    {showUploadedFiles && files.length > 0 && (
                      <div
                        ref={dropDownRef}
                        className="absolute bottom-[70%] right-0 left-[45%] w-72 bg-neutral-50 rounded-lg shadow-lg border border-gray-100 z-20"
                      >
                        <ul className="max-h-56 overflow-auto p-2 space-y-2">
                          {files.map((file, index) => (
                            <li
                              key={index}
                              className="flex justify-between items-center hover:bg-violet-100/60 p-2 rounded-md text-sm text-gray-700"
                            >
                              <div className="flex gap-3 items-center">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 20 20"
                                  fill="none"
                                >
                                  <path
                                    d="M18.3334 8.33329V12.5C18.3334 16.6666 16.6667 18.3333 12.5001 18.3333H7.50008C3.33341 18.3333 1.66675 16.6666 1.66675 12.5V7.49996C1.66675 3.33329 3.33341 1.66663 7.50008 1.66663H11.6667"
                                    stroke="#0D6494"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M18.3334 8.33329H15.0001C12.5001 8.33329 11.6667 7.49996 11.6667 4.99996V1.66663L18.3334 8.33329Z"
                                    stroke="#0D6494"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M5.83325 10.8334H10.8333"
                                    stroke="#0D6494"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M5.83325 14.1666H9.16659"
                                    stroke="#0D6494"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <div className="flex flex-col gap-1">
                                  <span>{truncateString(file.name, 20)}</span>
                                  <span className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="group"
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                >
                                  <path
                                    d="M14 3.98665C11.78 3.76665 9.54667 3.65332 7.32 3.65332C6 3.65332 4.68 3.71999 3.36 3.85332L2 3.98665"
                                    stroke="#6F5B86"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M5.66675 3.31337L5.81341 2.44004C5.92008 1.80671 6.00008 1.33337 7.12675 1.33337H8.87341C10.0001 1.33337 10.0867 1.83337 10.1867 2.44671L10.3334 3.31337"
                                    stroke="#6F5B86"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M12.5667 6.09338L12.1334 12.8067C12.06 13.8534 12 14.6667 10.14 14.6667H5.86002C4.00002 14.6667 3.94002 13.8534 3.86668 12.8067L3.43335 6.09338"
                                    stroke="#6F5B86"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M6.88672 11H9.10672"
                                    stroke="#6F5B86"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M6.33325 8.33337H9.66659"
                                    stroke="#6F5B86"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div> */}

              {/* Buttons */}
              <div className="flex justify-between border-t border-gray-100 py-[30px] gap-8 items-center">
                {/* <div className="flex gap-[15px] items-center"> */}
                {/* <button
                    type="button"
                    onClick={() => setShowSideModal("settings")}
                    className="w-10 h-10 relative flex justify-center items-center bg-white rounded-2xl border border-gray-100 hover:border-gray-300"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 9.10998V14.88C3 17 3 17 5 18.35L10.5 21.53C11.33 22.01 12.68 22.01 13.5 21.53L19 18.35C21 17 21 17 21 14.89V9.10998C21 6.99998 21 6.99999 19 5.64999L13.5 2.46999C12.68 1.98999 11.33 1.98999 10.5 2.46999L5 5.64999C3 6.99999 3 6.99998 3 9.10998Z"
                        stroke="#0D6494"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                        stroke="#0D6494"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button> */}
                <div className="flex gap-3 font-brSonoma text-zinc-700 flex-col">
                  <p className="font-bold text-xl">
                    Total Amount:{" "}
                    {`${getCurrencySymbol(currency)}${total.toFixed(2)}`}
                  </p>
                  <p>
                    Total Quantity:{" "}
                    {formik.values.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </p>
                </div>
                {/* </div> */}
                <div className="flex items-center gap-[15px]">
                  <Link href={"/invoice"}>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    className="whitespace-nowrap"
                    type="button"
                    loading={submitType === "draft" && CreateMutation.isPending}
                    disabled={CreateMutation.isPending || indexLoading}
                    onClick={() => {
                      setSubmitType("draft");
                      formik.handleSubmit();
                    }}
                    variant="secondary"
                  >
                    Save as Draft
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setSubmitType("preview");
                      formik.handleSubmit();
                    }}
                    loading={
                      submitType === "preview" && CreateMutation.isPending
                    }
                    disabled={CreateMutation.isPending || indexLoading}
                    className="whitespace-nowrap"
                  >
                    Preview & Save
                  </Button>
                </div>
              </div>
            </form>
          );
        }}
      </Formik>
      {showAddTaxModal && <AddNewTax close={() => setShowAddTaxModal(false)} />}
      <AnimatePresence>
        {showSideModal ? (
          <SideModalWrapper close={closeSideModal}>
            {displayModal()}
          </SideModalWrapper>
        ) : null}
      </AnimatePresence>
    </section>
  );
};

export default CreateInvoicePage;
