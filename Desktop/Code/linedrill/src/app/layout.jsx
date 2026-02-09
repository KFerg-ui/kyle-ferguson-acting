import "../styles/globals.css";

export const metadata = {
  title: "LineDrill — Your AI Scene Partner",
  description: "Upload your script, learn your lines, and rehearse with AI-powered voice coaching.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
