"use server"

import { db } from "@/db/db"
import { ActionState } from "@/types"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { InsertCompany, SelectCompany, companiesTable } from "@/db/schema"

// Validation schema for companies
const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  website: z.string().url("Invalid website URL").optional()
})

type CompanyInput = z.infer<typeof companySchema>

// Create a new company
export async function createCompanyAction(data: CompanyInput): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = companySchema.parse(data)
    
    // Insert company into database
    const [newCompany] = await db.insert(companiesTable).values(validatedData).returning()
    
    return {
      isSuccess: true,
      message: "Company created successfully",
      data: newCompany
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid company data"
      }
    }
    
    console.error("Error creating company:", error)
    return {
      isSuccess: false,
      message: "Failed to create company"
    }
  }
}

// Get all companies
export async function getCompaniesAction(): Promise<ActionState<SelectCompany[]>> {
  try {
    const companies = await db
      .select()
      .from(companiesTable)
      .orderBy(companiesTable.name)
    
    return {
      isSuccess: true,
      message: "Companies retrieved successfully",
      data: companies
    }
  } catch (error) {
    console.error("Error getting companies:", error)
    return {
      isSuccess: false,
      message: "Failed to get companies"
    }
  }
}

// Get a company by ID
export async function getCompanyByIdAction(companyId: string): Promise<ActionState<any>> {
  try {
    const company = await db.query.companies.findFirst({
      where: eq(companiesTable.id, companyId),
      with: {
        sites: true
      }
    })
    
    if (!company) {
      return {
        isSuccess: false,
        message: "Company not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Company retrieved successfully",
      data: company
    }
  } catch (error) {
    console.error("Error getting company:", error)
    return {
      isSuccess: false,
      message: "Failed to get company"
    }
  }
}

// Update a company
export async function updateCompanyAction(companyId: string, data: Partial<CompanyInput>): Promise<ActionState<any>> {
  try {
    // Validate input
    const validatedData = companySchema.partial().parse(data)
    
    // Update company in database
    const [updatedCompany] = await db
      .update(companiesTable)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(companiesTable.id, companyId))
      .returning()
    
    if (!updatedCompany) {
      return {
        isSuccess: false,
        message: "Company not found"
      }
    }
    
    return {
      isSuccess: true,
      message: "Company updated successfully",
      data: updatedCompany
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isSuccess: false,
        message: error.errors[0].message || "Invalid company data"
      }
    }
    
    console.error("Error updating company:", error)
    return {
      isSuccess: false,
      message: "Failed to update company"
    }
  }
}

// Delete a company
export async function deleteCompanyAction(companyId: string): Promise<ActionState<void>> {
  try {
    await db.delete(companiesTable).where(eq(companiesTable.id, companyId))
    
    return {
      isSuccess: true,
      message: "Company deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting company:", error)
    return {
      isSuccess: false,
      message: "Failed to delete company"
    }
  }
} 