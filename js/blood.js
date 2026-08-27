document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("donor-form");
  const donorList = document.getElementById("donor-list");
  const donorPageSize = 10;
  let donorCurrentPage = 1;
  const bloodTypeFilter = document.getElementById("blood-type-filter");
  const detailsModal = document.getElementById("donor-details-modal");
  const requestedDonorIds = new Set();
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
  const donorRequestStatuses = new Map();
  if (typeof supabaseClient === "undefined" || (!form && !donorList)) return;

  const fields = {
    full_name: document.getElementById("donor-name"),
    blood_group: document.getElementById("donor-blood-group"),
    gender: document.getElementById("donor-gender"),
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
    const { data: profile } = await supabaseClient.from("profiles").select("blood_group").eq("id", user.id).maybeSingle();
    const profileBloodGroup = String(profile?.blood_group || "").trim().toLowerCase();
    const applicationBloodGroup = String(applicationFields.blood_group.value || "").trim().toLowerCase();
    if (!profileBloodGroup || profileBloodGroup !== applicationBloodGroup) {
      applicationMessage.textContent = !profileBloodGroup
        ? "Please set your blood group in your profile before applying as a donor."
        : "Your donor application blood group must match your profile blood group.";
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
      applicationMessage.textContent = window.lifeLinkText ? window.lifeLinkText("Your last donation must be at least 3 months ago.") : "Your last donation must be at least 3 months ago.";
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

  function donorEligibilityStatus(gender, lastDonation) {
    const requiredDays = ["male", "female"].includes(String(gender).toLowerCase()) ? 120 : null;
    const donationDate = new Date(`${lastDonation}T00:00:00`);
    if (!requiredDays || Number.isNaN(donationDate.getTime())) return "Not Eligible";
    const eligibleDate = new Date(donationDate.getTime() + requiredDays * 86400000);
    return Date.now() >= eligibleDate.getTime() ? "Eligible" : "Not Eligible";
  }

  function renderDonors(donors) {
    const cards = donors.map(donor => {
      const initials = donor.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
      const status = donorEligibilityStatus(donor.gender, donor.last_donation_date);
      const requestStatus = donorRequestStatuses.get(donor.user_id) || null;
      const requestSent = Boolean(requestStatus);
      const requestDisabled = requestSent || status === "Not Eligible";
      const contactDisabled = !requestSent;
      const requestLabel = requestStatus === "pending" ? "Pending" : requestStatus === "accepted" ? "Accepted / Confirmation Pending" : requestStatus === "completed" ? "Not Eligible" : "Request for Donate";
      return `<article class="card donor-card donor-card--community" data-blood-group="${escapeAttr(donor.blood_group)}" data-gender="${escapeAttr(donor.gender || "")}">
        <div class="person-card"><div class="avatar">${escapeHtml(donor.blood_group)}</div><div>
          <h3>${escapeHtml(donor.full_name)}</h3><span class="badge">${escapeHtml(donor.blood_group)}</span>
          <p class="muted">${escapeHtml(donor.location)}</p>
        </div></div>
        <div class="donor-card-footer"><div class="donor-card-meta"><span class="donor-status">${status}</span><span class="muted">${escapeHtml(initials)} · Last donation: ${escapeHtml(donationAge(donor.last_donation_date))}</span></div>
          <div class="donor-card-actions"><button class="btn btn-primary donor-contact-button" type="button" data-name="${escapeAttr(donor.full_name)}" data-user-id="${escapeAttr(donor.user_id)}" data-blood-group="${escapeAttr(donor.blood_group)}" data-gender="${escapeAttr(donor.gender || "")}" data-phone="${escapeAttr(donor.phone)}" data-email="${escapeAttr(donor.email || "")}" data-location="${escapeAttr(donor.location)}" data-last-donation="${escapeAttr(donor.last_donation_date)}" data-created-at="${escapeAttr(donor.created_at || "")}" data-date-of-birth="${escapeAttr(donor.date_of_birth || "")}" data-division="${escapeAttr(donor.division || "")}" data-district="${escapeAttr(donor.district || "")}" data-upazila="${escapeAttr(donor.upazila || "")}" data-address="${escapeAttr(donor.address || "")}" data-whatsapp="${escapeAttr(donor.whatsapp || "")}" data-facebook="${escapeAttr(donor.facebook || "")}" data-weight="${escapeAttr(donor.weight_kg || "")}" data-height="${escapeAttr(donor.height || "")}" data-emergency-phone="${escapeAttr(donor.emergency_phone || "")}" data-medical-conditions="${escapeAttr(donor.medical_conditions || "")}" data-medications="${escapeAttr(donor.current_medications || "")}" data-notes="${escapeAttr(donor.notes || "")}"${contactDisabled ? " disabled" : ""}>Contact donor</button><button class="btn btn-outline donor-request-button" type="button" data-donor-user-id="${escapeAttr(donor.user_id)}" data-donor-name="${escapeAttr(donor.full_name)}" data-donor-blood-group="${escapeAttr(donor.blood_group)}"${requestDisabled ? " disabled" : ""}>${escapeHtml(requestLabel)}</button></div>
        </div>
      </article>`;
    });
    if (cards.length) donorList.insertAdjacentHTML("afterbegin", cards.join(""));
    updateDonorStatuses();
    donorList.querySelectorAll(".donor-contact-button").forEach(button => button.addEventListener("click", () => showDonorDetails(button.dataset)));
  }

  function updateDonorStatuses() {
    donorList?.querySelectorAll(".donor-card").forEach(card => {
      const button = card.querySelector(".donor-contact-button");
      const status = card.querySelector(".donor-status");
      if (status) {
        const text = donorEligibilityStatus(card.dataset.gender, button?.dataset.lastDonation);
        status.textContent = text;
        status.classList.toggle("is-eligible", text === "Eligible");
        status.classList.toggle("is-not-eligible", text === "Not Eligible");
      }
    });
  }

  function showDonorDetails(donor) {
    sessionStorage.setItem("lifelink_selected_donor", JSON.stringify(donor));
    window.location.href = "/index/donor-details.html";
  }

  document.querySelectorAll(".donor-contact-button").forEach(button => button.addEventListener("click", () => showDonorDetails(button.dataset)));
  document.getElementById("donor-details-close")?.addEventListener("click", () => { detailsModal.hidden = true; });
  detailsModal?.addEventListener("click", event => { if (event.target === detailsModal) detailsModal.hidden = true; });
  document.querySelectorAll("[data-details-tab]").forEach(tab => {
    tab.addEventListener("click", () => {
      const selected = tab.dataset.detailsTab;
      document.querySelectorAll("[data-details-tab]").forEach(item => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      document.querySelectorAll(".donor-details-tab-panel").forEach(panel => {
        panel.hidden = panel.id !== `donor-${selected === "details" ? "details" : selected}-panel`;
        panel.classList.toggle("is-active", !panel.hidden);
      });
    });
  });

  function filterDonors() {
    const query = document.getElementById("donor-search")?.value.trim().toLowerCase() || "";
    const selectedType = document.getElementById("donor-filter-blood")?.value || "all";
    const selectedDate = document.getElementById("donor-filter-date")?.value || "";
    const eligibleOnly = document.getElementById("donor-filter-eligible")?.checked || false;
    const matchingCards = [];
    donorList?.querySelectorAll(".donor-card").forEach(card => {
      const contactButton = card.querySelector(".donor-contact-button");
      const searchableText = card.textContent.toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesType = selectedType === "all" || card.dataset.bloodGroup === selectedType;
      const matchesDate = !selectedDate || (contactButton?.dataset.lastDonation || "") <= selectedDate;
      const matchesEligibility = !eligibleOnly || donorEligibilityStatus(card.dataset.gender, contactButton?.dataset.lastDonation) === "Eligible";
      const visible = matchesSearch && matchesType && matchesDate && matchesEligibility;
      if (visible) matchingCards.push(card);
    });
    const totalPages = Math.max(1, Math.ceil(matchingCards.length / donorPageSize));
    donorCurrentPage = Math.min(donorCurrentPage, totalPages);
    const pageStart = (donorCurrentPage - 1) * donorPageSize;
    const pageEnd = Math.min(pageStart + donorPageSize, matchingCards.length);
    donorList?.querySelectorAll(".donor-card").forEach(card => {
      card.hidden = !matchingCards.slice(pageStart, pageEnd).includes(card);
    });
    const count = document.getElementById("donor-result-count");
    if (count) count.textContent = `${matchingCards.length} donor${matchingCards.length === 1 ? "" : "s"}`;
    const pagination = document.getElementById("donor-pagination");
    const pageIndicator = document.getElementById("donor-page-indicator");
    const summary = document.getElementById("donor-pagination-summary");
    const previous = document.getElementById("donor-page-previous");
    const next = document.getElementById("donor-page-next");
    if (pagination) pagination.hidden = matchingCards.length <= donorPageSize;
    if (pageIndicator) pageIndicator.textContent = `Page ${donorCurrentPage} of ${totalPages}`;
    if (summary) summary.textContent = `Showing ${pageEnd - pageStart} of ${matchingCards.length} donors`;
    if (previous) previous.disabled = donorCurrentPage <= 1;
    if (next) next.disabled = donorCurrentPage >= totalPages;
    document.querySelectorAll("#blood-type-filter .blood-type-button").forEach(button => {
      if (button.id === "donor-eligible-quick-filter") return;
      const active = button.dataset.bloodType === selectedType;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const eligibleQuickFilter = document.getElementById("donor-eligible-quick-filter");
    if (eligibleQuickFilter) {
      eligibleQuickFilter.classList.toggle("active", eligibleOnly);
      eligibleQuickFilter.setAttribute("aria-pressed", String(eligibleOnly));
    }
  }

  async function loadDonors() {
    const { data, error } = await supabaseClient.from("blood_donor_applications")
      .select("user_id,full_name,blood_group,gender,phone,email,location,last_donation_date,created_at,notes,date_of_birth,division,district,upazila,address,whatsapp,facebook,weight_kg,height,emergency_phone,medical_conditions,current_medications")
      .eq("status", "available").order("created_at", { ascending: false });
    if (error) {
      console.error("Donor loading error:", error);
      return;
    }
    donorList?.querySelectorAll(".donor-card").forEach(card => card.remove());
    renderDonors(data || []);
  }

  async function checkExistingApplication(user) {
    if (!form || !user) return false;
    const { data, error } = await supabaseClient.from("blood_donor_applications")
      .select("full_name,blood_group,gender,phone,location,last_donation_date,notes")
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
  if (user && donorList) {
    const { data: sentRequests } = await supabaseClient.from("blood_donation_requests").select("donor_user_id,status,created_at").eq("requester_user_id", user.id).order("created_at", { ascending: false });
    (sentRequests || []).forEach(request => {
      if (!donorRequestStatuses.has(request.donor_user_id) && ["pending", "accepted"].includes(request.status)) {
        requestedDonorIds.add(request.donor_user_id);
        donorRequestStatuses.set(request.donor_user_id, request.status);
      }
    });
  }
  if (user && form) {
    fields.full_name.value = user.user_metadata?.full_name || "";
    await checkExistingApplication(user);
  }

  async function notifyDonorOfMatches(user) {
    if (!user) return;
    const notificationKey = `lifelink_last_notification_${user.id}`;
    const { data: notifications } = await supabaseClient.from("blood_request_notifications")
      .select("id,message,created_at,read_at").eq("recipient_user_id", user.id)
      .is("read_at", null).order("created_at", { ascending: false }).limit(5);
    if (!notifications?.length) return;
    const latestNotification = notifications[0];
    if (localStorage.getItem(notificationKey) === latestNotification.id) return;
    localStorage.setItem(notificationKey, latestNotification.id);
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("LifeLink blood request match", { body: latestNotification.message });
    }
    if (message) showMessage(latestNotification.message);
    else if (typeof toast === "function") toast(latestNotification.message);
  }

  if (user && donorList) {
    await notifyDonorOfMatches(user);
    window.setInterval(() => notifyDonorOfMatches(user), 30000);
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
  donorList?.addEventListener("click", event => {
    const button = event.target.closest(".donor-request-button");
    if (!button) return;
    event.stopPropagation();
    const params = new URLSearchParams({ donor_id: button.dataset.donorUserId, donor_name: button.dataset.donorName, blood_group: button.dataset.donorBloodGroup || "" });
    window.location.href = `/index/blood-request.html?${params}`;
  });
  document.getElementById("donor-search-button")?.addEventListener("click", filterDonors);
  document.getElementById("donor-search")?.addEventListener("input", filterDonors);
  document.querySelectorAll("#blood-type-filter .blood-type-button").forEach(button => {
    if (button.id === "donor-eligible-quick-filter") return;
    button.addEventListener("click", () => {
      const bloodFilter = document.getElementById("donor-filter-blood");
      if (bloodFilter) bloodFilter.value = button.dataset.bloodType;
      filterDonors();
    });
  });
  document.getElementById("donor-eligible-quick-filter")?.addEventListener("click", () => {
    const eligible = document.getElementById("donor-filter-eligible");
    if (eligible) eligible.checked = !eligible.checked;
    donorCurrentPage = 1;
    filterDonors();
  });
  document.getElementById("apply-donor-filters")?.addEventListener("click", filterDonors);
  document.getElementById("donor-page-previous")?.addEventListener("click", () => {
    donorCurrentPage -= 1;
    filterDonors();
  });
  document.getElementById("donor-page-next")?.addEventListener("click", () => {
    donorCurrentPage += 1;
    filterDonors();
  });
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