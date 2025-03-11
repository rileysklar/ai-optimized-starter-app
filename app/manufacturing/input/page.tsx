"use server"

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

export const metadata = {
  title: "Data Input | Manufacturing",
  description: "Enter production data and manage parts"
}

export default async function InputPage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="container py-6">
      <h1 className="mb-4 text-3xl font-bold">Manufacturing</h1>
      <ManufacturingNavbar />

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
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Parts Management</CardTitle>
            <CardDescription>
              Add, edit, or remove parts and their cycle times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground p-4 text-center">
              <p>Parts management form will be implemented here.</p>
              <p className="mt-2">Total parts: {parts?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
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
            <div className="text-muted-foreground p-4 text-center">
              <p>Setup times configuration will be implemented here.</p>
              <p className="mt-2">Cells available: {cells?.length || 0}</p>
            </div>
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
