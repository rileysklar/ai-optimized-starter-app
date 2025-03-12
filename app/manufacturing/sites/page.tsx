import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getSitesAction } from "@/actions/db/sites-actions"
import { getCompaniesAction } from "@/actions/db/companies-actions"
import { SitesManager } from "../_components/sites-manager"
import { ManufacturingNavbar } from "../_components/manufacturing-navbar"

export const metadata = {
  title: "Manage Sites | Manufacturing",
  description: "Manage manufacturing sites and their company assignments"
}

export default function SitesManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mt-8">
        <Suspense fallback={<SitesLoading />}>
          <SitesContent />
        </Suspense>
      </div>
    </div>
  )
}

function SitesLoading() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Manufacturing Sites</CardTitle>
        <CardDescription>Manage all manufacturing sites</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="w-64">
            <Skeleton className="h-8 w-full" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

async function SitesContent() {
  "use server"

  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // Fetch sites and companies
  const [sitesResult, companiesResult] = await Promise.all([
    getSitesAction(),
    getCompaniesAction()
  ])

  // Check if fetching was successful
  if (!sitesResult.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load sites</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Could not load sites data. {sitesResult.message}</p>
        </CardContent>
      </Card>
    )
  }

  if (!companiesResult.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load companies</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Could not load companies data. {companiesResult.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <SitesManager
      userId={userId}
      initialSites={sitesResult.data}
      companies={companiesResult.data}
    />
  )
}
