import mongoose, { Schema, models } from "mongoose"

export interface ICreditRequest extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  amount: number
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
}

const creditRequestSchema = new Schema<ICreditRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
)

export const CreditRequest = models.CreditRequest || mongoose.model<ICreditRequest>("CreditRequest", creditRequestSchema) 