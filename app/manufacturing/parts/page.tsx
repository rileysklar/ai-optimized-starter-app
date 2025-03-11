"use server"

import { getPartsAction } from "@/actions/db/parts-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PartsManager } from "../_components/parts-manager"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Parts Management | Manufacturing",
  description: "Manage part definitions and cycle times"
}

export default async function PartsPage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Parts Management</h1>
      </div>

      <p className="text-muted-foreground">
        Create and manage part definitions, including standard cycle times for
        each machine. The bottleneck machine is automatically detected based on
        the longest cycle time.
      </p>

      <Suspense fallback={<PartsPageSkeleton />}>
        <PartsContent userId={userId} />
      </Suspense>
    </div>
  )
}

function PartsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="rounded-lg border p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>

          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

async function PartsContent({ userId }: { userId: string }) {
  // Fetch parts data
  const { data: parts } = await getPartsAction()

  return <PartsManager userId={userId} initialParts={parts || []} />
}
