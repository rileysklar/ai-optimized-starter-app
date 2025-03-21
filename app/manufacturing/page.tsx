import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { HourXHourTracker } from "@/app/manufacturing/_components/hour-x-hour-tracker"
import { ProductionTrackerSkeleton } from "@/app/manufacturing/_components/production-tracker-skeleton"
import { getCellsAction } from "@/actions/db/cells-actions"
import { getPartsAction } from "@/actions/db/parts-actions"
import { getActiveShiftByUserIdAction } from "@/actions/db/shifts-actions"
import { ManufacturingNavbar } from "@/app/manufacturing/_components/manufacturing-navbar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "Production Tracking | Manufacturing",
  description: "Real-time production efficiency tracking"
}

export default async function ManufacturingPage() {
  "use server"

  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="container py-6">
      <Suspense fallback={<ProductionTrackerSkeleton />}>
        <ProductionTrackerContent userId={userId} />
      </Suspense>
    </div>
  )
}

async function ProductionTrackerContent({ userId }: { userId: string }) {
  "use server"

  // Fetch cells and parts from server actions
  const { data: cells } = await getCellsAction()
  const { data: parts } = await getPartsAction()
  const { data: activeShift } = await getActiveShiftByUserIdAction(userId)

  // Provide mock cells if none exist in the database yet
  let availableCells = cells || []
  if (availableCells.length === 0) {
    availableCells = [
      {
        id: "mock-cell-1",
        name: "Assembly Cell 1",
        description: "Main assembly cell",
        valueStreamId: "mock-value-stream-1",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  // If no parts are available, show an alert
  if (!parts || parts.length === 0) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>No parts available</AlertTitle>
          <AlertDescription>
            You need to create parts before you can track production. Please add
            parts in the Parts Management section.
          </AlertDescription>
        </Alert>

        <Button asChild>
          <Link href="/manufacturing/input">Go to Parts Management</Link>
        </Button>
      </div>
    )
  }

  return (
    <HourXHourTracker userId={userId} parts={parts} cells={availableCells} />
  )
}
