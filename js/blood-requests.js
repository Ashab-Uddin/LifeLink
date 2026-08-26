document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("blood-requests-list");
  if (!list || typeof supabaseClient === "undefined") return;

  const { data: authData } = await supabaseClient.auth.getUser();
  if (!authData.user) {
    window.location.replace("/index/login.html");
    return;
  }

  const notificationKey = `lifelink_last_request_response_${authData.user.id}`;
  const checkRequesterNotifications = async () => {
    const { data: notifications } = await supabaseClient.from("blood_request_notifications")
      .select("id,message,created_at").eq("recipient_user_id", authData.user.id).is("read_at", null)
      .order("created_at", { ascending: false }).limit(5);
    const latest = notifications?.[0];
    if (!latest || localStorage.getItem(notificationKey) === latest.id) return;
    localStorage.setItem(notificationKey, latest.id);
    if (typeof toast === "function") toast(latest.message);
    if ("Notification" in window && Notification.permission === "granted") new Notification("LifeLink donor response", { body: latest.message });
  };
  await checkRequesterNotifications();
  window.setInterval(checkRequesterNotifications, 30000);

  const { data, error } = await supabaseClient.from("blood_requests")
    .select("id,user_id,patient_name,blood_group,division,district,upazila,address,donation_center,contact_number,whatsapp_number,blood_amount_bags,donation_date,donation_time,hemoglobin,patient_problem,status,created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  if (error) {
    list.innerHTML = `<p class="blood-request-empty">Unable to load blood requests. Please run the request setup SQL first.</p>`;
    return;
  }
  const escape = value => String(value || "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" }[character]));
  const formatDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "Not provided";
  const formatTime = value => value ? value.slice(0, 5) : "Not provided";
  const requests = data || [];
  const detailModal = document.getElementById("blood-request-details-modal");
  let selectedRequest = null;
  const detail = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value || "Not provided"; };
  const showDetails = request => {
    selectedRequest = request;
    detail("request-details-title", `Request for ${request.patient_name}`);
    detail("request-details-patient", request.patient_name);
    detail("request-details-blood", request.blood_group);
    detail("request-details-blood-label", request.blood_group);
    detail("request-details-location", `${request.donation_center} · ${request.district}`);
    detail("request-details-full-location", [request.address, request.upazila, request.district, request.division].filter(Boolean).join(", "));
    detail("request-details-amount", `${request.blood_amount_bags} bag${Number(request.blood_amount_bags) === 1 ? "" : "s"}`);
    detail("request-details-posted", formatDate(request.created_at?.slice(0, 10)));
    detail("request-details-date", formatDate(request.donation_date));
    detail("request-details-time", formatTime(request.donation_time));
    detail("request-details-center", request.donation_center);
    detail("request-details-division", request.division);
    detail("request-details-district", request.district);
    detail("request-details-upazila", request.upazila);
    detail("request-details-address", request.address);
    const contact = document.getElementById("request-details-contact");
    contact.textContent = request.contact_number || "Contact not provided";
    contact.href = request.contact_number ? `tel:${request.contact_number}` : "#";
    const whatsapp = document.getElementById("request-details-whatsapp");
    whatsapp.textContent = request.whatsapp_number || "WhatsApp not provided";
    const whatsappNumber = String(request.whatsapp_number || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
    whatsapp.href = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";
    whatsapp.target = whatsappNumber ? "_blank" : "_self";
    whatsapp.rel = whatsappNumber ? "noopener" : "";
    detail("request-details-hemoglobin", request.hemoglobin ? `${request.hemoglobin} g/dL` : "Not provided");
    detail("request-details-problem", request.patient_problem);
    const donateButton = document.getElementById("request-donate-button");
    if (donateButton) {
      donateButton.textContent = "I want to donate";
      donateButton.disabled = false;
    }
    document.getElementById("request-donate-message").textContent = "";
    detailModal.hidden = false;
  };
  const render = () => {
    const query = document.getElementById("request-search")?.value.trim().toLowerCase() || "";
    const blood = document.getElementById("request-filter-blood")?.value || "all";
    const division = document.getElementById("request-filter-division")?.value || "all";
    const district = document.getElementById("request-filter-district")?.value.trim().toLowerCase() || "";
    const upazila = document.getElementById("request-filter-upazila")?.value.trim().toLowerCase() || "";
    const dateFrom = document.getElementById("request-filter-date-from")?.value || "";
    const dateTo = document.getElementById("request-filter-date-to")?.value || "";
    const maxAmount = Number(document.getElementById("request-filter-amount")?.value || 10);
    const maxHemoglobin = Number(document.getElementById("request-filter-hemoglobin")?.value || 20);
    const filtered = requests.filter(request => {
      const searchable = `${request.patient_name} ${request.donation_center} ${request.district} ${request.upazila} ${request.blood_group}`.toLowerCase();
      const amount = Number(request.blood_amount_bags) || 0;
      const hemoglobin = request.hemoglobin === null || request.hemoglobin === undefined ? 0 : Number(request.hemoglobin);
      return (!query || searchable.includes(query)) && (blood === "all" || request.blood_group === blood) && (division === "all" || request.division === division) && (!district || String(request.district || "").toLowerCase().includes(district)) && (!upazila || String(request.upazila || "").toLowerCase().includes(upazila)) && (!dateFrom || request.donation_date >= dateFrom) && (!dateTo || request.donation_date <= dateTo) && amount <= maxAmount && hemoglobin <= maxHemoglobin;
    });
    const amountValue = document.getElementById("request-filter-amount-value");
    const hemoglobinValue = document.getElementById("request-filter-hemoglobin-value");
    if (amountValue) amountValue.textContent = `0 - ${maxAmount}`;
    if (hemoglobinValue) hemoglobinValue.textContent = `0.0 - ${maxHemoglobin.toFixed(1)}`;
    document.querySelectorAll("[data-request-blood]").forEach(button => {
      const active = button.dataset.requestBlood === blood;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (!filtered.length) {
      list.innerHTML = `<p class="blood-request-empty">No matching open blood requests.</p>`;
      return;
    }
    list.innerHTML = filtered.map((request, index) => `<article class="blood-request-item" tabindex="0" data-request-index="${requests.indexOf(request)}">
      <div class="blood-request-item-heading"><div class="request-card-identity"><span class="request-card-blood">${escape(request.blood_group)}</span><div><h2>${escape(request.patient_name)}</h2></div></div><span class="blood-request-status">Open request</span></div>
      <div class="request-card-center"><span>Hospital / center</span><strong>${escape(request.donation_center || "Not provided")}</strong></div>
      <dl class="blood-request-meta">
        <div><dt>Blood group</dt><dd class="request-blood-value">${escape(request.blood_group)}</dd></div><div><dt>Amount</dt><dd>${escape(request.blood_amount_bags)} bag${Number(request.blood_amount_bags) === 1 ? "" : "s"}</dd></div><div><dt>Donation date</dt><dd>${formatDate(request.donation_date)}</dd></div><div><dt>Time</dt><dd>${formatTime(request.donation_time)}</dd></div><div><dt>Division</dt><dd>${escape(request.division)}</dd></div><div><dt>Upazila</dt><dd>${escape(request.upazila) || "Not provided"}</dd></div>
      </dl><p class="blood-request-card-hint">View complete request details</p>
    </article>`).join("");
    list.querySelectorAll(".blood-request-item").forEach(card => {
      const open = () => showDetails(requests[Number(card.dataset.requestIndex)]);
      card.addEventListener("click", open);
      card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
    });
  };
  if (!requests.length) list.innerHTML = `<p class="blood-request-empty">No open blood requests yet.</p>`;
  else render();
  const filtersToggle = document.getElementById("request-filters-toggle");
  const filtersPanel = document.getElementById("request-filters-panel");
  filtersToggle?.addEventListener("click", () => {
    const expanded = filtersToggle.getAttribute("aria-expanded") === "true";
    filtersToggle.setAttribute("aria-expanded", String(!expanded));
    filtersPanel?.classList.toggle("is-open", !expanded);
  });
  ["request-search", "request-filter-blood", "request-filter-division", "request-filter-district", "request-filter-upazila", "request-filter-date-from", "request-filter-date-to", "request-filter-amount", "request-filter-hemoglobin"].forEach(id => document.getElementById(id)?.addEventListener("input", render));
  document.getElementById("request-search-button")?.addEventListener("click", render);
  document.getElementById("request-apply-filters")?.addEventListener("click", render);
  document.querySelectorAll("[data-request-blood]").forEach(button => {
    button.addEventListener("click", () => {
      const blood = document.getElementById("request-filter-blood");
      if (blood) blood.value = button.dataset.requestBlood;
      document.querySelectorAll("[data-request-blood]").forEach(item => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });
  document.getElementById("request-reset-filters")?.addEventListener("click", () => {
    ["request-search", "request-filter-district", "request-filter-upazila", "request-filter-date-from", "request-filter-date-to"].forEach(id => { const input = document.getElementById(id); if (input) input.value = ""; });
    ["request-filter-blood", "request-filter-division"].forEach(id => { const select = document.getElementById(id); if (select) select.value = "all"; });
    ["request-filter-amount", "request-filter-hemoglobin"].forEach(id => { const input = document.getElementById(id); if (input) input.value = input.max; });
    document.querySelectorAll("[data-request-blood]").forEach(item => {
      const active = item.dataset.requestBlood === "all";
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    render();
  });
  document.getElementById("request-details-close")?.addEventListener("click", () => { detailModal.hidden = true; });
  detailModal?.addEventListener("click", event => { if (event.target === detailModal) detailModal.hidden = true; });
  document.getElementById("request-donate-button")?.addEventListener("click", async () => {
    if (!selectedRequest) return;
    const button = document.getElementById("request-donate-button");
    const response = document.getElementById("request-donate-message");
    button.disabled = true;
    response.textContent = "Sending your response...";
    const { error: responseError } = await supabaseClient.rpc("respond_to_blood_request", { p_request_id: selectedRequest.id });
    if (responseError) {
      response.textContent = responseError.message || "Unable to send your response.";
      response.classList.add("is-error");
      button.disabled = false;
      return;
    }
    response.classList.remove("is-error");
    response.textContent = "";
    button.textContent = "Response sent";
    detailModal.hidden = true;
    document.getElementById("donor-response-success-modal").hidden = false;
  });
  const responseSuccessModal = document.getElementById("donor-response-success-modal");
  const closeResponseSuccess = () => { responseSuccessModal.hidden = true; };
  document.getElementById("donor-response-success-close")?.addEventListener("click", closeResponseSuccess);
  document.getElementById("donor-response-success-done")?.addEventListener("click", closeResponseSuccess);
  responseSuccessModal?.addEventListener("click", event => { if (event.target === responseSuccessModal) closeResponseSuccess(); });
});
