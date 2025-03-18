const express = require("express");
const admin = require("../config/config");

const timeKeeperRouter = express.Router();

const db = admin.firestore();

// Get specific user specific month data
timeKeeperRouter.get('/:userId/:month', async (req, res) => {
    try {
        const { userId, month } = req.params;
        let userDocRef = db.collection('timesheets').doc(userId);
        let monthDocRef = userDocRef.collection('months').doc(month);

        let monthDoc = await monthDocRef.get();

        let timesheetData = monthDoc.data();
                
        if (!timesheetData) {
            return res.status(404).json({ 
                error: true,
                message: 'No timesheet data found for this month' 
            });
        }

        res.status(200).json({
            error: false,
            timesheet: timesheetData,
        });

    } catch (error) {
        console.error("Error fetching timesheet:", error);
        return res.status(500).json({ message: "Internal Server Error", error });
    }
});

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
// Sort the time in reverse manner
timeKeeperRouter.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        let userDocRef = db.collection('timesheets').doc(userId);
        let monthsCollectionRef = userDocRef.collection('months');
        let monthlySalaryRef = userDocRef.collection('configuration').doc('job');

        let monthsSnapshot = await monthsCollectionRef.get();
        let monthlySalarySnapshot = await monthlySalaryRef.get();

        if (monthsSnapshot.empty) {
            return res.status(404).json({ message: 'No timesheet data found for this user' });
        }

        let salary = 0;
        let currency = '';
        let workHours = {};
        let hasJobData = false;

        if (!monthlySalarySnapshot.empty) {
            let salaryData = monthlySalarySnapshot.data();
            if (salaryData) {
                salary = salaryData.salary || 0;
                currency = salaryData.currency || '';
                workHours = salaryData.workHours || {};
                hasJobData = true;
            }
        }

        let timesheetData = [];
        let totalSalary = 0;

        monthsSnapshot.forEach(doc => {
            let data = doc.data();
            let totalTime = data.totalTime || "0h 0m";
            console.log('Total time of month:', totalTime);

            let hoursMatch = totalTime.match(/(\d+)h/);
            let minutesMatch = totalTime.match(/(\d+)m/);
            let hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
            let minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
            let totalHours = hours + (minutes / 60);

            let expectedMonthlyHours = 0;
            let monthlyHourlySalary = "0.00";

            if (hasJobData) {
                const [monthName, year] = doc.id.split(' ');
                const monthIndex = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ].indexOf(monthName);
                const daysInMonth = new Date(parseInt(year), monthIndex + 1, 0).getDate();

                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(parseInt(year), monthIndex, day);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dailyHours = Number(workHours[dayName]) || 0;
                    expectedMonthlyHours += dailyHours;
                }

                console.log('Expected monthly hours for', monthName, year, ':', expectedMonthlyHours);

                let hourlyRate = expectedMonthlyHours > 0 ? salary / expectedMonthlyHours : 0;

                monthlyHourlySalary = (totalHours * hourlyRate).toFixed(2);
                totalSalary += Number(monthlyHourlySalary);
            }

            timesheetData.push({
                id: doc.id,
                data: {
                    ...data,
                    monthlyHourlySalary: monthlyHourlySalary,
                    expectedMonthlyHours: hasJobData ? expectedMonthlyHours : 0
                }
            });
        });

        timesheetData.sort((a, b) => {
            const [monthA, yearA] = a.id.split(' ');
            const [monthB, yearB] = b.id.split(' ');
            const yearANum = parseInt(yearA);
            const yearBNum = parseInt(yearB);

            const months = [
                'January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'
            ];

            const monthNumA = months.indexOf(monthA) + 1;
            const monthNumB = months.indexOf(monthB) + 1;

            return yearBNum - yearANum || monthNumB - monthNumA;
        });

        let sortedTimesheetData = {};
        timesheetData.forEach(entry => {
            sortedTimesheetData[entry.id] = entry.data;
        });

        return res.json({ 
            userId, 
            timesheet: sortedTimesheetData,
            totalSalary: totalSalary.toFixed(2),
            currency: currency
        });
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
                message: "User not found" 
            });
        }

        if (!monthDoc) {
            return res.status(404).json({ 
                error: true, 
                message: `No timesheet found for ${month}` 
            });
        }

        let timesheetData = monthDoc.data();

        let updatedEntries = timesheetData.entries.map(entry => {
            let updatedEntry = entries.find(e => e.date === entry.date);
            return updatedEntry ? { ...entry, time: updatedEntry.time } : entry;
        });

        let totalMinutes = updatedEntries.reduce((sum, entry) => {
            let { hours, minutes } = extractTime(entry.time);
            return sum + hours * 60 + minutes;
        }, 0);

        let requiredMinutes = updatedEntries.reduce((sum, entry) => {
            let dayName = new Date(entry.date).toLocaleDateString("en-US", { weekday: "short" });
            return sum + (STANDARD_WORK_HOURS[dayName] || 0) * 60;
        }, 0);

        let additionalMinutes = Math.max(0, totalMinutes - requiredMinutes);
        let deficientMinutes = Math.max(0, requiredMinutes - totalMinutes);

        let formatTime = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

        let totalTime = formatTime(totalMinutes);
        let additionalTime = formatTime(additionalMinutes);
        let deficientTime = formatTime(deficientMinutes);

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