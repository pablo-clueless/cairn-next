import Image from "next/image";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export const Logo = ({ className }: Props) => {
  return (
    <div className={cn("relative aspect-square w-10", className)}>
      <Image alt="adflow.ai" className="" fill sizes="100%" src="/assets/cairn.png" />
    </div>
  );
};
