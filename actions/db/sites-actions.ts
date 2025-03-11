"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { sitesTable, companiesTable, SelectSite } from "@/db/schema"

// Validation schema for sites
const siteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  location: z.string().optional(),
  companyId: z.string().uuid("Invalid company ID")
})

type SiteInput = z.infer<typeof siteSchema>

// Create a new site
export async function createSiteAction(data: SiteInput): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = siteSchema.parse(data)
    
    // Insert site into database
    const [newSite] = await db.insert(sitesTable).values(validatedData).returning()
    
    return {
      isSuccess: true,
      message: "Site created successfully",
      data: newSite
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid site data"
      }
    }
    
    console.error("Error creating site:", error)
    return {
      isSuccess: false,
      message: "Failed to create site"
    }
  }
}

// Get all sites
export async function getSitesAction(): Promise<ActionState<SelectSite[]>> {
  try {
    const sites = await db
      .select()
      .from(sitesTable)
      .orderBy(sitesTable.name)
    
    return {
      isSuccess: true,
      message: "Sites retrieved successfully",
      data: sites
    }
  } catch (error) {
    console.error("Error getting sites:", error)
    return {
      isSuccess: false,
      message: "Failed to get sites"
    }
  }
}

// Get sites by company ID
export async function getSitesByCompanyIdAction(companyId: string): Promise<ActionState<SelectSite[]>> {
  try {
    const sites = await db
      .select()
      .from(sitesTable)
      .where(eq(sitesTable.companyId, companyId))
      .orderBy(sitesTable.name)
    
    return {
      isSuccess: true,
      message: "Sites retrieved successfully",
      data: sites
    }
  } catch (error) {
    console.error("Error getting sites:", error)
    return {
      isSuccess: false,
      message: "Failed to get sites"
    }
  }
}

// Get a site by ID
export async function getSiteByIdAction(siteId: string): Promise<ActionState<any>> {
  try {
    const site = await db.query.sites.findFirst({
      where: eq(sitesTable.id, siteId),
      with: {
        company: true
      }
    })
    
    if (!site) {
      return {
        isSuccess: false,
        message: "Site not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Site retrieved successfully",
      data: site
    }
  } catch (error) {
    console.error("Error getting site:", error)
    return {
      isSuccess: false,
      message: "Failed to get site"
    }
  }
}

// Update a site
export async function updateSiteAction(siteId: string, data: Partial<SiteInput>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = siteSchema.partial().parse(data)
    
    // Update site in database
    const [updatedSite] = await db
      .update(sitesTable)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(sitesTable.id, siteId))
      .returning()
    
    if (!updatedSite) {
      return {
        isSuccess: false,
        message: "Site not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Site updated successfully",
      data: updatedSite
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid site data"
      }
    }
    
    console.error("Error updating site:", error)
    return {
      isSuccess: false,
      message: "Failed to update site"
    }
  }
}

// Delete a site
export async function deleteSiteAction(siteId: string): Promise<ActionState<void>> {
  try {
    await db.delete(sitesTable).where(eq(sitesTable.id, siteId))
    
    return {
      isSuccess: true,
      message: "Site deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting site:", error)
    return {
      isSuccess: false,
      message: "Failed to delete site"
    }
  }
} 