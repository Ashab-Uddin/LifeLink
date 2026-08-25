document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("blood-request-form");
  const message = document.getElementById("blood-request-message");
  const success = document.getElementById("blood-request-success");
  if (!form || typeof supabaseClient === "undefined") return;

  const fields = {
    patient_name: "request-patient-name",
    blood_group: "request-blood-group",
    division: "request-division",
    district: "request-district",
    upazila: "request-upazila",
    address: "request-address",
    donation_center: "request-center",
    contact_number: "request-contact",
    whatsapp_number: "request-whatsapp",
    blood_amount_bags: "request-amount",
    donation_date: "request-date",
    donation_time: "request-time",
    hemoglobin: "request-hemoglobin",
    patient_problem: "request-problem"
  };

  const readValue = field => document.getElementById(fields[field]).value.trim() || null;
  const { data: authData } = await supabaseClient.auth.getUser();
  if (!authData.user) {
    window.location.replace("/index/login.html");
    return;
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.textContent = "Submitting your blood request...";
    message.classList.remove("is-error");

    const donationDate = new Date(`${readValue("donation_date")}T${readValue("donation_time")}`);
    if (Number.isNaN(donationDate.getTime())) {
      message.textContent = "Please provide a valid donation date and time.";
      message.classList.add("is-error");
      return;
    }

    const request = Object.fromEntries(Object.keys(fields).map(field => [field, readValue(field)]));
    request.user_id = authData.user.id;
    request.blood_amount_bags = Number(request.blood_amount_bags);
    if (request.hemoglobin) request.hemoglobin = Number(request.hemoglobin);

    const { error } = await supabaseClient.from("blood_requests").insert(request);
    if (error) {
      message.textContent = error.message || "Unable to submit your blood request.";
      message.classList.add("is-error");
      return;
    }

    form.hidden = true;
    success.hidden = false;
  });
});
