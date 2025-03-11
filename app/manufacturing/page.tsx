import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { HourXHourTracker } from "@/app/manufacturing/_components/hour-x-hour-tracker"
import { ProductionTrackerSkeleton } from "@/app/manufacturing/_components/production-tracker-skeleton"
import { getCellsAction } from "@/actions/db/cells-actions"
import { getPartsAction } from "@/actions/db/parts-actions"
import { SelectCell, SelectPart } from "@/db/schema"

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
      <h1 className="mb-4 text-3xl font-bold">Manufacturing</h1>

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

  // Log available parts for debugging
  console.log("Available parts:", parts)
  console.log("Available cells:", availableCells)

  // Create a variable to hold the parts we'll use
  let availableParts: SelectPart[] = []

  // Add any existing parts
  if (parts && parts.length > 0) {
    availableParts = [...parts]
  }

  // Ensure we have at least one part for testing
  if (availableParts.length === 0) {
    // Add a mock part if none exist
    availableParts = [
      {
        id: "mock-part-1",
        partNumber: "TEST-1001",
        description: "Test Part",
        cycleTimeMachine1: 10,
        cycleTimeMachine2: 15,
        cycleTimeMachine3: 12,
        cycleTimeMachine4: 8,
        bottleneckMachine: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
  }

  return (
    <HourXHourTracker
      userId={userId}
      parts={availableParts}
      cells={availableCells}
    />
  )
}
