// models/Complaints.js
const mongoose = require('mongoose');

const RowSchema = new mongoose.Schema({
  sr: { type: String },            // eg "1"
  source: { type: String },        // "Directly from Investors"
  pendingAtEndLastMonth: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  resolved: { type: Number, default: 0 },
  totalPending: { type: Number, default: 0 },
  pendingMoreThan3Months: { type: Number, default: 0 },
  avgResolutionDays: { type: Number, default: 0 }
}, { _id: false });

const TrendMonthSchema = new mongoose.Schema({
  sr: { type: Number },
  month: { type: String }, // e.g. "March 25"
  carriedForward: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  resolved: { type: Number, default: 0 },
  pending: { type: Number, default: 0 }
}, { _id: false });

const TrendYearSchema = new mongoose.Schema({
  sr: { type: Number },
  year: { type: String }, // e.g. "2025-2026"
  carriedForward: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  resolved: { type: Number, default: 0 },
  pending: { type: Number, default: 0 }
}, { _id: false });

const AuditSchema = new mongoose.Schema({
  sr: { type: Number },
  financialYear: { type: String },
  complianceStatus: { type: String, default: "NA" },
  remarks: { type: String, default: "" }
}, { _id: false });

const ComplaintsSchema = new mongoose.Schema({
  // The "dateDisplayed" is the heading date admin sets (format: ISO or human)
  dateDisplayed: { type: Date, default: Date.now },

  // Table 1 rows (three sources)
  tableRows: { type: [RowSchema], default: [
    { sr: "1", source: "Directly from Investors" },
    { sr: "2", source: "SEBI (SCORES)" },
    { sr: "3", source: "Other Sources (if any)" }
  ] },

  // Trend of monthly disposal
  monthlyTrend: { type: [TrendMonthSchema], default: [] },

  // Trend of year disposal
  yearlyTrend: { type: [TrendYearSchema], default: [] },

  // Annual compliance audit
  annualAudit: { type: [AuditSchema], default: [] },

  // metadata
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
}, { timestamps: true });

module.exports = mongoose.model('Complaints', ComplaintsSchema);
