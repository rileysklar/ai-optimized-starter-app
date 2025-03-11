import { ActionState } from "@/types"
import { SelectMachine } from "@/db/schema"

declare module "@/actions/db/machines-actions" {
  export function getMachinesAction(): Promise<ActionState<SelectMachine[]>>
  export function getMachinesByCellIdAction(
    cellId: string
  ): Promise<ActionState<SelectMachine[]>>
  export function getMachineByIdAction(
    machineId: string
  ): Promise<ActionState<any>>
  export function createMachineAction(
    data: any
  ): Promise<ActionState<SelectMachine>>
  export function updateMachineAction(
    id: string,
    data: any
  ): Promise<ActionState<SelectMachine>>
  export function deleteMachineAction(id: string): Promise<ActionState<void>>
}
