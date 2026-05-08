const mongoose = require('mongoose')

const deliveryLineSchema = mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const deliverySchema = mongoose.Schema(
  {
    deliveryNo: { type: String, required: true, unique: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

    customerName: { type: String, required: true, trim: true },
    siteName: { type: String, trim: true },
    siteAddress: { type: String, trim: true },
    contactPhone: { type: String, trim: true },

    fromGodownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    deliveryAt: { type: Date, required: true },
    returnExpectedAt: { type: Date },

    assignedDeliveryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vehicleLabel: { type: String, trim: true },

    lines: { type: [deliveryLineSchema], default: [] },

    status: {
      type: String,
      required: true,
      enum: ['UPCOMING', 'DISPATCHED', 'DELIVERED', 'PENDING_RETURN', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
    },

    dispatchedTagIds: { type: [String], default: [] },
    deliveredTagIds: { type: [String], default: [] },
    returnedTagIds: { type: [String], default: [] },

    damagedTagIds: { type: [String], default: [] },
    lostTagIds: { type: [String], default: [] },

    challanNo: { type: String },
    challanGeneratedAt: { type: Date },

    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

deliverySchema.index({ deliveryAt: 1 })
deliverySchema.index({ status: 1, deliveryAt: 1 })
deliverySchema.index({ fromGodownId: 1, deliveryAt: 1 })
deliverySchema.index({ assignedDeliveryUserId: 1, deliveryAt: 1 })

module.exports = mongoose.model('Delivery', deliverySchema)

