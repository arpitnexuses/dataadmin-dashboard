import mongoose, { Schema, models } from "mongoose"

export interface IDataRequest extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  jobTitles: string[]
  geography: {
    target: string[]
    exclude: string[]
  }
  industry: {
    target: string[]
    exclude: string[]
  }
  companySize: {
    minEmployees?: number
    maxEmployees?: number
    minRevenue?: number
    maxRevenue?: number
  }
  ownershipType: string[]
  competitorProducts: string[]
  seniorityLevel: string[]
  engagementPreferences: string[]
  budget: {
    min?: number
    max?: number
    currency: string
  }
  financialIndicators: string[]
  technologyStack: string[]
  status: "pending" | "approved" | "rejected"
  hasBeenEdited: boolean
  createdAt: Date
  updatedAt: Date
}

const dataRequestSchema = new Schema<IDataRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    jobTitles: [{
      type: String,
    }],
    geography: {
      target: [String],
      exclude: [String],
    },
    industry: {
      target: [String],
      exclude: [String],
    },
    companySize: {
      minEmployees: Number,
      maxEmployees: Number,
      minRevenue: Number,
      maxRevenue: Number,
    },
    ownershipType: [String],
    competitorProducts: [String],
    seniorityLevel: [String],
    engagementPreferences: [String],
    budget: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: "USD",
      },
    },
    financialIndicators: [String],
    technologyStack: [String],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    hasBeenEdited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

export const DataRequest = models.DataRequest || mongoose.model<IDataRequest>("DataRequest", dataRequestSchema) 