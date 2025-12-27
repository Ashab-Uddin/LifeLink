/* =====================================
   PAGE TRANSITION FADE-IN
===================================== */
document.addEventListener("DOMContentLoaded", () => {
    const body = document.querySelector("body");
    body.style.opacity = 0;
    setTimeout(() => {
        body.style.transition = "opacity 1s";
        body.style.opacity = 1;
    }, 50);
});

/* =====================================
   BUTTON RIPPLE EFFECT (JS Controlled)
===================================== */
document.addEventListener("click", function (e) {
    if (e.target.tagName === "BUTTON") {
        let button = e.target;
        let ripple = document.createElement("span");

        ripple.classList.add("ripple");
        button.appendChild(ripple);

        let x = e.clientX - button.getBoundingClientRect().left;
        let y = e.clientY - button.getBoundingClientRect().top;

        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
});

/* =====================================
   SMOOTH SCROLL (for internal links)
===================================== */
document.querySelectorAll("a[href^='#']").forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        target.scrollIntoView({ behavior: "smooth" });
    });
});

/* =====================================
   FAKE AI LOADING FOR PREDICTION
===================================== */
function showResult() {
    const box = document.getElementById("result-box");
    const text = document.getElementById("result-text");

    box.style.display = "block";
    text.innerHTML = "<span style='color:#7fffd4;'>Analyzing symptoms with AI...</span>";

    // Fake loading delay for effect
    setTimeout(() => {
        text.innerHTML = `
            Based on your symptoms, you may have:
            <br><br>
            <b style="color:#7fffd4; font-size:20px;">Viral Fever (Low Severity)</b>
            <br><br>
            Stay hydrated and monitor your symptoms.
        `;
    }, 1500);
}

/* =====================================
   LOCATION DETECTION SIMULATION
===================================== */
function detectLocation() {
    alert("Detecting your location...");
    setTimeout(() => {
        alert("Location detected: Mirpur, Dhaka");
    }, 1200);
}

/* =====================================
   CONTACT BUTTON POPUP
===================================== */
function callNow(number) {
    alert("Calling " + number + "...");
}

/* =====================================
   FADE-IN ANIMATION TRIGGER ON SCROLL
===================================== */
const fadeElements = document.querySelectorAll(".fade, .fade-up, .card");

window.addEventListener("scroll", () => {
    fadeElements.forEach(el => {
        let position = el.getBoundingClientRect().top;
        let screenHeight = window.innerHeight;

        if (position < screenHeight - 80) {
            el.style.opacity = 1;
            el.style.transform = "translateY(0)";
        }
    });
});





// /* =========================================
//    LOGIN SYSTEM WITH VALIDATION
// ========================================= */

// function login() {
//     let email = document.getElementById("email").value.trim();
//     let password = document.getElementById("password").value.trim();
//     let errorBox = document.getElementById("login-error");

//     // Empty check
//     if (email === "" || password === "") {
//         showError("Please enter both email and password.");
//         return;
//     }

//     // Basic email format check
//     if (!email.includes("@") || !email.includes(".")) {
//         showError("Invalid email format.");
//         return;
//     }

//     /* 
//        DEMO LOGIN ACCOUNT:
//        Email: user@gmail.com
//        Password: 12345
//     */
//     if (email === "user@gmail.com" && password === "12345") {
        
//         // Save login state
//         localStorage.setItem("loggedIn", "true");

//         // Smooth success animation
//         errorBox.style.color = "#7fffd4";
//         errorBox.innerHTML = "Login successful! Redirecting...";
//         errorBox.style.display = "block";

//         setTimeout(() => {
//             window.location = "dashboard.html";
//         }, 1200);

//     } else {
//         showError("Incorrect email or password.");
//     }
// }

// function showError(msg) {
//     let errorBox = document.getElementById("login-error");
//     errorBox.style.display = "block";
//     errorBox.style.color = "#ff6666";
//     errorBox.innerHTML = msg;

//     // Shake animation
//     errorBox.style.animation = "shake 0.3s";
//     setTimeout(() => { errorBox.style.animation = ""; }, 300);
// }

// /* Shake Animation */
// let style = document.createElement("style");
// style.innerHTML = `
// @keyframes shake {
//   0% { transform: translateX(0px); }
//   25% { transform: translateX(-5px); }
//   50% { transform: translateX(5px); }
//   75% { transform: translateX(-5px); }
//   100% { transform: translateX(0px); }
// }
// `;
// document.head.appendChild(style);


// /* =========================================
//    CHECK LOGIN BEFORE ACCESSING DASHBOARD
// ========================================= */

// function checkLogin() {
//     let isLoggedIn = localStorage.getItem("loggedIn");

//     if (isLoggedIn !== "true") {
//         alert("Please login first!");
//         window.location = "login.html";
//     }
// }

// /* Call checkLogin() inside dashboard.html */
