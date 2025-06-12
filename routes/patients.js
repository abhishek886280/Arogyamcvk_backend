// arogya-mcvk/backend/routes/patients.js
const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/authMiddleware'); // Import auth middleware

// ALL patient routes are now protected and require admin role

// @route   GET api/patients
// @desc    Get all patients or search patients by name/Aadhar
// @access  Private (Admin Only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
      // Using $or to search in multiple fields (name or Aadhar) with case-insensitivity
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } }, 
          { aadharNo: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const patients = await Patient.find(query).sort({ dateOfAppointment: -1 }); // Sort by most recent appointment
    res.json(patients);
  } catch (err) {
    console.error('Error fetching patients:', err.message);
    res.status(500).send('Server Error');
  }         
});

// @route   POST api/patients
// @desc    Add a new patient
// @access  Private (Admin Only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  // Destructure all expected fields from req.body
  const { 
    dateOfAppointment, name, address, aadharNo, contactNo, diseases, doctorName,
    bodyWeightKg, heightCm, hemoglobin, bloodGroup, sbp, dbp, wbc, rbc, platelet,
    bfrPercent, bodyWaterPercent, boneMassKg, metabolicAge, vFatPercent,
    proteinMassKg, muscleMassKg, diabetes
  } = req.body;

  try {
    // Check if patient with the same Aadhar No. already exists
    let existingPatient = await Patient.findOne({ aadharNo });
    if (existingPatient) {
      return res.status(400).json({ errors: [{ msg: 'Patient with this Aadhar No. already exists.' }] });
    }

    // Create a new patient instance with all fields
    const newPatientData = {
        dateOfAppointment, name, address, aadharNo, contactNo, diseases, doctorName,
        bodyWeightKg, heightCm, hemoglobin, bloodGroup, sbp, dbp, wbc, rbc, platelet,
        bfrPercent, bodyWaterPercent, boneMassKg, metabolicAge, vFatPercent,
        proteinMassKg, muscleMassKg, diabetes
    };
    if (req.body.bmi !== undefined && req.body.bmi !== null && req.body.bmi !== '') {
        newPatientData.bmi = parseFloat(req.body.bmi);
    }
    
    const newPatient = new Patient(newPatientData);
    const patient = await newPatient.save();
    res.status(201).json(patient);
  } catch (err) {
    console.error('Error adding patient:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ errors: messages.map(msg => ({ msg })) });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/patients/:id
// @desc    Get a single patient by ID
// @access  Private (Admin Only)
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found.' });
    }
    res.json(patient);
  } catch (err) {
    console.error('Error fetching patient by ID:', err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Patient not found (invalid ID format).' });
    }
    res.status(500).send('Server Error');
  }
});


// @route   PUT api/patients/:id
// @desc    Update an existing patient
// @access  Private (Admin Only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  
  // --- Start of FIX ---
  // The logic to build the patientFields object has been corrected.
  // It now dynamically and safely builds an object with only the fields
  // present in the request body, trusting the frontend's formatting (number or null).

  const patientFields = {};
  const allPossibleFields = [
    'dateOfAppointment', 'name', 'address', 'aadharNo', 'contactNo', 'diseases', 'doctorName',
    'bodyWeightKg', 'heightCm', 'hemoglobin', 'bloodGroup', 'sbp', 'dbp', 'wbc', 'rbc', 'platelet',
    'bmi', 'bfrPercent', 'bodyWaterPercent', 'boneMassKg', 'metabolicAge', 'vFatPercent',
    'proteinMassKg', 'muscleMassKg', 'diabetes'
  ];

  for (const field of allPossibleFields) {
      // Use Object.prototype.hasOwnProperty.call to safely check if the property exists on the object
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
          patientFields[field] = req.body[field];
      }
  }
  // --- End of FIX ---

  try {
    let patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found.' });
    }

    // If Aadhar No. is being changed, check if the new Aadhar No. already exists for another patient
    if (patientFields.aadharNo && patientFields.aadharNo !== patient.aadharNo) {
        const existingPatientWithNewAadhar = await Patient.findOne({ aadharNo: patientFields.aadharNo });
        if (existingPatientWithNewAadhar) {
            return res.status(400).json({ errors: [{ msg: 'Another patient with this Aadhar No. already exists.' }] });
        }
    }
    
    // Recalculate BMI if weight or height changes and BMI is not manually provided in this update
    const newWeight = patientFields.bodyWeightKg !== undefined ? patientFields.bodyWeightKg : patient.bodyWeightKg;
    const newHeight = patientFields.heightCm !== undefined ? patientFields.heightCm : patient.heightCm;

    // Only recalculate if BMI wasn't part of the update request
    if (patientFields.bmi === undefined && (patientFields.bodyWeightKg !== undefined || patientFields.heightCm !== undefined)) {
        if (newWeight != null && newHeight != null && newHeight > 0) {
            const heightInMeters = newHeight / 100;
            patientFields.bmi = parseFloat((newWeight / (heightInMeters * heightInMeters)).toFixed(2));
        } else if (newWeight === null || newHeight === null) {
            patientFields.bmi = null; 
        }
    }

    // Update the patient record
    patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { $set: patientFields },
      { new: true, runValidators: true }
    );
    res.json(patient);
  } catch (err) {
    console.error('Error updating patient:', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ errors: messages.map(msg => ({ msg })) });
    }
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Patient not found (invalid ID format).' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/patients/:id
// @desc    Delete a patient by ID
// @access  Private (Admin Only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found.' });
    }

    await Patient.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Patient removed successfully.' });
  } catch (err) {
    console.error('Error deleting patient:', err.message);
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Patient not found (invalid ID format).' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;