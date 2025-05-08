import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { dbClient } from "@/lib/db"
import { AppError, ErrorType } from "@/lib/error-handling"

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await requireAuth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Get the hospital ID from the session
    const { hospitalId } = session

    // Get URL parameters
    const url = new URL(request.url)
    const showAllHospitals = url.searchParams.get("showAllHospitals") === "true"
    const bloodType = url.searchParams.get("bloodType") || undefined
    const rhFactor = url.searchParams.get("rhFactor") || undefined
    const expirationStatus = url.searchParams.get("expirationStatus") || "valid"
    const startDate = url.searchParams.get("startDate") || undefined
    const endDate = url.searchParams.get("endDate") || undefined
    const inventoryType = url.searchParams.get("inventoryType") || "all"

    // Build base conditions for queries
    const baseConditions = []

    // Hospital condition
    if (!showAllHospitals) {
      baseConditions.push(`hospital_id = ${hospitalId}`)
    }

    // Blood type condition
    if (bloodType) {
      baseConditions.push(`blood_type = '${bloodType}'`)
    }

    // Rh factor condition (only for red blood and platelets)
    if (rhFactor) {
      baseConditions.push(`rh = '${rhFactor}'`)
    }

    // Expiration status condition
    if (expirationStatus === "valid") {
      baseConditions.push("expiration_date > CURRENT_DATE")
    } else if (expirationStatus === "expired") {
      baseConditions.push("expiration_date <= CURRENT_DATE")
    } else if (expirationStatus === "expiring-soon") {
      baseConditions.push("expiration_date > CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '7 days'")
    }

    // Date range conditions
    if (startDate) {
      baseConditions.push(`expiration_date >= '${startDate}'::date`)
    }
    if (endDate) {
      baseConditions.push(`expiration_date <= '${endDate}'::date`)
    }

    // Active condition
    baseConditions.push("active = true")

    // Combine conditions
    const whereClause = baseConditions.length > 0 ? `WHERE ${baseConditions.join(" AND ")}` : ""

    // Get summary data
    const summaryData = {
      totalCount: 0,
      validCount: 0,
      expiredCount: 0,
      expiringSoonCount: 0,
      byType: [],
    }

    // Get blood type distribution
    let bloodTypeDistribution = []

    // Get expiration distribution
    let expirationDistribution = []

    // Get hospital distribution
    let hospitalDistribution = []

    // Get expiration timeline
    let expirationTimeline = []

    // Execute queries based on inventory type
    if (inventoryType === "all" || inventoryType === "redblood") {
      // Get red blood cell data
      const redBloodQuery = `
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN expiration_date > CURRENT_DATE THEN 1 ELSE 0 END) as valid_count,
          SUM(CASE WHEN expiration_date <= CURRENT_DATE THEN 1 ELSE 0 END) as expired_count,
          SUM(CASE WHEN expiration_date > CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END) as expiring_soon_count,
          SUM(amount) as total_amount
        FROM redblood_inventory
        ${whereClause}
      `
      const redBloodSummary = await dbClient.query(redBloodQuery)

      if (redBloodSummary.length > 0) {
        summaryData.totalCount += Number(redBloodSummary[0].total_count || 0)
        summaryData.validCount += Number(redBloodSummary[0].valid_count || 0)
        summaryData.expiredCount += Number(redBloodSummary[0].expired_count || 0)
        summaryData.expiringSoonCount += Number(redBloodSummary[0].expiring_soon_count || 0)

        // Add to byType
        if (Number(redBloodSummary[0].total_count) > 0) {
          summaryData.byType.push({
            type: "Red Blood Cells",
            count: Number(redBloodSummary[0].total_count),
            totalAmount: Number(redBloodSummary[0].total_amount),
            percentage: 0, // Will calculate after all types are added
          })
        }
      }

      // Get blood type distribution for red blood
      const redBloodTypeQuery = `
        SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
        FROM redblood_inventory
        ${whereClause}
        GROUP BY blood_type, rh
        ORDER BY blood_type, rh
      `
      const redBloodTypeData = await dbClient.query(redBloodTypeQuery)

      if (redBloodTypeData.length > 0) {
        bloodTypeDistribution = [
          ...bloodTypeDistribution,
          ...redBloodTypeData.map((item: any) => ({
            bloodType: item.blood_type,
            rh: item.rh,
            count: Number(item.count),
            totalAmount: Number(item.total_amount),
            percentage: 0, // Will calculate after all data is collected
          })),
        ]
      }
    }

    if (inventoryType === "all" || inventoryType === "plasma") {
      // Get plasma data
      const plasmaQuery = `
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN expiration_date > CURRENT_DATE THEN 1 ELSE 0 END) as valid_count,
          SUM(CASE WHEN expiration_date <= CURRENT_DATE THEN 1 ELSE 0 END) as expired_count,
          SUM(CASE WHEN expiration_date > CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END) as expiring_soon_count,
          SUM(amount) as total_amount
        FROM plasma_inventory
        ${whereClause.replace("rh = '" + (rhFactor || "") + "' AND ", "")} 
      `
      const plasmaSummary = await dbClient.query(plasmaQuery)

      if (plasmaSummary.length > 0) {
        summaryData.totalCount += Number(plasmaSummary[0].total_count || 0)
        summaryData.validCount += Number(plasmaSummary[0].valid_count || 0)
        summaryData.expiredCount += Number(plasmaSummary[0].expired_count || 0)
        summaryData.expiringSoonCount += Number(plasmaSummary[0].expiring_soon_count || 0)

        // Add to byType
        if (Number(plasmaSummary[0].total_count) > 0) {
          summaryData.byType.push({
            type: "Plasma",
            count: Number(plasmaSummary[0].total_count),
            totalAmount: Number(plasmaSummary[0].total_amount),
            percentage: 0, // Will calculate after all types are added
          })
        }
      }

      // Get blood type distribution for plasma
      const plasmaTypeQuery = `
        SELECT blood_type, '' as rh, COUNT(*) as count, SUM(amount) as total_amount
        FROM plasma_inventory
        ${whereClause.replace("rh = '" + (rhFactor || "") + "' AND ", "")}
        GROUP BY blood_type
        ORDER BY blood_type
      `
      const plasmaTypeData = await dbClient.query(plasmaTypeQuery)

      if (plasmaTypeData.length > 0) {
        bloodTypeDistribution = [
          ...bloodTypeDistribution,
          ...plasmaTypeData.map((item: any) => ({
            bloodType: item.blood_type,
            rh: item.rh,
            count: Number(item.count),
            totalAmount: Number(item.total_amount),
            percentage: 0, // Will calculate after all data is collected
          })),
        ]
      }
    }

    if (inventoryType === "all" || inventoryType === "platelets") {
      // Get platelets data
      const plateletsQuery = `
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN expiration_date > CURRENT_DATE THEN 1 ELSE 0 END) as valid_count,
          SUM(CASE WHEN expiration_date <= CURRENT_DATE THEN 1 ELSE 0 END) as expired_count,
          SUM(CASE WHEN expiration_date > CURRENT_DATE AND expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END) as expiring_soon_count,
          SUM(amount) as total_amount
        FROM platelets_inventory
        ${whereClause}
      `
      const plateletsSummary = await dbClient.query(plateletsQuery)

      if (plateletsSummary.length > 0) {
        summaryData.totalCount += Number(plateletsSummary[0].total_count || 0)
        summaryData.validCount += Number(plateletsSummary[0].valid_count || 0)
        summaryData.expiredCount += Number(plateletsSummary[0].expired_count || 0)
        summaryData.expiringSoonCount += Number(plateletsSummary[0].expiring_soon_count || 0)

        // Add to byType
        if (Number(plateletsSummary[0].total_count) > 0) {
          summaryData.byType.push({
            type: "Platelets",
            count: Number(plateletsSummary[0].total_count),
            totalAmount: Number(plateletsSummary[0].total_amount),
            percentage: 0, // Will calculate after all types are added
          })
        }
      }

      // Get blood type distribution for platelets
      const plateletsTypeQuery = `
        SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
        FROM platelets_inventory
        ${whereClause}
        GROUP BY blood_type, rh
        ORDER BY blood_type, rh
      `
      const plateletsTypeData = await dbClient.query(plateletsTypeQuery)

      if (plateletsTypeData.length > 0) {
        bloodTypeDistribution = [
          ...bloodTypeDistribution,
          ...plateletsTypeData.map((item: any) => ({
            bloodType: item.blood_type,
            rh: item.rh,
            count: Number(item.count),
            totalAmount: Number(item.total_amount),
            percentage: 0, // Will calculate after all data is collected
          })),
        ]
      }
    }

    // Calculate percentages for byType
    if (summaryData.totalCount > 0) {
      summaryData.byType = summaryData.byType.map((item: any) => ({
        ...item,
        percentage: item.count / summaryData.totalCount,
      }))
    }

    // Calculate percentages for blood type distribution
    if (summaryData.totalCount > 0) {
      bloodTypeDistribution = bloodTypeDistribution.map((item: any) => ({
        ...item,
        percentage: item.count / summaryData.totalCount,
      }))
    }

    // Get expiration distribution
    expirationDistribution = [
      {
        status: "Valid",
        count: summaryData.validCount - summaryData.expiringSoonCount,
        percentage:
          summaryData.totalCount > 0
            ? (summaryData.validCount - summaryData.expiringSoonCount) / summaryData.totalCount
            : 0,
        totalAmount: 0, // Will calculate this later
      },
      {
        status: "Expiring Soon",
        count: summaryData.expiringSoonCount,
        percentage: summaryData.totalCount > 0 ? summaryData.expiringSoonCount / summaryData.totalCount : 0,
        totalAmount: 0, // Will calculate this later
      },
      {
        status: "Expired",
        count: summaryData.expiredCount,
        percentage: summaryData.totalCount > 0 ? summaryData.expiredCount / summaryData.totalCount : 0,
        totalAmount: 0, // Will calculate this later
      },
    ]

    // Get hospital distribution if showing all hospitals
    if (showAllHospitals) {
      // Build the query based on inventory type
      let hospitalQuery = ""

      if (inventoryType === "all") {
        hospitalQuery = `
          SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, SUM(amount) as total_amount
          FROM (
            SELECT hospital_id, amount FROM redblood_inventory ${whereClause}
            UNION ALL
            SELECT hospital_id, amount FROM plasma_inventory ${whereClause.replace("rh = '" + (rhFactor || "") + "' AND ", "")}
            UNION ALL
            SELECT hospital_id, amount FROM platelets_inventory ${whereClause}
          ) as combined
          JOIN hospital h ON combined.hospital_id = h.hospital_id
          GROUP BY h.hospital_id, h.hospital_name
          ORDER BY count DESC
        `
      } else if (inventoryType === "redblood") {
        hospitalQuery = `
          SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, SUM(rb.amount) as total_amount
          FROM redblood_inventory rb
          JOIN hospital h ON rb.hospital_id = h.hospital_id
          ${whereClause}
          GROUP BY h.hospital_id, h.hospital_name
          ORDER BY count DESC
        `
      } else if (inventoryType === "plasma") {
        hospitalQuery = `
          SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, SUM(p.amount) as total_amount
          FROM plasma_inventory p
          JOIN hospital h ON p.hospital_id = h.hospital_id
          ${whereClause.replace("rh = '" + (rhFactor || "") + "' AND ", "")}
          GROUP BY h.hospital_id, h.hospital_name
          ORDER BY count DESC
        `
      } else if (inventoryType === "platelets") {
        hospitalQuery = `
          SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, SUM(p.amount) as total_amount
          FROM platelets_inventory p
          JOIN hospital h ON p.hospital_id = h.hospital_id
          ${whereClause}
          GROUP BY h.hospital_id, h.hospital_name
          ORDER BY count DESC
        `
      }

      const hospitalData = await dbClient.query(hospitalQuery)

      if (hospitalData.length > 0) {
        hospitalDistribution = hospitalData.map((item: any) => ({
          hospitalId: item.hospital_id,
          hospitalName: item.hospital_name,
          count: Number(item.count),
          totalAmount: Number(item.total_amount),
          percentage: summaryData.totalCount > 0 ? Number(item.count) / summaryData.totalCount : 0,
        }))
      }
    }

    // Create expiration timeline
    expirationTimeline = [
      {
        period: "Expired",
        count: summaryData.expiredCount,
        percentage: summaryData.totalCount > 0 ? summaryData.expiredCount / summaryData.totalCount : 0,
      },
      {
        period: "1-7 days",
        count: summaryData.expiringSoonCount,
        percentage: summaryData.totalCount > 0 ? summaryData.expiringSoonCount / summaryData.totalCount : 0,
      },
      {
        period: "8-30 days",
        count: Math.floor(summaryData.validCount * 0.3), // Simulated data
        percentage: summaryData.totalCount > 0 ? Math.floor(summaryData.validCount * 0.3) / summaryData.totalCount : 0,
      },
      {
        period: "31-90 days",
        count: Math.floor(summaryData.validCount * 0.4), // Simulated data
        percentage: summaryData.totalCount > 0 ? Math.floor(summaryData.validCount * 0.4) / summaryData.totalCount : 0,
      },
      {
        period: "> 90 days",
        count: Math.floor(summaryData.validCount * 0.3) - summaryData.expiringSoonCount, // Simulated data
        percentage:
          summaryData.totalCount > 0
            ? (Math.floor(summaryData.validCount * 0.3) - summaryData.expiringSoonCount) / summaryData.totalCount
            : 0,
      },
    ]

    // Return the analysis data
    return NextResponse.json({
      success: true,
      data: {
        summary: summaryData,
        byBloodType: bloodTypeDistribution,
        byExpiration: expirationDistribution,
        byHospital: hospitalDistribution,
        expirationTimeline: expirationTimeline,
      },
    })
  } catch (error) {
    console.error("Error analyzing inventory data:", error)

    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, details: error.details },
        { status: error.type === ErrorType.AUTHENTICATION ? 401 : 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to analyze inventory data" }, { status: 500 })
  }
}
