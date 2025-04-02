import mongoose, { Schema, models } from "mongoose"

export interface IDataFile extends mongoose.Document {
  filename: string
  originalName: string
  data: Array<{
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
      _id: false
    }],
  },
  { timestamps: true },
)

export const DataFile = models.DataFile || mongoose.model<IDataFile>("DataFile", dataFileSchema)

