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
import { getCellsAction } from "@/actions/db/cells-actions"
import { getValueStreamsAction } from "@/actions/db/value-streams-actions"
import { CellsManager } from "../_components/cells-manager"

export const metadata = {
  title: "Manage Cells | Manufacturing",
  description: "Manage production cells and their value stream assignments"
}

export default async function CellsManagementPage() {
  "use server"

  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mt-8">
        <h1 className="mb-6 text-3xl font-bold">Cell Management</h1>

        <Suspense fallback={<CellsLoading />}>
          <CellsContent userId={userId} />
        </Suspense>
      </div>
    </div>
  )
}

function CellsLoading() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Production Cells</CardTitle>
        <CardDescription>Manage all production cells</CardDescription>
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

async function CellsContent({ userId }: { userId: string }) {
  "use server"

  // Fetch cells and value streams
  const [cellsResult, valueStreamsResult] = await Promise.all([
    getCellsAction(),
    getValueStreamsAction()
  ])

  // Check if fetching was successful
  if (!cellsResult.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load cells</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Could not load cells data. {cellsResult.message}</p>
        </CardContent>
      </Card>
    )
  }

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

  return (
    <CellsManager
      userId={userId}
      initialCells={cellsResult.data}
      valueStreams={valueStreamsResult.data}
    />
  )
}
