import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Mail, Phone, Users, Globe, LinkedinIcon, DollarSign, Briefcase, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RowDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rowData: any
}

export function RowDetailsModal({ isOpen, onClose, rowData }: RowDetailsModalProps) {
  if (!rowData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
              {rowData.First_Name?.[0]}{rowData.Last_Name?.[0]}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{rowData.First_Name} {rowData.Last_Name}</div>
              <div className="text-sm text-gray-500">{rowData.Title}</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Title</p>
                <p className="text-gray-900 font-medium">{rowData.Title}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Company</p>
                <p className="text-gray-900 font-medium">{rowData.Company}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-green-50 text-green-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{rowData.Email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-red-50 text-red-600">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Corporate Phone</p>
                <p className="text-gray-900 font-medium">{rowData.Corporate_Phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Personal Phone</p>
                <p className="text-gray-900 font-medium">{rowData.Personal_Phone}</p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Employee Size</p>
                <p className="text-gray-900 font-medium">{rowData.Employees_Size}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Annual Revenue</p>
                <p className="text-gray-900 font-medium">{rowData.Annual_Revenue}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-pink-50 text-pink-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Country</p>
                <p className="text-gray-900 font-medium">{rowData.Country}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Website</p>
                <a 
                  href={rowData.Website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  {rowData.Website}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <LinkedinIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">LinkedIn</p>
                <a 
                  href={rowData.Person_Linkedin_Url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  View Profile
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Technologies Section */}
        {rowData.Technologies && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Technologies</h3>
            <div className="max-h-[200px] overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2">
                {rowData.Technologies.split(',').map((tech: string, index: number) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      "bg-gradient-to-r from-gray-100 to-gray-200",
                      "text-gray-700",
                      "transition-all duration-200",
                      "whitespace-nowrap",
                      "shadow-sm",
                      "hover:shadow-md",
                      "hover:from-gray-200 hover:to-gray-300"
                    )}
                  >
                    {tech.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 