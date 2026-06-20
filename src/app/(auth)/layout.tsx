import React from "react";

interface Props {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="grid h-screen w-screen place-items-center overflow-hidden">{children}</div>
  );
};

export default AuthLayout;
