import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import fs from "fs/promises"
import path from "path"
import { DocViewer } from "@/app/manufacturing/_components/doc-viewer"
import { DocViewerSkeleton } from "@/app/manufacturing/_components/doc-viewer-skeleton"

export const metadata = {
  title: "Documentation | Manufacturing",
  description: "User documentation for Manufacturing Efficiency Tracking System"
}

export default async function DocsPage() {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="container py-6">
      <Suspense fallback={<DocViewerSkeleton />}>
        <DocPageContent />
      </Suspense>
    </div>
  )
}

async function DocPageContent() {
  "use server"

  // Get a list of available docs
  const docsDir = path.join(process.cwd(), "docs")
  const docFiles = await fs.readdir(docsDir)

  // Read the getting-started.md file by default
  const defaultDocPath = path.join(docsDir, "getting-started.md")
  const content = await fs.readFile(defaultDocPath, "utf-8")

  const docs = await Promise.all(
    docFiles.map(async filename => {
      const filePath = path.join(docsDir, filename)
      // Extract title from first line of markdown
      const fileContent = await fs.readFile(filePath, "utf-8")
      const firstLine = fileContent.split("\n")[0]
      const title =
        firstLine.replace(/^#\s+/, "") || filename.replace(".md", "")

      return {
        title,
        filename,
        path: `/manufacturing/docs/${filename.replace(".md", "")}`
      }
    })
  )

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
      <div className="md:sticky md:top-6 md:h-[calc(100vh-8rem)] md:self-start">
        <div className="bg-card max-h-full overflow-auto rounded-lg p-4 shadow">
          <h3 className="mb-3 text-lg font-medium">Documentation</h3>
          <ul className="space-y-2">
            {docs.map(doc => (
              <li key={doc.filename}>
                <a
                  href={doc.path}
                  className="text-primary block py-1 hover:underline"
                >
                  {doc.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="w-full overflow-auto">
        <DocViewer content={content} />
      </div>
    </div>
  )
}
