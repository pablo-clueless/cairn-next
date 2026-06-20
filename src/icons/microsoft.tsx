import { IconBase, type IconProps } from "./icon-base";

export const MicrosoftIcon = ({ className, ...props }: IconProps) => {
  return (
    <IconBase className={className} viewBox="0 0 16 16" {...props}>
      <path d="M2 2H7.71428V7.71428H2V2Z" fill="#F35325" />
      <path d="M8.28613 2H14.0004V7.71428H8.28613V2Z" fill="#81BC06" />
      <path d="M2 8.28613H7.71428V14.0004H2V8.28613Z" fill="#05A6F0" />
      <path d="M8.28516 8.28613H13.9994V14.0004H8.28516V8.28613Z" fill="#FFBA08" />
    </IconBase>
  );
};
