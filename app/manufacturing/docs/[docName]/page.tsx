import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import fs from "fs/promises"
import path from "path"
import { DocViewer } from "@/app/manufacturing/_components/doc-viewer"
import { DocViewerSkeleton } from "@/app/manufacturing/_components/doc-viewer-skeleton"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Documentation | Manufacturing",
  description: "User documentation for Manufacturing Efficiency Tracking System"
}

interface DocsPageProps {
  params: {
    docName: string
  }
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { userId } = await auth()

  if (!userId) {
    return redirect("/login")
  }

  return (
    <div className="container py-6">
      <Suspense fallback={<DocViewerSkeleton />}>
        <DocPageContent docName={params.docName} />
      </Suspense>
    </div>
  )
}

async function DocPageContent({ docName }: { docName: string }) {
  "use server"

  // Get a list of available docs
  const docsDir = path.join(process.cwd(), "docs")
  let docFiles

  try {
    docFiles = await fs.readdir(docsDir)
  } catch (error) {
    console.error("Error reading docs directory:", error)
    return (
      <div className="text-destructive">
        <p>Error loading documentation. Please contact your administrator.</p>
      </div>
    )
  }

  // Find the requested doc file
  let content
  let filename = `${docName}.md`

  try {
    const docPath = path.join(docsDir, filename)
    content = await fs.readFile(docPath, "utf-8")
  } catch (error) {
    console.error(`Error reading doc file ${filename}:`, error)
    return notFound()
  }

  // Load all doc files for navigation
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
          <ul className="space-y-2">
            {docs.map(doc => (
              <li key={doc.filename}>
                <a
                  href={doc.path}
                  className={`block py-1 ${
                    doc.filename === filename
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary hover:underline"
                  }`}
                >
                  {doc.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="w-[100%] overflow-auto">
        <DocViewer content={content} />
      </div>
    </div>
  )
}
