export interface ElsatChannel {
  lcn: number
  name: string
  frequency: string
  transponder: number
  serviceId: number
}

export const channelsElsat: ElsatChannel[] = []
