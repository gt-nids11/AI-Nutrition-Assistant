const PantryItem = require('../models/PantryItem');

// @desc    Get all pantry items for user
// @route   GET /api/pantry
// @access  Private
exports.getPantryItems = async (req, res) => {
  try {
    const items = await PantryItem.find({ user: req.user.id }).sort({ expiryDate: 1 });
    res.json({ success: true, count: items.length, items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new pantry item
// @route   POST /api/pantry
// @access  Private
exports.addPantryItem = async (req, res) => {
  try {
    const { name, quantity, unit, expiryDate } = req.body;

    if (!name || quantity === undefined || !unit || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Please provide name, quantity, unit and expiry date' });
    }

    const item = await PantryItem.create({
      user: req.user.id,
      name,
      quantity: Number(quantity),
      unit,
      expiryDate: new Date(expiryDate)
    });

    res.status(201).json({ success: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update pantry item details
// @route   PUT /api/pantry/:id
// @access  Private
exports.editPantryItem = async (req, res) => {
  try {
    const { name, quantity, unit, expiryDate } = req.body;
    let item = await PantryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Pantry item not found' });
    }

    // Ensure item belongs to user
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const updatedData = {};
    if (name !== undefined) updatedData.name = name;
    if (quantity !== undefined) updatedData.quantity = Number(quantity);
    if (unit !== undefined) updatedData.unit = unit;
    if (expiryDate !== undefined) updatedData.expiryDate = new Date(expiryDate);

    item = await PantryItem.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData },
      { new: true }
    );

    res.json({ success: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete pantry item
// @route   DELETE /api/pantry/:id
// @access  Private
exports.deletePantryItem = async (req, res) => {
  try {
    const item = await PantryItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Pantry item not found' });
    }

    // Ensure item belongs to user
    if (item.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await PantryItem.deleteOne({ _id: req.params.id });

    res.json({ success: true, message: 'Item removed from pantry' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expiring pantry items
// @route   GET /api/pantry/expiring
// @access  Private
exports.getExpiringItems = async (req, res) => {
  try {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // Items expiring between now and 3 days from now, or already expired
    const expiringItems = await PantryItem.find({
      user: req.user.id,
      expiryDate: { $lte: threeDaysFromNow }
    }).sort({ expiryDate: 1 });

    res.json({ success: true, count: expiringItems.length, items: expiringItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
