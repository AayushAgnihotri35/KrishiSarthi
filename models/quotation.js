// models/Quotation.js
const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  equipment: {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: String, required: true },
    rentalPrice: String,
    subsidy: String
  },
  quotationType: {
    type: String,
    enum: ['purchase', 'rental'],
    required: true
  },
  customerDetails: {
    name: { type: String, required: true },
    phone: { 
      type: String, 
      required: true,
      match: /^[0-9]{10}$/
    },
    email: {
      type: String,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    location: { type: String, required: true },
    landSize: Number
  },
  rentalDuration: String,
  interests: {
    subsidy: { type: Boolean, default: false },
    loan: { type: Boolean, default: false },
    insurance: { type: Boolean, default: false }
  },
  additionalNotes: String,
  status: {
    type: String,
    enum: ['pending', 'contacted', 'quoted', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  quotationNumber: {
    type: String,
    unique: true
  },
  assignedTo: String,
  estimatedPrice: Number,
  finalPrice: Number,
  notes: [{ 
    text: String, 
    addedBy: String, 
    addedAt: Date 
  }]
}, {
  timestamps: true
});

// Generate quotation number before saving
quotationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `KS-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema, 'quotation');