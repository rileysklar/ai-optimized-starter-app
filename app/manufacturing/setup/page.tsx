"use server"

import { getSetupTimesAction } from "@/actions/db/setup-times-actions"
import { getCellsAction } from "@/actions/db/cells-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { SetupTimesManager } from "../_components/setup-times-manager"
import { SetupTimesSkeleton } from "../_components/setup-times-skeleton"

export const metadata = {
  title: "Setup Times | Manufacturing",
  description: "Configure machine setup times"
}

export default async function SetupTimesPage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Setup Times</h1>
      </div>

      <p className="text-muted-foreground">
        Configure standard setup times for each machine across different cells.
        These times will be used in efficiency calculations.
      </p>

      <Suspense fallback={<SetupTimesSkeleton />}>
        <SetupTimesContent userId={userId} />
      </Suspense>
    </div>
  )
}

async function SetupTimesContent({ userId }: { userId: string }) {
  // Fetch cells and setup times
  const { data: cells } = await getCellsAction()
  const { data: setupTimes } = await getSetupTimesAction()

  return (
    <SetupTimesManager
      userId={userId}
      initialCells={cells || []}
      initialSetupTimes={setupTimes || []}
    />
  )
}
