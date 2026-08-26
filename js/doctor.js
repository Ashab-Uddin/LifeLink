document.addEventListener("DOMContentLoaded", loadDoctors);

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
      contextEl.innerHTML = `Showing <strong>${escapeHtml(data.matched_department || "General Medicine")}</strong> specialists recommended for <strong>${escapeHtml(disease)}</strong>.`;
    }

    if (!data.doctors.length) {
      listEl.innerHTML =
        "<div class='card'><p class='muted'>No doctors found for this department yet.</p></div>";
      return;
    }

    listEl.innerHTML = data.doctors
      .map((doc) => {
        const initials = (doc["Doctor Name"] || "")
          .replace(/^(Prof\.|Dr\.)\s*/gi, "")
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase();

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
            <button class="btn btn-primary" onclick="toast('Contact option selected')">Contact</button>
            <button class="btn btn-outline">View Profile</button>
          </div>
        </article>`;
      })
      .join("");
  } catch (e) {
    listEl.innerHTML = `<div class="notice">${escapeHtml(e.message)}</div>`;
  }
}
