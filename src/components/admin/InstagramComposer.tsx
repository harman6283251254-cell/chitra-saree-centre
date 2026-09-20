"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveInstagramPost } from "@/app/admin/actions";
import Icon from "@/components/Icon";

export default function InstagramComposer({ products, selectedId, initialCaption, images, mainImageUrl, productUrl, connected }: {
  products: { id: string; name: string }[]; selectedId: string; initialCaption: string; images: string[];
  mainImageUrl: string | null; productUrl: string; connected: boolean;
}) {
  const router = useRouter();
  const [caption, setCaption] = useState(initialCaption);
  const [image, setImage] = useState(mainImageUrl);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const submit = (publish: boolean) => start(async () => {
    if (publish && !confirm("Publish this post to Instagram now?")) return;
    const r = await saveInstagramPost(selectedId || null, caption, image, publish);
    setMsg(r.ok ? { ok: true, text: r.message } : { ok: false, text: r.error });
    router.refresh();
  });

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <label className="label" htmlFor="prod">1. Choose a product</label>
        <select id="prod" className="field" value={selectedId} onChange={(e) => router.push(`/admin/social/instagram${e.target.value ? `?product=${e.target.value}` : ""}`)}>
          <option value="">— Select a product —</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {selectedId && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            <p className="label">2. Photo</p>
            <div className="aspect-[4/5] overflow-hidden rounded-xl border border-ink/10 bg-blush">
              {image ? <img src={image} alt="Selected post photo" className="h-full w-full object-cover" /> : <p className="p-6 text-sm text-ink-mute">This product has no photo yet. Add one from Products → Edit.</p>}
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {images.map((u) => (
                  <button key={u} type="button" onClick={() => setImage(u)} className={`h-16 w-14 shrink-0 overflow-hidden rounded border-2 ${u === image ? "border-wine" : "border-transparent"}`}>
                    <img src={u} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {image && <a href={image} download target="_blank" rel="noopener noreferrer" className="btn-ghost mt-2 text-sm"><Icon name="upload" className="h-4 w-4 rotate-180" />Open / download photo</a>}
          </div>
          <div>
            <label className="label" htmlFor="cap">3. Caption & hashtags (you can edit anything)</label>
            <textarea id="cap" value={caption} onChange={(e) => setCaption(e.target.value)} rows={16} maxLength={2200} className="field font-sans leading-relaxed" />
            <p className="mt-1 text-right text-xs text-ink-mute">{caption.length} / 2200</p>
            <p className="text-sm text-ink-mute">Product link: <a href={productUrl} target="_blank" rel="noopener noreferrer" className="text-wine underline">{productUrl}</a></p>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn-outline" onClick={async () => { await navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                {copied ? "Copied!" : "Copy caption"}
              </button>
              <button type="button" className="btn-ghost" disabled={pending} onClick={() => submit(false)}>Save as draft</button>
              <button type="button" className="btn-primary" disabled={pending || !connected || !image} onClick={() => submit(true)} title={connected ? "" : "Connect Instagram first"}>
                {pending ? "Working…" : "Publish to Instagram"}
              </button>
            </div>
            {!connected && <p className="mt-2 text-sm text-ink-mute">Instagram is not connected yet, so &ldquo;Publish&rdquo; is off. Copy the caption and post the photo from your phone, or ask your website helper to connect Instagram.</p>}
            {msg && <p role="status" className={`mt-3 rounded-lg p-3 text-sm ${msg.ok ? "bg-[#E4F3EA] text-[#1F7A45]" : "bg-wine/10 text-wine"}`}>{msg.text}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
