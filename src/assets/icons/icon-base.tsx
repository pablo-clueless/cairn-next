import React from "react";

interface IconBaseProps extends React.SVGProps<SVGSVGElement> {
  viewBox?: string;
  width?: string | number;
  height?: string | number;
  className?: string;
  children?: React.ReactNode;
}

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const IconBase = ({
  viewBox = "0 0 24 24",
  width = 24,
  height = 24,
  className = "",
  children,
  ...props
}: IconBaseProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      fill="none"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
};

export { IconBase, type IconBaseProps, type IconProps };
