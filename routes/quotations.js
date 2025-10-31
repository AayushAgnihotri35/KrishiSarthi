const express = require('express');
const router = express.Router();
const Quotation = require('../models/quotation');

// Create new quotation (if you don't have this already)
router.post('/', async (req, res) => {
  try {
    const quotation = new Quotation(req.body);
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

// Get all quotations
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

// Get quotations by phone number (customer's own quotations)
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

// Get single quotation
router.get('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
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

// Accept Equipment Quotation
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

// Cancel Equipment Quotation
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelledBy, cancelReason, userPhone } = req.body;

    const quotation = await Quotation.findById(id);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Verify user is the owner
    if (quotation.customerDetails.phone !== userPhone) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this quotation'
      });
    }

    if (quotation.status === 'completed' || quotation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Quotation is already completed or cancelled'
      });
    }

    quotation.status = 'cancelled';
    quotation.cancelledBy = cancelledBy;
    quotation.cancelledAt = new Date();
    quotation.cancelReason = cancelReason;
    
    if (!quotation.statusHistory) {
      quotation.statusHistory = [];
    }
    quotation.statusHistory.push({
      status: 'cancelled',
      changedAt: new Date(),
      changedBy: cancelledBy,
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

module.exports = router;