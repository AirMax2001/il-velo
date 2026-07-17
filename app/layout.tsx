import "./globals.css";
import { ToastProvider } from "@/components/shared/Toast";

export const metadata = {
  title: "pippetto",
  description: "Campaign Operating System dark fantasy"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Raleway:ital,wght@0,400;0,600;0,700;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Uncial+Antiqua&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Bevan:ital@0;1&family=Nunito:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
