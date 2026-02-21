import { Schema, model } from 'mongoose';
import type { ListingType } from './community.types.js';

const listingSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['job', 'business', 'offer', 'freelancer', 'rental', 'vehicle'] satisfies ListingType[],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    area: { type: String, required: true, index: true },
    contactName: { type: String },
    contactPhone: { type: String },
    priceLabel: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ListingModel = model('Listing', listingSchema);

