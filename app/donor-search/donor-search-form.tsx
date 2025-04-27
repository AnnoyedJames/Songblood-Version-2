"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatBloodType, formatDate, getBloodTypeColor } from "@/lib/utils"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import DatabaseError from "@/components/database-error"

type SearchResult = {
  type: string
  bag_id: number
  donor_name: string
  blood_type: string
  rh: string
  amount: number
  expiration_date: string
  hospital_name: string
  hospital_contact_phone: string
}

export default function DonorSearchForm() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState("")
  const [dbError, setDbError] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()

    if (!query.trim()) return

    setIsLoading(true)
    setSearched(true)
    setError("")
    setDbError(false)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        if (response.status === 503) {
          setDbError(true)
          return
        }
        throw new Error(`Search failed with status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setResults(data.results)
      } else {
        setResults([])
        if (data.error) {
          setError(data.error)
        }
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("An error occurred while searching. Please try again.")
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  if (dbError) {
    return <DatabaseError showLoginLink={false} />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Donors</CardTitle>
        <CardDescription>Search by donor name or bag ID across all hospitals</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <Input
            placeholder="Enter donor name or bag ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
            {!isLoading && <Search className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {searched && !error && (
          <div>
            <h3 className="text-lg font-medium mb-4">Search Results {results.length > 0 && `(${results.length})`}</h3>

            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No results found for "{query}"</div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bag ID</TableHead>
                      <TableHead>Donor Name</TableHead>
                      <TableHead>Blood Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={`${result.type}-${result.bag_id}`}>
                        <TableCell>{result.bag_id}</TableCell>
                        <TableCell>{result.donor_name}</TableCell>
                        <TableCell>
                          <Badge className={getBloodTypeColor(result.blood_type, result.rh)}>
                            {formatBloodType(result.blood_type, result.rh)}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.amount} ml</TableCell>
                        <TableCell>{formatDate(result.expiration_date)}</TableCell>
                        <TableCell>
                          <div>{result.hospital_name}</div>
                          <div className="text-xs text-muted-foreground">{result.hospital_contact_phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{result.type}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
