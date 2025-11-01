// models/CropListing.js
const mongoose = require('mongoose');

const cropListingSchema = new mongoose.Schema({
  crop: {
    name: { type: String, required: true },
    category: { type: String, required: true },
    msp: { type: String, required: true }
  },
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',          // References the User model
    required: true,       // Must be provided
    index: true           // Indexed for faster queries
  },
  seller: {
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
    location: { type: String, required: true }
  },
  cropDetails: {
    quantity: { type: Number, required: true },
    quality: { 
      type: String, 
      enum: ['premium', 'standard', 'fair'],
      required: true 
    },
    expectedPrice: { type: Number, required: true },
    harvestDate: Date
  },
  services: {
    transport: { type: Boolean, default: false },
    storage: { type: Boolean, default: false },
    qualityTest: { type: Boolean, default: false }
  },
  additionalInfo: String,
  status: {
    type: String,
    enum: ['active', 'contacted', 'negotiating', 'sold', 'cancelled', 'expired'],
    default: 'active'
  },
  listingNumber: {
    type: String,
    unique: true
  },
  buyerContacts: [{
    buyerName: String,
    buyerPhone: String,
    offeredPrice: Number,
    contactedAt: Date
  }],
  finalPrice: Number,
  soldDate: Date,
  notes: [{ 
    text: String, 
    addedBy: String, 
    addedAt: Date 
  }],
  
  // NEW FIELDS
  soldTo: String,
  soldQuantity: Number,
  cancelledAt: Date,
  cancelReason: String,
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    notes: String
  }]
}, {
  timestamps: true
});

// Generate listing number before saving
cropListingSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('CropListing').countDocuments();
    this.listingNumber = `CL-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('CropListing', cropListingSchema, 'cropListings');