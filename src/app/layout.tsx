import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Task Tracker",
  description: "Simple, distraction-free daily task and completion tracker",
  icons: {
    icon: [
      { url: "/task_logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/task_logo.png",
    apple: "/task_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        {children}
      </body>
    </html>
  );
}
