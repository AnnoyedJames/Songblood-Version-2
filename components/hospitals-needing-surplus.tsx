"use client"

import { useEffect, useState } from "react"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { SurplusItem } from "@/lib/surplus-utils"

type HospitalsNeedingSurplusProps = {
  initialHospitals: SurplusItem[]
  hospitalId: number
  refreshInterval?: number
  className?: string
}

export default function HospitalsNeedingSurplus({
  initialHospitals,
  hospitalId,
  refreshInterval = 60000, // Default to 1 minute
  className = "",
}: HospitalsNeedingSurplusProps) {
  const [hospitals, setHospitals] = useState<SurplusItem[]>(initialHospitals)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/surplus/needed?hospitalId=${hospitalId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch hospitals needing surplus")
        }

        const data = await response.json()
        setHospitals(data)
      } catch (err) {
        console.error("Error fetching hospitals needing surplus:", err)
        setError("Failed to refresh hospitals data")
      } finally {
        setLoading(false)
      }
    }

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchHospitals, refreshInterval)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [hospitalId, refreshInterval])

  if (hospitals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Hospitals Needing Your Surplus</CardTitle>
          <CardDescription>Hospitals that need blood components you have in surplus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4 text-muted-foreground">
            No hospitals currently need your surplus inventory.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="relative">
        <CardTitle className="text-lg">Hospitals Needing Your Surplus</CardTitle>
        <CardDescription>Hospitals that need blood components you have in surplus</CardDescription>
        {loading && (
          <div className="absolute top-4 right-4">
            <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && <div className="p-3 text-sm border rounded-lg bg-red-50 text-red-700 mb-4">{error}</div>}

          {hospitals.map((hospital, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium">
                  {hospital.hospitalName} needs <span className="font-bold">{hospital.type}</span> of{" "}
                  <Badge className={getBloodTypeColor(hospital.bloodType, hospital.rh)}>
                    {formatBloodType(hospital.bloodType, hospital.rh)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  They have {hospital.count} units (
                  {hospital.surplusLevel === "critical-low" ? (
                    <span className="text-red-600 font-semibold">CRITICAL</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">LOW</span>
                  )}
                  )
                </div>
                <div className="text-sm text-muted-foreground">
                  You have <span className="font-medium">{hospital.yourCount} units</span> in surplus
                </div>
                <div className="flex gap-2 mt-2">
                  <a
                    href={`mailto:?subject=Blood Component Information&body=Hello,%0D%0A%0D%0AWe noticed you have a need for ${hospital.type} ${formatBloodType(hospital.bloodType, hospital.rh)}.%0D%0A%0D%0APlease contact us for more information.%0D%0A%0D%0AThank you.`}
                    className="inline-flex items-center"
                  >
                    <Button variant="outline" size="sm" className="h-7">
                      <Mail className="h-3.5 w-3.5 mr-1" />
                      Contact
                    </Button>
                  </a>

                  <Link
                    href={`/surplus/details?hospital=${hospital.hospitalId}&type=${hospital.type}&bloodType=${hospital.bloodType}&rh=${hospital.rh}`}
                  >
                    <Button variant="ghost" size="sm" className="h-7">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
