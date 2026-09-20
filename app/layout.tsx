import Providers from "../providers";
import "./globals.css";

export const metadata = {
  title: "Aawaz — Voice-Native Txn Super Agent",
  description: "Voice-controlled Web3 payments: save contacts once, send crypto by voice or text. Embeddable in DronaHQ.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
