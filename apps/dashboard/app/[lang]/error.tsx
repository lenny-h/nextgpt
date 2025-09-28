"use client";

export default function ErrorPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Unexpected error</h1>
        <p>
          An unexpected error occurred. Please reach out to the support team
        </p>
      </div>
    </div>
  );
}
