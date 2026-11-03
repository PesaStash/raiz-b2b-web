"use client";

import CopyButton from "@/components/ui/CopyButton";
import Overlay from "@/components/ui/Overlay";
import { IGatewayWebhook } from "@/types/services";
import Image from "next/image";

interface Props {
  close: () => void;
  webhook: IGatewayWebhook;
}

const WebhookSecretModal = ({ close, webhook }: Props) => {
  const secret = webhook.raw_secret;
  if (!secret) return null;

  return (
    <Overlay close={close} width="375px">
      <div className="flex flex-col h-full py-8 px-5">
        <div className="flex items-center justify-between mb-6">
          <h5 className="text-raiz-gray-950 text-xl font-bold leading-normal">
            Webhook signing secret
          </h5>
          <button onClick={close} className="text-raiz-gray-950">
            <Image src="/icons/close.svg" width={16} height={16} alt="close" />
          </button>
        </div>

        <p className="text-sm text-raiz-gray-600 mb-4">
          Copy this secret now. It will not be shown again after you close this
          dialog.
        </p>

        <div className="flex justify-between rounded-r-lg items-center bg-raiz-gray-100">
          <p
            title={secret}
            className="text-raiz-gray-950 p-[15px] truncate text-sm font-medium"
          >
            {secret}
          </p>
          <div className="size-[50px] flex items-center justify-center">
            <CopyButton
              className="bg-raiz-gray-200 size-12 flex items-center"
              value={secret}
              size={20}
            />
          </div>
        </div>
      </div>
    </Overlay>
  );
};

export default WebhookSecretModal;
