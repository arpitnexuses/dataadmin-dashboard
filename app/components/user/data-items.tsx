import Link from "next/link"
import { Card } from "@/components/ui/card"

interface DataItem {
  id: number
  name: string
  description?: string
}

interface DataItemsProps {
  items: DataItem[]
  currentFileIndex?: number
}

export function DataItems({ items, currentFileIndex }: DataItemsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {items.map((item) => (
        <Link 
          key={item.id} 
          href={`/dashboard?file=${item.id}`}
          className="block"
        >
          <Card 
            className={`p-4 hover:bg-gray-800 transition-colors ${
              currentFileIndex === item.id ? 'border-blue-500' : ''
            }`}
          >
            <h3 className="text-lg font-semibold text-white">{item.name}</h3>
            {item.description && (
              <p className="text-gray-400 mt-2">{item.description}</p>
            )}
          </Card>
        </Link>
      ))}
    </div>
  )
} 