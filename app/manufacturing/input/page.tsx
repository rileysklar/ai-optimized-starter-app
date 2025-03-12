import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ManufacturingNavbar } from "@/app/manufacturing/_components/manufacturing-navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getCellsAction } from "@/actions/db/cells-actions"
import { getPartsAction } from "@/actions/db/parts-actions"
import { PartsManager } from "@/app/manufacturing/_components/parts-manager"
import { SetupTimesManager } from "@/app/manufacturing/_components/setup-times-manager"
import { SetupTimesSkeleton } from "@/app/manufacturing/_components/setup-times-skeleton"

export const metadata = {
  title: "Data Input | Manufacturing",
  description: "Enter production data and manage parts"
}

export default async function InputPage() {
  "use server"

  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="container py-6">
      <Suspense fallback={<InputSkeleton />}>
        <InputContent userId={userId} />
      </Suspense>
    </div>
  )
}

function InputSkeleton() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="parts" className="w-full">
        <TabsList className="mb-4 grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="setup">Setup Times</TabsTrigger>
          <TabsTrigger value="downtime">Downtime</TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

async function InputContent({ userId }: { userId: string }) {
  "use server"

  // Fetch data for forms
  const { data: cells } = await getCellsAction()
  const { data: parts } = await getPartsAction()

  return (
    <Tabs defaultValue="parts" className="w-full">
      <TabsList className="mb-4 grid max-w-md grid-cols-3">
        <TabsTrigger value="parts">Parts</TabsTrigger>
        <TabsTrigger value="setup">Setup Times</TabsTrigger>
        <TabsTrigger value="downtime">Downtime</TabsTrigger>
      </TabsList>

      <TabsContent value="parts">
        <PartsManager userId={userId} initialParts={parts || []} />
      </TabsContent>

      <TabsContent value="setup">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Setup Times</CardTitle>
            <CardDescription>
              Configure standard setup times for machines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cells && cells.length > 0 ? (
              <SetupTimesManager
                userId={userId}
                initialCells={cells}
                initialSetupTimes={[]}
              />
            ) : (
              <div className="text-muted-foreground p-4 text-center">
                <p>No cells available. Please create cells first.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="downtime">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Downtime Reasons</CardTitle>
            <CardDescription>
              Manage standard downtime reasons and categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground p-4 text-center">
              <p>Downtime reasons management will be implemented here.</p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
