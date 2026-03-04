import React, { useState } from "react";
import SideModalWrapper from "../../SideModalWrapper";
import SideWrapperHeader from "@/components/SideWrapperHeader";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import { useFormik } from "formik";
import ModalTrigger from "@/components/ui/ModalTrigger";
import NetworkModal from "./NetworkModal";
import { toFormikValidationSchema } from "zod-formik-adapter";
import { z } from "zod";
import { useSendStore } from "@/store/Send";
import { CHAINS } from "@/constants/misc";
import CenterModalWrapper from "@/components/layouts/CenterModalWrapper";
import CenterModalHeader from "@/components/layouts/CenterModalHeader";

interface Props {
  close: () => void;
  goNext: () => void;
}

const AddRecipient = ({ close, goNext }: Props) => {
  const [modal, setModal] = useState(false);
  const { actions, cryptoAddress, cryptoNetwork } = useSendStore();

  const schema = z.object({
    address: z.string().min(1, "Address is required"),
    network: z.enum(["bsc", "tron", "polygon", "ethereum"], {
      required_error: "Network is required",
    }),
  });

  const formik = useFormik({
    initialValues: {
      address: cryptoAddress || "",
      network: cryptoNetwork || "",
    },
    validationSchema: toFormikValidationSchema(schema),
    onSubmit: (val) => {
      actions.setCryptoAddress(val.address);
      actions.setCryptoNetwork(val.network);
      goNext();
    },
  });
  return (
    <CenterModalWrapper close={close}>
      <CenterModalHeader close={close} />
      <h2 className="text-xl font-bold text-raiz-gray-950 mb-4">
        Add Recipient
      </h2>

      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col justify-between gap-8 h-full pb-[30px]"
      >
        <div className="flex flex-col gap-4">
          <InputField
            label="Address"
            {...formik.getFieldProps("address")}
            status={
              formik.touched.address && formik.errors.address ? "error" : null
            }
            errorMessage={formik.touched.address && formik.errors.address}
          />
          <ModalTrigger
            onClick={() => setModal(true)}
            placeholder="Select Network type"
            value={
              CHAINS.find((i) => i.value === formik.values.network)?.name || ""
            }
          />
        </div>
        <Button type="submit" disabled={!formik.isValid}>
          Continue
        </Button>
      </form>
      {modal && <NetworkModal close={() => setModal(false)} formik={formik} />}
    </CenterModalWrapper>
  );
};

export default AddRecipient;
