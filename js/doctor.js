document.addEventListener("DOMContentLoaded", loadDoctors);

// Keep the fetched doctors in memory so the modal can look them up by index
// without re-fetching or embedding huge JSON blobs inside onclick attributes.
let CURRENT_DOCTORS = [];

async function loadDoctors() {
  const listEl = document.getElementById("doctor-list");
  const contextEl = document.getElementById("doctor-context");
  if (!listEl) return;

  const params = new URLSearchParams(location.search);
  const disease = params.get("disease");

  let url = `${API_BASE}/doctors`;
  if (disease) url += `?disease=${encodeURIComponent(disease)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success)
      throw new Error(data.message || "Could not load doctors.");

    if (disease && contextEl) {
      contextEl.style.display = "block";
      contextEl.innerHTML = `Showing <strong>${escapeHtml(data.matched_department || "General Medicine")}</strong> specialists recommended for <strong>${escapeHtml(disease)}</strong> from LABAID Hospital.`;
    }

    if (!data.doctors.length) {
      listEl.innerHTML =
        "<div class='card'><p class='muted'>No doctors found for this department yet.</p></div>";
      return;
    }

    CURRENT_DOCTORS = data.doctors;

    listEl.innerHTML = CURRENT_DOCTORS.map((doc, index) => {
      const initials = getInitials(doc["Doctor Name"]);

      return `
        <article class="card">
          <div class="person-card">
            <div class="avatar">${escapeHtml(initials)}</div>
            <div>
              <h3>${escapeHtml(doc["Doctor Name"] || "")}</h3>
              <span class="badge">${escapeHtml(doc["Department"] || "")}</span>
              <p class="muted">${escapeHtml(doc["Specialty"] || "")} · ${escapeHtml(doc["Designation"] || "")}</p>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn btn-primary" onclick="contactDoctor(${index})">Contact</button>
            <button class="btn btn-outline" onclick="viewDoctorProfile(${index})">View Profile</button>
          </div>
        </article>`;
    }).join("");
  } catch (e) {
    listEl.innerHTML = `<div class="notice">${escapeHtml(e.message)}</div>`;
  }
}

function getInitials(name) {
  return (name || "")
    .replace(/^(Prof\.|Dr\.)\s*/gi, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Called by the "Contact" button. Opens the device's phone dialer with the
// doctor's number pre-filled (works on mobile; on desktop it prompts to
// choose a calling app, or the number can just be copied from the toast).
function contactDoctor(index) {
  const doc = CURRENT_DOCTORS[index];
  if (!doc) return;

  const phone = doc["Phone Number"];
  if (!phone) {
    toast("No phone number available for this doctor.");
    return;
  }

  toast(`Calling ${doc["Doctor Name"] || "doctor"} at ${phone}`);
  window.location.href = `tel:${phone}`;
}

// Called by the "View Profile" button. Builds a modal on the fly (so we
// don't need to add a hidden modal element to every page) and fills it
// with every field that came back from the API for this doctor.
function viewDoctorProfile(index) {
  const doc = CURRENT_DOCTORS[index];
  if (!doc) return;

  closeDoctorModal();

  const initials = getInitials(doc["Doctor Name"]);
  const phone = doc["Phone Number"];

  // Field order controls what shows up in the modal. Any column present in
  // the CSV / API response can be added here as { label, key }.
  const fields = [
    { label: "Department", key: "Department" },
    { label: "Specialty", key: "Specialty" },
    { label: "Designation", key: "Designation" },
    { label: "Phone Number", key: "Phone Number" },
  ];

  const rowsHtml = fields
    .map(({ label, key }) => {
      const value = doc[key];
      if (!value) return "";

      const displayValue =
        key === "Phone Number"
          ? `<a href="tel:${escapeHtml(value)}">${escapeHtml(value)}</a>`
          : escapeHtml(value);

      return `
        <div class="modal-doctor-row">
          <span class="label">${escapeHtml(label)}</span>
          <span class="value">${displayValue}</span>
        </div>`;
    })
    .join("");

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "doctor-modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" aria-label="Close" onclick="closeDoctorModal()">&times;</button>
      <div class="modal-doctor-header">
        <div class="avatar">${escapeHtml(initials)}</div>
        <div>
          <h3>${escapeHtml(doc["Doctor Name"] || "")}</h3>
          <span class="badge">${escapeHtml(doc["Department"] || "")}</span>
        </div>
      </div>
      <div class="modal-doctor-details">
        ${rowsHtml}
      </div>
      <div class="card-actions" style="margin-top:20px">
        ${phone ? `<a class="btn btn-primary" href="tel:${escapeHtml(phone)}">Call ${escapeHtml(phone)}</a>` : ""}
        <button class="btn btn-outline" onclick="closeDoctorModal()">Close</button>
      </div>
    </div>`;

  // Clicking the dark backdrop (but not the box itself) closes the modal.
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeDoctorModal();
  });

  document.body.appendChild(overlay);
  document.addEventListener("keydown", handleDoctorModalEscape);
}

function closeDoctorModal() {
  const overlay = document.getElementById("doctor-modal-overlay");
  if (overlay) overlay.remove();
  document.removeEventListener("keydown", handleDoctorModalEscape);
}

function handleDoctorModalEscape(e) {
  if (e.key === "Escape") closeDoctorModal();
}
