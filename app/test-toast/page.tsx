"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export default function TestToastPage() {
  const { toast } = useToast()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Toast Test Page</h1>
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => {
            toast({
              title: "Simple Toast",
              description: "Your message has been sent.",
            })
          }}
        >
          Show Simple Toast
        </Button>

        <Button
          variant="destructive"
          onClick={() => {
            toast({
              variant: "destructive",
              title: "Error Toast",
              description: "There was a problem with your request.",
            })
          }}
        >
          Show Error Toast
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Toast with Action",
              description: "Your message has been sent.",
              action: (
                <Button variant="outline" size="sm">
                  Undo
                </Button>
              ),
            })
          }}
        >
          Toast with Action
        </Button>
      </div>
    </div>
  )
}
