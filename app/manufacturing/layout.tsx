import { getProfileByUserIdAction } from "@/actions/db/profiles-actions"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { ManufacturingNavbar } from "./_components/manufacturing-navbar"

export const metadata = {
  title: "Manufacturing | AI-Optimized Starter App",
  description: "Track and optimize manufacturing efficiency"
}

export default async function ManufacturingLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  const { data: profile } = await getProfileByUserIdAction(userId)

  if (!profile) {
    return redirect("/signup")
  }

  // Verify user has access to manufacturing features
  if (
    profile.role !== "admin" &&
    profile.role !== "supervisor" &&
    profile.role !== "operator"
  ) {
    return redirect("/")
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <ManufacturingNavbar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
