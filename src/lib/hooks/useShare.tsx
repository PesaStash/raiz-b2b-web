import { useCallback } from "react";

const useShare = (referralCode: string) => {
  const shareOnWhatsApp = useCallback(() => {
    const message = encodeURIComponent(
      `Check out Raiz App: I use it to get a USD bank account, virtual card and send money around the world. Get it at https://raizapp.onelink.me/RiOx/webdirect. Use my referral code ${referralCode} and get reward points you can redeem when you transfer`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  }, [referralCode]);

  const shareOnIMessage = useCallback(() => {
    const message = encodeURIComponent(
      `Check out Raiz App: I use it to get a USD bank account, virtual card and send money around the world. Get it at https://raizapp.onelink.me/RiOx/webdirect. Use my referral code ${referralCode} and get reward points you can redeem when you transfer`
    );
    window.open(`sms:&body=${message}`, "_blank");
  }, [referralCode]);

  const shareOnAll = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Share Referral Code",
          text: `Check out Raiz App: I use it to get a USD bank account, virtual card and send money around the world. Get it at https://raizapp.onelink.me/RiOx/webdirect. Use my referral code ${referralCode} and get reward points you can redeem when you transfer`,
          url: window.location.href,
        });
      } catch {
      }
    } else {
      alert("Sharing not supported on this browser.");
    }
  }, [referralCode]);

  return { shareOnWhatsApp, shareOnIMessage, shareOnAll };
};

export default useShare;
