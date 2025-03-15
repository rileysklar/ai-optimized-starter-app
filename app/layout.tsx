import {
  createProfileAction,
  getProfileByUserIdAction
} from "@/actions/db/profiles-actions"
import { Toaster } from "@/components/ui/toaster"
import { Providers } from "@/components/utilities/providers"
import { TailwindIndicator } from "@/components/utilities/tailwind-indicator"
import { cn } from "@/app/manufacturing/lib/utils"
import { ConfettiProvider } from "@/app/manufacturing/lib/hooks/use-confetti"
import { ClerkProvider } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CellFlow | Optimize Manufacturing",
  description:
    "CellFlow is a manufacturing optimization platform that helps you streamline your operations, reduce costs, and increase efficiency.",
  openGraph: {
    type: "website",
    title: "CellFlow | Optimize Manufacturing",
    description:
      "Track progress, reward success. Optimize manufacturing efficiency in real-time.",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "CellFlow Manufacturing Efficiency Platform"
      }
    ],
    siteName: "CellFlow"
  },
  twitter: {
    card: "summary_large_image",
    title: "CellFlow | Optimize Manufacturing",
    description:
      "Track progress, reward success. Optimize manufacturing efficiency in real-time.",
    images: ["/hero.png"]
  }
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (userId) {
    const profileRes = await getProfileByUserIdAction(userId)
    if (!profileRes.isSuccess) {
      await createProfileAction({ userId })
    }
  }

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={cn(
            "bg-background mx-auto min-h-screen w-full scroll-smooth antialiased",
            inter.className
          )}
        >
          <Providers
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <ConfettiProvider>
              {children}

              <TailwindIndicator />

              <Toaster />
            </ConfettiProvider>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
