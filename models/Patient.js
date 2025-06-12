// arogya-mcvk/backend/models/Patient.js
const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  dateOfAppointment: {
    type: Date,
    default: Date.now,
  },
  name: {
    type: String,
    required: [true, 'Patient name is required.'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  aadharNo: {
    type: String,
    required: [true, 'Aadhar number is required.'],
    unique: true, // Ensures Aadhar number is unique across all patient records
    trim: true,
    match: [/^\d{12}$/, 'Aadhar number must be 12 digits.'], // Basic Aadhar validation
  },
  contactNo: {
    type: String,
    required: [true, 'Contact number is required.'],
    trim: true,
    match: [/^\d{10,15}$/, 'Contact number must be between 10 to 15 digits.'], // Basic phone validation
  },
  diseases: {
    type: String,
    trim: true,
  },
  doctorName: {
    type: String,
    trim: true,
  },
  bodyWeightKg: { type: Number, min: [0, 'Body weight cannot be negative.'] },
  heightCm: { type: Number, min: [0, 'Height cannot be negative.'] },
  hemoglobin: { type: Number, min: [0, 'Hemoglobin cannot be negative.'] },
  bloodGroup: { type: String, trim: true },
  sbp: { type: Number, min: [0, 'SBP cannot be negative.'] }, // Systolic Blood Pressure
  dbp: { type: Number, min: [0, 'DBP cannot be negative.'] }, // Diastolic Blood Pressure
  wbc: { type: Number, min: [0, 'WBC count cannot be negative.'] }, // White Blood Cell count
  rbc: { type: Number, min: [0, 'RBC count cannot be negative.'] }, // Red Blood Cell count
  platelet: { type: Number, min: [0, 'Platelet count cannot be negative.'] },
  bmi: { type: Number, min: [0, 'BMI cannot be negative.'] }, // Body Mass Index
  bfrPercent: { type: Number, min: [0, 'BFR cannot be negative.'], max: [100, 'BFR cannot exceed 100.'] }, // Body Fat Rate
  bodyWaterPercent: { type: Number, min: [0, 'Body Water % cannot be negative.'], max: [100, 'Body Water % cannot exceed 100.'] },
  boneMassKg: { type: Number, min: [0, 'Bone Mass cannot be negative.'] },
  metabolicAge: { type: Number, min: [0, 'Metabolic Age cannot be negative.'] },
  vFatPercent: { type: Number, min: [0, 'V-Fat % cannot be negative.'], max: [100, 'V-Fat % cannot exceed 100.'] }, // Visceral Fat
  proteinMassKg: { type: Number, min: [0, 'Protein Mass cannot be negative.'] },
  muscleMassKg: { type: Number, min: [0, 'Muscle Mass cannot be negative.'] },
  diabetes: { 
    type: String, 
    trim: true, 
    default: 'None',
    enum: ['None', 'Type 1', 'Type 2', 'Gestational', 'Pre-diabetes', 'Other'] // Allowed values for diabetes status
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to calculate BMI before saving if weight and height are present and BMI is not manually set
PatientSchema.pre('save', function (next) {
  // Check if BMI is not manually set or if weight/height changed
  if ((this.isModified('bodyWeightKg') || this.isModified('heightCm')) && this.bodyWeightKg != null && this.heightCm != null && this.heightCm > 0) {
    const heightInMeters = this.heightCm / 100;
    this.bmi = parseFloat((this.bodyWeightKg / (heightInMeters * heightInMeters)).toFixed(2));
  }
  next();
});

// Create a text index for searching by name and Aadhar number (optional, can be useful for search performance)
PatientSchema.index({ name: 'text', aadharNo: 'text' });


module.exports = mongoose.model('Patient', PatientSchema);