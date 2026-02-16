"use client";
import React, { useRef, useState, useEffect } from "react";
import { Formik, FormikProps } from "formik";
import { z } from "zod";
import { toFormikValidationSchema } from "zod-formik-adapter";
import InputField from "@/components/ui/InputField";
import TextareaField from "@/components/ui/TextareaField";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { formatAmount, getCurrencySymbol } from "@/utils/helpers";
import { useOutsideClick } from "@/lib/hooks/useOutsideClick";
import InputLabel from "@/components/ui/InputLabel";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useUser } from "@/lib/hooks/useUser";
import { AnimatePresence } from "motion/react";
import { ICreateInvoicePayload, ICustomer } from "@/types/invoice";
import SelectField from "@/components/ui/SelectField";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UpdateInvoiceApi, FetchInvoiceDetailApi } from "@/services/invoice";
import { useRouter, useParams } from "next/navigation";
import AddNewCustomer from "@/app/(dashboard)/customers/_components/AddNewCustomer";
import { CustomerSearchBox } from "../../_components/CustomerSearchbox";
import TaxSelect from "../../_components/TaxSelect";
import DiscountInput from "../../_components/DiscountInput";
import AddNewTax from "../../_components/AddNewTax";
import SideModalWrapper from "@/app/(dashboard)/_components/SideModalWrapper";
import { ACCOUNT_CURRENCIES } from "@/constants/misc";

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

const EditInvoicePage = () => {
  const { selectedCurrency } = useCurrencyStore();
  const { user } = useUser();
  const router = useRouter();
  const { invoiceNo } = useParams<{ invoiceNo: string }>();

  const formikRef = useRef<FormikProps<InvoiceFormValues>>(null);
  const customerBtnRef = useRef<HTMLButtonElement>(null);
  const currencyBtnRef = useRef<HTMLButtonElement>(null);

  const [showSearchBox, setShowSearchBox] = useState(false);
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currency, setCurrency] = useState<keyof typeof ACCOUNT_CURRENCIES>(
    selectedCurrency?.name || ""
  );
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

  const currencyDropdownRef = useOutsideClick(
    () => setShowCurrencyDropdown(false),
    currencyBtnRef
  );

  const currencyOpts =
    user?.business_account?.wallets?.map((each) => ({
      value: each?.wallet_type?.currency || "",
      label: each?.wallet_type?.currency || "",
    })) || [];

  const {
    data: invoiceData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["invoice-detail", invoiceNo],
    queryFn: () => FetchInvoiceDetailApi(invoiceNo),
    enabled: !!invoiceNo,
  });

  useEffect(() => {
    if (invoiceData && formikRef.current) {
      if (invoiceData.customer) {
        setSelectedCustomer(invoiceData.customer);
      }
      if (invoiceData.currency) {
        setCurrency(invoiceData.currency as keyof typeof ACCOUNT_CURRENCIES);
      }
      if (invoiceData.discount_amount && invoiceData.discount_amount > 0) {
        setDiscountType("discount");
      }
      if (invoiceData.tax_amount && invoiceData.tax_amount > 0) {
        setTaxType("tax");
      }
      const discountValue =
        invoiceData.total_discount || invoiceData.discount_amount || 0;
      formikRef.current.setValues({
        customerName: invoiceData.customer_id || "",
        invoiceNumber: invoiceData.invoice_number || "",
        dateIssued:
          invoiceData.issue_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        dueDate:
          invoiceData.due_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        currency: invoiceData.currency || selectedCurrency?.name || "",
        notes: invoiceData.note || "",
        items:
          invoiceData.invoice_items && invoiceData.invoice_items.length > 0
            ? invoiceData.invoice_items.map((item) => ({
                description: item.description || "",
                quantity: item.quantity || 1,
                unitPrice: item.unit_price || 0,
              }))
            : [
                {
                  description: "",
                  quantity: 1,
                  unitPrice: 0,
                },
              ],
        terms: invoiceData.terms_and_conditions || "",
        discount: discountValue,
        discountType: "value",
        tax_amount: invoiceData.tax_amount || 0,
        tax_rate_id: invoiceData.tax_rate_id || "",
      });
    }
  }, [invoiceData, selectedCurrency]);

  const calculateTotals = (values: InvoiceFormValues) => {
    let subtotal = 0;

    for (const item of values.items) {
      subtotal += item.unitPrice * item.quantity;
    }

    let totalDiscount = 0;
    if (discountType === "discount" && values.discount) {
      totalDiscount =
        values.discountType === "percent"
          ? (values.discount / 100) * subtotal
          : values.discount;
    }

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

  const initialValues: InvoiceFormValues = {
    customerName: "",
    invoiceNumber: "",
    dateIssued: new Date().toISOString().split("T")[0],
    dueDate: new Date().toISOString().split("T")[0],
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

  const UpdateMutation = useMutation({
    mutationFn: ({
      payload,
      isDraft,
    }: {
      payload: ICreateInvoicePayload;
      isDraft: boolean;
    }) => UpdateInvoiceApi(invoiceNo, payload, isDraft),
    onSuccess: (response) => {
      const id = response?.invoice_id || invoiceNo;
      qc.invalidateQueries({ queryKey: ["invoices-list"] });
      qc.invalidateQueries({ queryKey: ["invoice-detail", invoiceNo] });
      router.push(`/invoice/${id}`);
    },
  });

  const handleSubmit = (values: InvoiceFormValues) => {
    const { totalDiscount, totalTax, total } = calculateTotals(values);

    const payload: ICreateInvoicePayload = {
      invoice_number: values.invoiceNumber,
      issue_date: values.dateIssued,
      due_date: values.dueDate,
      total_amount: total,
      tax_amount: totalTax,
      ...(values.tax_rate_id && { tax_rate_id: values.tax_rate_id || "" }),
      discount_amount: totalDiscount,
      currency: values.currency,
      customer_id: values.customerName,
      terms_and_conditions: values.terms || "",
      note: values.notes || "",
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
    UpdateMutation.mutate({ payload, isDraft });
  };
  const today = new Date().toISOString().split("T")[0];
  const closeSideModal = () => setShowSideModal(null);

  const displayModal = () => {
    switch (showSideModal) {
      case "customer":
        return <AddNewCustomer close={closeSideModal} />;
      //   case "settings":
      //     return <InvoiceSettings close={closeSideModal} />;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <section className="mt-10 h-full p-6 bg-white">
        <div className="flex justify-center items-center h-64">
          <p className="text-zinc-700">Loading invoice...</p>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mt-10 h-full p-6 bg-white">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-600">
            Error loading invoice. Please try again.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10 h-full p-6 bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-zinc-900 text-2xl font-bold leading-7 mb-8">
          Edit Invoice
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
                        ? selectedCustomer?.full_name
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
                  <div className="flex gap-2 items-center">
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
                  <div className="flex gap-3 items-center">
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
                      <div className="w-[20%]">
                        <InputField
                          className="!bg-white"
                          disabled
                          type="number"
                          value={itemAmount.toFixed(2)}
                          name={`items[${index}].amount`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          formik.setFieldValue(
                            "items",
                            formik.values.items.filter((_, i) => i !== index)
                          )
                        }
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
              <div className="flex justify-between gap-8 items-end -mt-[36px] pb-8">
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
                    className="!min-h-[91px]"
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
                    className="!min-h-[91px]"
                  />
                </div>
                {/* Totals */}
                <div className="border-t pt-4 font-medium w-1/2 flex flex-col gap-5 text-zinc-700 font-brSonoma text-sm border border-gray-100 max-w-96 p-6 bg-white/60 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span>Subtotal:</span>
                    <span>{`${getCurrencySymbol(currency)}${formatAmount(
                      subtotal
                    )}`}</span>
                  </div>
                  {discountType === "discount" && (
                    <div className="flex items-center justify-between gap-5">
                      <span>Discount:</span>
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

              {/* Buttons */}
              <div className="flex justify-between border-t border-gray-100 py-[30px] gap-8 items-center">
                <div className="flex gap-3 font-brSonoma text-zinc-700 flex-col">
                  <p className="font-bold text-xl">
                    Total Amount:{" "}
                    {`${getCurrencySymbol(currency)}${formatAmount(total)}`}
                  </p>
                  <p>
                    Total Quantity:{" "}
                    {formik.values.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-[15px]">
                  <Button
                    onClick={() => router.back()}
                    type="button"
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="whitespace-nowrap"
                    type="button"
                    loading={submitType === "draft" && UpdateMutation.isPending}
                    disabled={UpdateMutation.isPending}
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
                      submitType === "preview" && UpdateMutation.isPending
                    }
                    disabled={UpdateMutation.isPending}
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

export default EditInvoicePage;
