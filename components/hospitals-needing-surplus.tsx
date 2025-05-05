"use client"

import { useEffect, useState } from "react"
import { formatBloodType, getBloodTypeColor } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowRightLeft, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { SurplusItem } from "@/lib/surplus-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

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
  const [selectedHospital, setSelectedHospital] = useState<SurplusItem | null>(null)
  const [transferAmount, setTransferAmount] = useState<number>(0)
  const [transferUnits, setTransferUnits] = useState<number>(0)
  const [isTransferring, setIsTransferring] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

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

  const handleTransferClick = (hospital: SurplusItem) => {
    setSelectedHospital(hospital)
    // Set default values based on the hospital's needs
    const suggestedUnits = Math.min(5, hospital.yourCount - hospital.count)
    setTransferUnits(suggestedUnits > 0 ? suggestedUnits : 1)
    setTransferAmount(suggestedUnits * 450) // Assuming 450ml per unit
    setDialogOpen(true)
  }

  const handleTransferSubmit = async () => {
    if (!selectedHospital) return

    try {
      setIsTransferring(true)

      const response = await fetch("/api/surplus/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromHospitalId: hospitalId,
          toHospitalId: selectedHospital.hospitalId,
          type: selectedHospital.type,
          bloodType: selectedHospital.bloodType,
          rh: selectedHospital.rh,
          amount: transferAmount,
          units: transferUnits,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to record transfer")
      }

      // Success
      toast({
        title: "Transfer recorded successfully",
        description: `${transferUnits} units of ${formatBloodType(selectedHospital.bloodType, selectedHospital.rh)} ${selectedHospital.type} transferred to ${selectedHospital.hospitalName}`,
      })

      // Close dialog and refresh data
      setDialogOpen(false)

      // Remove the transferred hospital from the list or update its count
      setHospitals((prevHospitals) =>
        prevHospitals.filter(
          (h) =>
            !(
              h.hospitalId === selectedHospital.hospitalId &&
              h.type === selectedHospital.type &&
              h.bloodType === selectedHospital.bloodType &&
              h.rh === selectedHospital.rh
            ),
        ),
      )
    } catch (err) {
      console.error("Error recording transfer:", err)
      toast({
        title: "Transfer failed",
        description: err instanceof Error ? err.message : "An error occurred while recording the transfer",
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
    }
  }

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
                  <Button variant="outline" size="sm" className="h-7" onClick={() => handleTransferClick(hospital)}>
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1" />
                    Transfer
                  </Button>

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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Blood Components</DialogTitle>
              <DialogDescription>Record a transfer of blood components to another hospital.</DialogDescription>
            </DialogHeader>

            {selectedHospital && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipient">Recipient Hospital</Label>
                    <div id="recipient" className="font-medium mt-1">
                      {selectedHospital.hospitalName}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bloodType">Blood Type</Label>
                    <div id="bloodType" className="font-medium mt-1">
                      <Badge className={getBloodTypeColor(selectedHospital.bloodType, selectedHospital.rh)}>
                        {formatBloodType(selectedHospital.bloodType, selectedHospital.rh)}
                      </Badge>{" "}
                      {selectedHospital.type}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="units">Units to Transfer</Label>
                    <Input
                      id="units"
                      type="number"
                      min="1"
                      max={selectedHospital.yourCount}
                      value={transferUnits}
                      onChange={(e) => {
                        const units = Number.parseInt(e.target.value)
                        setTransferUnits(units)
                        setTransferAmount(units * 450) // Assuming 450ml per unit
                      }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount (ml)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="100"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(Number.parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleTransferSubmit}
                disabled={isTransferring || transferUnits <= 0 || transferAmount <= 0}
              >
                {isTransferring ? "Recording..." : "Record Transfer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
