// routes/quotations.js
const express = require('express');
const router = express.Router();
const Quotation = require('../models/Quotation'); // We'll create this

// Create new quotation
router.post('/', async (req, res) => {
  try {
    const quotation = new Quotation(req.body);
    await quotation.save();
    
    res.status(201).json({
      success: true,
      message: 'Quotation submitted successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to submit quotation',
      error: error.message
    });
  }
});

// Get all quotations
router.get('/', async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10, search } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.quotationType = type;
    if (search) {
      filter.$or = [
        { 'customerDetails.name': new RegExp(search, 'i') },
        { 'customerDetails.phone': new RegExp(search, 'i') },
        { 'equipment.name': new RegExp(search, 'i') },
        { quotationNumber: new RegExp(search, 'i') }
      ];
    }

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

// Get quotations by phone number
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

// Update quotation status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, assignedTo, estimatedPrice, finalPrice } = req.body;
    
    const quotation = await Quotation.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        assignedTo,
        estimatedPrice,
        finalPrice,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update quotation',
      error: error.message
    });
  }
});

// Delete quotation
router.delete('/:id', async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndDelete(req.params.id);
    
    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    res.json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quotation',
      error: error.message
    });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const totalQuotations = await Quotation.countDocuments();
    const pendingQuotations = await Quotation.countDocuments({ status: 'pending' });
    const approvedQuotations = await Quotation.countDocuments({ status: 'approved' });
    const completedQuotations = await Quotation.countDocuments({ status: 'completed' });
    
    const purchaseCount = await Quotation.countDocuments({ quotationType: 'purchase' });
    const rentalCount = await Quotation.countDocuments({ quotationType: 'rental' });

    const recentQuotations = await Quotation.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        total: totalQuotations,
        pending: pendingQuotations,
        approved: approvedQuotations,
        completed: completedQuotations,
        purchase: purchaseCount,
        rental: rentalCount,
        recent: recentQuotations
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