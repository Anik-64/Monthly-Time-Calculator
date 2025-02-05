require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const serviceAccount = require('./firebaseConfig.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Save timesheet data
app.post('/save-timesheet', async (req, res) => {
    try {
        let { timesheet, totaltime, additionaltime, deficienttime, month } = req.body;
        let userId = 'Anik Majumder';  // Replace this with actual dynamic user ID
        console.log(timesheet);
        
        let docRef = db.collection('timesheets').doc(`${userId}_${month}`);
        await docRef.set({
            userId,
            month,
            totalTime: totaltime,
            additionalTime: additionaltime,
            deficientTime: deficienttime,
            entries: timesheet.filter(entry => entry.date)
        }, { merge: true });

        res.json({ message: 'Timesheet saved successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
