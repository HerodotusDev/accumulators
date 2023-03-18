export const metadata = {
  title: "MMR - Home",
  description: "Merkle mountain range library example",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ background: "black", color: "white" }}>
      <body>{children}</body>
    </html>
  );
}
