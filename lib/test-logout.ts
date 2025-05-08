/**
 * Utility function to test the logout functionality
 * This can be used in development to verify that logout works correctly
 */
export async function testLogout() {
  console.log("Testing logout functionality...")

  // 1. Check if cookies exist before logout
  const cookiesBefore = document.cookie
  console.log("Cookies before logout:", cookiesBefore)

  try {
    // 2. Send logout request
    console.log("Sending logout request...")
    const response = await fetch("/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })

    // 3. Check response
    console.log("Logout response status:", response.status)
    console.log("Logout response ok:", response.ok)

    // 4. Check if cookies are cleared after logout
    const cookiesAfter = document.cookie
    console.log("Cookies after logout:", cookiesAfter)

    // 5. Verify if all authentication cookies are cleared
    const authCookies = ["adminId", "hospitalId", "adminUsername", "adminPassword", "fallbackMode", "sessionToken"]
    const remainingAuthCookies = authCookies.filter((cookie) =>
      document.cookie.split(";").some((c) => c.trim().startsWith(`${cookie}=`)),
    )

    if (remainingAuthCookies.length > 0) {
      console.error("Some auth cookies were not cleared:", remainingAuthCookies)
      return {
        success: false,
        message: "Some authentication cookies were not cleared",
        remainingCookies: remainingAuthCookies,
      }
    }

    return {
      success: true,
      message: "Logout successful, all cookies cleared",
    }
  } catch (error) {
    console.error("Error during logout test:", error)
    return {
      success: false,
      message: "Error during logout test",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
