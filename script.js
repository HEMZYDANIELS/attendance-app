function register() {
  const name = document.getElementById("reg-name").value.toUpperCase();
  const matric = document.getElementById("reg-matric").value.toUpperCase();
  const username = document.getElementById("reg-username").value.toUpperCase();
  const password = document.getElementById("reg-password").value;

  if (!name || !matric || !username || !password) {
    document.getElementById("register-error").textContent = "Please fill all fields.";
    return;
  }

  // Optional: Matric number format check
  // const matricPattern = /^(MAC|CSC|LIS|EDU)\/\d{4}\/\d{4,6}$/i;
  // if (!matricPattern.test(matric)) {
  //   document.getElementById("register-error").textContent = "Matric number must be in MAC/2019/12345 or similar format.";
  //   return;
  // }

  let users = JSON.parse(localStorage.getItem("users") || "[]");
  if (users.find(u => u.username === username && u.matric === matric)) {
    document.getElementById("register-error").textContent = "User already exists.";
    return;
  }
  users.push({ name, matric, username, password });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful! Please login.");
  window.location.href = "index.html";
}

function login() {
  const matricNumber = document.getElementById("matric-number").value.toUpperCase();
  const username = document.getElementById("username").value.toUpperCase();
  const password = document.getElementById("password").value;
  const rememberMe = document.getElementById("remember-me").checked;

  if (!matricNumber || !username || !password) {
    document.getElementById("login-error").textContent = "Please fill all fields.";
    return;
  }

  const regMatric = localStorage.getItem("registeredMatric");
  const regUsername = localStorage.getItem("registeredUsername");
  const regPassword = localStorage.getItem("registeredPassword");

  if (
    matricNumber === regMatric &&
    username === regUsername &&
    password === regPassword
  ) {
    if (rememberMe) {
      localStorage.setItem('loggedInUser', username.toUpperCase());
      localStorage.setItem('loggedInMatric', matricNumber.toUpperCase());
    } else {
      sessionStorage.setItem('loggedInUser', username.toUpperCase());
      sessionStorage.setItem('loggedInMatric', matricNumber.toUpperCase());
    }
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("login-error").textContent = "Invalid login! Please register first.";
  }
}

// Always get the current logged-in user/matric in uppercase for the attendance key
function getAttendanceKey() {
  let username = localStorage.getItem('loggedInUser') || sessionStorage.getItem('loggedInUser');
  let matric = localStorage.getItem('loggedInMatric') || sessionStorage.getItem('loggedInMatric');
  if (!username || !matric) return null;
  return `attendance_${matric.toUpperCase()}_${username.toUpperCase()}`;
}

// Mark attendance as Present or Absent
function markAttendance(status) {
  const attendanceKey = getAttendanceKey();
  if (!attendanceKey) return;
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  let data = JSON.parse(localStorage.getItem(attendanceKey) || "[]");
  // Check if attendance for today already exists
  const alreadyMarked = data.find(entry => entry.date === today);
  if (!alreadyMarked) {
    data.push({ date: today, status: status }); // <-- THIS LINE ADDS THE ATTENDANCE
    localStorage.setItem(attendanceKey, JSON.stringify(data)); // <-- THIS LINE SAVES IT
    loadAttendance();
    alert(`Attendance marked as "${status}" for ${today}`);
  } else {
    alert("You have already marked attendance for today.");
  }
}


// Update loadAttendance to show status
function loadAttendance() {
  const attendanceKey = getAttendanceKey();
  if (!attendanceKey) return;
  const data = JSON.parse(localStorage.getItem(attendanceKey) || "[]");
  const list = document.getElementById('attendance-list');
  list.innerHTML = "";
  if (data.length === 0) {
    list.innerHTML = "<li>No attendance marked yet.</li>";
  } else {
    // Support both old (string) and new ({date, status}) formats
    data.forEach(entry => {
      let li = document.createElement('li');
      if (typeof entry === "string") {
        li.textContent = entry;
      } else {
        li.textContent = `${entry.date}: ${entry.status}`;
      }
      list.appendChild(li);
    });
  }
  showAttendanceSummary(data);
  rateAttendanceThisWeek();
}

function showAttendanceSummary(data) {
  let present = 0, absent = 0, total = 0;
  data.forEach(entry => {
    if (typeof entry === "object") {
      if (entry.status === "Present") present++;
      if (entry.status === "Absent") absent++;
      total++;
    } else {
      // For old string-only entries, count as present
      present++;
      total++;
    }
  });
  let percent = total > 0 ? Math.round((present / total) * 100) : 0;
  document.getElementById('attendance-summary').textContent =
    `Total Days: ${total} | Present: ${present} | Absent: ${absent} | Attendance: ${percent}%`;
}

// Update rateAttendanceThisWeek to count only "Present"
function rateAttendanceThisWeek() {
  const attendanceKey = getAttendanceKey();
  if (!attendanceKey) return;
  const data = JSON.parse(localStorage.getItem(attendanceKey) || "[]");
  const monday = getMonday(new Date());
  let count = 0;
  data.forEach(entry => {
    const date = new Date(entry.date);
    if (date >= monday && date <= new Date() && entry.status === "Present") {
      count++;
    }
  });
  let rating = "";
  if (count >= 5) rating = "Excellent attendance this week! ⭐⭐⭐⭐⭐";
  else if (count >= 3) rating = "Good attendance this week! ⭐⭐⭐";
  else if (count >= 1) rating = "Poor attendance this week. ⭐";
  else rating = "No attendance marked this week.";
  document.getElementById('attendance-rating').textContent = rating;
}

document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.onsubmit = function(e) {
      e.preventDefault();
      register();
    };
  }

  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = function(e) {
      e.preventDefault();
      login();
    };
  }

  // Attendance buttons
  const btnPresent = document.getElementById('mark-present');
  const btnAbsent = document.getElementById('mark-absent');
  if (btnPresent && btnAbsent) {
    btnPresent.onclick = function() { markAttendance("Present"); };
    btnAbsent.onclick = function() { markAttendance("Absent"); };
  }

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = function() {
      localStorage.removeItem('loggedInUser');
      localStorage.removeItem('loggedInMatric');
      sessionStorage.removeItem('loggedInUser');
      sessionStorage.removeItem('loggedInMatric');
      window.location.href = "index.html";
    };
  }

  // Scroll Down Button
  const scrollBtn = document.getElementById('scroll-down-btn');
  if (scrollBtn) {
    scrollBtn.onclick = function() {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };
  }

  // Call loadAttendance on dashboard load
  if (document.getElementById('attendance-list')) {
    loadAttendance();
  }
});