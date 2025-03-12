"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ManufacturingNavbar } from "@/app/manufacturing/_components/manufacturing-navbar"
import { ProductionHistoryViewer } from "@/app/manufacturing/_components/production-history-viewer"
import { Skeleton } from "@/components/ui/skeleton"
import { getCellsAction } from "@/actions/db/cells-actions"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Production History | Manufacturing",
    description: "View historical production data and efficiency metrics"
  }
}

export default async function HistoryPage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="container py-6">
      <Suspense fallback={<HistorySkeleton />}>
        <HistoryContent userId={userId} />
      </Suspense>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-[600px] w-full rounded-lg" />
    </div>
  )
}

async function HistoryContent({ userId }: { userId: string }) {
  // Fetch cells for filtering
  const { data: cells } = await getCellsAction()

  return <ProductionHistoryViewer userId={userId} initialCells={cells || []} />
}
