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
import { getMachinesAction } from "@/actions/db/machines-actions"
import { getCellsAction } from "@/actions/db/cells-actions"
import { MachinesManager } from "../_components/machines-manager"
import { ManufacturingNavbar } from "../_components/manufacturing-navbar"

export const metadata = {
  title: "Manage Machines | Manufacturing",
  description: "Manage production machines and their cell assignments"
}

export default function MachinesManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mt-8">
        <h1 className="mb-6 text-3xl font-bold">Machine Management</h1>

        <Suspense fallback={<MachinesLoading />}>
          <MachinesContent />
        </Suspense>
      </div>
    </div>
  )
}

function MachinesLoading() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Production Machines</CardTitle>
        <CardDescription>Manage all production machines</CardDescription>
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

async function MachinesContent() {
  "use server"

  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // Fetch machines and cells
  const [machinesResult, cellsResult] = await Promise.all([
    getMachinesAction(),
    getCellsAction()
  ])

  // Check if fetching was successful
  if (!machinesResult.isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>Failed to load machines</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Could not load machines data. {machinesResult.message}</p>
        </CardContent>
      </Card>
    )
  }

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

  return (
    <MachinesManager
      userId={userId}
      initialMachines={machinesResult.data}
      cells={cellsResult.data}
    />
  )
}
