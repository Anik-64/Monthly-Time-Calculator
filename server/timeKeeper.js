const express = require("express");
const admin = require("../config/config");

const timeKeeperRouter = express.Router();

const db = admin.firestore();

// Save timesheet data
timeKeeperRouter.post('/', async (req, res) => {
    try {
        let { id, name, timesheet, totaltime, additionaltime, deficienttime, month } = req.body;

        // console.log("Saving timesheet for:", id, name);
        
        let userDocRef = db.collection('timesheets').doc(id);
        let monthDocRef = userDocRef.collection('months').doc(month); 

        await monthDocRef.set({
            name,
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

timeKeeperRouter.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let userDocRef = db.collection('timesheets').doc(userId);
        let monthsCollectionRef = userDocRef.collection('months');

        // Fetch all months data
        let monthsSnapshot = await monthsCollectionRef.get();
        if (monthsSnapshot.empty) {
            return res.status(404).json({ message: 'No timesheet data found for this user' });
        }

        let timesheetData = {};
        monthsSnapshot.forEach(doc => {
            timesheetData[doc.id] = doc.data();
        });

        return res.json({ userId, timesheet: timesheetData });
    } catch (error) {
        console.error("Error fetching timesheet:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});

timeKeeperRouter.put('/', async (req, res) => {

    // Function to extract hours and minutes correctly
    function extractTime(timeStr) {
        if (!timeStr) return { hours: 0, minutes: 0 };
        
        let hours = 0, minutes = 0;
        let hourMatch = timeStr.match(/(\d+)h/);
        let minuteMatch = timeStr.match(/(\d+)m/);

        if (hourMatch) hours = parseInt(hourMatch[1], 10);
        if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);

        return { hours, minutes };
    }

    try {
        let { userId, month, entries } = req.body;
        
        let userDocRef = db.collection("timesheets").doc(userId);
        let monthsCollectionRef = userDocRef.collection("months").doc(month);
        
        console.log(userDocRef.get());
        let userDoc = await userDocRef.get();
        let monthDoc = await monthsCollectionRef.get();

        if (!userDoc) {
            return res.status(404).json({ 
                error: true,
                message: "Timesheet not found" 
            });
        }

        if (!monthDoc) {
            return res.status(404).json({ 
                error: true,
                message: `No timesheet found for ${month}` 
            });
        }

        let timesheetData = monthDoc.data();

        // Update entries with new times
        let updatedEntries = timesheetData.entries.map(entry => {
            let updatedEntry = entries.find(e => e.date === entry.date);
            return updatedEntry ? { ...entry, time: updatedEntry.time } : entry;
        });

        // Recalculate total, additional, and deficient time
        let totalMinutes = updatedEntries.reduce((sum, entry) => {
            let { hours, minutes } = extractTime(entry.time);
            return sum + hours * 60 + minutes;
        }, 0);

        let requiredMinutes = updatedEntries.length * 8 * 60; // Assuming 8-hour workdays
        let additionalMinutes = Math.max(0, totalMinutes - requiredMinutes);
        let deficientMinutes = Math.max(0, requiredMinutes - totalMinutes);

        // Convert back to "Xh Ym" format
        let formatTime = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

        let totalTime = formatTime(totalMinutes);
        let additionalTime = formatTime(additionalMinutes);
        let deficientTime = formatTime(deficientMinutes);

        // Update Firestore document
        await monthsCollectionRef.update({
            entries: updatedEntries,
            totalTime,
            additionalTime,
            deficientTime
        });

        res.status(200).json({ 
            error: false,
            message: "Timesheet updated successfully", 
            updatedMonth: { ...timesheetData, entries: updatedEntries, totalTime, additionalTime, deficientTime }
        });

    } catch (error) {
        console.error("Error updating timesheet:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = timeKeeperRouter;