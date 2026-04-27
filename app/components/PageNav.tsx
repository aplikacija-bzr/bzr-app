"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type PageNavProps = {
  title: string;
  subtitle?: string;
  homeHref?: string;
};

export default function PageNav({
  title,
  subtitle,
  homeHref = "/",
}: PageNavProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Nazad
        </button>

        <Link
          href={homeHref}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Početna
        </Link>
      </div>
    </div>
  );
}