document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("donor-form");
  const donorList = document.getElementById("donor-list");
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
      return `<article class="card donor-card donor-card--community">
        <div class="person-card"><div class="avatar">${escapeHtml(donor.blood_group)}</div><div>
          <h3>${escapeHtml(donor.full_name)}</h3><span class="badge">${escapeHtml(donor.blood_group)}</span>
          <p class="muted">${escapeHtml(donor.location)} · Available donor</p>
        </div></div>
        <div class="donor-card-footer"><span class="muted">${escapeHtml(initials)} · Last donated ${escapeHtml(new Date(donor.last_donation_date).toLocaleDateString())}</span>
          <button class="btn btn-primary donor-contact-button" type="button" data-phone="${escapeAttr(donor.phone)}">Contact donor</button>
        </div>
      </article>`;
    });
    if (cards.length) donorList.insertAdjacentHTML("afterbegin", cards.join(""));
    donorList.querySelectorAll(".donor-contact-button").forEach(button => {
      button.addEventListener("click", () => toast(`Contact: ${button.dataset.phone}`));
    });
  }

  async function loadDonors() {
    const { data, error } = await supabaseClient.from("blood_donor_applications")
      .select("full_name,blood_group,phone,location,last_donation_date")
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
});