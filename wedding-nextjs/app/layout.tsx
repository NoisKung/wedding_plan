import type { Metadata } from "next";
import { Libre_Baskerville, Lato } from "next/font/google";
import { I18nProvider } from "@/providers/I18nProvider";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
});

export const metadata: Metadata = {
  title: "Sunee & Supakit | The Wedding",
  description: "You are cordially invited to our wedding on 22 November 2026",
  openGraph: {
    title: "Sunee & Supakit | The Wedding",
    description: "22 November 2026 · BokRak VIVACE WEDDING HALL",
    images: ["/portrait.jpeg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${libreBaskerville.variable} ${lato.variable}`}>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
