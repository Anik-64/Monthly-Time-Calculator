document.addEventListener("DOMContentLoaded", async () => {
    const monthPicker = document.getElementById("monthPicker");
    const loadDataBtn = document.getElementById("loadData");
    const saveDataBtn = document.getElementById("saveData");

    const totalTimeEl = document.getElementById("totalTime");
    const additionalTimeEl = document.getElementById("additionalTime");
    const deficientTimeEl = document.getElementById("deficientTime");

    const userNameEl = document.getElementById("userName");
    const userPhotoEl = document.getElementById("userPhoto");
    const logoutBtn = document.getElementById("logoutBtn");
    let userId = '';
    let userName = '';

    const STANDARD_WORK_HOURS = { "Mon": 8, "Tue": 8, "Wed": 8, "Thu": 4, "Sat": 8, "Sun": 8 };

    // Fetch user profile
    async function fetchUserProfile() {
        try {
            let response = await fetch('/api/v1/user/');
            let user = await response.json();

            console.log(user);

            if (response.status == 200) {
                userNameEl.textContent = user.name;
                if (user.photo) {
                    userPhotoEl.src = user.photo;
                } else {
                    userPhotoEl.src = "../logo/image.png"; // Set a default image
                }
                // userPhotoEl.src = user.picture;
                userPhotoEl.style.display = "block";
                userId = user.id;
                userName = user.name;
            }
        } catch (error) {
            console.error("User not logged in:", error);
        }
    }

    // Saved timestamps
    // async function fetchSavedTimesheets() {
    //     if (!userId) return;

    //     try {
    //         let response = await fetch(`/api/v1/timesheet/${userId}`);
    //         let data = await response.json();
    //         if (!response.ok) return;

    //         timesheetContainer.innerHTML = "";
            
    //         Object.entries(data.timesheet).forEach(([month, details]) => {
    //             let card = document.createElement("div");
    //             card.className = "col-md-4 mb-3";
    //             card.innerHTML = `
    //                 <div class="card">
    //                     <h5 class="card-header">${month}</h5>
    //                     <div class="card-body">
    //                         <p>Total: <strong>${details.totalTime}</strong></p>
    //                         <p class="text-success">Additional: <strong>${details.additionalTime}</strong></p>
    //                         <p class="text-danger">Deficient: <strong>${details.deficientTime}</strong></p>
    //                         <button class="btn btn-primary view-details" data-month="${month}">View Details</button>
    //                     </div>
    //                 </div>
    //                 <div class="table-container d-none" id="table-${month}"></div>
    //             `;
    //             timesheetContainer.appendChild(card);
    //         });

    //         document.querySelectorAll(".view-details").forEach(button => {
    //             button.addEventListener("click", (event) => {
    //                 let month = event.target.getAttribute("data-month");
    //                 toggleTableView(month, data.timesheet[month].entries);
    //             });
    //         });
    //     } catch (error) {
    //         console.error("Error fetching timesheets:", error);
    //     }
    // }

    async function fetchSavedTimesheets() {
        if (!userId) return;

        try {
            let response = await fetch(`/api/v1/timesheet/${userId}`);
            let data = await response.json();
            if (!response.ok) return;

            // console.log("API Response:", data); // Debugging

            let timesheetArray = Array.isArray(data.timesheet) ? data.timesheet : Object.entries(data.timesheet).map(([month, details]) => ({
                month,
                data: details
            }));

            timesheetContainer.innerHTML = "";

            timesheetArray.forEach(({ month, data }) => {  
                let card = document.createElement("div");
                card.className = "col-md-4 mb-3";
                card.innerHTML = `
                    <div class="card">
                        <h5 class="card-header">${month}</h5>
                        <div class="card-body">
                            <p>Total: <strong>${data.totalTime}</strong></p>
                            <p class="text-success">Additional: <strong>${data.additionalTime}</strong></p>
                            <p class="text-danger">Deficient: <strong>${data.deficientTime}</strong></p>
                            <button class="btn btn-primary view-details" data-month="${month}">View Details</button>
                        </div>
                    </div>
                    <div class="table-container d-none" id="table-${month}"></div>
                `;
                timesheetContainer.appendChild(card);
            });

            document.querySelectorAll(".view-details").forEach(button => {
                button.addEventListener("click", (event) => {
                    let month = event.target.getAttribute("data-month");
                    toggleTableView(month, timesheetArray.find(item => item.month === month).data.entries);
                });
            });
        } catch (error) {
            console.error("Error fetching timesheets:", error);
        }
    }

    function toggleTableView(month, entries) {
        let tableContainer = document.getElementById(`table-${month}`);
        if (!tableContainer.classList.contains("d-none")) {
            tableContainer.classList.add("d-none");
            tableContainer.innerHTML = "";
            return;
        }
        
        tableContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Date</th>
                            ${entries.map(entry => `<th>${entry.date}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Time</td>
                            ${entries.map(entry => `<td contenteditable="true" class="editable-time" data-date="${entry.date}">${entry.time}</td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            <button class="btn btn-success update-timesheet" data-month="${month}">Update</button>
        `;
        tableContainer.classList.remove("d-none");

        document.querySelector(`.update-timesheet[data-month="${month}"]`).addEventListener("click", async () => {
            await updateTimesheet(month);
        });
    }

    // Update timestamps
    async function updateTimesheet(month) {
        let updatedEntries = [];
        document.querySelectorAll(".editable-time").forEach(cell => {
            updatedEntries.push({ date: cell.getAttribute("data-date"), time: cell.textContent.trim() });
        });

        Swal.fire({
            title: "Do you want to save the changes?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, do it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    let response = await fetch("/api/v1/timesheet", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userId, month, entries: updatedEntries })
                    });

                    let result = await response.json();
                    if (result.error) {
                        Swal.fire("Error", result.message, "error");
                    } else {
                        Swal.fire("Saved!", "Timesheet updated successfully.", "success")
                        .then(() => {
                            fetchSavedTimesheets(); // Refresh the saved timesheets
                        });
                    }
                } catch (error) {
                    Swal.fire("Error", "Failed to update timesheet. Please try again.", "error");
                    console.error("Error updating timesheet:", error);
                }
            } else if (result.isDenied) {
                Swal.fire("Changes are not saved", "", "info");
            }
        });
    }

    // Logout action
    logoutBtn.addEventListener("click", async () => {
        try {
            await fetch('/logout', { method: 'GET' });
            window.location.href = "/"; // Redirect to login page
        } catch (error) {
            console.error("Logout error:", error);
        }
    });

    function parseTime(timeStr) {
        let match = timeStr.match(/(\d+)h\s*(\d*)m?/);
        if (match) {
            let hours = parseInt(match[1], 10);
            let minutes = match[2] ? parseInt(match[2], 10) : 0;
            return { hours, minutes };
        }
        return { hours: 0, minutes: 0 };
    }

    function calculateTotalTime() {
        let totalMinutes = 0;
        let expectedMinutes = 0;

        document.querySelectorAll("#timeRow td").forEach(td => {
            let time = td.textContent.trim();
            let { hours, minutes } = parseTime(time);
            totalMinutes += hours * 60 + minutes;

            let date = td.getAttribute("data-date");
            if (date) {
                let dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
                if (STANDARD_WORK_HOURS[dayName] !== undefined) {
                    expectedMinutes += STANDARD_WORK_HOURS[dayName] * 60;
                }
            }
        });

        let totalHours = Math.floor(totalMinutes / 60);
        let remainingMinutes = totalMinutes % 60;
        totalTimeEl.textContent = `${totalHours}h ${remainingMinutes}m`;

        let additionalMinutes = Math.max(0, totalMinutes - expectedMinutes);
        let deficientMinutes = Math.max(0, expectedMinutes - totalMinutes);

        additionalTimeEl.textContent = `${Math.floor(additionalMinutes / 60)}h ${additionalMinutes % 60}m`;
        deficientTimeEl.textContent = `${Math.floor(deficientMinutes / 60)}h ${deficientMinutes % 60}m`;
    }

    function generateTable(year, month) {
        const dateRow = document.getElementById("dateRow");
        const timeRow = document.getElementById("timeRow");
        dateRow.innerHTML = "<th>Date</th>";
        timeRow.innerHTML = "<td>Time</td>";

        let daysInMonth = new Date(year, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            let date = new Date(year, month - 1, day);
            let dayName = date.toLocaleDateString("en-US", { weekday: "short" });

            let th = document.createElement("th");
            th.textContent = `${day} (${dayName})`;
            dateRow.appendChild(th);

            let td = document.createElement("td");
            td.contentEditable = true;
            td.setAttribute("data-date", `${year}-${month}-${day}`);
            td.addEventListener("input", calculateTotalTime);
            timeRow.appendChild(td);
        }
    }

    loadDataBtn.addEventListener("click", () => {
        let [year, month] = monthPicker.value.split("-");
        generateTable(year, month);
    });

    // Save the time stamps
    saveDataBtn.addEventListener("click", () => {
        Swal.fire({
            title: "Do you want to save this timesheets?",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: "Save",
            denyButtonText: `Don't save`
        }).then((result) => {
            if (result.isConfirmed) {
                let [year, month] = monthPicker.value.split("-");
                let date = new Date(year, month - 1);
                let formattedMonth = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

                let timesheetData = [];
                document.querySelectorAll("#timeRow td").forEach(td => {
                    let date = td.getAttribute("data-date");
                    let time = td.textContent.trim();
                    if (time) {
                        timesheetData.push({ date, time });
                    }
                });

                fetch("/api/v1/timesheet", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        id: userId,
                        name: userName,
                        timesheet: timesheetData,
                        totaltime: totalTimeEl.textContent, 
                        additionaltime: additionalTimeEl.textContent,
                        deficienttime: deficientTimeEl.textContent, 
                        month: formattedMonth
                    })
                })
                .then(response => response.json())
                .then(data => {
                    Swal.fire("Saved!", "Timesheet has been saved successfully.", "success")
                    .then(() => {
                        resetForm();
                        fetchSavedTimesheets(); // Fetch updated user profile after saving
                    });
                })
                .catch(error => {
                    Swal.fire("Error", "Failed to save timesheet. Please try again.", "error");
                    console.error("Error saving timesheet:", error);
                });
            } else if (result.isDenied) {
                Swal.fire("Changes are not saved", "", "info");
            }
        });
    });

    // Reset function to clear form
    function resetForm() {
        // Clear all time entries
        document.querySelectorAll("#timeRow td").forEach(td => {
            td.textContent = "";
        });

        // Reset summary fields
        totalTimeEl.textContent = "0h 0m";
        additionalTimeEl.textContent = "0h 0m";
        deficientTimeEl.textContent = "0h 0m";

        // Reset month picker
        monthPicker.value = "";

        // Remove generated table content
        document.getElementById("dateRow").innerHTML = "<th>Date</th>";
        document.getElementById("timeRow").innerHTML = "<td>Time</td>";

        // Optionally hide or reset styles if needed
        document.getElementById("timesheetContainer").innerHTML = "";
    }


    await fetchUserProfile();
    await fetchSavedTimesheets();
});
