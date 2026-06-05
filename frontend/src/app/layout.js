import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import LayoutFrame from "../components/LayoutFrame";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "NutriMate AI – Personal Nutrition & Kitchen Copilot",
  description: "Manage ingredients, track calories, plan weekly meals, reduce food waste, and cook with a personalized AI chatbot.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-zinc-950 text-zinc-100">
      <body className={`${inter.className} min-h-full bg-zinc-950 flex flex-col antialiased`}>
        <AuthProvider>
          <LayoutFrame>
            {children}
          </LayoutFrame>
        </AuthProvider>
      </body>
    </html>
  );
}
