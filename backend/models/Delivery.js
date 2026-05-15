const mongoose = require('mongoose')

const deliveryLineSchema = mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown' },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false },
)

const deliveryLineCheckSchema = mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qtyAck: { type: Number },
    ok: { type: Boolean, default: false },
  },
  { _id: false },
)

const billerReturnLineSchema = mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
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

    billerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

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
    pickedUpTagIds: { type: [String], default: [] },
    deliveredTagIds: { type: [String], default: [] },
    returnedTagIds: { type: [String], default: [] },

    damagedTagIds: { type: [String], default: [] },
    lostTagIds: { type: [String], default: [] },

    vehicleVerifiedAt: { type: Date },
    vehicleVerifiedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickedUpAt: { type: Date },
    pickedUpByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    challanNo: { type: String },
    challanGeneratedAt: { type: Date },

    deliveryVerifyToken: { type: String, trim: true },
    billerReturnVerifyToken: { type: String, trim: true },

    deliveryVerifierName: { type: String, trim: true },
    deliveryVerifiedAt: { type: Date },
    deliveryLineChecks: { type: [deliveryLineCheckSchema], default: [] },
    deliverySignature: { type: String },

    billerReturnSubmittedAt: { type: Date },
    billerDamagedLines: { type: [billerReturnLineSchema], default: [] },
    billerMissingLines: { type: [billerReturnLineSchema], default: [] },
    damageTotal: { type: Number },
    missingTotal: { type: Number },

    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

deliverySchema.index({ deliveryAt: 1 })
deliverySchema.index({ status: 1, deliveryAt: 1 })
deliverySchema.index({ fromGodownId: 1, deliveryAt: 1 })
deliverySchema.index({ assignedDeliveryUserId: 1, deliveryAt: 1 })
deliverySchema.index({ billerUserId: 1, deliveryAt: -1 })
deliverySchema.index({ deliveryVerifyToken: 1 }, { unique: true, sparse: true })
deliverySchema.index({ billerReturnVerifyToken: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('Delivery', deliverySchema)
