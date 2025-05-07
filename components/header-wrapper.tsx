import { cookies } from "next/headers"
import Header from "./header"

export default async function HeaderWrapper() {
  // Get the hospital ID from cookies or session
  const cookieStore = cookies()
  const hospitalIdCookie = cookieStore.get("hospitalId")
  const hospitalId = hospitalIdCookie ? Number.parseInt(hospitalIdCookie.value) : 0

  // Only render the header if we have a valid hospital ID
  if (!hospitalId) return null

  return <Header hospitalId={hospitalId} />
}
