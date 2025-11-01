const express = require('express');
const router = express.Router();
const CropListing = require('../models/CropListing');
const auth = require('../middleware/auth');

// Create new crop listing - PROTECTED
router.post('/', auth, async (req, res) => {
  try {
    const listing = new CropListing({
      ...req.body,
      userId: req.user.id
    });
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

// Get current user's crop listings - PROTECTED
router.get('/my-listings', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 100 } = req.query;
    
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

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

// Get all crop listings (public - for marketplace)
router.get('/', async (req, res) => {
  try {
    const { status, crop, quality, page = 1, limit = 100, search } = req.query;
    
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

// Get listings by phone number (for backward compatibility/notifications)
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

// Get single listing - PROTECTED (user can only view their own)
router.get('/:id', auth, async (req, res) => {
  try {
    const listing = await CropListing.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or unauthorized'
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

// Add buyer contact to listing (no auth needed for buyers)
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

// Delete listing - PROTECTED
router.delete('/:id', auth, async (req, res) => {
  try {
    const listing = await CropListing.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found or unauthorized'
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

// Get dashboard statistics - PROTECTED
router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    
    const totalListings = await CropListing.countDocuments(filter);
    const activeListings = await CropListing.countDocuments({ ...filter, status: 'active' });
    const soldListings = await CropListing.countDocuments({ ...filter, status: 'sold' });
    const negotiatingListings = await CropListing.countDocuments({ ...filter, status: 'negotiating' });
    
    const quantityResult = await CropListing.aggregate([
      { $match: { ...filter, status: 'active' } },
      { $group: { _id: null, totalQuantity: { $sum: '$cropDetails.quantity' } } }
    ]);
    const totalQuantity = quantityResult.length > 0 ? quantityResult[0].totalQuantity : 0;

    const recentListings = await CropListing.find(filter)
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

// ============================================
// ACCEPT, SOLD & CANCEL ROUTES (NEW FUNCTIONALITY)
// ============================================

// Accept Crop Listing (Buyer expresses interest - no auth needed)
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { buyerName, buyerPhone, offeredPrice } = req.body;

    const listing = await CropListing.findById(id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found'
      });
    }

    if (listing.status !== 'active' && listing.status !== 'contacted') {
      return res.status(400).json({
        success: false,
        message: 'Listing is not available for purchase'
      });
    }

    if (!listing.buyerContacts) {
      listing.buyerContacts = [];
    }

    const existingBuyer = listing.buyerContacts.find(
      b => b.buyerPhone === buyerPhone
    );

    if (existingBuyer) {
      return res.status(400).json({
        success: false,
        message: 'You have already expressed interest in this listing'
      });
    }

    listing.buyerContacts.push({
      buyerName,
      buyerPhone,
      offeredPrice,
      contactedAt: new Date()
    });

    if (listing.status === 'active') {
      listing.status = 'contacted';
    }

    if (!listing.statusHistory) {
      listing.statusHistory = [];
    }
    listing.statusHistory.push({
      status: 'contacted',
      changedAt: new Date(),
      notes: `Buyer ${buyerName} showed interest. Offered price: ₹${offeredPrice}/quintal`
    });

    await listing.save();

    res.json({
      success: true,
      message: 'Interest registered successfully. Seller will contact you soon.',
      data: listing
    });

  } catch (error) {
    console.error('Error accepting crop listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register interest',
      error: error.message
    });
  }
});

// Mark Crop as Sold - PROTECTED
router.patch('/:id/sold', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { soldTo, finalPrice, soldQuantity } = req.body;

    const listing = await CropListing.findOne({
      _id: id,
      userId: req.user.id
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found or unauthorized'
      });
    }

    if (listing.status === 'sold' || listing.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Listing is already sold or cancelled'
      });
    }

    listing.status = 'sold';
    listing.soldTo = soldTo;
    listing.soldDate = new Date();
    listing.finalPrice = finalPrice;
    listing.soldQuantity = soldQuantity || listing.cropDetails.quantity;
    
    if (!listing.statusHistory) {
      listing.statusHistory = [];
    }
    listing.statusHistory.push({
      status: 'sold',
      changedAt: new Date(),
      notes: `Sold to ${soldTo} at ₹${finalPrice}/quintal`
    });

    await listing.save();

    res.json({
      success: true,
      message: 'Crop marked as sold successfully',
      data: listing
    });

  } catch (error) {
    console.error('Error marking crop as sold:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark crop as sold',
      error: error.message
    });
  }
});

// Cancel Crop Listing - PROTECTED
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const listing = await CropListing.findOne({
      _id: id,
      userId: req.user.id
    });
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found or unauthorized'
      });
    }

    if (listing.status === 'sold' || listing.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Listing is already sold or cancelled'
      });
    }

    listing.status = 'cancelled';
    listing.cancelledAt = new Date();
    listing.cancelReason = cancelReason;
    
    if (!listing.statusHistory) {
      listing.statusHistory = [];
    }
    listing.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      notes: cancelReason || 'Listing cancelled by seller'
    });

    await listing.save();

    res.json({
      success: true,
      message: 'Crop listing cancelled successfully',
      data: listing
    });

  } catch (error) {
    console.error('Error cancelling crop listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel crop listing',
      error: error.message
    });
  }
});

module.exports = router;