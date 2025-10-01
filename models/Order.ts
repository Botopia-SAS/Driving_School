import { Schema, models, model } from 'mongoose';

// Schema for individual slots/appointments in the order
const OrderSlotSchema = new Schema({
  slotId: { type: String, required: true },
  instructorId: { type: String, required: false }, // Optional for ticket_class
  instructorName: { type: String, required: false }, // Optional for ticket_class
  ticketClassId: { type: String, required: false }, // For ticket_class orders
  date: { type: String, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  classType: { type: String, required: true }, // 'driving_test', 'driving_lesson', 'ticket_class'
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' }, // 'pending', 'confirmed', 'cancelled'
});

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, unique: true },
  
  // Type of order
  orderType: { type: String, required: true }, // 'driving_test', 'driving_lesson_package'
  
  // Original cart items (for backward compatibility)
  items: [
    {
      id: { type: String, required: true },
      title: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
    }
  ],
  
  // Detailed appointment/slot information
  appointments: [OrderSlotSchema],
  
  // For driving lesson packages
  packageDetails: {
    productId: { type: String },
    packageTitle: { type: String },
    packagePrice: { type: Number },
    totalHours: { type: Number },
    selectedHours: { type: Number },
    pickupLocation: { type: String },
    dropoffLocation: { type: String },
  },
  
  // Payment information
  total: { type: Number, required: true },
  paymentMethod: { type: String, default: 'online' }, // 'online', 'physical'
  paymentStatus: { type: String, default: 'pending' }, // 'pending', 'completed', 'failed'
  
  // Order status
  estado: { type: String, default: 'pending' }, // 'pending', 'confirmed', 'completed', 'cancelled'
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Generate unique order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    try {
      // Find the highest existing order number to ensure consecutive numbering
      const lastOrder = await (this.constructor as typeof models.Order)
        .findOne({}, { orderNumber: 1 })
        .sort({ createdAt: -1 })
        .lean() as { orderNumber?: string | number } | null;

      let nextNumber = 1;
      if (lastOrder && lastOrder.orderNumber) {
        // Parse the current highest number and increment
        const currentNumber = parseInt(lastOrder.orderNumber.toString());
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }

      this.orderNumber = nextNumber.toString();
    } catch (error) {
      console.error('Error generating order number:', error);
      // Fallback to timestamp if all else fails
      this.orderNumber = Date.now().toString();
    }
  }
  this.updatedAt = new Date();
  next();
});

export default models.Order || model('Order', OrderSchema); 