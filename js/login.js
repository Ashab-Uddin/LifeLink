document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("login-form");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("login-email").value.trim();

        const password =
            document.getElementById("login-password").value;

        if (!email || !password) {

            alert("Please enter your email and password.");

            return;
        }

        try {

            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (error) {

                console.error("Login error:", error);

                alert(error.message);

                return;
            }

            console.log("Login successful:", data);

            alert("Login successful!");

            window.location.href =
                "/index/index.html";

        } catch (error) {

            console.error("Unexpected login error:", error);

            alert(
                "Something went wrong. Please try again."
            );

        }

    });

});

const loginPassword = document.getElementById("login-password");
const loginPasswordToggle = document.getElementById("login-password-toggle");

if (loginPassword && loginPasswordToggle) {
    loginPasswordToggle.addEventListener("click", () => {

        if (loginPassword.type === "password") {
            loginPassword.type = "text";
            loginPasswordToggle.textContent = "🙈";
            loginPasswordToggle.setAttribute("aria-label", "Hide password");
        } else {
            loginPassword.type = "password";
            loginPasswordToggle.textContent = "👁";
            loginPasswordToggle.setAttribute("aria-label", "Show password");
        }

    });
}