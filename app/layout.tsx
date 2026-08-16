import Providers from "../providers";
import "./globals.css";

export const metadata = {
  title: "Aawaz — The Monad Super Agent",
  description: "Voice-controlled Web3 agent for Monad Testnet (MetaMask)",
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
