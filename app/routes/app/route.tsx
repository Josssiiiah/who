import { Outlet } from "@remix-run/react";

export default function Route() {
  console.log("Look at you, you found an easter egg");
  return (
    <div className="flex flex-col w-full h-screen mx-auto max-w-[1440px]">
      <Outlet />
    </div>
  );
}
