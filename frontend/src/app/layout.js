import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import LayoutFrame from "../components/LayoutFrame";

export const metadata = {
  title: "NutriMate AI – Personal Nutrition & Kitchen Copilot",
  description: "Manage ingredients, track calories, plan weekly meals, reduce food waste, and cook with a personalized AI chatbot.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-[#09090b]">
      <body className="min-h-full flex flex-col antialiased text-zinc-100 bg-[#09090b]">
        <AuthProvider>
          <LayoutFrame>
            {children}
          </LayoutFrame>
        </AuthProvider>
      </body>
    </html>
  );
}

