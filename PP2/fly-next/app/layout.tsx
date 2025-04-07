// app/layout.tsx
import "./globals.css";
import { AuthProvider } from "./context/authContext";
import { ThemeProvider } from "next-themes";

export const metadata = {
  title: "My App",
  description: "My awesome app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
