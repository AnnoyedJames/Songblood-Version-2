import { neon } from "@neondatabase/serverless"

// Create a SQL client with the connection string
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to get hospital data by ID
export async function getHospitalById(hospitalId: number) {
  const result = await sql`
    SELECT * FROM hospital WHERE hospital_id = ${hospitalId}
  `
  return result[0]
}

// Helper function to verify admin credentials
export async function verifyAdminCredentials(username: string, password: string) {
  const result = await sql`
    SELECT admin_id, hospital_id FROM admin 
    WHERE admin_username = ${username} AND admin_password = ${password}
  `
  return result[0] || null
}

// Helper function to get blood inventory for a hospital
export async function getBloodInventory(hospitalId: number) {
  const redBlood = await sql`
    SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
    FROM redblood_inventory
    WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
    GROUP BY blood_type, rh
    ORDER BY blood_type, rh
  `

  return redBlood
}

// Helper function to get plasma inventory for a hospital
export async function getPlasmaInventory(hospitalId: number) {
  const plasma = await sql`
    SELECT blood_type, COUNT(*) as count, SUM(amount) as total_amount
    FROM plasma_inventory
    WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
    GROUP BY blood_type
    ORDER BY blood_type
  `

  return plasma
}

// Helper function to get platelets inventory for a hospital
export async function getPlateletsInventory(hospitalId: number) {
  const platelets = await sql`
    SELECT blood_type, rh, COUNT(*) as count, SUM(amount) as total_amount
    FROM platelets_inventory
    WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
    GROUP BY blood_type, rh
    ORDER BY blood_type, rh
  `

  return platelets
}

// Helper function to get surplus alerts
export async function getSurplusAlerts(hospitalId: number) {
  // Get current hospital's inventory
  const currentHospitalInventory = await sql`
    SELECT 'RedBlood' as type, blood_type, rh, COUNT(*) as count
    FROM redblood_inventory
    WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
    GROUP BY blood_type, rh
    UNION ALL
    SELECT 'Plasma' as type, blood_type, '' as rh, COUNT(*) as count
    FROM plasma_inventory
    WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
    GROUP BY blood_type
    UNION ALL
    SELECT 'Platelets' as type, blood_type, rh, COUNT(*) as count
    FROM platelets_inventory
    WHERE hospital_id = ${hospitalId} AND expiration_date > CURRENT_DATE
    GROUP BY blood_type, rh
  `

  // Get other hospitals with surplus
  const alerts = []

  for (const item of currentHospitalInventory) {
    const { type, blood_type, rh, count } = item

    // If current hospital has low stock (less than 5 units)
    if (Number(count) < 5) {
      let surplusHospitals

      if (type === "RedBlood") {
        surplusHospitals = await sql`
          SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
          FROM redblood_inventory rb
          JOIN hospital h ON rb.hospital_id = h.hospital_id
          WHERE rb.hospital_id != ${hospitalId}
            AND rb.blood_type = ${blood_type}
            AND rb.rh = ${rh}
            AND rb.expiration_date > CURRENT_DATE
          GROUP BY h.hospital_id, h.hospital_name
          HAVING COUNT(*) > 10
          ORDER BY count DESC
        `
      } else if (type === "Plasma") {
        surplusHospitals = await sql`
          SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
          FROM plasma_inventory p
          JOIN hospital h ON p.hospital_id = h.hospital_id
          WHERE p.hospital_id != ${hospitalId}
            AND p.blood_type = ${blood_type}
            AND p.expiration_date > CURRENT_DATE
          GROUP BY h.hospital_id, h.hospital_name
          HAVING COUNT(*) > 10
          ORDER BY count DESC
        `
      } else if (type === "Platelets") {
        surplusHospitals = await sql`
          SELECT h.hospital_id, h.hospital_name, COUNT(*) as count
          FROM platelets_inventory p
          JOIN hospital h ON p.hospital_id = h.hospital_id
          WHERE p.hospital_id != ${hospitalId}
            AND p.blood_type = ${blood_type}
            AND p.rh = ${rh}
            AND p.expiration_date > CURRENT_DATE
          GROUP BY h.hospital_id, h.hospital_name
          HAVING COUNT(*) > 10
          ORDER BY count DESC
        `
      }

      if (surplusHospitals && surplusHospitals.length > 0) {
        for (const hospital of surplusHospitals) {
          alerts.push({
            type,
            bloodType: blood_type,
            rh: rh || "",
            hospitalName: hospital.hospital_name,
            hospitalId: hospital.hospital_id,
            count: hospital.count,
            yourCount: count,
          })
        }
      }
    }
  }

  return alerts
}

// Helper function to search for donors
export async function searchDonors(query: string) {
  if (!query || query.trim() === "") {
    return []
  }

  const searchTerm = `%${query}%`

  // Search by bag ID if the query is a number
  if (!isNaN(Number(query))) {
    const bagId = Number(query)

    const redBloodResults = await sql`
      SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
             rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM redblood_inventory rb
      JOIN hospital h ON rb.hospital_id = h.hospital_id
      WHERE rb.bag_id = ${bagId}
    `

    const plasmaResults = await sql`
      SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM plasma_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.bag_id = ${bagId}
    `

    const plateletsResults = await sql`
      SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
             p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
      FROM platelets_inventory p
      JOIN hospital h ON p.hospital_id = h.hospital_id
      WHERE p.bag_id = ${bagId}
    `

    return [...redBloodResults, ...plasmaResults, ...plateletsResults]
  }

  // Search by donor name
  const redBloodResults = await sql`
    SELECT 'RedBlood' as type, rb.bag_id, rb.donor_name, rb.blood_type, rb.rh, 
           rb.amount, rb.expiration_date, h.hospital_name, h.hospital_contact_phone
    FROM redblood_inventory rb
    JOIN hospital h ON rb.hospital_id = h.hospital_id
    WHERE rb.donor_name ILIKE ${searchTerm}
  `

  const plasmaResults = await sql`
    SELECT 'Plasma' as type, p.bag_id, p.donor_name, p.blood_type, '' as rh, 
           p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
    FROM plasma_inventory p
    JOIN hospital h ON p.hospital_id = h.hospital_id
    WHERE p.donor_name ILIKE ${searchTerm}
  `

  const plateletsResults = await sql`
    SELECT 'Platelets' as type, p.bag_id, p.donor_name, p.blood_type, p.rh, 
           p.amount, p.expiration_date, h.hospital_name, h.hospital_contact_phone
    FROM platelets_inventory p
    JOIN hospital h ON p.hospital_id = h.hospital_id
    WHERE p.donor_name ILIKE ${searchTerm}
  `

  return [...redBloodResults, ...plasmaResults, ...plateletsResults]
}

// Helper function to add new plasma bag
export async function addNewPlasmaBag(
  donorName: string,
  amount: number,
  hospitalId: number,
  expirationDate: string,
  bloodType: string,
  adminUsername: string,
  adminPassword: string,
) {
  try {
    await sql`
      SELECT Add_New_PlasmaBag(
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        ${adminUsername},
        ${adminPassword}
      )
    `
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Helper function to add new platelets bag
export async function addNewPlateletsBag(
  donorName: string,
  amount: number,
  hospitalId: number,
  expirationDate: string,
  bloodType: string,
  rh: string,
  adminUsername: string,
  adminPassword: string,
) {
  try {
    await sql`
      SELECT Add_New_PlateletsBag(
        ${donorName},
        ${amount},
        ${hospitalId},
        ${expirationDate}::date,
        ${bloodType},
        ${rh},
        ${adminUsername},
        ${adminPassword}
      )
    `
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
