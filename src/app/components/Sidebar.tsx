"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Roadmap", href: "/roadmap" },
  { name: "Skills", href: "/skills" },
  { name: "Learning", href: "/learning" },
  { name: "Projects", href: "/projects" },
  { name: "Certifications", href: "/certifications" },
  { name: "Progress", href: "/progress" },
];

const bottomNavigation = [
  { name: "Profile", href: "/profile" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Invisible hover trigger */}
      <div
        className="fixed left-0 top-0 z-50 h-screen w-3"
        onMouseEnter={() => setIsOpen(true)}
      />

      {/* Sidebar */}
      <aside
        onMouseLeave={() => setIsOpen(false)}
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white px-4 py-6 shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="mb-8 px-3">
          <Link href="/">
            <h1 className="text-2xl font-bold text-indigo-600">
              CareerPath
            </h1>

            <p className="mt-1 text-xs text-gray-500">
              Your path to job readiness
            </p>
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-100 pt-4">
          {bottomNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}