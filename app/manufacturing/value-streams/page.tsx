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
import { getValueStreamsAction } from "@/actions/db/value-streams-actions"
import { getSitesAction } from "@/actions/db/sites-actions"
import { ValueStreamsManager } from "../_components/value-streams-manager"
import { ManufacturingNavbar } from "../_components/manufacturing-navbar"

export const metadata = {
  title: "Manage Value Streams | Manufacturing",
  description: "Manage production value streams and their site assignments"
}

export default function ValueStreamsManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mt-8">
        <h1 className="mb-6 text-3xl font-bold">Value Stream Management</h1>

        <Suspense fallback={<ValueStreamsLoading />}>
          <ValueStreamsContent />
        </Suspense>
      </div>
    </div>
  )
}

function ValueStreamsLoading() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Value Streams</CardTitle>
        <CardDescription>Manage all value streams</CardDescription>
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

async function ValueStreamsContent() {
  "use server"

  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // Fetch value streams and sites
  const [valueStreamsResult, sitesResult] = await Promise.all([
    getValueStreamsAction(),
    getSitesAction()
  ])

  // Check if fetching was successful
  if (!valueStreamsResult.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load value streams</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Could not load value streams data. {valueStreamsResult.message}</p>
        </CardContent>
      </Card>
    )
  }

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

  return (
    <ValueStreamsManager
      userId={userId}
      initialValueStreams={valueStreamsResult.data}
      sites={sitesResult.data}
    />
  )
}
