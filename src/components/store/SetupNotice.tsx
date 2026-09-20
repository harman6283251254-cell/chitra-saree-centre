export default function SetupNotice() {
  return (
    <div className="page py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-zari/40 bg-white p-8">
        <h1 className="text-3xl">Almost ready</h1>
        <p className="mt-3 text-ink-soft">
          The website is running, but it is not connected to its database yet. Add your Supabase details to the
          <code className="mx-1 rounded bg-ivory-deep px-1.5 py-0.5 text-sm">.env.local</code>
          file (see the setup guide, step 2) and restart the website.
        </p>
      </div>
    </div>
  );
}
