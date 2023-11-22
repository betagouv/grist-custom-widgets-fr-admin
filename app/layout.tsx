import Script from "next/script";
import "leaflet/dist/leaflet.css";
import "../styles/index.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Script src="https://docs.getgrist.com/grist-plugin-api.js" />
      </body>
    </html>
  );
}
