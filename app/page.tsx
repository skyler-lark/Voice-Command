import RecorderUpload from "@/app/components/RecorderUpload";

export default function Page() {
  return (
    <main className="min-h-screen bg-surface p-6 text-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center py-10">
        <RecorderUpload />
      </div>
    </main>
  );
}
