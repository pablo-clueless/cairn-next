"use client";

import { Logo } from "@/components/shared";

const Page = () => {
  return (
    <div className="flex w-100 flex-col items-center gap-y-10 rounded-xs border bg-white p-6">
      <Logo />
      <p className="font-medium">Login to continue</p>
    </div>
  );
};

export default Page;
