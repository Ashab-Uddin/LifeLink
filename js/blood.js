document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("donor-form");
  const donorList = document.getElementById("donor-list");
  const bloodTypeFilter = document.getElementById("blood-type-filter");
  const detailsModal = document.getElementById("donor-details-modal");
  if (typeof supabaseClient === "undefined" || (!form && !donorList)) return;

  const fields = {
    full_name: document.getElementById("donor-name"),
    blood_group: document.getElementById("donor-blood-group"),
    phone: document.getElementById("donor-phone"),
    location: document.getElementById("donor-location"),
    last_donation_date: document.getElementById("donor-last-donation"),
    notes: document.getElementById("donor-notes")
  };
  const message = document.getElementById("donor-message");
  const success = document.getElementById("donor-success");
  const existing = document.getElementById("donor-existing");
  const submitButton = form?.querySelector("button[type=submit]");

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
  }

  function renderDonors(donors) {
    const cards = donors.map(donor => {
      const initials = donor.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
      return `<article class="card donor-card donor-card--community" data-blood-group="${escapeAttr(donor.blood_group)}">
        <div class="person-card"><div class="avatar">${escapeHtml(donor.blood_group)}</div><div>
          <h3>${escapeHtml(donor.full_name)}</h3><span class="badge">${escapeHtml(donor.blood_group)}</span>
          <p class="muted">${escapeHtml(donor.location)} · Available donor</p>
        </div></div>
        <div class="donor-card-footer"><span class="muted">${escapeHtml(initials)} · Last donated ${escapeHtml(new Date(donor.last_donation_date).toLocaleDateString())}</span>
          <button class="btn btn-primary donor-contact-button" type="button" data-name="${escapeAttr(donor.full_name)}" data-blood-group="${escapeAttr(donor.blood_group)}" data-phone="${escapeAttr(donor.phone)}" data-email="${escapeAttr(donor.email || "")}" data-location="${escapeAttr(donor.location)}" data-last-donation="${escapeAttr(donor.last_donation_date)}" data-notes="${escapeAttr(donor.notes || "")}">Contact donor</button>
        </div>
      </article>`;
    });
    if (cards.length) donorList.insertAdjacentHTML("afterbegin", cards.join(""));
    donorList.querySelectorAll(".donor-contact-button").forEach(button => button.addEventListener("click", () => showDonorDetails(button.dataset)));
  }

  function showDonorDetails(donor) {
    if (!detailsModal) return;
    document.getElementById("donor-details-title").textContent = `Contact ${donor.name}`;
    document.getElementById("donor-details-name").textContent = donor.name;
    document.getElementById("donor-details-blood").textContent = donor.bloodGroup;
    document.getElementById("donor-details-group").textContent = donor.bloodGroup;
    const phone = document.getElementById("donor-details-phone");
    phone.textContent = donor.phone || "Not provided";
    phone.href = donor.phone ? `tel:${donor.phone}` : "#";
    const email = document.getElementById("donor-details-email");
    email.textContent = donor.email || "Not provided";
    email.href = donor.email ? `mailto:${donor.email}` : "#";
    document.getElementById("donor-details-location").textContent = donor.location || "Not provided";
    document.getElementById("donor-details-last-donation").textContent = donor.lastDonation ? new Date(donor.lastDonation).toLocaleDateString() : "Not provided";
    document.getElementById("donor-details-notes-text").textContent = donor.notes || "No additional notes.";
    detailsModal.hidden = false;
  }

  document.querySelectorAll(".donor-contact-button").forEach(button => button.addEventListener("click", () => showDonorDetails(button.dataset)));
  document.getElementById("donor-details-close")?.addEventListener("click", () => { detailsModal.hidden = true; });
  detailsModal?.addEventListener("click", event => { if (event.target === detailsModal) detailsModal.hidden = true; });

  function filterDonors() {
    const selectedType = bloodTypeFilter?.querySelector(".blood-type-button.active")?.dataset.bloodType || "all";
    donorList?.querySelectorAll(".donor-card").forEach(card => {
      card.hidden = selectedType !== "all" && card.dataset.bloodGroup !== selectedType;
    });
  }

  async function loadDonors() {
    const { data, error } = await supabaseClient.from("blood_donor_applications")
      .select("full_name,blood_group,phone,email,location,last_donation_date,notes")
      .eq("status", "available").order("created_at", { ascending: false });
    if (error) {
      console.error("Donor loading error:", error);
      return;
    }
    donorList?.querySelectorAll(".donor-card--community").forEach(card => card.remove());
    renderDonors(data || []);
  }

  async function checkExistingApplication(user) {
    if (!form || !user) return false;
    const { data, error } = await supabaseClient.from("blood_donor_applications")
      .select("full_name,blood_group,phone,location,last_donation_date,notes")
      .eq("user_id", user.id).maybeSingle();
    if (error) {
      console.error("Donor application check error:", error);
      return false;
    }
    if (!data) return false;
    Object.entries(fields).forEach(([key, field]) => {
      field.value = data[key] || "";
      field.disabled = true;
    });
    submitButton.disabled = true;
    form.hidden = true;
    existing.hidden = false;
    return true;
  }

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (user && form) {
    fields.full_name.value = user.user_metadata?.full_name || "";
    await checkExistingApplication(user);
  }

  form?.addEventListener("submit", async event => {
    event.preventDefault();
    const { data: authData } = await supabaseClient.auth.getUser();
    if (!authData.user) {
      window.location.href = "/index/login.html";
      return;
    }
    const donationDate = new Date(fields.last_donation_date.value);
    const monthsSinceDonation = (Date.now() - donationDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (!Number.isFinite(monthsSinceDonation) || monthsSinceDonation < 3) {
      showMessage("Your last donation must be at least 3 months ago.", true);
      return;
    }
    showMessage("Submitting your application...");
    if (await checkExistingApplication(authData.user)) return;
    const { error } = await supabaseClient.from("blood_donor_applications").insert({
      user_id: authData.user.id,
      email: authData.user.email || "",
      ...Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value.trim()]))
    }, { onConflict: "user_id" });
    if (error) {
      console.error("Donor application error:", error);
      showMessage(error.message || "Unable to submit your application.", true);
      return;
    }
    form.hidden = true;
    success.hidden = false;
    if (donorList) await loadDonors();
  });

  if (donorList) await loadDonors();
  bloodTypeFilter?.querySelectorAll(".blood-type-button").forEach(button => {
    button.addEventListener("click", () => {
      bloodTypeFilter.querySelectorAll(".blood-type-button").forEach(item => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      filterDonors();
    });
  });
  filterDonors();
});