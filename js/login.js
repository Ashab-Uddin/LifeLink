document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("login-form");
    const googleLoginButton = document.getElementById("google-login-btn");
    const oauthRedirectUrl =
        "https://life-link-ui93.vercel.app/index/login.html";

    function getRedirectUrl() {
        return oauthRedirectUrl;
    }

    async function redirectIfAlreadySignedIn() {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            window.location.replace("/index/index.html");
        }
    }

    redirectIfAlreadySignedIn().catch(error => {
        console.error("Session check error:", error);
    });

    googleLoginButton?.addEventListener("click", async () => {
        googleLoginButton.disabled = true;
        googleLoginButton.classList.add("is-loading");

        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: getRedirectUrl()
            }
        });

        if (error) {
            console.error("Google login error:", error);
            alert(error.message || "Unable to continue with Google.");
            googleLoginButton.disabled = false;
            googleLoginButton.classList.remove("is-loading");
        }
    });

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