import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Building2, Mail, Phone, Users, Globe, LinkedinIcon, DollarSign, Briefcase, MapPin, ChevronDown, ChevronUp, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface RowDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rowData: any
}

// Map column names to icons
const COLUMN_ICONS: Record<string, any> = {
  S_No: Info,
  Account_name: Building2,
  Industry_client: Building2,
  Industry_Nexuses: Building2,
  Type_of_Company: Building2,
  priority: Info,
  Sales_Manager: Briefcase,
  No_of_Employees: Users,
  Revenue: DollarSign,
  Contact_Name: Briefcase,
  Designation: Briefcase,
  Contact_Number_Personal: Phone,
  Phone_Status: Phone,
  Email_id: Mail,
  Email_Status: Mail,
  Person_Linkedin_Url: LinkedinIcon,
  Website: Globe,
  Company_Linkedin_Url: LinkedinIcon,
  Technologies: Info,
  City: MapPin,
  State: MapPin,
  Country_Contact_Person: MapPin,
  Company_Address: MapPin,
  Company_Headquarter: MapPin,
  Workmates_Remark: Info,
  TM_Remarks: Info
};

// Map column names to friendly display names
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  S_No: "S. No.",
  Account_name: "Account Name",
  Industry_client: "Industry (Client)",
  Industry_Nexuses: "Industry (Nexuses)",
  Type_of_Company: "Company Type",
  priority: "Priority",
  Sales_Manager: "Sales Manager",
  No_of_Employees: "Number of Employees",
  Revenue: "Revenue",
  Contact_Name: "Contact Name",
  Designation: "Designation",
  Contact_Number_Personal: "Contact Number (Personal)",
  Phone_Status: "Phone Status",
  Email_id: "Email ID",
  Email_Status: "Email Status",
  Person_Linkedin_Url: "LinkedIn Profile",
  Website: "Website",
  Company_Linkedin_Url: "Company LinkedIn",
  Technologies: "Technologies",
  City: "City",
  State: "State",
  Country_Contact_Person: "Country (Contact Person)",
  Company_Address: "Company Address",
  Company_Headquarter: "Company Headquarter",
  Workmates_Remark: "Workmates Remark",
  TM_Remarks: "TM Remarks"
};

// Determine which columns should be treated as links
const URL_COLUMNS = ['Website', 'Person_Linkedin_Url', 'Company_Linkedin_Url'];

// Determine which columns might contain comma-separated values like Technologies
const MULTI_VALUE_COLUMNS = ['Technologies'];

export function RowDetailsModal({ isOpen, onClose, rowData }: RowDetailsModalProps) {
  if (!rowData) return null
  const [showAllTech, setShowAllTech] = useState(false)
  
  // Get first name and last name for the avatar (with fallbacks)
  const getInitials = () => {
    if (rowData.First_Name && rowData.Last_Name) {
      return `${rowData.First_Name[0]}${rowData.Last_Name[0]}`;
    } else if (rowData.Contact_Name) {
      const parts = rowData.Contact_Name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`;
      } else if (parts.length === 1 && parts[0].length > 0) {
        return parts[0][0];
      }
    }
    return "👤"; // Default fallback
  };
  
  // Get the title or designation to show under the name
  const getTitle = () => {
    if (rowData.Title) return rowData.Title;
    if (rowData.Designation) return rowData.Designation;
    return "";
  };
  
  // Get the name to display in the header
  const getDisplayName = () => {
    if (rowData.First_Name && rowData.Last_Name) {
      return `${rowData.First_Name} ${rowData.Last_Name}`;
    } else if (rowData.Contact_Name) {
      return rowData.Contact_Name;
    } else if (rowData.Account_name) {
      return rowData.Account_name;
    }
    return "Contact";
  };
  
  // Get all columns from the data
  const allColumns = Object.keys(rowData).filter(key => {
    // Skip empty values
    if (!rowData[key]) return false;
    
    // Skip special columns used for the header
    if (key === 'First_Name' || key === 'Last_Name') return false;
    if (getDisplayName().includes(rowData[key])) return false;
    
    return true;
  });
  
  // Sort columns by importance
  const sortedColumns = allColumns.sort((a, b) => {
    // Always prioritize these important columns at the top
    const priorityColumns = [
      'Title', 'Designation', 'Company', 'Account_name', 'Email', 'Email_id', 'Corporate_Phone',
      'Personal_Phone', 'Contact_Number_Personal'
    ];
    
    const aIsPriority = priorityColumns.includes(a);
    const bIsPriority = priorityColumns.includes(b);
    
    if (aIsPriority && !bIsPriority) return -1;
    if (!aIsPriority && bIsPriority) return 1;
    
    // Then alphabetical order
    return a.localeCompare(b);
  });
  
  // Divide columns into two columns for display
  const leftColumns = sortedColumns.slice(0, Math.ceil(sortedColumns.length / 2));
  const rightColumns = sortedColumns.slice(Math.ceil(sortedColumns.length / 2));
  
  // Check if the value contains a technology or multi-value field
  const isMultiValueField = (key: string, value: string) => {
    if (MULTI_VALUE_COLUMNS.includes(key)) return true;
    if (typeof value === 'string' && value.includes(',')) return true;
    return false;
  };
  
  // Render a field based on its type
  const renderField = (key: string, value: string) => {
    const IconComponent = COLUMN_ICONS[key] || Info;
    const displayName = COLUMN_DISPLAY_NAMES[key] || key.replace(/_/g, ' ');
    
    // For URL fields
    if (URL_COLUMNS.includes(key) || key.toLowerCase().includes('url') || key.toLowerCase().includes('website')) {
      return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{displayName}</p>
            <a 
              href={value.startsWith('http') ? value : `https://${value}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              {value.length > 30 ? `${value.substring(0, 30)}...` : value}
            </a>
          </div>
        </div>
      );
    }
    
    // Regular field
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <IconComponent className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{displayName}</p>
          <p className="text-gray-900 font-medium">{value}</p>
        </div>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
              {getInitials()}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{getDisplayName()}</div>
              <div className="text-sm text-gray-500">{getTitle()}</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Left Column */}
          <div className="space-y-4">
            {leftColumns.map(key => {
              if (isMultiValueField(key, rowData[key])) return null;
              return (
                <div key={key}>
                  {renderField(key, rowData[key])}
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {rightColumns.map(key => {
              if (isMultiValueField(key, rowData[key])) return null;
              return (
                <div key={key}>
                  {renderField(key, rowData[key])}
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-value fields like Technologies */}
        {allColumns.filter(key => isMultiValueField(key, rowData[key])).map(key => {
          const values = rowData[key].split(',').map((v: string) => v.trim()).filter(Boolean);
          return (
            <div key={key} className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  {COLUMN_DISPLAY_NAMES[key] || key.replace(/_/g, ' ')}
                </h3>
                {values.length > 5 && (
                  <button 
                    onClick={() => setShowAllTech(!showAllTech)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {showAllTech ? (
                      <>Show Less <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Show All <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>
                )}
              </div>
              <div className="max-h-[200px] overflow-y-auto pr-2">
                <div className="flex flex-wrap gap-2">
                  {values
                    .slice(0, showAllTech ? undefined : 5)
                    .map((value: string, index: number) => (
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
                        {value}
                      </Badge>
                    ))
                  }
                  {!showAllTech && values.length > 5 && (
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        "bg-gradient-to-r from-blue-100 to-blue-200",
                        "text-blue-700",
                        "transition-all duration-200",
                        "whitespace-nowrap",
                        "shadow-sm",
                        "hover:shadow-md",
                        "hover:from-blue-200 hover:to-blue-300",
                        "cursor-pointer"
                      )}
                      onClick={() => setShowAllTech(true)}
                    >
                      +{values.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </DialogContent>
    </Dialog>
  )
} 