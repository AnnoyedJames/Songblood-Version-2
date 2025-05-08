type SurplusAlert = {
  type: string
  bloodType: string
  rh: string
  hospitalName: string
  hospitalId: number
  count: number
  yourCount: number
  contactPhone?: string
  contactEmail?: string
}

type SurplusAlertsProps = {
  alerts: SurplusAlert[]
}

export default function SurplusAlerts({ alerts }: SurplusAlertsProps) {
  // Return null to remove the component from rendering
  return null
}
