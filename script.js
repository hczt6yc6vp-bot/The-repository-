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

// Turn the form into a clean, readable booking email:
// a clear subject, the date written out in French, and no empty lines
function buildBookingEmail() {
  const get = (name) => (form.elements[name]?.value || "").trim();
  const dateFr = get("Date de dépôt")
    ? new Date(get("Date de dépôt") + "T12:00").toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : "";
  const cleaningChoice = get("Nettoyage") === "Aucun" ? "" : get("Nettoyage");
  const repairChoice = get("Réparation") === "Aucune" ? "" : get("Réparation");
  const services = [cleaningChoice && "Nettoyage " + cleaningChoice, repairChoice && "Réparation " + repairChoice]
    .filter(Boolean).join(" + ");

  const fields = {
    "Client": get("Nom"),
    "email": get("email"),
    "Téléphone": get("Téléphone"),
    "Prestations": services,
    "Dépôt du vélo": dateFr,
    "Type de vélo": get("Vélo"),
    "Description": get("Message"),
  };
  const payload = {
    access_key: get("access_key"),
    subject: "Réservation – " + get("Nom") + (dateFr ? " – " + dateFr : ""),
    from_name: "Olafsgarage.ch",
    botcheck: form.elements["botcheck"].checked,
  };
  for (const [k, v] of Object.entries(fields)) if (v) payload[k] = v;
  return payload;
}

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

  try {
    const res = await fetch(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      // JSON keeps accents (é, ô) intact in the email
      body: JSON.stringify(buildBookingEmail()),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success !== true) {
      throw new Error(data.message || "Request failed");
    }
    form.reset();
    updateChoices();
    status.classList.add("success");
    status.textContent = "Merci ! Votre demande a bien été envoyée. Je vous confirmerai le rendez-vous par e-mail.";
  } catch (err) {
    status.classList.add("error");
    status.textContent = "Une erreur est survenue. Veuillez réessayer ou m'écrire directement à contact@olafsgarage.ch.";
  } finally {
    button.disabled = false;
    button.textContent = "Envoyer la demande";
  }
});
