"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function DocViewerSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
      <div className="md:sticky md:top-6 md:h-[calc(100vh-8rem)] md:self-start">
        <Card className="max-h-full overflow-auto p-4">
          <Skeleton className="mb-4 h-6 w-1/2" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </Card>
      </div>
      <div className="w-full overflow-auto">
        <Card className="p-6">
          <Skeleton className="mb-6 h-10 w-3/4" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>

          <Skeleton className="mb-4 mt-8 h-8 w-2/3" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>

          <Skeleton className="mb-4 mt-8 h-8 w-1/2" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
        </Card>
      </div>
    </div>
  )
}
