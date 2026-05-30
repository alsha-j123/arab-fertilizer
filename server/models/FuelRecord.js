const mongoose = require('mongoose');

const fuelRecordSchema = new mongoose.Schema({
  employee:     { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  vehicleInfo:  { type: String, required: true, trim: true },       // e.g. "Honda CD-70 — ABC-1234"
  fuelType:     { type: String, enum: ['Petrol', 'Diesel', 'CNG'], default: 'Petrol' },
  liters:       { type: Number, required: true, min: 0 },
  costPerLiter: { type: Number, required: true, min: 0 },
  totalCost:    { type: Number, required: true, min: 0 },
  date:         { type: Date, required: true, default: Date.now },
  odometerKm:   { type: Number },
  notes:        { type: String, trim: true, default: '' },
}, { timestamps: true });

fuelRecordSchema.index({ employee: 1 });
fuelRecordSchema.index({ date: -1 });

module.exports = mongoose.model('FuelRecord', fuelRecordSchema);
