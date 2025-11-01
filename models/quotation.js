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
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',          // References the User model
    required: true,       // Must be provided
    index: true           // Indexed for faster queries
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
    enum: ['pending', 'contacted', 'quoted', 'approved', 'rejected', 'completed', 'cancelled'],
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
  }],
  
   // Completion fields (ADD THESE)
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String
  },
  completedBy: {
    type: String
  },
  completedAt: {
    type: Date
  },

  // Acceptance fields (if not already present)
  acceptedBy: {
    type: String
  },
  acceptedAt: {
    type: Date
  },
  acceptedContact: {
    type: String
  },

  // Cancellation fields (if not already present)
  cancelledBy: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  },

  // Status history (if not already present)
  statusHistory: [{
    status: String,
    changedAt: Date,
    changedBy: String,
    notes: String,
    rating: Number
  }],

  // NEW FIELDS
  acceptedBy: String,
  acceptedAt: Date,
  acceptedContact: String,
  cancelledBy: String,
  cancelledAt: Date,
  cancelReason: String,
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String,
    notes: String
  }]
}, 
{
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

