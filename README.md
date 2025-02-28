# AI Health Symptom Checker

AI Health Symptom Checker is a web-based app that uses AI to provide possible health conditions based on user-submitted symptoms. It helps users gain quick health insights and recommendations.

---

## Features
- Symptom Input Form – Users can enter their symptoms, duration, severity, and additional factors.
- AI-Generated Health Analysis – Get possible conditions and recommendations.
- Doctor & Pharmacy Search – Find nearby doctors and pharmacies for medical help.
- User Authentication – Secure login & account system with JWT authentication.
- History Tracking – Users can track past symptom checks, doctor visits, and pharmacy searches.
- Responsive UI – Works across desktops, tablets, and mobile devices.

---

## Installation

### Prerequisites
- Node.js and npm installed on your machine.
- MongoDB (for storing user data and history) 

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/jaskaranahir/ai-health-check.git
   cd ai-health-check

2. Set up the backend
   ```bash
   cd backend
   npm install
   node src/server.js

   Backend running on: http://localhost:5001

3. Set up the front-end
   ```bash
   cd ../frontend
   npm install
   npm start
4. Access the app at http://localhost:3000


---

## Usage
- Sign in or create an account to save your history (All the user search will be saved only if the user is logged in)
  
The below features are open to use for all the users no need to sign in.
- Enter symptoms (e.g., fever, headache) and additional details.
- Click "Check Symptoms" to get AI-generated analysis.
- View recommendations & possible conditions.
- Search for doctors or pharmacies nearby for medical assistance.
- Track past health checks in the dashboard (for signed in users only)


---

## Tech Stack
- Frontend: React.js
- Backend: Node.js, Express.js
- Database: MongoDB (for storing user data & history)
- Authentication: JWT (JSON Web Token)
- AI API: Gemini AI (for symptom analysis)
- Google Maps API: For doctor & pharmacy search


---


## Future Enhancements
- Improve AI Accuracy – Fine-tune AI model for better analysis.
- Integrate User Dashboard – Display detailed health reports.
- Mobile App Version – Extend to iOS & Android.
- Emergency Alerts – Notify users of severe symptoms.

## License
This project is open-source and free to use.

## Contact
For questions, reach out to [jaskaranjattahir01@gmail.com] or open an issue on GitHub.


   
