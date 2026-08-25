document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("donor-form");
  const donorList = document.getElementById("donor-list");
  const bloodTypeFilter = document.getElementById("blood-type-filter");
  const detailsModal = document.getElementById("donor-details-modal");
  const applicationModal = document.getElementById("blood-donor-application-modal");
  const applicationForm = document.getElementById("blood-donor-form");
  const applicationExisting = document.getElementById("blood-donor-existing");
  const applicationFields = {
    full_name: document.getElementById("blood-donor-name"),
    blood_group: document.getElementById("blood-donor-group"),
    phone: document.getElementById("blood-donor-phone"),
    location: document.getElementById("blood-donor-address"),
    last_donation_date: document.getElementById("blood-donor-last-donation"),
    notes: document.getElementById("blood-donor-notes")
  };
  const applicationMessage = document.getElementById("blood-donor-message");
  const donorApplicationKey = userId => `lifelink_donor_application_${userId}`;
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

  document.getElementById("open-blood-donor-form")?.addEventListener("click", async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      window.location.href = "/index/login.html";
      return;
    }
    const locallySubmitted = localStorage.getItem(donorApplicationKey(user.id)) === "submitted";
    const { data, error } = await supabaseClient.from("blood_donor_applications")
      .select("id").eq("user_id", user.id).maybeSingle();
    if (error) {
      console.error("Donor application check error:", error);
      return;
    }
    applicationModal.hidden = false;
    const alreadySubmitted = Boolean(data) || locallySubmitted;
    applicationForm.hidden = alreadySubmitted;
    applicationExisting.hidden = !alreadySubmitted;
    applicationForm.style.display = alreadySubmitted ? "none" : "";
    applicationExisting.style.display = alreadySubmitted ? "" : "none";
    if (!alreadySubmitted) {
      applicationFields.full_name.value = user.user_metadata?.full_name || "";
      applicationFields.full_name.focus();
    }
  });
  document.getElementById("blood-donor-close")?.addEventListener("click", () => { applicationModal.hidden = true; });
  document.getElementById("blood-donor-existing-close")?.addEventListener("click", () => { applicationModal.hidden = true; });
  applicationModal?.addEventListener("click", event => { if (event.target === applicationModal) applicationModal.hidden = true; });

  function applicationExtraFields() {
    const value = id => document.getElementById(id)?.value.trim() || null;
    return {
      gender: value("blood-donor-gender"),
      date_of_birth: value("blood-donor-date-of-birth"),
      division: value("blood-donor-division"),
      district: value("blood-donor-district"),
      upazila: value("blood-donor-upazila"),
      address: value("blood-donor-address"),
      whatsapp: value("blood-donor-whatsapp"),
      facebook: value("blood-donor-facebook"),
      weight_kg: value("blood-donor-weight"),
      height: value("blood-donor-height"),
      emergency_phone: value("blood-donor-emergency-phone"),
      medical_conditions: value("blood-donor-medical-conditions"),
      current_medications: value("blood-donor-medications")
    };
  }

  applicationForm?.addEventListener("submit", async event => {
    event.preventDefault();
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      window.location.href = "/index/login.html";
      return;
    }
    const { data: existingApplication } = await supabaseClient.from("blood_donor_applications")
      .select("id").eq("user_id", user.id).maybeSingle();
    if (existingApplication) {
      applicationForm.hidden = true;
      applicationExisting.hidden = false;
      applicationForm.style.display = "none";
      applicationExisting.style.display = "";
      return;
    }
    const donationDate = new Date(applicationFields.last_donation_date.value);
    const monthsSinceDonation = (Date.now() - donationDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (!Number.isFinite(monthsSinceDonation) || monthsSinceDonation < 3) {
      applicationMessage.textContent = "Your last donation must be at least 3 months ago.";
      return;
    }
    const { error } = await supabaseClient.from("blood_donor_applications").insert({
      user_id: user.id,
      email: user.email || "",
      ...Object.fromEntries(Object.entries(applicationFields).map(([key, field]) => [key, field.value.trim()])),
      ...applicationExtraFields()
    });
    if (error) {
      applicationMessage.textContent = error.message || "Unable to submit your application.";
      return;
    }
    applicationForm.hidden = true;
    applicationExisting.hidden = false;
    applicationForm.style.display = "none";
    applicationExisting.style.display = "";
    localStorage.setItem(donorApplicationKey(user.id), "submitted");
  });

  function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle("is-error", isError);
  }

  function donationAge(value) {
    const donationDate = new Date(`${value}T00:00:00`);
    const days = Math.max(0, Math.floor((Date.now() - donationDate.getTime()) / 86400000));
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30.44);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }

  function renderDonors(donors) {
    const cards = donors.map(donor => {
      const initials = donor.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
      return `<article class="card donor-card donor-card--community" data-blood-group="${escapeAttr(donor.blood_group)}">
        <div class="person-card"><div class="avatar">${escapeHtml(donor.blood_group)}</div><div>
          <h3>${escapeHtml(donor.full_name)}</h3><span class="badge">${escapeHtml(donor.blood_group)}</span>
          <p class="muted">${escapeHtml(donor.location)} · Available donor</p>
        </div></div>
        <div class="donor-card-footer"><span class="muted">${escapeHtml(initials)} · Last donation: ${escapeHtml(donationAge(donor.last_donation_date))}</span>
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
    const query = document.getElementById("donor-search")?.value.trim().toLowerCase() || "";
    const selectedType = document.getElementById("donor-filter-blood")?.value || "all";
    const selectedDate = document.getElementById("donor-filter-date")?.value || "";
    let visibleCount = 0;
    donorList?.querySelectorAll(".donor-card").forEach(card => {
      const contactButton = card.querySelector(".donor-contact-button");
      const searchableText = card.textContent.toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesType = selectedType === "all" || card.dataset.bloodGroup === selectedType;
      const matchesDate = !selectedDate || (contactButton?.dataset.lastDonation || "") <= selectedDate;
      const visible = matchesSearch && matchesType && matchesDate;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });
    const count = document.getElementById("donor-result-count");
    if (count) count.textContent = `${visibleCount} donor${visibleCount === 1 ? "" : "s"}`;
    document.querySelectorAll("#blood-type-filter .blood-type-button").forEach(button => {
      const active = button.dataset.bloodType === selectedType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
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
  document.getElementById("donor-search-button")?.addEventListener("click", filterDonors);
  document.getElementById("donor-search")?.addEventListener("input", filterDonors);
  document.querySelectorAll("#blood-type-filter .blood-type-button").forEach(button => {
    button.addEventListener("click", () => {
      const bloodFilter = document.getElementById("donor-filter-blood");
      if (bloodFilter) bloodFilter.value = button.dataset.bloodType;
      filterDonors();
    });
  });
  document.getElementById("apply-donor-filters")?.addEventListener("click", filterDonors);
  document.getElementById("reset-donor-filters")?.addEventListener("click", () => {
    ["donor-search", "donor-filter-district", "donor-filter-upazila", "donor-filter-date"].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });
    ["donor-filter-blood", "donor-filter-gender", "donor-filter-division"].forEach(id => {
      const select = document.getElementById(id);
      if (select) select.value = "all";
    });
    const eligible = document.getElementById("donor-filter-eligible");
    if (eligible) eligible.checked = false;
    filterDonors();
  });
  filterDonors();
});