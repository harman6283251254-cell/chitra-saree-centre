import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { whatsappConfigured, WA_TEMPLATES } from "@/lib/whatsapp-server";
import { instagramConfigured } from "@/lib/instagram-server";
import { formatDate } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";
import WhatsAppTest from "@/components/admin/WhatsAppTest";
import Icon from "@/components/Icon";

export const metadata = { title: "Social media" };

function Status({ on }: { on: boolean }) {
  return on
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E4F3EA] px-3 py-1 text-sm text-[#1F7A45]"><span className="h-2 w-2 rounded-full bg-[#1F7A45]" />Connected</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-3 py-1 text-sm text-ink-soft"><span className="h-2 w-2 rounded-full bg-ink-mute" />Not connected</span>;
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] text-ink-soft">{items.map((x, i) => <li key={i}>{x}</li>)}</ol>;
}

export default async function SocialPage() {
  const { sb } = await requireAdmin();
  const s = await getSettings();
  const wa = whatsappConfigured();
  const ig = instagramConfigured();
  const [{ data: log }, { data: posts }] = await Promise.all([
    sb.from("notification_log").select("id,recipient,template,status,created_at").order("created_at", { ascending: false }).limit(8),
    sb.from("instagram_posts").select("id,caption,status,error,created_at,product_id").order("created_at", { ascending: false }).limit(8),
  ]);

  return (
    <>
      <PageTitle title="Social media" />
      <p className="-mt-4 mb-6 max-w-2xl text-ink-mute">Your website never asks for your WhatsApp or Instagram password. Connections use Meta&apos;s official business tools, set up once by whoever manages your website.</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-3xl"><Icon name="chat" className="h-7 w-7 text-[#1F8F4E]" />WhatsApp</h2>
            <Status on={wa} />
          </div>
          <p className="mt-3 text-[15px]">
            <strong>Already working:</strong> &ldquo;Chat on WhatsApp&rdquo; buttons on your website open a chat with <strong>+91 {s.whatsapp_number}</strong>, with the product name filled in.
          </p>
          <p className="mt-2 text-[15px]">
            <strong>Automatic messages</strong> (order confirmation, dispatch, delivery, cancellation) {wa ? "are switched on." : "are in demo mode — they are recorded below but not sent."}
          </p>

          <h3 className="mt-6 font-medium">Send test message</h3>
          <WhatsAppTest />

          {!wa && (
            <details className="mt-6 rounded-lg bg-ivory p-4">
              <summary className="cursor-pointer font-medium text-wine">Configure — how to connect (for your website helper)</summary>
              <Steps items={[
                <>Open <a className="text-wine underline" href="https://business.facebook.com" target="_blank" rel="noopener noreferrer">Meta Business Suite</a> and verify your business.</>,
                <>In <a className="text-wine underline" href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">Meta for Developers</a>, create an app and add the <em>WhatsApp</em> product.</>,
                <>Register your business number there. Note: a number used on the Cloud API cannot be used in the normal WhatsApp app at the same time — many shops use a second number for automatic messages.</>,
                <>Create message templates named <code>{WA_TEMPLATES.confirmation}</code> and <code>{WA_TEMPLATES.status}</code> and wait for Meta&apos;s approval.</>,
                <>Put the permanent access token and phone number ID into the website&apos;s secret settings (<code>WHATSAPP_ACCESS_TOKEN</code>, <code>WHATSAPP_PHONE_NUMBER_ID</code>) and restart.</>,
              ]} />
            </details>
          )}

          <h3 className="mt-6 font-medium">Recent automatic messages</h3>
          {log?.length ? (
            <ul className="mt-2 divide-y divide-ink/10 text-sm">
              {log.map((l) => <li key={l.id} className="flex justify-between gap-2 py-1.5"><span>{l.template} → {l.recipient}</span><span className={l.status === "failed" ? "text-wine" : "text-ink-mute"}>{l.status} · {formatDate(l.created_at)}</span></li>)}
            </ul>
          ) : <p className="mt-2 text-sm text-ink-mute">None yet.</p>}
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-3xl"><Icon name="instagram" className="h-7 w-7 text-wine" />Instagram</h2>
            <Status on={ig} />
          </div>
          <p className="mt-3 text-[15px]">Pick a product and the website prepares the photo, caption, price, hashtags and product link for you. You check everything before anything is posted.</p>
          <Link href="/admin/social/instagram" className="btn-primary mt-5"><Icon name="plus" className="h-5 w-5" />Create post</Link>
          {!ig && <p className="mt-3 text-sm text-ink-mute">Until Instagram is connected, you can still create posts — copy the caption and download the photo to post from your phone.</p>}

          {!ig && (
            <details className="mt-6 rounded-lg bg-ivory p-4">
              <summary className="cursor-pointer font-medium text-wine">Connect — how to connect (for your website helper)</summary>
              <Steps items={[
                <>In the Instagram app, switch <strong>@chitrasareecentre</strong> to a Business or Creator account and link it to your Facebook Page.</>,
                <>In Meta for Developers, add Instagram to the same app and request <code>instagram_basic</code> and <code>instagram_content_publish</code> permissions.</>,
                <>Generate a long-lived access token through Meta&apos;s login screen (never share your password with anyone).</>,
                <>Put <code>INSTAGRAM_ACCESS_TOKEN</code> and <code>INSTAGRAM_BUSINESS_ACCOUNT_ID</code> in the website&apos;s secret settings and restart.</>,
              ]} />
            </details>
          )}

          <h3 className="mt-6 font-medium">Recent posts</h3>
          {posts?.length ? (
            <ul className="mt-2 divide-y divide-ink/10 text-sm">
              {posts.map((p) => (
                <li key={p.id} className="py-2">
                  <div className="flex justify-between gap-2"><span className="line-clamp-1">{p.caption.split("\n").find((l: string) => l.trim() && !l.includes("✨")) ?? p.caption.slice(0, 40)}</span>
                    <span className={p.status === "failed" ? "text-wine" : p.status === "published" ? "text-[#1F7A45]" : "text-ink-mute"}>{p.status}</span></div>
                  {p.error && <p className="text-xs text-wine">{p.error}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sm text-ink-mute">None yet.</p>}

          <h3 className="mt-6 font-medium">Customer enquiries</h3>
          <p className="mt-1 text-sm text-ink-mute">Instagram DMs are answered in the Instagram app. Website visitors can reach you on WhatsApp from every product page.</p>
          {s.instagram_url && <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="btn-outline mt-3 py-2 text-sm">Open Instagram profile</a>}
        </Card>
      </div>
    </>
  );
}
