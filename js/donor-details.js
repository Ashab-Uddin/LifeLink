document.addEventListener("DOMContentLoaded", () => {
  const donor = JSON.parse(sessionStorage.getItem("lifelink_selected_donor") || "null");
  if (!donor) {
    window.location.replace("/index/blood.html");
    return;
  }

  const value = field => donor[field] || "Not provided";
  const dateValue = field => {
    if (!donor[field]) return "Not provided";
    const date = new Date(field === "createdAt" ? donor[field] : `${donor[field]}T00:00:00`);
    return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleDateString();
  };
  const requiredMonths = ["male", "female"].includes(String(donor.gender).toLowerCase()) ? 4 : null;
  const donationDate = new Date(`${donor.lastDonation}T00:00:00`);
  const eligibleDate = requiredMonths && !Number.isNaN(donationDate.getTime()) ? new Date(donationDate.setMonth(donationDate.getMonth() + requiredMonths)) : null;
  const eligibility = eligibleDate && Date.now() >= eligibleDate.getTime() ? "Eligible" : "Not Eligible";

  document.title = `${value("name")} - Donor Details | LifeLink`;
  document.getElementById("donor-details-title").textContent = `Contact ${value("name")}`;
  document.getElementById("donor-details-name").textContent = value("name");
  document.getElementById("donor-details-blood").textContent = value("bloodGroup");
  document.getElementById("donor-details-group").textContent = value("bloodGroup");
  const status = document.getElementById("donor-details-status");
  status.textContent = eligibility;
  status.classList.toggle("is-eligible", eligibility === "Eligible");
  status.classList.toggle("is-not-eligible", eligibility === "Not Eligible");
  document.getElementById("donor-details-gender").textContent = value("gender");
  document.getElementById("donor-details-location").textContent = value("location");
  document.getElementById("donor-details-last-donation").textContent = dateValue("lastDonation");
  document.getElementById("donor-details-member-since").textContent = dateValue("createdAt");
  const donationStatus = document.getElementById("donor-details-donation-status");
  donationStatus.textContent = eligibility;
  donationStatus.classList.toggle("is-eligible", eligibility === "Eligible");
  donationStatus.classList.toggle("is-not-eligible", eligibility === "Not Eligible");
  document.getElementById("donor-details-donation-date").textContent = dateValue("lastDonation");
  document.getElementById("donor-details-interval").textContent = requiredMonths ? `Every ${requiredMonths} months` : "Not provided";

  const phone = document.getElementById("donor-details-phone");
  phone.textContent = value("phone");
  phone.href = donor.phone ? `tel:${donor.phone}` : "#";
  const emailTargets = ["donor-details-profile-email", "donor-details-email-details"];
  emailTargets.forEach(id => {
    const email = document.getElementById(id);
    if (!email) return;
    email.textContent = value("email");
    email.href = donor.email ? `mailto:${donor.email}` : "#";
  });
  const whatsapp = document.getElementById("donor-details-whatsapp");
  whatsapp.textContent = value("whatsapp");
  whatsapp.href = donor.whatsapp ? `tel:${donor.whatsapp}` : "#";
  const facebook = document.getElementById("donor-details-facebook");
  facebook.textContent = value("facebook");
  facebook.href = donor.facebook || "#";

  [
    ["donor-details-date-of-birth", "dateOfBirth"], ["donor-details-emergency-phone", "emergencyPhone"],
    ["donor-details-division", "division"], ["donor-details-district", "district"],
    ["donor-details-upazila", "upazila"], ["donor-details-address", "address"],
    ["donor-details-weight", "weight"], ["donor-details-height", "height"],
    ["donor-details-medical-conditions", "medicalConditions"], ["donor-details-medications", "medications"],
    ["donor-details-notes-text", "notes"]
  ].forEach(([id, field]) => {
    document.getElementById(id).textContent = field === "dateOfBirth" ? dateValue(field) : value(field);
  });

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
});
