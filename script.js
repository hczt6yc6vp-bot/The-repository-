// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const links = document.querySelector(".nav-links");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
  }
});

// Don't allow booking dates in the past
const dateInput = document.getElementById("date");
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().split("T")[0];

// Send the booking form to your email without leaving the page
const form = document.getElementById("booking-form");
const status = document.getElementById("form-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Sending…";
  status.className = "form-status";
  status.textContent = "";

  // FormSubmit's AJAX endpoint lives at /ajax/<email>
  const ajaxUrl = form.action.replace("formsubmit.co/", "formsubmit.co/ajax/");

  try {
    const res = await fetch(ajaxUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === "false" || data.success === false) {
      throw new Error(data.message || "Request failed");
    }
    form.reset();
    status.classList.add("success");
    status.textContent = "Thanks! Your request was sent. We'll email you to confirm your appointment.";
  } catch (err) {
    status.classList.add("error");
    status.textContent = "Sorry, something went wrong. Please try again or email us directly.";
  } finally {
    button.disabled = false;
    button.textContent = "Request Appointment";
  }
});
