import { ActionState } from "@/types"
import { SelectValueStream } from "@/db/schema"

declare module "@/actions/db/value-streams-actions" {
  export function getValueStreamsAction(): Promise<
    ActionState<SelectValueStream[]>
  >
  export function createValueStreamAction(data: any): Promise<ActionState<any>>
  export function updateValueStreamAction(
    id: string,
    data: any
  ): Promise<ActionState<any>>
  export function deleteValueStreamAction(
    id: string
  ): Promise<ActionState<void>>
}
