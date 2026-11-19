🚗 MoveMate – Smart Ride Sharing & Community Platform
MoveMate is a full-stack web application designed to make travelling easier through ride sharing, trip planning, cab sharing, and a community-based service exchange marketplace. Users can connect with others, discover available rides and trips, manage bookings, and receive notifications through one platform.

✨ Features
Authentication & User Accounts – Register, log in, manage profiles, and change or reset passwords.
Ride Management – Create rides, discover available rides, view ride details, and manage your rides.
Ride Bookings – Book available seats and manage booking requests.
Trip Planning – Create trips, explore trips, and manage participation requests.
Cab Sharing – Publish cab-sharing options and find or request shared rides.
Community Marketplace – Create service listings and discover services offered by other users.
Service Exchange – Request an exchange by offering another listing and track exchange requests.
Notifications – Receive and manage updates related to platform activity.
Profile Management – View and update user profile information, including profile photos.
Location Assistance – Location autocomplete support in the client.
🧰 Tech Stack
Frontend
React 19
Vite
React Router
Tailwind CSS
Axios
Lucide React
Backend
Node.js
Express 5
MongoDB
Mongoose
JWT Authentication
bcrypt
Multer
Cloudinary
Nodemailer
express-validator
Testing & Security
Jest and Supertest
MongoDB Memory Server
Helmet
Express Rate Limit
CORS
📁 Project Structure
MoveMate/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   └── package.json
│
└── README.md
⚙️ Getting Started
1. Prerequisites
Make sure you have installed:

Node.js (LTS recommended)
npm
MongoDB database (local MongoDB or MongoDB Atlas)
Git
2. Clone the repository
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd MoveMate
3. Install frontend dependencies
cd client
npm install
4. Install backend dependencies
Open another terminal from the project root and run:

cd server
npm install
5. Configure environment variables
Create a .env file inside the server directory. Add your own credentials:

PORT=5000
CLIENT_URL=http://localhost:5173

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=your_token_expiry

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_or_app_password
EMAIL_FROM=your_sender_email
Important: Never commit your real .env file, database credentials, JWT secret, email password, or Cloudinary secret to GitHub. Keep .env in .gitignore and share only a placeholder .env.example.

6. Start the backend
From the server directory:

npm run dev
The backend runs on http://localhost:5000 by default.

7. Start the frontend
From the client directory:

npm run dev
Vite usually serves the frontend at http://localhost:5173.

🔌 API Overview
The backend API uses the /api/v1 prefix.

Module	Base endpoint
Authentication	/api/v1/auth
Users	/api/v1/users
Rides	/api/v1/rides
Bookings	/api/v1/bookings
Services	/api/v1/services
Service Exchanges	/api/v1/exchanges
Notifications	/api/v1/notifications
Cab Sharing	/api/v1/cab-shares
Trip Planning	/api/v1/trips
Health Check
GET /api/health
Successful response:

{
  "success": true,
  "message": "MoveMate API is running"
}
For individual endpoint methods, request bodies, and authorization requirements, refer to the route files in server/src/routes/.

🧪 Run Backend Tests
From the server directory:

npm test
To run tests in watch mode:

npm run test:watch
🔐 Security Notes
Authentication uses JSON Web Tokens.
Passwords are hashed using bcrypt.
Helmet adds security-related HTTP headers.
Rate limiting helps protect the API from excessive requests.
Request validation is implemented with express-validator.
Configure CORS using your frontend URL.
Store all secrets in environment variables.
🤝 Contributing
Contributions and suggestions are welcome.

Fork the repository.
Create a feature branch: git checkout -b feature/your-feature.
Commit your changes: git commit -m "Add your feature".
Push the branch: git push origin feature/your-feature.
Open a Pull Request.
📄 License
No license file is currently specified. Add a LICENSE file if you want to publish the project under an open-source license.

MoveMate – Making every journey smarter, easier, and more connected.