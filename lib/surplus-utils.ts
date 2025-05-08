import { dbClient } from "./db"
import { queryCache } from "./cache"

// Threshold constants for surplus determination (in ml)
export const SURPLUS_THRESHOLDS = {
  CRITICAL_LOW: 500,
  LOW: 1500,
  OPTIMAL: 3000,
  SURPLUS: 5000,
  HIGH_SURPLUS: 8000,
}

// Types for surplus data
export type SurplusLevel = "critical-low" | "low" | "optimal" | "surplus" | "high-surplus"

export type SurplusItem = {
  type: string
  bloodType: string
  rh: string
  hospitalName: string
  hospitalId: number
  count: number
  yourCount: number
  surplusLevel: SurplusLevel
  totalAmount: number
}

export type HospitalSurplus = {
  hospitalId: number
  hospitalName: string
  type: string
  bloodType: string
  rh: string
  count: number
  totalAmount: number
  surplusLevel: SurplusLevel
  lastUpdated: Date
}

export type SurplusSummary = {
  redBlood: {
    surplus: number
    optimal: number
    low: number
    critical: number
  }
  plasma: {
    surplus: number
    optimal: number
    low: number
    critical: number
  }
  platelets: {
    surplus: number
    optimal: number
    low: number
    critical: number
  }
}

// Calculate surplus level based on amount
export function calculateSurplusLevel(amount: number): SurplusLevel {
  if (amount < SURPLUS_THRESHOLDS.CRITICAL_LOW) return "critical-low"
  if (amount < SURPLUS_THRESHOLDS.LOW) return "low"
  if (amount < SURPLUS_THRESHOLDS.OPTIMAL) return "optimal"
  if (amount < SURPLUS_THRESHOLDS.HIGH_SURPLUS) return "surplus"
  return "high-surplus"
}

// Get surplus alerts for a hospital (enhanced version of getSurplusAlerts)
export async function getEnhancedSurplusAlerts(hospitalId: number): Promise<SurplusItem[]> {
  try {
    const cacheKey = `surplus-alerts:${hospitalId}`
    const cached = queryCache.get<SurplusItem[]>(cacheKey)

    if (cached) {
      return cached
    }

    // Get current hospital's inventory with active=true filter
    const currentHospitalInventory = await dbClient`
      SELECT 'RedBlood' as type, blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM redblood_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
      UNION ALL
      SELECT 'Plasma' as type, blood_type, '' as rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM plasma_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type
      UNION ALL
      SELECT 'Platelets' as type, blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
      FROM platelets_inventory
      WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
      GROUP BY blood_type, rh
    `

    // Get other hospitals with surplus
    const alerts: SurplusItem[] = []

    for (const item of currentHospitalInventory) {
      const { type, blood_type, rh, count, total_amount } = item
      const surplusLevel = calculateSurplusLevel(Number(total_amount))

      // If current hospital has low stock (less than optimal level)
      if (surplusLevel === "critical-low" || surplusLevel === "low") {
        let surplusHospitals

        if (type === "RedBlood") {
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, SUM(amount) as total_amount
            FROM redblood_inventory rb
            JOIN hospital h ON rb.hospital_id = h.hospital_id
            WHERE rb.hospital_id != ${hospitalId}
              AND rb.blood_type = ${blood_type}
              AND rb.rh = ${rh}
              AND rb.expiration_date > CURRENT_DATE
              AND rb.active = true
            GROUP BY h.hospital_id, h.hospital_name
            HAVING SUM(amount) > ${SURPLUS_THRESHOLDS.SURPLUS}
            ORDER BY SUM(amount) DESC
          `
        } else if (type === "Plasma") {
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, SUM(amount) as total_amount
            FROM plasma_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.expiration_date > CURRENT_DATE
              AND p.active = true
            GROUP BY h.hospital_id, h.hospital_name
            HAVING SUM(amount) > ${SURPLUS_THRESHOLDS.SURPLUS}
            ORDER BY SUM(amount) DESC
          `
        } else if (type === "Platelets") {
          surplusHospitals = await dbClient`
            SELECT h.hospital_id, h.hospital_name, COUNT(*) as count, SUM(amount) as total_amount
            FROM platelets_inventory p
            JOIN hospital h ON p.hospital_id = h.hospital_id
            WHERE p.hospital_id != ${hospitalId}
              AND p.blood_type = ${blood_type}
              AND p.rh = ${rh}
              AND p.expiration_date > CURRENT_DATE
              AND p.active = true
            GROUP BY h.hospital_id, h.hospital_name
            HAVING SUM(amount) > ${SURPLUS_THRESHOLDS.SURPLUS}
            ORDER BY SUM(amount) DESC
          `
        }

        if (surplusHospitals && surplusHospitals.length > 0) {
          for (const hospital of surplusHospitals) {
            const hospitalSurplusLevel = calculateSurplusLevel(Number(hospital.total_amount))
            alerts.push({
              type,
              bloodType: blood_type,
              rh: rh || "",
              hospitalName: hospital.hospital_name,
              hospitalId: hospital.hospital_id,
              count: Number(hospital.count),
              yourCount: Number(count),
              surplusLevel: hospitalSurplusLevel,
              totalAmount: Number(hospital.total_amount),
            })
          }
        }
      }
    }

    queryCache.set(cacheKey, alerts, 5 * 60) // Cache for 5 minutes
    return alerts
  } catch (error) {
    console.error("Error in getEnhancedSurplusAlerts:", error)
    return [] // Return empty array instead of throwing
  }
}

// Get hospital's own surplus inventory
export async function getHospitalSurplus(hospitalId: number): Promise<HospitalSurplus[]> {
  try {
    const cacheKey = `hospital-surplus:${hospitalId}`
    const cached = queryCache.get<HospitalSurplus[]>(cacheKey)

    if (cached) {
      return cached
    }

    // Get current hospital's inventory with surplus levels
    const redBloodSurplus = await dbClient`
      SELECT 
        ${hospitalId} as hospital_id,
        h.hospital_name,
        'RedBlood' as type, 
        blood_type, 
        rh, 
        COUNT(*) as count,
        SUM(amount) as total_amount,
        CURRENT_TIMESTAMP as last_updated
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      WHERE rb.hospital_id = ${hospitalId} 
        AND rb.expiration_date > CURRENT_DATE 
        AND rb.active = true
      GROUP BY h.hospital_name, blood_type, rh
      HAVING SUM(amount) > ${SURPLUS_THRESHOLDS.SURPLUS}
    `

    const plasmaSurplus = await dbClient`
      SELECT 
        ${hospitalId} as hospital_id,
        h.hospital_name,
        'Plasma' as type, 
        blood_type, 
        '' as rh, 
        COUNT(*) as count,
        SUM(amount) as total_amount,
        CURRENT_TIMESTAMP as last_updated
      FROM plasma_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.hospital_id = ${hospitalId} 
        AND p.expiration_date > CURRENT_DATE 
        AND p.active = true
      GROUP BY h.hospital_name, blood_type
      HAVING SUM(amount) > ${SURPLUS_THRESHOLDS.SURPLUS}
    `

    const plateletsSurplus = await dbClient`
      SELECT 
        ${hospitalId} as hospital_id,
        h.hospital_name,
        'Platelets' as type, 
        blood_type, 
        rh, 
        COUNT(*) as count,
        SUM(amount) as total_amount,
        CURRENT_TIMESTAMP as last_updated
      FROM platelets_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.hospital_id = ${hospitalId} 
        AND p.expiration_date > CURRENT_DATE 
        AND p.active = true
      GROUP BY h.hospital_name, blood_type, rh
      HAVING SUM(amount) > ${SURPLUS_THRESHOLDS.SURPLUS}
    `

    // Combine and process results
    const allSurplus = [
      ...redBloodSurplus.map((item) => ({
        ...item,
        surplusLevel: calculateSurplusLevel(Number(item.total_amount)),
      })),
      ...plasmaSurplus.map((item) => ({
        ...item,
        surplusLevel: calculateSurplusLevel(Number(item.total_amount)),
      })),
      ...plateletsSurplus.map((item) => ({
        ...item,
        surplusLevel: calculateSurplusLevel(Number(item.total_amount)),
      })),
    ]

    // Convert to proper types
    const result: HospitalSurplus[] = allSurplus.map((item) => ({
      hospitalId: item.hospital_id,
      hospitalName: item.hospital_name,
      type: item.type,
      bloodType: item.blood_type,
      rh: item.rh,
      count: Number(item.count),
      totalAmount: Number(item.total_amount),
      surplusLevel: item.surplusLevel,
      lastUpdated: new Date(item.last_updated),
    }))

    queryCache.set(cacheKey, result, 5 * 60) // Cache for 5 minutes
    return result
  } catch (error) {
    console.error("Error in getHospitalSurplus:", error)
    return [] // Return empty array instead of throwing
  }
}

// Get hospitals that need your surplus
export async function getHospitalsNeedingSurplus(hospitalId: number): Promise<SurplusItem[]> {
  try {
    const cacheKey = `hospitals-needing-surplus:${hospitalId}`
    const cached = queryCache.get<SurplusItem[]>(cacheKey)

    if (cached) {
      return cached
    }

    // Get current hospital's surplus inventory
    const hospitalSurplus = await getHospitalSurplus(hospitalId)
    const results: SurplusItem[] = []

    // For each surplus item, find hospitals that need it
    for (const surplus of hospitalSurplus) {
      const { type, bloodType, rh } = surplus
      let needyHospitals

      if (type === "RedBlood") {
        needyHospitals = await dbClient`
          SELECT 
            h.hospital_id, 
            h.hospital_name, 
            COUNT(*) as count,
            SUM(amount) as total_amount
          FROM redblood_inventory rb
          JOIN hospital h ON rb.hospital_id = h.hospital_id
          WHERE rb.hospital_id != ${hospitalId}
            AND rb.blood_type = ${bloodType}
            AND rb.rh = ${rh}
            AND rb.expiration_date > CURRENT_DATE
            AND rb.active = true
          GROUP BY h.hospital_id, h.hospital_name
          HAVING SUM(amount) < ${SURPLUS_THRESHOLDS.LOW}
          ORDER BY SUM(amount) ASC
        `
      } else if (type === "Plasma") {
        needyHospitals = await dbClient`
          SELECT 
            h.hospital_id, 
            h.hospital_name, 
            COUNT(*) as count,
            SUM(amount) as total_amount
          FROM plasma_inventory p
          JOIN hospital h ON p.hospital_id = h.hospital_id
          WHERE p.hospital_id != ${hospitalId}
            AND p.blood_type = ${bloodType}
            AND p.expiration_date > CURRENT_DATE
            AND p.active = true
          GROUP BY h.hospital_id, h.hospital_name
          HAVING SUM(amount) < ${SURPLUS_THRESHOLDS.LOW}
          ORDER BY SUM(amount) ASC
        `
      } else if (type === "Platelets") {
        needyHospitals = await dbClient`
          SELECT 
            h.hospital_id, 
            h.hospital_name, 
            COUNT(*) as count,
            SUM(amount) as total_amount
          FROM platelets_inventory p
          JOIN hospital h ON p.hospital_id = h.hospital_id
          WHERE p.hospital_id != ${hospitalId}
            AND p.blood_type = ${bloodType}
            AND p.rh = ${rh}
            AND p.expiration_date > CURRENT_DATE
            AND p.active = true
          GROUP BY h.hospital_id, h.hospital_name
          HAVING SUM(amount) < ${SURPLUS_THRESHOLDS.LOW}
          ORDER BY SUM(amount) ASC
        `
      }

      if (needyHospitals && needyHospitals.length > 0) {
        for (const hospital of needyHospitals) {
          const hospitalSurplusLevel = calculateSurplusLevel(Number(hospital.total_amount))
          results.push({
            type,
            bloodType,
            rh: rh || "",
            hospitalName: hospital.hospital_name,
            hospitalId: hospital.hospital_id,
            count: Number(hospital.count),
            yourCount: surplus.count,
            surplusLevel: hospitalSurplusLevel,
            totalAmount: Number(hospital.total_amount),
          })
        }
      }
    }

    queryCache.set(cacheKey, results, 5 * 60) // Cache for 5 minutes
    return results
  } catch (error) {
    console.error("Error in getHospitalsNeedingSurplus:", error)
    return [] // Return empty array instead of throwing
  }
}

// Get surplus summary statistics
export async function getSurplusSummary(hospitalId: number): Promise<SurplusSummary> {
  try {
    const cacheKey = `surplus-summary:${hospitalId}`
    const cached = queryCache.get<SurplusSummary>(cacheKey)

    if (cached) {
      return cached
    }

    // Get current hospital's inventory with surplus levels
    const redBloodStats = await dbClient`
      SELECT 
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.SURPLUS} THEN 1 ELSE 0 END) as surplus_count,
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.OPTIMAL} AND SUM(amount) < ${SURPLUS_THRESHOLDS.SURPLUS} THEN 1 ELSE 0 END) as optimal_count,
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.LOW} AND SUM(amount) < ${SURPLUS_THRESHOLDS.OPTIMAL} THEN 1 ELSE 0 END) as low_count,
        SUM(CASE WHEN SUM(amount) < ${SURPLUS_THRESHOLDS.LOW} THEN 1 ELSE 0 END) as critical_count
      FROM (
        SELECT blood_type, rh, SUM(amount) as amount
        FROM redblood_inventory
        WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
        GROUP BY blood_type, rh
      ) as rb
    `

    const plasmaStats = await dbClient`
      SELECT 
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.SURPLUS} THEN 1 ELSE 0 END) as surplus_count,
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.OPTIMAL} AND SUM(amount) < ${SURPLUS_THRESHOLDS.SURPLUS} THEN 1 ELSE 0 END) as optimal_count,
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.LOW} AND SUM(amount) < ${SURPLUS_THRESHOLDS.OPTIMAL} THEN 1 ELSE 0 END) as low_count,
        SUM(CASE WHEN SUM(amount) < ${SURPLUS_THRESHOLDS.LOW} THEN 1 ELSE 0 END) as critical_count
      FROM (
        SELECT blood_type, SUM(amount) as amount
        FROM plasma_inventory
        WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
        GROUP BY blood_type
      ) as p
    `

    const plateletsStats = await dbClient`
      SELECT 
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.SURPLUS} THEN 1 ELSE 0 END) as surplus_count,
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.OPTIMAL} AND SUM(amount) < ${SURPLUS_THRESHOLDS.SURPLUS} THEN 1 ELSE 0 END) as optimal_count,
        SUM(CASE WHEN SUM(amount) >= ${SURPLUS_THRESHOLDS.LOW} AND SUM(amount) < ${SURPLUS_THRESHOLDS.OPTIMAL} THEN 1 ELSE 0 END) as low_count,
        SUM(CASE WHEN SUM(amount) < ${SURPLUS_THRESHOLDS.LOW} THEN 1 ELSE 0 END) as critical_count
      FROM (
        SELECT blood_type, rh, SUM(amount) as amount
        FROM platelets_inventory
        WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE AND active = true
        GROUP BY blood_type, rh
      ) as p
    `

    const summary: SurplusSummary = {
      redBlood: {
        surplus: Number(redBloodStats[0]?.surplus_count || 0),
        optimal: Number(redBloodStats[0]?.optimal_count || 0),
        low: Number(redBloodStats[0]?.low_count || 0),
        critical: Number(redBloodStats[0]?.critical_count || 0),
      },
      plasma: {
        surplus: Number(plasmaStats[0]?.surplus_count || 0),
        optimal: Number(plasmaStats[0]?.optimal_count || 0),
        low: Number(plasmaStats[0]?.low_count || 0),
        critical: Number(plasmaStats[0]?.critical_count || 0),
      },
      platelets: {
        surplus: Number(plateletsStats[0]?.surplus_count || 0),
        optimal: Number(plateletsStats[0]?.optimal_count || 0),
        low: Number(plateletsStats[0]?.low_count || 0),
        critical: Number(plateletsStats[0]?.critical_count || 0),
      },
    }

    queryCache.set(cacheKey, summary, 5 * 60) // Cache for 5 minutes
    return summary
  } catch (error) {
    console.error("Error in getSurplusSummary:", error)
    // Return default values instead of throwing
    return {
      redBlood: { surplus: 0, optimal: 0, low: 0, critical: 0 },
      plasma: { surplus: 0, optimal: 0, low: 0, critical: 0 },
      platelets: { surplus: 0, optimal: 0, low: 0, critical: 0 },
    }
  }
}
