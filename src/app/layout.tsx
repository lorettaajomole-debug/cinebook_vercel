import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CineBook — Ultra-Premium Cinema Ticket Booking",
  description:
    "Experience movies the way they were intended. Reserve high-fidelity IMAX, Dolby Atmos, and VIP Recliner seats with instant confirmation on CineBook.",
  keywords: ["cinema tickets", "movie booking", "IMAX", "Dolby Atmos", "CineBook"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-gray-100 min-h-screen flex flex-col antialiased selection:bg-accent-cyan selection:text-gray-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
