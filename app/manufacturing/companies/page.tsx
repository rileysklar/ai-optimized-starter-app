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
import { getCompaniesAction } from "@/actions/db/companies-actions"
import { CompaniesManager } from "../_components/companies-manager"
import { ManufacturingNavbar } from "../_components/manufacturing-navbar"

export const metadata = {
  title: "Manage Companies | Manufacturing",
  description: "Manage manufacturing companies and their details"
}

export default function CompaniesManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mt-8">
        <Suspense fallback={<CompaniesLoading />}>
          <CompaniesContent />
        </Suspense>
      </div>
    </div>
  )
}

function CompaniesLoading() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Manufacturing Companies</CardTitle>
        <CardDescription>Manage all manufacturing companies</CardDescription>
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

async function CompaniesContent() {
  "use server"

  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // Fetch companies
  const companiesResult = await getCompaniesAction()

  // Check if fetching was successful
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
    <CompaniesManager userId={userId} initialCompanies={companiesResult.data} />
  )
}
