import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata: Metadata = {
  title: "CareerPath",
  description: "Your personalized path to job readiness",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f8f9fc] text-gray-900">
        <Sidebar />

        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}