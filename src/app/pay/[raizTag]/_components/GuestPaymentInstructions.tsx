"use client";
import AfricaPaymentInstructions from "@/components/transactions/AfricaPaymentInstructions";
import { useGuestSendStore } from "@/store/GuestSend";

interface Props {
  onCancel?: () => void;
  onDone?: () => void;
  cancelling?: boolean;
}

const GuestPaymentInstructions = ({ onCancel, onDone, cancelling }: Props) => {
  const {
    payment_instruction,
    amount,
    local_amount,
    payout_currency,
    expires_at,
    status,
    collection_account_number,
    collection_account_name,
    collection_bank_name,
    collection_method,
    account_type,
    channel_name,
    guestAccount,
    network_name,
  } = useGuestSendStore();

  return (
    <AfricaPaymentInstructions
      amount={local_amount}
      usdAmount={amount}
      payoutCurrency={payout_currency}
      expiresAt={expires_at}
      status={status}
      paymentInstruction={payment_instruction}
      collectionAccountNumber={collection_account_number}
      collectionAccountName={collection_account_name}
      collectionBankName={collection_bank_name}
      collectionMethod={collection_method}
      accountType={account_type}
      channelName={channel_name}
      momoAccountNumber={guestAccount}
      networkName={network_name}
      onCancel={onCancel}
      onDone={onDone}
      cancelling={cancelling}
    />
  );
};

export default GuestPaymentInstructions;
