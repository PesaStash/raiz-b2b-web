"use client";
import React from "react";
import Overlay from "../ui/Overlay";
import Image from "next/image";
import InputField from "../ui/InputField";
import { useFormik } from "formik";
import InputLabel from "../ui/InputLabel";
import Button from "../ui/Button";
import { useMutation } from "@tanstack/react-query";
import { FeedbackPayload } from "@/types/services";
import { FeedbacksApi } from "@/services/user";
import { toast } from "sonner";

interface Props {
  close: () => void;
}

const FeedbacksModal = ({ close }: Props) => {
  const Mutation = useMutation({
    mutationFn: (data: FeedbackPayload) => FeedbacksApi(data),
    onSuccess: (res) => {
      toast.success(
        res?.message ||
          "Thanks! Your Feedback has been received. We'll get back to you."
      );
      close();
    },
  });
  const formik = useFormik({
    initialValues: {
      email: "",
      feature: "",
      feedback: "",
    },
    onSubmit: (val, { resetForm }) => {
      try {
        Mutation.mutate(val);
      } catch (error) {
        console.log(error);
      } finally {
        resetForm();
      }
    },
  });
  return (
    <Overlay width="375px" close={close}>
      <div className="flex flex-col justify-center items-center  h-full py-8 px-5  text-center overflow-y-scroll">
        <div className="flex justify-between gap-4 mb-8 items-start">
          <div className="text-zinc-900 text-left space-y-1 ">
            <h3 className=" font-bold  text-xl">Feedback & Feature Requests</h3>
            <p className="text-xs leading-tight">
              Tell us what you think or request a feature.
            </p>
          </div>
          <button onClick={close}>
            <Image
              src={"/icons/close.svg"}
              alt="close"
              width={16}
              height={16}
            />
          </button>
        </div>
        <form
          onSubmit={formik.handleSubmit}
          className="flex flex-col gap-[15px] w-full text-left"
        >
          <div className="flex flex-col gap-2">
            <InputLabel content="Feedback" />
            <textarea
              className="w-full min-h-[100px] p-4 text-sm leading-relaxed text-raiz-gray-950 placeholder:text-raiz-gray-400 placeholder:text-sm bg-raiz-gray-100 border border-transparent rounded-lg outline-none focus:bg-white focus:border-raiz-gray-600 active:border-raiz-gray-600 resize-y transition-colors duration-150"
              placeholder="I'd love it if the app could..."
              aria-label="Feedback or suggestion"
            />
          </div>
          <InputField
            label="Feature request"
            placeholder="Investment"
            {...formik.getFieldProps("feature")}
            status={formik.errors.feature ? "error" : null}
            errorMessage={formik.touched.feature && formik.errors.feature}
          />
          <InputField
            placeholder="Enter your email address"
            label="Email"
            type="email"
            {...formik.getFieldProps("email")}
            status={formik.errors.email ? "error" : null}
            errorMessage={formik.touched.email && formik.errors.email}
          />
          <Button
            loading={Mutation.isPending}
            disabled={Mutation.isPending}
            type="submit"
          >
            Submit Feedback
          </Button>
          <Button onClick={close} variant="secondary">
            Cancel
          </Button>
        </form>
      </div>
    </Overlay>
  );
};

export default FeedbacksModal;
