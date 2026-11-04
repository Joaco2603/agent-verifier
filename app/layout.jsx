import "./globals.css";

export const metadata = {
  title: "RF Studio",
  description: "Visual editor for experiment task contracts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
