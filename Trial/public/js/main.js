// Global variables
let currentUser = null;
let token = null;

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const newAppointmentModal = document.getElementById('newAppointmentModal');
const newContactModal = document.getElementById('newContactModal');
const appointmentsSection = document.getElementById('appointmentsSection');
const emergencyContactsSection = document.getElementById('emergencyContactsSection');
const welcomeSection = document.getElementById('welcomeSection');

// Modal close buttons
const closeLoginModal = document.getElementById('closeLoginModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const closeAppointmentModal = document.getElementById('closeAppointmentModal');
const closeContactModal = document.getElementById('closeContactModal');

// Forms
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const newAppointmentForm = document.getElementById('newAppointmentForm');
const newContactForm = document.getElementById('newContactForm');

// Event Listeners
loginBtn.addEventListener('click', () => showModal(loginModal));
registerBtn.addEventListener('click', () => showModal(registerModal));
closeLoginModal.addEventListener('click', () => hideModal(loginModal));
closeRegisterModal.addEventListener('click', () => hideModal(registerModal));
closeAppointmentModal.addEventListener('click', () => hideModal(newAppointmentModal));
closeContactModal.addEventListener('click', () => hideModal(newContactModal));

// Form submissions
loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
newAppointmentForm.addEventListener('submit', handleNewAppointment);
newContactForm.addEventListener('submit', handleNewContact);

// Role selection handling
const registerRole = document.getElementById('registerRole');
const specializationField = document.getElementById('specializationField');

registerRole.addEventListener('change', () => {
    specializationField.style.display = registerRole.value === 'doctor' ? 'block' : 'none';
});

// Modal functions
function showModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideModal(modal) {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

// Check if user is logged in
function checkAuth() {
    token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        currentUser = JSON.parse(user);
        updateUIForLoggedInUser();
        loadUserData();
    } else {
        updateUIForLoggedOutUser();
    }
}

// UI update functions
function updateUIForLoggedInUser() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const welcomeSection = document.getElementById('welcomeSection');
    const appointmentsSection = document.getElementById('appointmentsSection');
    const emergencyContactsSection = document.getElementById('emergencyContactsSection');

    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) {
        userMenu.style.display = 'flex';
        document.getElementById('userName').textContent = currentUser.name;
    }
    if (welcomeSection) welcomeSection.style.display = 'none';
    if (appointmentsSection) appointmentsSection.classList.remove('hidden');
    if (emergencyContactsSection) emergencyContactsSection.classList.remove('hidden');
}

function updateUIForLoggedOutUser() {
    const authButtons = document.querySelector('.auth-buttons');
    const userMenu = document.querySelector('.user-menu');
    const welcomeSection = document.getElementById('welcomeSection');
    const appointmentsSection = document.getElementById('appointmentsSection');
    const emergencyContactsSection = document.getElementById('emergencyContactsSection');

    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (welcomeSection) welcomeSection.style.display = 'block';
    if (appointmentsSection) appointmentsSection.classList.add('hidden');
    if (emergencyContactsSection) emergencyContactsSection.classList.add('hidden');
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}

// Load user data
async function loadUserData() {
    if (!token) return;

    try {
        await Promise.all([
            loadAppointments(),
            loadEmergencyContacts(),
            loadDoctors()
        ]);
    } catch (error) {
        console.error('Error loading user data:', error);
        if (error.message.includes('Invalid token')) {
            logout();
        }
    }
}

// API functions
async function login(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (response.ok) {
            token = data.token;
            currentUser = data.user;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUIForLoggedInUser();
            hideModal(loginModal);
            loadUserData();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        alert(error.message);
    }
}

async function register(userData) {
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
            hideModal(registerModal);
            showModal(loginModal);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        alert(error.message);
    }
}

async function loadAppointments() {
    if (!token) return;

    try {
        const response = await fetch('/api/appointments', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to load appointments');
        const appointments = await response.json();
        displayAppointments(appointments);
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

async function loadEmergencyContacts() {
    if (!token) return;

    try {
        const response = await fetch('/api/emergency-contacts', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to load emergency contacts');
        const contacts = await response.json();
        displayEmergencyContacts(contacts);
    } catch (error) {
        console.error('Error loading emergency contacts:', error);
    }
}

async function loadDoctors() {
    try {
        const response = await fetch('/api/doctors');
        if (!response.ok) throw new Error('Failed to load doctors');
        const doctors = await response.json();
        const doctorSelect = document.getElementById('appointmentDoctor');
        if (doctorSelect) {
            doctorSelect.innerHTML = '<option value="">Select a doctor</option>';
            doctors.forEach(doctor => {
                doctorSelect.innerHTML += `<option value="${doctor.id}">${doctor.name} - ${doctor.specialization}</option>`;
            });
        }
    } catch (error) {
        console.error('Error loading doctors:', error);
    }
}

// Display functions
function displayAppointments(appointments) {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList) return;

    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<p class="text-gray-500">No appointments found.</p>';
        return;
    }

    appointmentsList.innerHTML = appointments.map(appointment => `
        <div class="border-b pb-4 mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold">${appointment.doctor_name}</h3>
                    <p class="text-gray-600">${appointment.specialization}</p>
                    <p class="text-gray-600">Date: ${new Date(appointment.appointment_date).toLocaleString()}</p>
                    <p class="text-gray-600">Status: ${appointment.status}</p>
                    ${appointment.notes ? `<p class="text-gray-600">Notes: ${appointment.notes}</p>` : ''}
                </div>
                <span class="px-3 py-1 rounded-full text-sm ${
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                }">${appointment.status}</span>
            </div>
        </div>
    `).join('');
}

function displayEmergencyContacts(contacts) {
    const contactsList = document.getElementById('contactsList');
    if (!contactsList) return;

    if (contacts.length === 0) {
        contactsList.innerHTML = '<p class="text-gray-500">No emergency contacts found.</p>';
        return;
    }

    contactsList.innerHTML = contacts.map(contact => `
        <div class="border-b pb-4 mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold">${contact.name}</h3>
                    <p class="text-gray-600">Phone: ${contact.phone}</p>
                    <p class="text-gray-600">Relationship: ${contact.relationship}</p>
                </div>
                <button onclick="deleteEmergencyContact(${contact.id})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Form handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await login(email, password);
}

async function handleRegister(e) {
    e.preventDefault();
    const userData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        role: document.getElementById('registerRole').value,
        phone: document.getElementById('registerPhone').value
    };

    if (userData.role === 'doctor') {
        userData.specialization = document.getElementById('registerSpecialization').value;
    }

    await register(userData);
}

async function handleNewAppointment(e) {
    e.preventDefault();
    const appointmentData = {
        doctor_id: document.getElementById('appointmentDoctor').value,
        appointment_date: document.getElementById('appointmentDate').value,
        notes: document.getElementById('appointmentNotes').value
    };

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(appointmentData)
        });

        if (response.ok) {
            hideModal(newAppointmentModal);
            loadAppointments();
        } else {
            const data = await response.json();
            throw new Error(data.error);
        }
    } catch (error) {
        alert(error.message);
    }
}

async function handleNewContact(e) {
    e.preventDefault();
    const contactData = {
        name: document.getElementById('contactName').value,
        phone: document.getElementById('contactPhone').value,
        relationship: document.getElementById('contactRelationship').value
    };

    try {
        const response = await fetch('/api/emergency-contacts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contactData)
        });

        if (response.ok) {
            hideModal(newContactModal);
            loadEmergencyContacts();
        } else {
            const data = await response.json();
            throw new Error(data.error);
        }
    } catch (error) {
        alert(error.message);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Add event listener for logout button if it exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}); 