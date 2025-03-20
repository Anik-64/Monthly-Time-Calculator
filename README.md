# Monthly Work Time Calculator (TimeCalc)

<p align="center">
  <img src="https://firebasestorage.googleapis.com/v0/b/alleventsair.appspot.com/o/files%2Fimages%2FGmhUu_1741541334176.png?alt=media&token=f64aacd4-ca72-4d94-abb2-b7f2a2e52ded" alt="TimeCalc Logo" width="200" height="250">
</p>

**TimeCalc** is a web-based tool designed to help users track their work hours or personal goals, calculate monthly summaries, and generate detailed reports. Whether you’re an employee managing job hours with salary insights or a student tracking progress toward a target, TimeCalc provides a flexible and user-friendly solution.

---

## Features

- **Customizable Tracking**:
  - Set weekly work schedules (e.g., Mon-Fri, 8h/day) or daily goal targets.
  - Log daily work times, breaks, or overtime.
  - Monitor additional or deficient hours compared to your schedule/goals.

- **Detailed Reports**:
  - View monthly summaries including total time, additional time, and deficient time.
  - Calculate earnings based on configured salary and hours (for job tracking).
  - Export professional PDF reports with salary breakdowns and time details.

- **Personalized Insights**:
  - Configure job settings with work hours, salary, and currency (e.g., USD, BDT).
  - Add motivational notes for goal tracking.
  - Update configurations anytime via an intuitive modal interface.

- **User-Friendly Interface**:
  - Responsive design with Bootstrap and Tailwind CSS.
  - Interactive elements like tooltips and hover effects for better UX.
  - Google Authentication for secure access.

- **Enhanced Security**:
  - **Helmet** for setting HTTP security headers.
  - **CORS** to manage cross-origin requests safely.
  - **Express session** to manage sessions.
  - **morgan** for logs.

---

## Tech Stack

- **Frontend**: HTML, CSS (Bootstrap, Tailwind), JavaScript
- **Backend**: Node.js, Express.js
- **Authentication**: Passport.js with Google OAuth
- **Database**: Firebase Firestore (for timesheets and configurations)
- **Libraries**:
  - `jsPDF` and `jspdf-autotable` for PDF report generation
  - `SweetAlert2` for user notifications
  - `AOS` for animations

---

## Usage

1. **Login**:
   - Visit the homepage and log in with your Google account.

2. **Initial Setup**:
   - After login, a modal prompts you to choose:
     - **For Your Job**: Set weekly work hours, salary, and currency.
     - **For Your Goals**: Set a daily target and add a motivational note.

3. **Track Time**:
   - Select a month using the picker.
   - Enter daily start/end times in the table.
   - Save your timesheet to see summaries (total, additional, deficient time).

4. **View Saved Timesheets**:
   - See past months as cards with monthly salary (if job configured).
   - Click "View Details" to see daily entries.

5. **Generate Reports**:
   - Click "Generate Report" to view a table of all months.
   - Export as a PDF with time and salary details.
   - Use "Back to Timesheets" to return to the card view.

6. **Update Configuration**:
   - Click your profile picture (tooltip: "Click to change configuration") to open the config modal and adjust settings.

---

## Contact

For questions or feedback, reach out to [anikmajumder303@gmail.com](mailto:anikmajumder303@gmail.com) or open an issue on GitHub.
