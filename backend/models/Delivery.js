const mongoose = require('mongoose')

const deliveryLineSchema = mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    godownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown' },
    qty: { type: Number, required: true, min: 0 },
    dispatchedQty: { type: Number, default: 0, min: 0 },
    // Biller/staff return reconciliation only. Short-delivery at verify shrinks
    // qty + dispatchedQty instead of incrementing returnedQty.
    returnedQty: { type: Number, default: 0, min: 0 },
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
    deliveryNo: { type: String, required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

    customerName: { type: String, required: true, trim: true },
    siteName: { type: String, trim: true },
    siteAddress: { type: String, trim: true },
    contactPhone: { type: String, trim: true },

    billerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    fromGodownId: { type: mongoose.Schema.Types.ObjectId, ref: 'Godown', required: true },
    deliveryAt: { type: Date, required: true },
    returnExpectedAt: { type: Date },
    deliveryTimeSlot: { type: String, enum: ['MORNING', 'AFTERNOON', 'EVENING'] },
    returnTimeSlot: { type: String, enum: ['MORNING', 'AFTERNOON', 'EVENING'] },
    selfDelivery: { type: Boolean, default: false },

    assignedDeliveryUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vehicleLabel: { type: String, trim: true },
    driverName: { type: String, trim: true },
    driverPhone: { type: String, trim: true },
    vehicleType: { type: String, enum: ['PRIVATE', 'PORTER', 'OWN'], default: 'OWN' },

    lines: { type: [deliveryLineSchema], default: [] },

    status: {
      type: String,
      required: true,
      enum: [
        'PROCESSED',
        'PACKED',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'RETURN_PICKUP',
        'PENDING_RETURN',
        'COMPLETED',
        'BILLED',
        'CANCELLED',
      ],
      default: 'PROCESSED',
    },

    phase: {
      type: String,
      enum: ['FORWARD', 'RETURN'],
      default: 'FORWARD',
    },

    packedAt: { type: Date },
    outForDeliveryAt: { type: Date },

    returnPickupVehicleLabel: { type: String, trim: true },
    returnPickupDriverName: { type: String, trim: true },
    returnPickupDriverPhone: { type: String, trim: true },
    returnPickupVehicleType: { type: String, enum: ['PRIVATE', 'PORTER', 'OWN'], default: 'OWN' },
    returnPickupAssignedAt: { type: Date },
    returnPickupAssignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    dispatchedTagIds: { type: [String], default: [] },
    pickedUpTagIds: { type: [String], default: [] },
    deliveredTagIds: { type: [String], default: [] },
    returnPickedUpTagIds: { type: [String], default: [] },
    returnedTagIds: { type: [String], default: [] },

    damagedTagIds: { type: [String], default: [] },
    lostTagIds: { type: [String], default: [] },

    vehicleVerifiedAt: { type: Date },
    vehicleVerifiedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pickedUpAt: { type: Date },
    pickedUpByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    challanNo: { type: String },
    challanGeneratedAt: { type: Date },

    billingType: { type: String, enum: ['FREE', 'INVOICE'], default: undefined },
    invoiceNo: { type: String, trim: true },
    invoiceName: { type: String, trim: true },
    invoiceAmount: { type: String, trim: true },
    billedAt: { type: Date },

    deliveryVerifyToken: { type: String, trim: true },
    billerReturnVerifyToken: { type: String, trim: true },

    deliveryVerifierName: { type: String, trim: true },
    deliveryVerifiedAt: { type: Date },
    deliveryLineChecks: { type: [deliveryLineCheckSchema], default: [] },
    deliverySignature: { type: String },

    billerReturnSubmittedAt: { type: Date },
    billerReturnName: { type: String, trim: true },
    billerSignature: { type: String },
    billerDamagedLines: { type: [billerReturnLineSchema], default: [] },
    billerMissingLines: { type: [billerReturnLineSchema], default: [] },
    // Items physically collected back from the biller right now (undamaged) —
    // these are the ones that get restocked into the godown.
    billerCollectedLines: { type: [billerReturnLineSchema], default: [] },
    damageTotal: { type: Number },
    missingTotal: { type: Number },

    // ── Pending (not-yet-returned) items reported from the biller return form ──
    // When the biller reports fewer damaged/missing/collected items than were
    // dispatched, the remainder is still outstanding with the customer. The
    // biller picks a date and a rough time-of-day slot for when those
    // remaining items will come back.
    billerPendingReturnLines: { type: [billerReturnLineSchema], default: [] },
    billerPendingReturnAt: { type: Date },
    billerPendingReturnSlot: { type: String, enum: ['MORNING', 'AFTERNOON', 'EVENING'] },
    billerPendingReturnNote: { type: String, trim: true },

    // ── Partial return / re-delivery fields ──────────────────────────────
    // Set when admin schedules a new delivery date for items the client
    // did not return on the original returnExpectedAt date.
    reDeliveryDate: { type: Date, default: null },
    reDeliveryNote: { type: String, trim: true, default: null },
    // ────────────────────────────────────────────────────────────────────

    createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

deliverySchema.index({ deliveryNo: 1 })
deliverySchema.index({ deliveryAt: 1 })
deliverySchema.index({ status: 1, deliveryAt: 1 })
deliverySchema.index({ fromGodownId: 1, deliveryAt: 1 })
deliverySchema.index({ assignedDeliveryUserId: 1, deliveryAt: 1 })
deliverySchema.index({ billerUserId: 1, deliveryAt: -1 })
deliverySchema.index({ deliveryVerifyToken: 1 }, { unique: true, sparse: true })
deliverySchema.index({ billerReturnVerifyToken: 1 }, { unique: true, sparse: true })
// Index for the return calendar queries
deliverySchema.index({ returnExpectedAt: 1, phase: 1, status: 1 })
deliverySchema.index({ billerPendingReturnAt: 1, phase: 1, status: 1 })
deliverySchema.index({ returnPickupAssignedAt: 1, phase: 1, status: 1 })

module.exports = mongoose.model('Delivery', deliverySchema)