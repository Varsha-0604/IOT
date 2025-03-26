# Healthcare Connect

A modern web application for patient-doctor connectivity, appointment management, and emergency contact management.

## Features

- User Authentication (Patients and Doctors)
- Appointment Scheduling and Management
- Emergency Contact Management
- Responsive UI with Tailwind CSS
- Secure API with JWT Authentication
- SQLite Database for Data Storage

## Setup Instructions

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd Trial
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser and visit `http://localhost:3000`

## Technologies Used

- Backend:
  - Express.js
  - SQLite3
  - JWT for Authentication
  - bcrypt for Password Hashing

- Frontend:
  - HTML5
  - CSS3 with Tailwind CSS
  - Vanilla JavaScript
  - Font Awesome Icons

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    specialization TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Appointments Table
```sql
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date DATETIME NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
);
```

### Emergency Contacts Table
```sql
CREATE TABLE emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES users(id)
);
```

## Sample Doctor Account

A sample doctor account is created when the application starts:

- Email: doctor@example.com
- Password: password123
- Name: Dr. John Smith
- Specialization: General Medicine
- Phone: 1234567890

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- Input validation
- SQL injection prevention

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 