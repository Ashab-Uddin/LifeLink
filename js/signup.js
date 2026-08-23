document.addEventListener("DOMContentLoaded", () => {

    const signupForm = document.getElementById("signup-form");

    if (!signupForm) {
        return;
    }

    signupForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("signup-name").value.trim();

        const email =
            document.getElementById("signup-email").value.trim();

        const password =
            document.getElementById("signup-password").value;

        if (!name || !email || !password) {
            alert("Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }

        try {

            const { data, error } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: name
                        }
                    }
                });

            if (error) {
                console.error("Signup error:", error);
                alert(error.message);
                return;
            }

            console.log("Signup successful:", data);

            if (!data.session) {

                alert(
                    "Account created successfully! " +
                    "Please check your email and verify your account."
                );

                window.location.href =
                    "/index/login.html";

                return;
            }

            alert("Account created successfully!");

            window.location.href =
                "/index/index.html";

        } catch (error) {

            console.error("Unexpected signup error:", error);

            alert("Something went wrong. Please try again.");

        }

    });

});

const signupPassword = document.getElementById("signup-password");
const signupPasswordToggle = document.getElementById("signup-password-toggle");

if (signupPassword && signupPasswordToggle) {
    signupPasswordToggle.addEventListener("click", () => {

        if (signupPassword.type === "password") {
            signupPassword.type = "text";
            signupPasswordToggle.textContent = "🙈";
            signupPasswordToggle.setAttribute("aria-label", "Hide password");
        } else {
            signupPassword.type = "password";
            signupPasswordToggle.textContent = "👁";
            signupPasswordToggle.setAttribute("aria-label", "Show password");
        }

    });
}