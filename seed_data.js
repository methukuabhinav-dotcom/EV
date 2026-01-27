
// Seed Data for Admin User Analytics
const users = [
    { name: "Arjun Mehta", email: "arjun@example.com", password: "password123" },
    { name: "Priya Sharma", email: "priya@example.com", password: "password123" },
    { name: "Rahul Verma", email: "rahul@example.com", password: "password123" },
    { name: "Sneha Gupta", email: "sneha@example.com", password: "password123" },
    { name: "Vikram Singh", email: "vikram@example.com", password: "password123" }
];

// Generate User Logs (Past 7 days)
const userLogs = [];
const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

users.forEach(user => {
    // Each user has 3-8 sessions
    const sessions = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < sessions; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const durationMinutes = Math.floor(Math.random() * 60) + 5; // 5 to 65 mins
        const loginTime = now - (daysAgo * oneDay) - (Math.random() * oneDay);
        const logoutTime = loginTime + (durationMinutes * 60 * 1000);

        userLogs.push({
            id: loginTime,
            email: user.email,
            name: user.name,
            loginTime: loginTime,
            logoutTime: logoutTime,
            duration: durationMinutes * 60 * 1000,
            active: false
        });
    }
});

// Set one user as currently active
const activeUser = users[0];
userLogs.push({
    id: Date.now(),
    email: activeUser.email,
    name: activeUser.name,
    loginTime: Date.now(),
    logoutTime: null,
    duration: 0,
    active: true
});

localStorage.setItem("users", JSON.stringify(users));
localStorage.setItem("userLogs", JSON.stringify(userLogs));

console.log("Mock User Data & Logs Seeded Successfully!");
window.location.reload();
