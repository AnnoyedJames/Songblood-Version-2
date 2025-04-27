import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EditSupplyLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </header>

      <main className="flex-1 container py-6 px-4 md:py-8">
        <Skeleton className="h-8 w-40 mb-6" />

        <div className="space-y-6">
          {/* Tabs skeleton */}
          <Skeleton className="h-10 w-full mb-6" />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Inventory table skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>

            {/* Add form skeleton */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
