const express = require("express");
const admin = require("../config/config");

const userConfigurationRouter = express.Router();

const db = admin.firestore();

// Get specific user specific configuration data



// Save user configuration job data
userConfigurationRouter.post('/job', async (req, res) => {
    try {
        const { userId, workHours, salary, currency } = req.body;

        // Validate input data
        if (!userId || !workHours || !salary || !currency) {
            return res.status(400).json({ 
                error: true,
                message: "Missing required fields."
            });
        }

        // Save data to Firestore
        const userRef = db.collection('timesheets').doc(userId);
        const configRef = userRef.collection('configuration').doc('job');
        await configRef.set({
            workHours,
            salary,
            currency,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
            error: false, 
            message: "Job configuration saved successfully!" 
        });
    } catch (error) {
        console.error("Error saving job configuration:", error);
        res.status(500).json({ error: "Failed to save job configuration." });
    }
});

// Save user configuration goal data
userConfigurationRouter.post('/goal', async (req, res) => {
    try {
        const { userId, dailyTarget, comment } = req.body;

        // Validate input data
        if (!userId || !dailyTarget) {
            return res.status(400).json({ 
                error: true,
                message: "Missing required fields."
            });
        }

        // Save data to Firestore
        const userRef = db.collection('timesheets').doc(userId);
        const configRef = userRef.collection('configuration').doc('goal');
        await configRef.set({
            dailyTarget,
            comment,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
            error: false, 
            message: "Goal hours saved successfully!" 
        });
    } catch (error) {
        console.error("Error saving job configuration:", error);
        res.status(500).json({ error: "Failed to save job configuration." });
    }
});

module.exports = userConfigurationRouter;