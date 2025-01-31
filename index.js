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
        let { timesheet } = req.body;
        let batch = db.batch();
        let userId = 'user123';  // Modify to get dynamic user ID

        timesheet.forEach(({ date, time }) => {
            let docRef = db.collection('timesheets').doc(userId).collection('months').doc(date);
            batch.set(docRef, { time }, { merge: true });
        });

        await batch.commit();
        res.json({ message: 'Timesheet saved successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
