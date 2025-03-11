import { ActionState } from "@/types"
import { SelectSite } from "@/db/schema"

declare module "@/actions/db/sites-actions" {
  export function getSitesAction(): Promise<ActionState<SelectSite[]>>
  export function getSitesByCompanyIdAction(
    companyId: string
  ): Promise<ActionState<SelectSite[]>>
  export function getSiteByIdAction(siteId: string): Promise<ActionState<any>>
  export function createSiteAction(data: any): Promise<ActionState<any>>
  export function updateSiteAction(
    id: string,
    data: any
  ): Promise<ActionState<any>>
  export function deleteSiteAction(id: string): Promise<ActionState<void>>
}
