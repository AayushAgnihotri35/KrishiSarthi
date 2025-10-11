// routes/cropListings.js
const express = require('express');
const router = express.Router();
const CropListing = require('../models/CropListing');

// Create new crop listing
router.post('/', async (req, res) => {
  try {
    const listing = new CropListing(req.body);
    await listing.save();
    
    res.status(201).json({
      success: true,
      message: 'Crop listing created successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error creating crop listing:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create listing',
      error: error.message
    });
  }
});

// Get all crop listings
router.get('/', async (req, res) => {
  try {
    const { status, crop, quality, page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (crop) filter['crop.name'] = new RegExp(crop, 'i');
    if (quality) filter['cropDetails.quality'] = quality;
    if (search) {
      filter.$or = [
        { 'seller.name': new RegExp(search, 'i') },
        { 'seller.phone': new RegExp(search, 'i') },
        { 'crop.name': new RegExp(search, 'i') },
        { listingNumber: new RegExp(search, 'i') }
      ];
    }

    const listings = await CropListing.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CropListing.countDocuments(filter);

    res.json({
      success: true,
      data: listings,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching crop listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: error.message
    });
  }
});

// Get listings by phone number (seller's own listings)
router.get('/seller/:phone', async (req, res) => {
  try {
    const listings = await CropListing.find({ 
      'seller.phone': req.params.phone 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: listings,
      count: listings.length
    });
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings',
      error: error.message
    });
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await CropListing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listing',
      error: error.message
    });
  }
});

// Update listing status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, finalPrice, soldDate } = req.body;
    
    const listing = await CropListing.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        finalPrice,
        soldDate,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      message: 'Listing updated successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update listing',
      error: error.message
    });
  }
});

// Add buyer contact to listing
router.post('/:id/buyer-contact', async (req, res) => {
  try {
    const { buyerName, buyerPhone, offeredPrice } = req.body;
    
    const listing = await CropListing.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { 
          buyerContacts: {
            buyerName,
            buyerPhone,
            offeredPrice,
            contactedAt: new Date()
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      message: 'Buyer contact added successfully',
      data: listing
    });
  } catch (error) {
    console.error('Error adding buyer contact:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to add buyer contact',
      error: error.message
    });
  }
});

// Delete listing
router.delete('/:id', async (req, res) => {
  try {
    const listing = await CropListing.findByIdAndDelete(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing',
      error: error.message
    });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalListings = await CropListing.countDocuments();
    const activeListings = await CropListing.countDocuments({ status: 'active' });
    const soldListings = await CropListing.countDocuments({ status: 'sold' });
    const negotiatingListings = await CropListing.countDocuments({ status: 'negotiating' });
    
    // Get total quantity available
    const quantityResult = await CropListing.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, totalQuantity: { $sum: '$cropDetails.quantity' } } }
    ]);
    const totalQuantity = quantityResult.length > 0 ? quantityResult[0].totalQuantity : 0;

    const recentListings = await CropListing.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        total: totalListings,
        active: activeListings,
        sold: soldListings,
        negotiating: negotiatingListings,
        totalQuantity,
        recent: recentListings
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;