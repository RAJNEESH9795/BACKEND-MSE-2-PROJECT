🚗 MoveMate – Smart Ride Sharing & Community Platform
MoveMate is a full-stack platform that brings everyday travel and community services together in one place. Users can publish and discover rides, plan trips, share cabs, book available seats, and connect through a service marketplace. The platform also supports service-exchange requests and activity notifications, helping users coordinate journeys and services more easily.

✨ Key Features
Authentication & Profiles: Register, log in, manage profiles, and change or reset passwords.
Ride Sharing: Create, browse, update, and cancel rides; request seats and manage bookings.
Trip Planning: Publish trips, discover journeys, and manage join requests.
Cab Sharing: Post shared-cab options and send or manage requests to join.
Community Marketplace: List services, explore listings, and request service exchanges.
Notifications: View updates and manage read/unread notifications.
🛠️ Tech Stack
Frontend: React 19, Vite, React Router, Tailwind CSS, Axios, Lucide React
Backend: Node.js, Express 5
Database: MongoDB, Mongoose
Authentication & Security: JWT, bcrypt, Helmet, CORS, Express Rate Limit, express-validator
File & Email Services: Multer, Cloudinary, Nodemailer
Testing: Jest, Supertest, MongoDB Memory Server
📁 Project Structure
MoveMate/
├── client/       # React frontend
└── server/       # Express API, database models, routes and tests
🚀 Getting Started
Prerequisites
Node.js and npm
MongoDB (local instance or MongoDB Atlas)
Git
1. Clone the repository
git clone https://github.com/RAJNEESH9795/BACKEND-MSE-2-PROJECT.git
cd BACKEND-MSE-2-PROJECT
2. Install dependencies
cd client
npm install
cd ../server
npm install
3. Configure environment variables
Create server/.env and add your own configuration:

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
Use valid credentials for the services you configure. Never commit your real .env file or secrets to GitHub.

4. Run the application
Start the backend in one terminal:

cd server
npm run dev
Start the frontend in another terminal:

cd client
npm run dev
The backend defaults to http://localhost:5000 and the Vite frontend usually runs at http://localhost:5173.

🔌 API Modules
The backend API uses the /api/v1 prefix:

Module	Base endpoint
Authentication	/api/v1/auth
Users & Profiles	/api/v1/users
Rides	/api/v1/rides
Bookings	/api/v1/bookings
Trips	/api/v1/trips
Cab Sharing	/api/v1/cab-shares
Services	/api/v1/services
Service Exchanges	/api/v1/exchanges
Notifications	/api/v1/notifications
Health check: GET /api/health

🧪 Run Backend Tests
From the server directory:

npm test
MoveMate – Making every journey smarter, easier, and more connected.