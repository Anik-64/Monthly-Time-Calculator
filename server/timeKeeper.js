const express = require("express");
const admin = require("../config/config");

const timeKeeperRouter = express.Router();

const db = admin.firestore();

// Save timesheet data
timeKeeperRouter.post('/', async (req, res) => {
    try {
        let { id, name, timesheet, totaltime, additionaltime, deficienttime, month } = req.body;
        
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

// Get specific user data
// timeKeeperRouter.get('/:userId', async (req, res) => {
//     try {
//         const { userId } = req.params;
//         let userDocRef = db.collection('timesheets').doc(userId);
//         let monthsCollectionRef = userDocRef.collection('months');

//         // Fetch all months data
//         let monthsSnapshot = await monthsCollectionRef.orderBy('month', 'desc').get();
//         if (monthsSnapshot.empty) {
//             return res.status(404).json({ 
//                 error: true,
//                 message: 'No timesheet data found for this user' 
//             });
//         }

//         let timesheetData = {};
//         monthsSnapshot.forEach(doc => {
//             timesheetData[doc.id] = doc.data();
//         });

//         return res.json({ userId, timesheet: timesheetData });
//     } catch (error) {
//         console.error("Error fetching timesheet:", error);
//         return res.status(500).json({ message: "Internal Server Error", error });
//     }
// });

// Sort the time in reverse manner
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

        let timesheetData = [];

        monthsSnapshot.forEach(doc => {
            timesheetData.push({ id: doc.id, data: doc.data() });
        });

        // Helper function to convert month names to numbers
        const monthNameToNumber = (monthName) => {
            const months = [
                'January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            return months.indexOf(monthName) + 1;
        };

        // Sort by year (desc), then by month (desc)
        timesheetData.sort((a, b) => {
            let [monthA, yearA] = a.id.split(' ');
            let [monthB, yearB] = b.id.split(' ');

            yearA = parseInt(yearA);
            yearB = parseInt(yearB);

            let monthNumA = monthNameToNumber(monthA);
            let monthNumB = monthNameToNumber(monthB);

            return yearB - yearA || monthNumB - monthNumA;
        });

        // Convert back to object format
        let sortedTimesheetData = {};
        timesheetData.forEach(entry => {
            sortedTimesheetData[entry.id] = entry.data;
        });

        return res.json({ userId, timesheet: sortedTimesheetData });
    } catch (error) {
        console.error("Error fetching timesheet:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});


// Updated route 
timeKeeperRouter.put('/', async (req, res) => {
    function extractTime(timeStr) {
        if (!timeStr) return { hours: 0, minutes: 0 };

        let hours = 0, minutes = 0;
        let hourMatch = timeStr.match(/(\d+)h/);
        let minuteMatch = timeStr.match(/(\d+)m/);

        if (hourMatch) hours = parseInt(hourMatch[1], 10);
        if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);

        return { hours, minutes };
    }

    const STANDARD_WORK_HOURS = { "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 4, "Sat": 8, "Sun": 8 };

    try {
        let { userId, month, entries } = req.body;

        let userDocRef = db.collection("timesheets").doc(userId);
        let monthsCollectionRef = userDocRef.collection("months").doc(month);

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

        // Update entries
        let updatedEntries = timesheetData.entries.map(entry => {
            let updatedEntry = entries.find(e => e.date === entry.date);
            return updatedEntry ? { ...entry, time: updatedEntry.time } : entry;
        });

        // Calculate total time
        let totalMinutes = updatedEntries.reduce((sum, entry) => {
            let { hours, minutes } = extractTime(entry.time);
            return sum + hours * 60 + minutes;
        }, 0);

        // Calculate expected (standard) work hours
        let requiredMinutes = updatedEntries.reduce((sum, entry) => {
            let dayName = new Date(entry.date).toLocaleDateString("en-US", { weekday: "short" });
            return sum + (STANDARD_WORK_HOURS[dayName] || 0) * 60;
        }, 0);

        // Calculate additional and deficient time
        let additionalMinutes = Math.max(0, totalMinutes - requiredMinutes);
        let deficientMinutes = Math.max(0, requiredMinutes - totalMinutes);

        // Convert to readable format
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