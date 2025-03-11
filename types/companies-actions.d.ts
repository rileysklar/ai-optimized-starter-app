import { ActionState } from "@/types"
import { SelectCompany } from "@/db/schema"

declare module "@/actions/db/companies-actions" {
  export function getCompaniesAction(): Promise<ActionState<SelectCompany[]>>
  export function getCompanyByIdAction(
    companyId: string
  ): Promise<ActionState<any>>
  export function createCompanyAction(data: any): Promise<ActionState<any>>
  export function updateCompanyAction(
    id: string,
    data: any
  ): Promise<ActionState<any>>
  export function deleteCompanyAction(id: string): Promise<ActionState<void>>
}
