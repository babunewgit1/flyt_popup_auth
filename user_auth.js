/*==========================================================================
   Global Toast Notification
   ========================================================================== */
window.initToast = function () {
  if (typeof Notyf !== "undefined") {
    const notyf = new Notyf({
      duration: 2500,
      position: { x: "right", y: "top" },
    });
    window.toast = {
      success: (msg) => notyf.success(msg),
      error: (msg) => notyf.error(msg),
    };
  } else {
    window.toast = {
      success: (msg) => console.log("Success:", msg),
      error: (msg) => console.error("Error:", msg),
    };
  }
};

document.addEventListener("DOMContentLoaded", function () {
  window.initToast();

  /* ==========================================================================
     Helper Functions (Password Toggle & Form Logic)
     ========================================================================== */
  function initPasswordToggles() {
    const showPassButtons = document.querySelectorAll(".show_pass");
    if (showPassButtons) {
      showPassButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const input = button.parentElement.querySelector("input");
          const img = button.querySelector("img");

          if (input && img) {
            if (input.type === "password") {
              input.type = "text";
              img.src =
                "https://cdn.prod.website-files.com/673728493d38fb595b0df373/6981d4e4fd9099de65a07b11_eye_off.png";
            } else {
              input.type = "password";
              img.src =
                "https://cdn.prod.website-files.com/673728493d38fb595b0df373/697b853f0e40bcd4969f65de_password.png";
            }
          }
        });
      });
    }
  }

  // Initialize Password Toggles Logic
  initPasswordToggles();

  const body = document.body;
  const forms = document.querySelectorAll(".fl_auth");

  function openForm(formSelector) {
    forms.forEach((form) => form.classList.add("form_hide"));
    const targetForm = document.querySelector(formSelector);
    if (targetForm) {
      targetForm.classList.remove("form_hide");
      body.classList.add("overflow");
    }
  }

  function closeAllForms() {
    forms.forEach((form) => form.classList.add("form_hide"));
    body.classList.remove("overflow");
  }

  // Expose close helper globally
  window.closeAllAuthForms = closeAllForms;

  /* ==========================================================================
     Form Navigation Handlers
     ========================================================================== */
  // Open Login Form
  const loginTriggers = document.querySelectorAll(
    ".desktop_login, .sm_login, .login_popup, .backtologin, .login_again",
  );
  loginTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openForm(".fl_auth.login_form");
    });
  });

  // Open Signup Form
  const signupTriggers = document.querySelectorAll(".signup_popup");
  signupTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openForm(".fl_auth.signup_form");
    });
  });

  // Open Forgot Password Form
  const forgetPassTriggers = document.querySelectorAll(
    ".forget_password_button, .forget_password_again",
  );
  forgetPassTriggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openForm(".fl_auth.forget_pass_form");
    });
  });

  // Close Forms
  const returnBtns = document.querySelectorAll(".sp_return");
  returnBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeAllForms();
    });
  });

  /* ==========================================================================
     Header & Auth State Logic (Global)
     ========================================================================== */
  function updateHeaderState() {
    const loginLinks = document.querySelectorAll(".desktop_login, .sm_login");
    const accountHolders = document.querySelectorAll(
      ".logout_desktop, .logout_sm",
    );

    if (typeof Cookies === "undefined") {
      console.warn("Cookies library not found");
      return;
    }

    const userEmail = Cookies.get("userEmail");
    const authToken = Cookies.get("authToken");
    const isLoggedIn = userEmail && authToken;

    if (isLoggedIn) {
      loginLinks.forEach((btn) => (btn.style.display = "none"));
      accountHolders.forEach((holder) => (holder.style.display = "flex"));
    } else {
      loginLinks.forEach((btn) => (btn.style.display = "flex"));
      accountHolders.forEach((holder) => (holder.style.display = "none"));
    }
  }

  // Initial State Check & Event Listeners
  updateHeaderState();
  window.addEventListener("userLoggedIn", updateHeaderState);
  window.addEventListener("userLoggedOut", updateHeaderState);
  window.updateHeaderState = updateHeaderState;

  /* ==========================================================================
     Global Logout Handler
     ========================================================================== */
  const logoutBtns = document.querySelectorAll(".logout_desktop, .logout_sm");
  logoutBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      if (typeof Cookies === "undefined") return;

      const token = Cookies.get("authToken");
      if (token) {
        try {
          await fetch(
            "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_logout_flyt",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            },
          );
        } catch (error) {
          console.error("Logout API failed", error);
        }
      }

      Cookies.remove("userEmail");
      Cookies.remove("authToken");
      Cookies.remove("userFirstName");
      Cookies.remove("userLastName");

      updateHeaderState();
      window.dispatchEvent(new Event("userLoggedOut"));
      window.toast.success("Logged out successfully");
    });
  });

  /* ==========================================================================
     Signup Form Logic
     ========================================================================== */
  const signupForm = document.querySelector(".signup_form .signup");

  if (signupForm) {
    const nameInput = signupForm.querySelector(".signupname");
    const emailInput = signupForm.querySelector(".signupemail");
    const passwordInput = signupForm.querySelector("#password");
    const confirmPasswordInput = signupForm.querySelector("#confirm");

    signupForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const fullName = nameInput.value.trim();
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || " ";
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      // Phone Validation
      let internationalNumber = "";
      if (
        window.iti &&
        typeof window.iti.isValidNumber === "function" &&
        window.iti.isValidNumber()
      ) {
        const format =
          window.intlTelInputUtils && window.intlTelInputUtils.numberFormat
            ? window.intlTelInputUtils.numberFormat.E164
            : 1;
        internationalNumber = window.iti.getNumber(format);
      } else if (
        window.iti &&
        typeof window.iti.isValidNumber === "function" &&
        !window.iti.isValidNumber()
      ) {
        window.toast.error("Please enter a valid phone number.");
        return;
      }

      // Password Validation
      if (passwordInput.value.length < 8) {
        window.toast.error("Password must be at least 8 characters long.");
        return;
      }

      if (passwordInput.value !== confirmPasswordInput.value) {
        window.toast.error("Password and confirm password does not match!");
        return;
      }

      const submitBtn = signupForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerText;

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Please wait...";

        // Verify Email & Phone
        const verifyRes = await fetch(
          "https://operators-dashboard.bubbleapps.io/api/1.1/wf/email_phone_verification",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, phone: internationalNumber }),
          },
        );
        const verifyData = await verifyRes.json();
        if (verifyData.response) {
          if (!verifyData.response.phone_valid && internationalNumber) {
            window.toast.error("Please enter a valid phone number.");
            return;
          } else if (!verifyData.response.phone_valid && !internationalNumber) {
            window.toast.error("Please enter a valid phone number.");
            return;
          }

          /*
          if (
            verifyData.response.email_status !== "DELIVERABLE" ||
            verifyData.response.disposable_email === true
          ) {
            window.toast.error("Please enter a valid email");
            return;
          }
          */
        }

        // Perform Signup
        const signupRes = await fetch(
          "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_signup_flyt",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              first_name: firstName,
              last_name: lastName,
              password: password,
              email: email,
              phone: internationalNumber,
            }),
          },
        );
        const signupData = await signupRes.json();
        console.log(signupData);

        if (signupRes.ok && signupData.response && signupData.response.token) {
          if (typeof Cookies !== "undefined") {
            Cookies.set("userEmail", email, { expires: 7, secure: true });
            Cookies.set("authToken", signupData.response.token, {
              expires: 7,
              secure: true,
            });
            Cookies.set("userFirstName", signupData.response.firstname, {
              expires: 7,
              secure: true,
            });
            Cookies.set(
              "userLastName",
              (signupData.response.lastname || "").trim(),
              {
                expires: 7,
                secure: true,
              },
            );
          } else {
            console.warn("Cookies library not found.");
          }

          window.toast.success("Sign up Successful");
          signupForm.reset();

          // Refresh Header UI & Close Form
          window.dispatchEvent(new Event("userLoggedIn"));

          const loginBtns = document.querySelectorAll(
            ".desktop_login, .sm_login",
          );
          loginBtns.forEach((btn) => (btn.style.display = "none"));

          const logoutBtns = document.querySelectorAll(
            ".logout_desktop, .logout_sm",
          );
          logoutBtns.forEach((btn) => (btn.style.display = "flex"));

          setTimeout(() => {
            closeAllForms();
          }, 1000);
        } else {
          window.toast.error(
            "Signup failed: " + (signupData.message || "Unknown error"),
          );
        }
      } catch (err) {
        console.error(err);
        window.toast.error("Something went wrong. Please try again.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  }

  /* ==========================================================================
     Login Form Logic
     ========================================================================== */
  const loginForm = document.querySelector(".login_form .login");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const emailInput = loginForm.querySelector(".signupemail");
      const passwordInput = loginForm.querySelector("#password");
      
      const emailVal = emailInput ? emailInput.value.trim() : "";
      const passwordVal = passwordInput ? passwordInput.value : "";

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerText;

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Please wait...";

        const response = await fetch(
          "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_login_flyt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: emailVal,
              password: passwordVal,
            }),
          },
        );

        const data = await response.json();
        console.log(data);

        if (response.ok && data.response) {
          // Store user data in cookies
          if (typeof Cookies !== "undefined") {
            Cookies.set("userEmail", emailVal, { expires: 7, secure: true });
            if (data.response.token) {
              Cookies.set("authToken", data.response.token, {
                expires: 7,
                secure: true,
              });
            }
            Cookies.set("userFirstName", data.response.firstname, {
              expires: 7,
              secure: true,
            });
            Cookies.set("userLastName", data.response.lastname, {
              expires: 7,
              secure: true,
            });
          } else {
            console.warn("Cookies library not found.");
          }

          window.toast.success("Login Successful!");
          loginForm.reset();

          // Dispatch event to update header instantly
          window.dispatchEvent(new Event("userLoggedIn"));
          setTimeout(() => {
            closeAllForms();
          }, 1000);
        } else {
          window.toast.error(
            "Login failed: " + (data.message || "Invalid credentials"),
          );
        }
      } catch (error) {
        console.error(error);
        window.toast.error("An error occurred during login. Please try again.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  }
  /* ==========================================================================
     Forgot Password Logic
     ========================================================================== */
  const forgetPassForm = document.querySelector(
    ".forget_pass_form .forget_password",
  );

  if (forgetPassForm) {
    forgetPassForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const emailInput = forgetPassForm.querySelector(".signupemail");
      const email = emailInput ? emailInput.value.trim() : "";

      const submitBtn = forgetPassForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerText;

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = "Sending...";

        const response = await fetch(
          "https://operators-dashboard.bubbleapps.io/api/1.1/wf/webflow_forgotpassword_flyt",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
            }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          window.toast.success(
            "Password reset instructions have been sent to your email!",
          );
          forgetPassForm.reset();

          // Open the request password confirmation form
          setTimeout(() => {
            openForm(".fl_auth.request_password_form");
          }, 1);
        } else {
          window.toast.error(
            "Failed to process request: " +
              (data.message || "Please try again"),
          );
        }
      } catch (error) {
        console.error("Error:", error);
        window.toast.error("An error occurred. Please try again.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  }
});



