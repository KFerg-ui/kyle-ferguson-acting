import { Courier_Prime } from "next/font/google";
import "../styles/globals.css";

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-courier-prime",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#111111",
};

export const metadata = {
  title: "LineDrill — Your AI Scene Partner",
  description: "Upload your script, learn your lines, and rehearse with AI-powered voice coaching.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LineDrill",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={courierPrime.variable}>
      <body>{children}</body>
    </html>
  );
}
