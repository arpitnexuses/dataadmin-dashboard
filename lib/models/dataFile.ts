import mongoose, { Schema, models } from "mongoose"

export interface IDataFile extends mongoose.Document {
  filename: string
  originalName: string
  columns: string[]
  data: Array<{
    [key: string]: string
    First_Name: string
    Last_Name: string
    Title: string
    Company: string
    Email: string
    Corporate_Phone: string
    Personal_Phone: string
    Employees_Size: string
    Industry: string
    Person_Linkedin_Url: string
    Website: string
    Company_Linkedin_Url: string
    Country: string
    Technologies: string
    Annual_Revenue: string
    S_No: string
    Account_name: string
    Industry_client: string
    Industry_Nexuses: string
    Type_of_Company: string
    priority: string
    Sales_Manager: string
    No_of_Employees: string
    Revenue: string
    Contact_Name: string
    Designation: string
    Contact_Number_Personal: string
    Phone_Status: string
    Email_id: string
    Email_Status: string
    Country_Contact_Person: string
    City: string
    State: string
    Company_Address: string
    Company_Headquarter: string
    Workmates_Remark: string
    TM_Remarks: string
  }>
  createdAt: Date
  updatedAt: Date
}

const dataFileSchema = new Schema<IDataFile>(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    columns: {
      type: [String],
      required: true,
    },
    data: [{
      First_Name: String,
      Last_Name: String,
      Title: String,
      Company: String,
      Email: String,
      Corporate_Phone: String,
      Personal_Phone: String,
      Employees_Size: String,
      Industry: String,
      Person_Linkedin_Url: String,
      Website: String,
      Company_Linkedin_Url: String,
      Country: String,
      Technologies: String,
      Annual_Revenue: String,
      S_No: String,
      Account_name: String,
      Industry_client: String,
      Industry_Nexuses: String,
      Type_of_Company: String,
      priority: String,
      Sales_Manager: String,
      No_of_Employees: String,
      Revenue: String,
      Contact_Name: String,
      Designation: String,
      Contact_Number_Personal: String,
      Phone_Status: String,
      Email_id: String,
      Email_Status: String,
      Country_Contact_Person: String,
      City: String,
      State: String,
      Company_Address: String,
      Company_Headquarter: String,
      Workmates_Remark: String,
      TM_Remarks: String,
      _id: false
    }],
  },
  { timestamps: true },
)

export const DataFile = models.DataFile || mongoose.model<IDataFile>("DataFile", dataFileSchema)

