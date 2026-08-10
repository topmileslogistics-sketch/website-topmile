import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default:
      "OTR CDL-A Truck Driver Jobs in Ohio | Top Miles Logistics",
    template: "%s | Top Miles Logistics",
  },
  description:
    "Top Miles Logistics is hiring OTR CDL-A drivers for Dry Van and Reefer freight. 70–80 CPM based on experience, 3,500–4,500 miles per week, weekly direct deposit. 3 months CDL-A experience required. Apply online.",
  applicationName: siteConfig.name,
  keywords: [
    "CDL-A jobs",
    "OTR truck driver jobs",
    "CDL driver jobs",
    "OTR trucking jobs",
    "Dry Van driver jobs",
    "Reefer driver jobs",
    "truck driver jobs in Ohio",
    "Ohio CDL jobs",
    "Top Miles Logistics",
    "1099 truck driver jobs",
    "SAP friendly trucking jobs",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  alternates: {
    canonical: "/",
  },
  category: "Transportation",
  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: "OTR CDL-A Truck Driver Jobs in Ohio | Top Miles Logistics",
    description:
      "Dry Van & Reefer OTR freight. 70–80 CPM based on experience, 3,500–4,500 miles per week, weekly direct deposit. SAP Step 6 drivers welcome.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Top Miles Logistics — OTR CDL-A truck driver jobs, Dry Van & Reefer, 70–80 CPM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OTR CDL-A Truck Driver Jobs in Ohio | Top Miles Logistics",
    description:
      "Dry Van & Reefer OTR freight. 70–80 CPM based on experience, 3,500–4,500 miles per week, weekly direct deposit.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#121a28",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">{children}</body>
    </html>
  );
}
