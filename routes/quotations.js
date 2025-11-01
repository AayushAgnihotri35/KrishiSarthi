const express = require('express');
const router = express.Router();
const Quotation = require('../models/quotation');
const auth = require('../middleware/auth');

// Create new quotation - PROTECTED with auth middleware
router.post('/', auth, async (req, res) => {
  try {
    // Add userId from authenticated user
    const quotation = new Quotation({
      ...req.body,
      userId: req.user.id
    });
    await quotation.save();
    
    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to create quotation',
      error: error.message
    });
  }
});

// Get current user's quotations - PROTECTED
router.get('/my-quotations', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 100 } = req.query;
    
    const filter = { userId: req.user.id };
    if (status) filter.status = status;

    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quotation.countDocuments(filter);

    res.json({
      success: true,
      data: quotations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
});

// Get all quotations (admin/public view - without auth for marketplace)
router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 100 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;

    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Quotation.countDocuments(filter);

    res.json({
      success: true,
      data: quotations,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
});

// Get quotations by phone number (for backward compatibility/notifications)
router.get('/customer/:phone', async (req, res) => {
  try {
    const quotations = await Quotation.find({ 
      'customerDetails.phone': req.params.phone 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quotations,
      count: quotations.length
    });
  } catch (error) {
    console.error('Error fetching customer quotations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
});

// Get single quotation - PROTECTED (user can only view their own)
router.get('/:id', auth, async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found or unauthorized'
      });
    }

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation',
      error: error.message
    });
  }
});

// ============================================
// ACCEPT & CANCEL ROUTES (NEW FUNCTIONALITY)
// ============================================

// Accept Equipment Quotation (Supplier side - no auth needed for accepting)
router.patch('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const { acceptedBy, contactNumber, supplierName } = req.body;

    const quotation = await Quotation.findById(id);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    if (quotation.status === 'completed' || quotation.status === 'cancelled' || quotation.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Quotation cannot be accepted'
      });
    }

    quotation.status = 'approved';
    quotation.acceptedBy = acceptedBy || supplierName;
    quotation.acceptedAt = new Date();
    quotation.acceptedContact = contactNumber;
    
    if (!quotation.statusHistory) {
      quotation.statusHistory = [];
    }
    quotation.statusHistory.push({
      status: 'approved',
      changedAt: new Date(),
      changedBy: acceptedBy || supplierName,
      notes: `Quotation accepted by ${supplierName}. Contact: ${contactNumber}`
    });

    await quotation.save();

    res.json({
      success: true,
      message: 'Quotation accepted successfully',
      data: quotation
    });

  } catch (error) {
    console.error('Error accepting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept quotation',
      error: error.message
    });
  }
});

// Cancel Equipment Quotation - PROTECTED
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const quotation = await Quotation.findOne({
      _id: id,
      userId: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found or unauthorized'
      });
    }

    if (quotation.status === 'completed' || quotation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Quotation is already completed or cancelled'
      });
    }

    quotation.status = 'cancelled';
    quotation.cancelledBy = 'Customer';
    quotation.cancelledAt = new Date();
    quotation.cancelReason = cancelReason;
    
    if (!quotation.statusHistory) {
      quotation.statusHistory = [];
    }
    quotation.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      changedBy: 'Customer',
      notes: cancelReason || 'Quotation cancelled by customer'
    });

    await quotation.save();

    res.json({
      success: true,
      message: 'Quotation cancelled successfully',
      data: quotation
    });

  } catch (error) {
    console.error('Error cancelling quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel quotation',
      error: error.message
    });
  }
});


// Add this route AFTER your cancel route and BEFORE module.exports

// Complete/Fulfill Equipment Quotation - PROTECTED
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback, completedBy } = req.body;

    const quotation = await Quotation.findOne({
      _id: id,
      userId: req.user.id
    });
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found or unauthorized'
      });
    }

    if (quotation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a cancelled quotation'
      });
    }

    if (quotation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Quotation is already completed'
      });
    }

    // Update quotation
    quotation.status = 'completed';
    quotation.rating = rating;
    quotation.feedback = feedback;
    quotation.completedBy = completedBy || 'Customer';
    quotation.completedAt = new Date();
    quotation.updatedAt = new Date();
    
    // Add to status history
    if (!quotation.statusHistory) {
      quotation.statusHistory = [];
    }
    quotation.statusHistory.push({
      status: 'completed',
      changedAt: new Date(),
      changedBy: completedBy || 'Customer',
      notes: feedback || 'Quotation marked as fulfilled by customer',
      rating: rating
    });

    await quotation.save();

    res.json({
      success: true,
      message: 'Request marked as completed successfully',
      data: quotation
    });

  } catch (error) {
    console.error('Error completing quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quotation',
      error: error.message
    });
  }
});

module.exports = router;
module.exports = router;