"use client"

import { useEffect, useState } from "react"
import BloodInventoryWarnings from "./blood-inventory-warnings"

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

type RealTimeInventoryWarningsProps = {
  initialRedBlood: InventoryItem[]
  initialPlasma: InventoryItem[]
  initialPlatelets: InventoryItem[]
  hospitalId: number
  refreshInterval?: number // in milliseconds
}

export default function RealTimeInventoryWarnings({
  initialRedBlood,
  initialPlasma,
  initialPlatelets,
  hospitalId,
  refreshInterval = 60000, // Default to 1 minute
}: RealTimeInventoryWarningsProps) {
  const [redBlood, setRedBlood] = useState(initialRedBlood)
  const [plasma, setPlasma] = useState(initialPlasma)
  const [platelets, setPlatelets] = useState(initialPlatelets)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initial data is already provided via props
    const fetchInventoryData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch updated inventory data
        const [redBloodRes, plasmaRes, plateletsRes] = await Promise.all([
          fetch(`/api/inventory/redblood?hospitalId=${hospitalId}`),
          fetch(`/api/inventory/plasma?hospitalId=${hospitalId}`),
          fetch(`/api/inventory/platelets?hospitalId=${hospitalId}`),
        ])

        if (!redBloodRes.ok || !plasmaRes.ok || !plateletsRes.ok) {
          throw new Error("Failed to fetch inventory data")
        }

        const [redBloodData, plasmaData, plateletsData] = await Promise.all([
          redBloodRes.json(),
          plasmaRes.json(),
          plateletsRes.json(),
        ])

        setRedBlood(redBloodData)
        setPlasma(plasmaData)
        setPlatelets(plateletsData)
      } catch (err) {
        console.error("Error fetching inventory data:", err)
        setError("Failed to refresh inventory data")
      } finally {
        setLoading(false)
      }
    }

    // Set up interval for periodic updates
    const intervalId = setInterval(fetchInventoryData, refreshInterval)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [hospitalId, refreshInterval])

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 text-red-700">
        <p>{error}</p>
        <p className="text-sm mt-1">Using last available data</p>
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div className="absolute top-2 right-2">
          <div className="animate-pulse h-2 w-2 rounded-full bg-blue-500"></div>
        </div>
      )}
      <BloodInventoryWarnings redBlood={redBlood} plasma={plasma} platelets={platelets} />
    </>
  )
}
