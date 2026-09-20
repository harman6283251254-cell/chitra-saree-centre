import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { razorpayMode } from "@/lib/razorpay";
import { PageTitle } from "@/components/admin/ui";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSettings();
  return (
    <>
      <PageTitle title="Settings" />
      <p className="-mt-4 mb-6 max-w-2xl text-ink-mute">Change your shop details here. Everything you save shows on the website straight away.</p>
      <SettingsForm settings={s} razorpay={razorpayMode()} />
    </>
  );
}
