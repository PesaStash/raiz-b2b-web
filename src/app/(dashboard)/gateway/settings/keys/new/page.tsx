"use client";
import { useRouter } from "next/navigation";
import CreateKeysModal from "@/app/(dashboard)/developers/_components/CreateKeysModal";
import { usePermissions } from "@/lib/hooks/usePermissions";
export default function NewKeyPage() {
 const router = useRouter(); const { canManageDeveloperTools } = usePermissions();
 if (!canManageDeveloperTools) return <p role="status" className="p-6">API-key access is unavailable for this account.</p>;
 return <CreateKeysModal fullPage close={()=>router.push("/gateway/settings")} />;
}
