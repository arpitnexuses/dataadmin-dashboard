'use client';

import { useState, useEffect } from 'react';
import { XCircle, ChevronDown, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataRow {
  [key: string]: any;  // Make it accept any column name
}

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSection {
  title: string;
  options: FilterOption[];
  multiSelect: boolean;
}

interface FilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Record<string, string[]>) => void;
  data: DataRow[];
}

// Helper function to get unique values from an array
const getUniqueValues = (arr: any[]): string[] => {
  return Array.from(new Set(arr.filter(Boolean))).sort();
};

// Helper function to check if a value is numeric
const isNumeric = (value: string): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(Number(value.replace(/[^0-9.-]+/g, "")));
};

// Helper function to check if a string might contain a number range
const isRange = (value: string): boolean => {
  return /\d+\s*-\s*\d+/.test(value) || /^[<>]\s*\d+/.test(value);
};

// Helper function to parse numeric values for sorting
const parseNumericValue = (value: string): number => {
  const num = value.replace(/[^0-9.-]+/g, "");
  return parseFloat(num) || 0;
};

// Helper function to determine if a column should be filterable
const isFilterableColumn = (columnName: string, values: any[]): boolean => {
  // Always include these columns regardless of unique value count
  const alwaysInclude = ['Title', 'Technologies', 'Industry', 'Employees_Size', 'Annual_Revenue', 'Country'];
  
  if (alwaysInclude.includes(columnName)) {
    return true;
  }

  // Skip columns that are likely to be unique identifiers or URLs
  const nonFilterablePatterns = [
    /id$/i,
    /url/i,
    /link/i,
    /^_/,
    /password/i,
    /email/i,
    /phone/i,
    /address/i,
  ];

  if (nonFilterablePatterns.some(pattern => pattern.test(columnName))) {
    return false;
  }

  // Get unique values count
  const uniqueValues = new Set(values.filter(Boolean));
  
  // Column should be filterable if:
  // 1. It has some values (not all null/empty)
  // 2. It has more than 1 unique value
  // 3. It has fewer unique values than 50% of total rows (to avoid columns with mostly unique values)
  return uniqueValues.size > 1 && uniqueValues.size < values.length * 0.5;
};

// Add these predefined categories
const EMPLOYEE_SIZE_CATEGORIES = [
  { label: "< 100", value: "lt100" },
  { label: "100 - 500", value: "100-500" },
  { label: "500+", value: "gt500" }
];

const REVENUE_CATEGORIES = [
  { label: "< 1M", value: "lt1M" },
  { label: "1M - 50M", value: "1M-50M" },
  { label: "50M+", value: "gt50M" }
];

// Helper function to categorize employee size
const categorizeEmployeeSize = (size: string): string => {
  const count = parseInt(size.replace(/[^0-9]/g, '')) || 0;
  if (count < 100) return "lt100";
  if (count <= 500) return "100-500";
  return "gt500";
};

// Helper function to categorize revenue
const categorizeRevenue = (revenue: string): string => {
  const amount = parseFloat(revenue.replace(/[^0-9.-]+/g, "")) || 0;
  if (amount < 1000000) return "lt1M";
  if (amount <= 50000000) return "1M-50M";
  return "gt50M";
};

export default function Filter({ isOpen, onClose, onApplyFilters, data }: FilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [filterSections, setFilterSections] = useState<FilterSection[]>([]);

  // Generate filter sections from data
  useEffect(() => {
    if (!data || data.length === 0) return;

    const generateFilterSections = () => {
      const sections: FilterSection[] = [];
      
      // Get all columns from the data
      const columns = Object.keys(data[0]);

      columns.forEach(column => {
        const values = data.map(item => item[column]);
        
        // Skip if column shouldn't be filterable
        if (!isFilterableColumn(column, values)) return;

        // Special handling for Technologies column
        if (column === 'Technologies') {
          // Get unique technologies from comma-separated values
          const uniqueTechnologies = getUniqueValues(
            values.flatMap(value => 
              value ? value.split(',').map((t: string) => t.trim()).filter(Boolean) : []
            )
          );

          if (uniqueTechnologies.length > 0) {
            sections.push({
              title: column,
              options: uniqueTechnologies.map(tech => ({
                label: tech,
                value: tech
              })),
              multiSelect: true
            });
          }
          return;
        }

        // Special handling for Employee Size
        if (column === 'Employees_Size') {
          sections.push({
            title: column,
            options: EMPLOYEE_SIZE_CATEGORIES,
            multiSelect: true
          });
          return;
        }

        // Special handling for Revenue
        if (column === 'Annual_Revenue') {
          sections.push({
            title: column,
            options: REVENUE_CATEGORIES,
            multiSelect: true
          });
          return;
        }

        // Handle other columns
        let uniqueValues = getUniqueValues(
          values.flatMap(value => 
            typeof value === 'string' && value.includes(',') 
              ? value.split(',').map(v => v.trim()) 
              : value
          )
        );

        // Sort values based on their type
        uniqueValues.sort((a, b) => {
          // Check if values are numeric or ranges
          const isNumericValues = isNumeric(a) && isNumeric(b);
          const isRangeValues = isRange(a) && isRange(b);

          if (isNumericValues || isRangeValues) {
            return parseNumericValue(a) - parseNumericValue(b);
          }
          
          // Default to string comparison
          return a.localeCompare(b);
        });

        sections.push({
          title: column,
          options: uniqueValues.map(value => ({ 
            label: value, 
            value: value.toString() 
          })),
          multiSelect: true
        });
      });

      // Sort sections to ensure important filters appear first
      const priorityOrder = ['Title', 'Industry', 'Technologies', 'Employees_Size', 'Annual_Revenue', 'Country'];
      sections.sort((a, b) => {
        const aIndex = priorityOrder.indexOf(a.title);
        const bIndex = priorityOrder.indexOf(b.title);
        if (aIndex === -1 && bIndex === -1) return a.title.localeCompare(b.title);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });

      setFilterSections(sections);
    };

    generateFilterSections();
  }, [data]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleFilterSelect = (section: string, value: string, label: string) => {
    setSelectedFilters(prev => {
      const currentFilters = prev[section] || [];
      const sectionConfig = filterSections.find(s => s.title === section);
      
      if (sectionConfig?.multiSelect) {
        const newFilters = currentFilters.includes(value)
          ? currentFilters.filter(v => v !== value)
          : [...currentFilters, value];
        return { ...prev, [section]: newFilters };
      } else {
        return { ...prev, [section]: [value] };
      }
    });
    setOpenSection(null);
  };

  const removeFilter = (section: string, value: string) => {
    // Create a complete copy of current filters
    const updatedFilters = JSON.parse(JSON.stringify(selectedFilters));
    
    // Remove the item from our copy
    updatedFilters[section] = updatedFilters[section].filter((v: string) => v !== value);
    
    // First update the local state
    setSelectedFilters(updatedFilters);
    
    // Process for parent component
    const processedFilters = { ...updatedFilters };
    
    // Process Employee Size filters
    if (processedFilters['Employees_Size']) {
      processedFilters['Employees_Size'] = processedFilters['Employees_Size'].map((v: string) => {
        switch (v) {
          case 'lt100': return '< 100';
          case '100-500': return '100 - 500';
          case 'gt500': return '500+';
          default: return v;
        }
      });
    }

    // Process Revenue filters
    if (processedFilters['Annual_Revenue']) {
      processedFilters['Annual_Revenue'] = processedFilters['Annual_Revenue'].map((v: string) => {
        switch (v) {
          case 'lt1M': return '< 1M';
          case '1M-50M': return '1M - 50M';
          case 'gt50M': return '50M+';
          default: return v;
        }
      });
    }

    // Call the parent update function after a minimal delay
    // to ensure we're not updating during render
    setTimeout(() => {
      onApplyFilters(processedFilters);
    }, 10);
    
    setOpenSection(null);
  };

  const clearFilters = () => {
    // First update the local state
    setSelectedFilters({});
    
    // Use setTimeout to ensure we're not updating during render
    setTimeout(() => {
      // Then apply to parent
      onApplyFilters({});
      onClose();
    }, 10);
  };

  const handleApply = () => {
    // Close all open dropdowns
    const openDropdowns = document.querySelectorAll('[data-state="open"]');
    openDropdowns.forEach((dropdown) => {
      (dropdown as HTMLElement).click();
    });

    // Create a deep copy to work with
    const currentFilters = JSON.parse(JSON.stringify(selectedFilters));
    const processedFilters = { ...currentFilters };
    
    // Process Employee Size filters
    if (processedFilters['Employees_Size']) {
      processedFilters['Employees_Size'] = processedFilters['Employees_Size'].map((value: string) => {
        switch (value) {
          case 'lt100': return '< 100';
          case '100-500': return '100 - 500';
          case 'gt500': return '500+';
          default: return value;
        }
      });
    }

    // Process Revenue filters
    if (processedFilters['Annual_Revenue']) {
      processedFilters['Annual_Revenue'] = processedFilters['Annual_Revenue'].map((value: string) => {
        switch (value) {
          case 'lt1M': return '< 1M';
          case '1M-50M': return '1M - 50M';
          case 'gt50M': return '50M+';
          default: return value;
        }
      });
    }

    // Apply filters and close the filter modal after a short delay
    setTimeout(() => {
      onApplyFilters(processedFilters);
      onClose();
    }, 10);
  };

  const getSelectedLabel = (section: string, value: string) => {
    const sectionConfig = filterSections.find(s => s.title === section);
    return sectionConfig?.options.find(opt => opt.value === value)?.label || value;
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#1C1C1C] bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-[#1C1C1C] shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50 flex flex-col border-l border-white/20`}
      >
        <div className="flex-none p-4 border-b border-gray-800">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Filters</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-900 rounded-full text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-grow">
          <div className="p-4 space-y-6">
            {filterSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <div className="text-sm font-medium text-gray-300">
                  {section.title.replace(/_/g, ' ')}
                </div>
                
                <div className="relative">
                  {/* Selected Items Display */}
                  <div 
                    className="min-h-[42px] bg-[#1C1C1C] rounded-md px-3 py-2 cursor-pointer border border-gray-800 hover:border-gray-700"
                    onClick={() => setOpenSection(openSection === section.title ? null : section.title)}
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedFilters[section.title]?.length ? (
                        selectedFilters[section.title].map(value => (
                          <span 
                            key={value} 
                            className="inline-flex items-center gap-1 bg-white/10 text-white text-sm rounded px-2 py-1"
                          >
                            {getSelectedLabel(section.title, value)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFilter(section.title, value);
                              }}
                              className="hover:text-gray-300"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">Select {section.title.replace(/_/g, ' ').toLowerCase()}...</span>
                      )}
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                        openSection === section.title ? 'transform rotate-180' : ''
                      }`} />
                    </div>
                  </div>

                  {/* Dropdown Options */}
                  {openSection === section.title && section.options.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-[#1C1C1C] border border-gray-800 rounded-md shadow-lg">
                      <div className="py-1 max-h-48 overflow-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                        {section.options.map((option) => (
                          <div
                            key={option.value}
                            className={`flex items-center px-3 py-2 cursor-pointer ${
                              selectedFilters[section.title]?.includes(option.value)
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                            }`}
                            onClick={() => handleFilterSelect(section.title, option.value, option.label)}
                          >
                            {option.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex-none p-4 border-t border-gray-800 mb-4">
          <div className="flex justify-between">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-900 rounded"
            >
              Clear all
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-white text-black font-medium rounded hover:bg-gray-200"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 