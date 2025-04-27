"use client"

import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type InventoryItem = {
  blood_type: string
  rh?: string
  count: number
  total_amount: number
}

type DynamicChartProps = {
  redBlood: InventoryItem[]
  plasma: InventoryItem[]
  platelets: InventoryItem[]
}

export default function DynamicChart({ redBlood, plasma, platelets }: DynamicChartProps) {
  // Process data for chart
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

  // Helper function to find inventory item by blood type and rh
  const findRedBloodItem = (fullType: string) => {
    // Parse blood type and rh from the full type
    let bloodType, rh

    if (fullType.includes("+") || fullType.includes("-")) {
      if (fullType.startsWith("AB")) {
        bloodType = "AB"
        rh = fullType.substring(2) // Get the + or - after AB
      } else {
        bloodType = fullType.charAt(0) // A, B, or O
        rh = fullType.substring(1) // Get the + or - after the blood type
      }

      return redBlood.find((item) => item.blood_type === bloodType && item.rh === rh)
    }
    return null
  }

  const findPlasmaItem = (fullType: string) => {
    // For plasma, we now include Rh factor
    let bloodType, rh

    if (fullType.includes("+") || fullType.includes("-")) {
      if (fullType.startsWith("AB")) {
        bloodType = "AB"
        rh = fullType.substring(2) // Get the + or - after AB
      } else {
        bloodType = fullType.charAt(0) // A, B, or O
        rh = fullType.substring(1) // Get the + or - after the blood type
      }

      return plasma.find((item) => item.blood_type === bloodType && item.rh === rh)
    }
    return null
  }

  const findPlateletsItem = (fullType: string) => {
    // Parse blood type and rh from the full type
    let bloodType, rh

    if (fullType.includes("+") || fullType.includes("-")) {
      if (fullType.startsWith("AB")) {
        bloodType = "AB"
        rh = fullType.substring(2) // Get the + or - after AB
      } else {
        bloodType = fullType.charAt(0) // A, B, or O
        rh = fullType.substring(1) // Get the + or - after the blood type
      }

      return platelets.find((item) => item.blood_type === bloodType && item.rh === rh)
    }
    return null
  }

  // Prepare data for chart
  const redBloodData = bloodTypes.map((type) => {
    const item = findRedBloodItem(type)
    return item ? Number(item.total_amount) : 0
  })

  const plasmaData = bloodTypes.map((type) => {
    const item = findPlasmaItem(type)
    return item ? Number(item.total_amount) : 0
  })

  const plateletsData = bloodTypes.map((type) => {
    const item = findPlateletsItem(type)
    return item ? Number(item.total_amount) : 0
  })

  // Chart data
  const data = {
    labels: bloodTypes,
    datasets: [
      {
        label: "Red Blood Cells (ml)",
        data: redBloodData,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Plasma (ml)",
        data: plasmaData,
        backgroundColor: "rgba(255, 206, 86, 0.5)",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 1,
      },
      {
        label: "Platelets (ml)",
        data: plateletsData,
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  }

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Blood Inventory by Type",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (ml)",
        },
      },
    },
  }

  return <Bar data={data} options={options} />
}
