import { Schema, model } from 'mongoose';

const contactSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['ambulance', 'police', 'mosque', 'temple', 'doctor', 'blood_donor', 'other'],
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    area: { type: String, required: true, index: true },
    available24x7: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ContactModel = model('Contact', contactSchema);

