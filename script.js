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

// Drop-off days and times: Mon, Tue, Thu, Fri from 16:00, Wed from 12:00, weekends depending on availability (confirmed by email)
const timeInput = document.getElementById("time");
const timeLabel = document.getElementById("time-label");
const OPENING = { 1: "16:00", 2: "16:00", 3: "12:00", 4: "16:00", 5: "16:00" };

function updateDropoff() {
  dateInput.setCustomValidity("");
  timeInput.setCustomValidity("");
  if (!dateInput.value) {
    timeInput.min = "12:00";
    timeLabel.textContent = "Heure de dépôt";
    return;
  }
  const day = new Date(dateInput.value + "T12:00").getDay();
  const opens = OPENING[day];
  if (!opens) {
    timeInput.min = "";
    timeLabel.textContent = "Heure de dépôt (week-end : selon disponibilité)";
    return;
  }
  timeInput.min = opens;
  timeLabel.textContent = "Heure de dépôt (dès " + opens.replace(":00", "h") + ")";
  if (timeInput.value && timeInput.value < opens) {
    timeInput.setCustomValidity("Ce jour-là, le dépôt est possible dès " + opens.replace(":00", "h") + ".");
  }
}
dateInput.addEventListener("change", () => { updateDropoff(); dateInput.reportValidity(); });
timeInput.addEventListener("change", updateDropoff);
updateDropoff();

// Cleaning / repair choices: at least one is needed, and "Autre" needs a description
const cleaning = document.getElementById("cleaning");
const repair = document.getElementById("repair");
const message = document.getElementById("message");
const messageLabel = document.getElementById("message-label");

function updateChoices() {
  const nothing = cleaning.value === "Aucun" && repair.value === "Aucune";
  repair.setCustomValidity(nothing ? "Veuillez choisir un nettoyage, une réparation, ou les deux." : "");
  const other = repair.value === "Autre";
  message.required = other;
  messageLabel.textContent = other ? "Décrivez le problème (obligatoire)" : "Décrivez le problème";
}
cleaning.addEventListener("change", updateChoices);
repair.addEventListener("change", updateChoices);
updateChoices();

// Send the booking form to your email without leaving the page
const form = document.getElementById("booking-form");
const status = document.getElementById("form-status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = form.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Envoi…";
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
    updateChoices();
    updateDropoff();
    status.classList.add("success");
    status.textContent = "Merci ! Votre demande a bien été envoyée. Je vous confirmerai le rendez-vous par e-mail.";
  } catch (err) {
    status.classList.add("error");
    status.textContent = "Une erreur est survenue. Veuillez réessayer ou m'écrire directement à olaf@eulers.ch.";
  } finally {
    button.disabled = false;
    button.textContent = "Envoyer la demande";
  }
});
