const express = require("express");
const admin = require("../config/config");

const userConfigurationRouter = express.Router();

const db = admin.firestore();

// Get specific user specific configuration data
userConfigurationRouter.get('/:userId/:type', async (req, res) => {
    try {
        const { userId, type } = req.params;

        if (type !== 'job' && type !== 'goal') {
            return res.status(400).json({ 
                error: true,
                message: "Invalid configuration type."
            });
        }

        const userRef = db.collection('timesheets').doc(userId);
        const configRef = userRef.collection('configuration').doc(type);
        const doc = await configRef.get();

        let data = doc.data();

        if (!data) {
            return res.status(404).json({ 
                error: true,
                message: 'Configurations not found.' 
            });
        }

        res.status(200).json({
            error: false,
            configurations: data,
        });
    } catch (error) {
        console.error("Error fetching job configuration:", error);
        res.status(500).json({ error: "Failed to fetch job configuration." });
    }
});


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

// Update user configuration job data
userConfigurationRouter.put('/:userId/job', async (req, res) => {
    try {
        const { userId } = req.params;
        const { workHours, salary, currency } = req.body;

        if (!workHours || !salary || !currency) {
            return res.status(400).json({ 
                error: true,
                message: "Missing required fields."
            });
        }

        const userRef = db.collection('timesheets').doc(userId);
        const configRef = userRef.collection('configuration').doc('job');
        await configRef.update({
            workHours,
            salary,
            currency,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
            error: false, 
            message: "Job configuration updated successfully!" 
        });
    } catch (error) {
        console.error("Error updating job configuration:", error);
        res.status(500).json({ error: "Failed to update job configuration." });
    }
});

// Update user configuration goal data
userConfigurationRouter.put('/:userId/goal', async (req, res) => {
    try {
        const { userId } = req.params;
        const { dailyTarget, comment } = req.body;

        if (!dailyTarget) {
            return res.status(400).json({ 
                error: true,
                message: "Missing required fields."
            });
        }

        const userRef = db.collection('timesheets').doc(userId);
        const configRef = userRef.collection('configuration').doc('goal');
        await configRef.update({
            dailyTarget,
            comment,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ 
            error: false, 
            message: "Goal configuration updated successfully!" 
        });
    } catch (error) {
        console.error("Error updating goal configuration:", error);
        res.status(500).json({ error: "Failed to update goal configuration." });
    }
});

module.exports = userConfigurationRouter;