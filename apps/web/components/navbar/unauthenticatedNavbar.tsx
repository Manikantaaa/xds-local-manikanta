"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";





const UnauthenticatedNavbar = () => {
  const currentUrl = usePathname();
  useEffect(() => {
    if (currentUrl.includes('/login')) {
      document.title = "XDS Spark - Login";
      return;
    }
  }, [currentUrl]);
  return (
    <nav className="shadow-md shadow-gray-400/90 bg-gradient-to-r header_bg border-gray-200 dark:bg-gray-900 w-full h-[3rem]">
      <div className=" flex flex-wrap items-start justify-between py-2 px-4">
        <Link href="/">
        <Image
          priority
          src="/xds-logo.svg"
          alt="Logo"
          width="0"
          height="0"
          sizes="100vw"
          style={{
            width: "auto",
            height: "1.542rem",
            position: "relative",
            top: "2px",
          }}
          loader={({ src, width }) => {
            return `${src}?w=${width}`;
          }}
        />
        </Link>
        <div className="flex items-center">
          {/* <p className="text-sm font-semibold relative xs_mobile_hide" style={{ top: "1px" }}>
            Welcome Samarasa Yalavarthi{" "}
          </p> */}
          {/* <Image
            className="mx-3"
            priority
            src={steeringWheel}
            alt="Steering Wheel Icon"
            sizes="100vh"
            style={{ width: "auto", height: "auto" }}
          />
          <Image
            className="mx-3"
            priority
            src={tada}
            alt="Tada Icon"
            sizes="100vw"
            style={{ width: "auto", height: "auto" }}
          /> */}

          {/* <DropdownMenu>
            <DropdownMenuTrigger className="focus-visible:outline-none">
              <Avatar className="mx-3  w-8 h-8 text-sm">
                <AvatarFallback className=" text-sm font-semibold">sc</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="overflow-visible mr-1 font-medium"
              side="left"
              collisionPadding={5}
            >
              <Link href="#">
                <DropdownMenuItem>Home</DropdownMenuItem>
              </Link>
              <Link href="#">
                <DropdownMenuItem>Browse Service Providers</DropdownMenuItem>
              </Link>
              <Link href="#">
                <DropdownMenuItem>My Lists</DropdownMenuItem>
              </Link>
              <Link href="#">
                <DropdownMenuItem>My Projects</DropdownMenuItem>
              </Link>
              <Link href="#">
                <DropdownMenuItem>My Opportunities</DropdownMenuItem>
              </Link>
              <DropdownMenuLabel className="text-sm font-bold min-w-[300px] relative px-4 py-1">
                My Profile
                <div className="relative right-[-3%]  transform h-0 w-0 border-y-4 border-y-transparent border-l-[11px] border-l-white"></div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="m-0" />
              <Link href="/personal-settings">
                <DropdownMenuItem>Personal Settings</DropdownMenuItem>
              </Link>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        </div>
      </div>
    </nav>
  );
};

export default UnauthenticatedNavbar;
