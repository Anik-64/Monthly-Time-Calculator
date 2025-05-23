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

    const salaryInput = document.getElementById("salaryInput");
    const updateSalary = document.getElementById("jobSalaryInput");
    const dailyGoalInput = document.getElementById("dailyTargetInput");

    const scrollToTopBtn = document.getElementById("scrollToTopBtn");

    const updateModal = new bootstrap.Modal(document.getElementById('userConfigModal'));

    let userId = '';
    let userName = '';

    let STANDARD_WORK_HOURS = {};

    const userInputModal = new bootstrap.Modal(document.getElementById('userInputModal'), {
        backdrop: 'static', 
        keyboard: false 
    });

    showShimmer();

    // Function to show shimmer overlay
    function showShimmer() {
        const shimmer = document.getElementById('shimmer');
        shimmer.style.display = 'block';
    }

    // Function to hide shimmer overlay
    function hideShimmer() {
        const shimmer = document.getElementById('shimmer');
        shimmer.style.display = 'none';
    }

    // Fetch user profile 
    async function fetchUserProfile() {
        try {
            let response = await fetch('/api/v1/user/');
            let user = await response.json();
            if (response.status == 200) {
                userNameEl.textContent = user.name;
                userPhotoEl.src = user.photo || "../logo/image.png";
                userPhotoEl.style.display = "block";
                userId = user.id;
                userName = user.name;
            }
        } catch (error) {
            console.error("User not logged in:", error);
        }
    }

    // Fetch user configuration
    async function fetchUserConfiguration() {
        showShimmer();
        try {
            // Fetch goal configuration
            let type = 'job';
            const jobResponse = await fetch(`/api/v1/configuration/${userId}/${type}`);
            const jobData = await jobResponse.json();

            if (jobResponse.ok && jobData) {
                STANDARD_WORK_HOURS = { 
                    Mon: jobData.configurations.workHours['Mon'],
                    Tue: jobData.configurations.workHours['Tue'],
                    Wed: jobData.configurations.workHours['Wed'],
                    Thu: jobData.configurations.workHours['Thu'],
                    Fri: jobData.configurations.workHours['Fri'],
                    Sat: jobData.configurations.workHours['Sat'],
                    Sun: jobData.configurations.workHours['Sun']
                }; 
                updateConfigurationUI("job", jobData.configurations);
                hideShimmer();
                return { type: 'job', data: jobData };
            }

            type = 'goal';
            const goalResponse = await fetch(`/api/v1/configuration/${userId}/${type}`);
            const goalData = await goalResponse.json();

            if (goalResponse.ok && goalData) {
                STANDARD_WORK_HOURS = { 
                    Mon: goalData.configurations.dailyTarget,
                    Tue: goalData.configurations.dailyTarget,
                    Wed: goalData.configurations.dailyTarget,
                    Thu: goalData.configurations.dailyTarget,
                    Fri: goalData.configurations.dailyTarget,
                    Sat: goalData.configurations.dailyTarget,
                    Sun: goalData.configurations.dailyTarget
                };
                updateConfigurationUI("goal", goalData.configurations);
                hideShimmer();
                return { type: 'goal', data: goalData };
            }

            updateConfigurationUI("none", {});
            hideShimmer();
            return null;
        } catch (error) {
            console.error("Error fetching user configuration:", error);
            return null;
        }
    }

    // Show modal if user has no configuration
    async function checkUserConfiguration() {
        const config = await fetchUserConfiguration();
        if (!config) {
            userInputModal.show(); 
        } else {
            // console.log("User configuration found:", config);
        }
    }

    // Function to update the right-side UI with configuration data
    function updateConfigurationUI(type, configurations) {
        const configTypeEl = document.getElementById('configType');
        const workHoursListEl = document.getElementById('workHoursList');
        const configSalaryEl = document.getElementById('configSalary');
        const configCurrencyEl = document.getElementById('configCurrency');
        const motivationEl = document.getElementById('motivation');
        const motivationSection = document.querySelector(".motivation");
        const salarySection = document.querySelector(".salary");
        const updatedTimeEl = document.getElementById("UpdatedTime");

        configTypeEl.textContent = 'N/A';
        workHoursListEl.innerHTML = '<li>No work hours configured.</li>';
        configSalaryEl.textContent = 'N/A';
        configCurrencyEl.textContent = 'N/A';
        motivationEl.textContent = 'N/A';
        updatedTimeEl.textContent = "";

        motivationSection.classList.remove("hidden");
        salarySection.classList.remove("hidden");

        if (type === 'job') {
            configTypeEl.textContent = 'Job';
            workHoursListEl.innerHTML = `
                <li>&nbsp&nbspMon - ${configurations.workHours.Mon} hours</li>
                <li>&nbsp&nbspTue - ${configurations.workHours.Tue} hours</li>
                <li>&nbsp&nbspWed - ${configurations.workHours.Wed} hours</li>
                <li>&nbsp&nbspThu - ${configurations.workHours.Thu} hours</li>
                <li>&nbsp&nbspFri - ${configurations.workHours.Fri} hours</li>
                <li>&nbsp&nbspSat - ${configurations.workHours.Sat} hours</li>
                <li>&nbsp&nbspSun - ${configurations.workHours.Sun} hours</li>
            `;
            configSalaryEl.textContent = configurations.salary;
            configCurrencyEl.textContent = configurations.currency;
            motivationSection.classList.add("hidden");
        } else if (type === 'goal') {
            configTypeEl.textContent = 'Goal';
            workHoursListEl.innerHTML = `
                <li>Daily Target-> <strong>${configurations.dailyTarget} hours</strong></li>
            `;
            motivationEl.textContent = configurations.comment;
            salarySection.classList.add("hidden");
        } else if (type === 'none') {
            configTypeEl.textContent = 'No Configuration';
            workHoursListEl.innerHTML = '<li>No work hours configured.</li>';
            configSalaryEl.textContent = 'N/A';
            configCurrencyEl.textContent = 'N/A';
        } else if (type === 'error') {
            configTypeEl.textContent = 'Error';
            workHoursListEl.innerHTML = '<li>Failed to fetch configuration.</li>';
            configSalaryEl.textContent = 'N/A';
            configCurrencyEl.textContent = 'N/A';
        }

        if (configurations.createdAt && configurations.updatedAt) {
            const createdAt = new Date(configurations.createdAt._seconds * 1000);
            const updatedAt = new Date(configurations.updatedAt._seconds * 1000);

            if (createdAt.getTime() !== updatedAt.getTime()) {
                const formattedTime = updatedAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
                updatedTimeEl.textContent = `(Updated: ${formattedTime})`;
            }
        }
    }

    // Event listener for user photo click
    document.getElementById('userPhoto').addEventListener('click', async () => {
        const config = await fetchUserConfiguration();
        if (config) {
            updateModal.show();

            populateUserConfigModal(config);
        } else {
            alert('No configuration found for this user.');
        }
    });

    // Function to populate the new modal with configuration data
    function populateUserConfigModal(config) {
        const { type, data } = config;

        document.getElementById('jobConfigForm').classList.add('d-none');
        document.getElementById('goalConfigForm').classList.add('d-none');
        document.getElementById('noConfigContent').classList.add('d-none');

        if (type === 'job') {
            document.getElementById('jobConfigForm').classList.remove('d-none');

            const workHours = data.configurations.workHours;
            const workHourInputs = document.querySelectorAll('#jobConfigForm .work-hour');
            workHourInputs.forEach(input => {
                const day = input.getAttribute('data-day');
                input.value = workHours[day];
            });

            document.getElementById('jobSalaryInput').value = data.configurations.salary;
            document.getElementById('jobCurrencySelect').value = data.configurations.currency;

            document.getElementById('jobConfigForm').addEventListener('submit', (e) => {
                e.preventDefault();
                updateJobConfiguration();
            });
        } else if (type === 'goal') {
            document.getElementById('goalConfigForm').classList.remove('d-none');

            document.getElementById('goalDailyTargetInput').value = data.configurations.dailyTarget;
            document.getElementById('goalCommentTextarea').value = data.configurations.comment;

            document.getElementById('goalConfigForm').addEventListener('submit', (e) => {
                e.preventDefault();
                updateGoalConfiguration();
            });
        } else {
            document.getElementById('noConfigContent').classList.remove('d-none');
        }
    }

    // Function to update job configuration
    async function updateJobConfiguration() {
        const workHours = {};
        document.querySelectorAll('#jobConfigForm .work-hour').forEach(input => {
            const day = input.getAttribute('data-day');
            workHours[day] = input.value;
        });

        const salary = document.getElementById('jobSalaryInput').value;
        const currency = document.getElementById('jobCurrencySelect').value;

        const updatedConfig = {
            workHours,
            salary,
            currency,
        };

        // Call API to update job configuration
        try {
            const response = await fetch(`/api/v1/configuration/${userId}/job`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConfig),
            });

            let result = await response.json();

            if (result.error) {
                alert(result.message);
            } else {
                updateModal.hide();
                await checkUserConfiguration();
                alert('Updated job configuration.' + result.message);
            }
        } catch (error) {
            console.error('Error updating job configuration:', error);
            alert('An error occurred while updating job configuration.');
        }
    }

    // Function to update goal configuration
    async function updateGoalConfiguration() {
        const dailyTarget = document.getElementById('goalDailyTargetInput').value;
        const comment = document.getElementById('goalCommentTextarea').value;

        const updatedConfig = {
            dailyTarget,
            comment,
        };

        // Call API to update goal configuration
        try {
            const response = await fetch(`/api/v1/configuration/${userId}/goal`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConfig),
            });

            let result = await response.json();

            if (result.error) {
                alert(result.message);
            } else {
                updateModal.hide();
                await checkUserConfiguration();
                alert(result.message);
            }
        } catch (error) {
            console.error('Error updating goal configuration:', error);
            alert('An error occurred while updating goal configuration.');
        }
    }

    // Event listeners for initial buttons
    document.getElementById('forJobBtn').addEventListener('click', () => {
        document.getElementById('initialButtons').classList.add('d-none');
        document.getElementById('jobForm').classList.remove('d-none');
    });

    document.getElementById('forGoalBtn').addEventListener('click', () => {
        document.getElementById('initialButtons').classList.add('d-none');
        document.getElementById('goalForm').classList.remove('d-none');
    });

    // Go back buttons
    document.getElementById('goBackBtn').addEventListener('click', () => {
        document.getElementById('jobForm').classList.add('d-none');
        document.getElementById('initialButtons').classList.remove('d-none');
    });

    document.getElementById('goBackBtnGoal').addEventListener('click', () => {
        document.getElementById('goalForm').classList.add('d-none');
        document.getElementById('initialButtons').classList.remove('d-none');
    });

    function validateHours(input) {
        const value = input.value.trim();
        const errorMessage = input.nextElementSibling; 

        if (value === "") {
            input.classList.remove("not-invalid");
            errorMessage.style.display = "none"; 
            return; 
        }

        const number = parseFloat(value);
        if (isNaN(number) || number < 0 || number > 24 || !Number.isInteger(number)) {
            input.classList.add("not-invalid");
            errorMessage.style.display = "block"; 
            return;
        }

        input.classList.remove("not-invalid");
        errorMessage.style.display = "none";
        return;
    }

    function validateSalary(input) {
        const value = input.value.trim();
        const errorMessage = input.nextElementSibling; 

        if (value === "") {
            input.classList.add("not-invalid");
            errorMessage.style.display = "block"; 
            return; 
        }

        const number = parseFloat(value);
        if (isNaN(number) || number < 0 || !Number.isInteger(number)) {
            input.classList.add("not-invalid");
            errorMessage.style.display = "block"; 
            return;
        }

        input.classList.remove("not-invalid");
        errorMessage.style.display = "none";
        return;
    }

    // Add blur event listener to work hour inputs
    document.querySelectorAll('.work-hour').forEach(input => {
        input.addEventListener('blur', () => {
            validateHours(input);
        });
    });

    // Add blur event listener to salary input
    salaryInput.addEventListener('blur', () => {
        validateSalary(salaryInput);
    });

    updateSalary.addEventListener('blur', () => {
        validateSalary(updateSalary);
    });
    
    // Add blur event listener to daily goal input
    dailyGoalInput.addEventListener('blur', () => {
        validateHours(dailyGoalInput);
    });

    // Submit job form
    document.getElementById('submitJobBtn').addEventListener('click', async () => {
        const workHours = Array.from(document.querySelectorAll('.work-hour')).map(input => {
            const value = input.value.trim();
            return value === "" ? 0 : parseFloat(value); 
        });

        const salary = document.getElementById('salaryInput').value.trim();
        const currency = document.getElementById('currencySelect').value;

        const jobData = {
            userId, 
            workHours: {
                Mon: workHours[0],
                Tue: workHours[1],
                Wed: workHours[2],
                Thu: workHours[3],
                Fri: workHours[4],
                Sat: workHours[5],
                Sun: workHours[6]
            },
            salary: parseFloat(salary),
            currency
        };

        try {
            const response = await fetch('/api/v1/configuration/job', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });

            const data = await response.json();

            if (response.error) {
                Swal.fire("Error", data.message, "error");
                return;
            }

            Swal.fire("Success", data.message, "success");
            userInputModal.hide(); 
            await fetchUserConfiguration();
            // console.log("STANDARD_WORK_HOURS(job) set:", STANDARD_WORK_HOURS);
        } catch (error) {
            Swal.fire("Error", "Failed to save job details. Please try again.", "error");
            console.error(error);
        }
    });

    // Submit goal form
    document.getElementById('submitGoalBtn').addEventListener('click', async () => {
        const dailyTarget = document.getElementById('dailyTargetInput').value;
        const comment = document.getElementById("comment").value.trim();

        if (isNaN(dailyTarget)) {
            Swal.fire("Error", "Please enter a valid number for daily target hours.", "error");
            return;
        }

        try {
            const response = await fetch('/api/v1/configuration/goal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, dailyTarget, comment })
            });

            const data = await response.json();

            if (response.error) {
                Swal.fire("Error", data.message, "error");
                return;
            }

            Swal.fire("Success", data.message, "success");
            userInputModal.hide(); 
            await fetchUserConfiguration();
            // console.log("STANDARD_WORK_HOURS(goal) set:", STANDARD_WORK_HOURS);
        } catch (error) {
            Swal.fire("Error", "Failed to save goal details. Please try again.", "error");
            console.error(error);
        }
    });

    // Fetch saved timesheets 
    let originalTimesheetContent = "";
    async function fetchSavedTimesheets() {
        if (!userId) return;
        try {
            let response = await fetch(`/api/v1/timesheet/${userId}`);
            let data = await response.json();
            if (!response.ok) return;

            let timesheetArray = Array.isArray(data.timesheet) ? data.timesheet : Object.entries(data.timesheet).map(([month, details]) => ({
                month,
                data: details
            })).filter(item => item.month !== "Invalid Date");

            let totalSalary = data.totalSalary; 
            let currency = data.currency;

            if (totalSalary != 0) {
                timesheetContainer.innerHTML = `
                    <div class="col-12 mb-2 mt-2">
                        <div class="alert alert-info text-center">
                            Total Salary Across All Months: <strong>${totalSalary} ${currency}</strong>
                        </div>
                    </div>
                `;
            }

            timesheetArray.forEach(({ month, data }) => {  
                let monthlySalary = data.monthlyHourlySalary || "0.00"; 
                let expectedHours = data.expectedMonthlyHours || 0; 
                let card = document.createElement("div");
                card.className = "col-md-4 mb-3";
                card.innerHTML = `
                    <div class="card">
                        <h6 class="card-header">
                            ${month}
                            ${monthlySalary !== "0.00" ? `<span class="badge bg-success ms-2">${monthlySalary} ${currency}</span>` : ''}
                        </h6>
                        <div class="card-body">
                            <p>Total: <strong>${data.totalTime}</strong></p>
                            <p class="text-success">Additional: <strong>${data.additionalTime}</strong></p>
                            <p class="text-danger">Deficient: <strong>${data.deficientTime}</strong></p>
                            ${expectedHours != 0 ? `<p class="text-muted">Expected Hours: <strong>${expectedHours}h</strong></p>` : ``}
                            <button class="btn btn-sm btn-info view-details mt-2" data-month="${month}">View Details</button>
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

            if (totalSalary != 0) {
                if (!document.getElementById('generateReportBtn')) {
                    const reportBtn = document.createElement('button');
                    reportBtn.id = 'generateReportBtn';
                    reportBtn.className = 'btn btn-sm btn-secondary';
                    reportBtn.textContent = 'Generate Report';
                    const generatebtn = document.querySelector(".generatebtn");
                    if (generatebtn) {
                        generatebtn.appendChild(reportBtn);
                    }
                }

                originalTimesheetContent = timesheetContainer.innerHTML;

                document.querySelectorAll(".view-details").forEach(button => {
                    button.addEventListener("click", (event) => {
                        let month = event.target.getAttribute("data-month");
                        toggleTableView(month, timesheetArray.find(item => item.month === month).data.entries);
                    });
                });

                document.getElementById('generateReportBtn').addEventListener('click', () => {
                    generateReport(timesheetArray, totalSalary, currency);
                });
            }
        } catch (error) {
            console.error("Error fetching timesheets:", error);
        }
    }

    function generateReport(timesheetArray, totalSalary, currency) {
        // Create report container
        const reportContainer = document.createElement('div');
        reportContainer.className = 'report-container mt-4';

        // Report header
        reportContainer.innerHTML = `
            <h3>Timesheet Report</h3>
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead class="thead-dark">
                        <tr>
                            <th>Month</th>
                            <th>Total Time</th>
                            <th>Expected Hours</th>
                            <th>Hourly Salary (${currency})</th>
                            <th>Additional Time</th>
                            <th>Deficient Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${timesheetArray.map(({ month, data }) => `
                            <tr>
                                <td>${month}</td>
                                <td>${data.totalTime}</td>
                                <td>${data.expectedMonthlyHours || 0}h</td>
                                <td>${data.monthlyHourlySalary || "0.00"}</td>
                                <td>${data.additionalTime}</td>
                                <td>${data.deficientTime}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3"><strong>Total Salary</strong></td>
                            <td colspan="3"><strong>${totalSalary} (${currency})</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="mt-2">
                <button id="backBtn" class="btn btn-sm btn-secondary me-2">Back to Timesheets</button>
                <button id="exportPdfBtn" class="btn btn-sm btn-primary">Export as PDF</button>
            </div>
        `;

        // Replace existing content or append to timesheetContainer
        timesheetContainer.innerHTML = '';
        timesheetContainer.appendChild(reportContainer);

        document.getElementById('backBtn').addEventListener('click', () => {
            timesheetContainer.innerHTML = originalTimesheetContent;
            // Re-attach event listeners after restoring content
            document.querySelectorAll(".view-details").forEach(button => {
                button.addEventListener("click", (event) => {
                    let month = event.target.getAttribute("data-month");
                    toggleTableView(month, timesheetArray.find(item => item.month === month).data.entries);
                });
            });
            document.getElementById('generateReportBtn').addEventListener('click', () => {
                generateReport(timesheetArray, totalSalary, currency);
            });
        });

        // Add PDF export functionality (requires jsPDF library)
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            if (typeof jspdf !== 'undefined' && jspdf.jsPDF) {
                const { jsPDF } = jspdf; 
                const doc = new jsPDF();
                doc.text('Timesheet Report', 10, 10);
                doc.autoTable({
                    startY: 20,
                    head: [['Month', 'Total Time', 'Expected Hours', `Hourly Salary (${currency})`, 'Additional Time', 'Deficient Time']],
                    body: timesheetArray.map(({ month, data }) => [
                        month,
                        data.totalTime,
                        `${data.expectedMonthlyHours || 0}h`,
                        data.monthlyHourlySalary || "0.00",
                        data.additionalTime,
                        data.deficientTime
                    ]),
                    foot: [['Total Salary', '', '', `${totalSalary} ${currency}`, '', '']],
                });
                const now = new Date();
                const formattedDateTime = now.toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Dhaka'
                }).replace(/[,]/g, '').replace(/ /g, '-').toLowerCase();
                doc.save(`Timesheet_Report_${userName}_${formattedDateTime}.pdf`);
            } else {
                Swal.fire("Error", "jsPDF library is not loaded correctly. Please ensure the CDN is included and loaded.", "error");
            }
        });
    }

    // Toggle table view 
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

    // Update timesheet 
    async function updateTimesheet(month) {
        let updatedEntries = [];
        let hasInvalidValue = false; // Flag to check for negative values

        let errorMessage = ""; 
        let invalidCell = null; 

        // Collect updated entries and validate for invalid values
        document.querySelectorAll(".editable-time").forEach(cell => {
            let date = cell.getAttribute("data-date");
            let time = cell.textContent.trim();
            if (!time) {
                time = "0h0m";
            }

            // Check for valid time format (e.g., 8h30m, 0h0m, etc.)
            let timePattern = /^(\d+h)?\s*(\d+m)?$/;
            if (!timePattern.test(time)) {
                hasInvalidValue = true;
                errorMessage = "Invalid time format. Use 'XhYm' (e.g., 8h30m).";
                invalidCell = cell; // Store the invalid cell
                return;
            }

            // Extract hours and minutes
            let hoursMatch = time.match(/(\d+)h/);
            let minutesMatch = time.match(/(\d+)m/);

            let hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
            let minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

            // Check for negative values
            if (hours < 0 || minutes < 0) {
                hasInvalidValue = true;
                errorMessage = "Negative values are not allowed.";
                invalidCell = cell; // Store the invalid cell
                return;
            }

            // Check if minutes are greater than 59
            if (minutes > 59) {
                hasInvalidValue = true;
                errorMessage = "Minutes cannot be greater than 59.";
                invalidCell = cell; // Store the invalid cell
                return;
            }

            // Check for invalid formats like 8.5h60m or 8.5h60.5m
            if (time.includes(".")) {
                hasInvalidValue = true;
                errorMessage = "Decimal values are not allowed.";
                invalidCell = cell; // Store the invalid cell
                return;
            }

            updatedEntries.push({ date, time });
        });

        // If invalid values are found, show an error message and focus on the invalid cell
        if (hasInvalidValue) {
            Swal.fire({
                title: "Error",
                text: errorMessage,
                icon: "error",
                didOpen: () => {
                    if (invalidCell) {
                        invalidCell.focus(); 
                    }
                }
            }).then(() => {
                setTimeout(() => {
                    if (invalidCell) {
                        invalidCell.focus(); 
                    }
                }, 1000); 
            });
            return;
        }

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

    // Parse time 
    function parseTime(timeStr) {
        let hours = 0;
        let minutes = 0;

        // Match hours (e.g., "8h" or "8h30m")
        let hoursMatch = timeStr.match(/(\d+)h/);
        if (hoursMatch) {
            hours = parseInt(hoursMatch[1], 10);
        }

        // Match minutes (e.g., "30m" or "8h30m")
        let minutesMatch = timeStr.match(/(\d+)m/);
        if (minutesMatch) {
            minutes = parseInt(minutesMatch[1], 10);
        }

        return { hours, minutes };
    }

    // Calculate total time 
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

    // Generate table with blur validation
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
            if (dayName === "Fri") th.classList.add("text-danger");
            dateRow.appendChild(th);

            let td = document.createElement("td");
            td.contentEditable = true;
            td.setAttribute("data-date", `${year}-${month}-${day}`);
            td.addEventListener("input", calculateTotalTime);

            // Add blur event listener for validation
            td.addEventListener("blur", function () {
                let time = td.textContent.trim();
                let previousValue = td.dataset.previousValue || ""; // Store previous valid value

                if (time !== "") {
                    if (!time.includes("h") && !time.includes("m")) {
                        Swal.fire("Error", "Time must include 'h' or 'm' (e.g., 8h or 30m).", "error")
                            .then(() => {
                                td.textContent = previousValue;
                                td.focus();
                            });
                        return;
                    }

                    let hoursMatch = time.match(/(-?\d+)h/);
                    let minutesMatch = time.match(/(-?\d+)m/);
                    let hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
                    let minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

                    if (hours < 0 || minutes < 0) {
                        Swal.fire("Error", "Negative values are not allowed.", "error")
                            .then(() => {
                                td.textContent = previousValue;
                                td.focus();
                            });
                        return;
                    }

                    if (minutes > 59) {
                        Swal.fire("Error", "Minutes cannot be greater than 59.", "error")
                            .then(() => {
                                td.textContent = previousValue;
                                td.focus();
                            });
                        return;
                    }

                    if (time.includes(".")) {
                        Swal.fire("Error", "Decimal values are not allowed.", "error")
                            .then(() => {
                                td.textContent = previousValue;
                                td.focus();
                            });
                        return;
                    }

                    let timePattern = /^(\d+h)?(\d+m)?$/;
                    if (time !== "" && !timePattern.test(time)) {
                        Swal.fire("Error", "Invalid time format. Use 'XhYm' (e.g., 8h30m) or leave empty.", "error")
                            .then(() => {
                                td.textContent = previousValue; // Revert to previous valid value
                                td.focus();
                            });
                        return;
                    }
                }

                // If valid, store the current value as the previous valid value
                td.dataset.previousValue = time || "0h0m"; // Default to "0h0m" if empty
                calculateTotalTime(); // Recalculate totals after validation
            });

            timeRow.appendChild(td);
        }
    }

    // Load data (unchanged except for ensuring blur listeners are added)
    loadDataBtn.addEventListener("click", async () => {
        const selectedMonth = monthPicker.value;
        if (!selectedMonth) {
            Swal.fire("Error", "Please select a month", "error");
            return;
        }

        let [year, month] = selectedMonth.split("-");
        let formattedMonth = new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

        let response = await fetch(`/api/v1/timesheet/${userId}/${formattedMonth}`);
        let data = await response.json();

        if (data.error) {
            generateTable(year, month);
            totalTimeEl.textContent = "0h 0m";
            additionalTimeEl.textContent = "0h 0m";
            deficientTimeEl.textContent = "0h 0m";
            return;
        }

        generateTable(year, month);
        data.timesheet.entries.forEach(entry => {
            let td = document.querySelector(`#timeRow td[data-date="${entry.date}"]`);
            if (td) {
                td.textContent = entry.time;
            }
        });

        totalTimeEl.textContent = data.timesheet.totalTime;
        additionalTimeEl.textContent = data.timesheet.additionalTime;
        deficientTimeEl.textContent = data.timesheet.deficientTime;
    });

    // Save data without validation
    saveDataBtn.addEventListener("click", () => {
        let [year, month] = monthPicker.value.split("-");
        let date = new Date(year, month - 1);
        let formattedMonth = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

        let timesheetData = [];
        document.querySelectorAll("#timeRow td").forEach(td => {
            let date = td.getAttribute("data-date");
            let time = td.textContent.trim() || "0h0m"; // Default to "0h0m" if empty
            timesheetData.push({ date, time });
        });

        Swal.fire({
            title: "Do you want to save this timesheet?",
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: "Save",
            denyButtonText: "Don't save"
        }).then((result) => {
            if (result.isConfirmed) {
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
                .then(response => {
                    if (!response.ok) throw new Error(`Server error: ${response.statusText}`);
                    return response.json();
                })
                .then(data => {
                    Swal.fire("Saved!", "Timesheet has been saved successfully.", "success")
                    .then(() => {
                        resetForm();
                        fetchSavedTimesheets();
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

    // Reset form 
    function resetForm() {
        document.querySelectorAll("#timeRow td").forEach(td => {
            td.textContent = "";
        });
        totalTimeEl.textContent = "0h 0m";
        additionalTimeEl.textContent = "0h 0m";
        deficientTimeEl.textContent = "0h 0m";
        monthPicker.value = "";
        document.getElementById("dateRow").innerHTML = "<th>Date</th>";
        document.getElementById("timeRow").innerHTML = "<td>Time</td>";
        document.getElementById("timesheetContainer").innerHTML = "";
    }

    // Logout action 
    logoutBtn.addEventListener("click", async () => {
        try {
            await fetch('/logout', { method: 'GET' });
            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
        }
    });

    window.onscroll = function() {
        if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };

    scrollToTopBtn.addEventListener("click", function() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0; 
    });

    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })

    await fetchUserProfile();
    await checkUserConfiguration();
    await fetchSavedTimesheets();
});