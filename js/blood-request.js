document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("blood-request-form");
  const message = document.getElementById("blood-request-message");
  const submitButton = document.getElementById("blood-request-submit");
  const success = document.getElementById("blood-request-success");
  if (!form || typeof supabaseClient === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const donorId = params.get("donor_id");
  const donorName = params.get("donor_name");
  const donorBloodGroup = params.get("blood_group");
  const bloodGroup = document.getElementById("request-blood-group");
  const intro = document.getElementById("request-intro");
  if (!donorId) {
    message.textContent = "Please start a request from an eligible donor card.";
    submitButton.disabled = true;
    return;
  }
  if (donorName) intro.textContent = `Complete the request details for ${donorName}. The donor will be notified after submission.`;
  if (donorBloodGroup && [...bloodGroup.options].some(option => option.value === donorBloodGroup)) bloodGroup.value = donorBloodGroup;

  const { data: authData } = await supabaseClient.auth.getUser();
  if (!authData.user) {
    window.location.replace("/index/login.html");
    return;
  }

  const value = id => document.getElementById(id).value.trim() || null;
  form.addEventListener("submit", async event => {
    event.preventDefault();
    submitButton.disabled = true;
    message.classList.remove("is-error");
    message.textContent = "Sending blood request...";

    const requestData = {
      user_id: authData.user.id,
      patient_name: value("request-patient-name"),
      blood_group: value("request-blood-group"),
      division: value("request-division"),
      district: value("request-district"),
      upazila: value("request-upazila"),
      address: value("request-address"),
      donation_center: value("request-center"),
      contact_number: value("request-phone"),
      whatsapp_number: value("request-whatsapp"),
      blood_amount_bags: Number(value("request-amount")),
      donation_date: value("request-date"),
      donation_time: value("request-time"),
      patient_problem: value("request-problem")
    };
    const { data: request, error: requestError } = await supabaseClient.from("blood_requests").insert(requestData).select("id").single();
    if (requestError) {
      message.textContent = requestError.message || "Unable to create blood request.";
      message.classList.add("is-error");
      submitButton.disabled = false;
      return;
    }

    const { error: donorError } = await supabaseClient.rpc("request_blood_donation_from_donor", {
      p_donor_user_id: donorId,
      p_blood_request_id: request.id
    });
    if (donorError) {
      await supabaseClient.from("blood_requests").delete().eq("id", request.id).eq("user_id", authData.user.id);
      message.textContent = donorError.message || "Unable to notify this donor.";
      message.classList.add("is-error");
      submitButton.disabled = false;
      return;
    }

    form.hidden = true;
    success.hidden = false;
    window.setTimeout(() => window.location.replace("/index/blood.html"), 800);
  });
});
