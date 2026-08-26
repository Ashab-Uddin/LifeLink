document.addEventListener("DOMContentLoaded", async () => {
  const details = document.getElementById("blood-request-details");
  const message = document.getElementById("blood-request-details-message");
  if (!details || typeof supabaseClient === "undefined") return;

  const { data: authData } = await supabaseClient.auth.getUser();
  if (!authData.user) {
    window.location.replace("/index/login.html");
    return;
  }

  const requestId = new URLSearchParams(window.location.search).get("id");
  if (!requestId) {
    message.textContent = "This blood request could not be found.";
    return;
  }

  const { data: request, error } = await supabaseClient.from("blood_requests")
    .select("id,user_id,patient_name,blood_group,division,district,upazila,address,donation_center,contact_number,whatsapp_number,blood_amount_bags,donation_date,donation_time,hemoglobin,patient_problem,status,created_at")
    .eq("id", requestId).eq("status", "open").maybeSingle();
  if (error || !request) {
    message.textContent = "This blood request is no longer available.";
    return;
  }

  const { data: profile } = await supabaseClient.from("profiles")
    .select("full_name,email").eq("id", request.user_id).maybeSingle();
  const detail = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value || "Not provided"; };
  const formatDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : "Not provided";
  const formatTime = value => value ? value.slice(0, 5) : "Not provided";

  document.title = `Request for ${request.patient_name} - LifeLink`;
  detail("request-details-title", `Request for ${request.patient_name}`);
  detail("request-details-patient", request.patient_name);
  detail("request-details-patient-name", request.patient_name);
  detail("request-details-blood", request.blood_group);
  detail("request-details-blood-label", request.blood_group);
  detail("request-details-location", `${request.donation_center} · ${request.district}`);
  detail("request-details-requester-name", profile?.full_name);
  const requesterEmail = document.getElementById("request-details-requester-email");
  requesterEmail.textContent = profile?.email || "Email not provided";
  requesterEmail.href = profile?.email ? `mailto:${encodeURIComponent(profile.email)}` : "#";
  detail("request-details-full-location", [request.address, request.upazila, request.district, request.division].filter(Boolean).join(", "));
  detail("request-details-amount", `${request.blood_amount_bags} bag${Number(request.blood_amount_bags) === 1 ? "" : "s"}`);
  detail("request-details-posted", formatDate(request.created_at?.slice(0, 10)));
  detail("request-details-date", formatDate(request.donation_date));
  detail("request-details-time", formatTime(request.donation_time));
  detail("request-details-center", request.donation_center);
  detail("request-details-donation-center", request.donation_center);
  detail("request-details-hemoglobin", request.hemoglobin ? `${request.hemoglobin} g/dL` : "Not provided");
  detail("request-details-problem", request.patient_problem);

  const contact = document.getElementById("request-details-contact");
  contact.textContent = request.contact_number || "Contact not provided";
  contact.href = request.contact_number ? `tel:${request.contact_number}` : "#";
  const whatsapp = document.getElementById("request-details-whatsapp");
  whatsapp.textContent = request.whatsapp_number || "WhatsApp not provided";
  const whatsappNumber = String(request.whatsapp_number || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  whatsapp.href = whatsappNumber ? `https://wa.me/${whatsappNumber}` : "#";
  whatsapp.target = whatsappNumber ? "_blank" : "_self";
  whatsapp.rel = whatsappNumber ? "noopener" : "";
  details.hidden = false;
  message.hidden = true;

  document.getElementById("request-donate-button")?.addEventListener("click", async event => {
    const button = event.currentTarget;
    const response = document.getElementById("request-donate-message");
    button.disabled = true;
    response.textContent = "Sending your response...";
    response.classList.remove("is-error");
    const { error: responseError } = await supabaseClient.rpc("create_blood_donation_request", { p_blood_request_id: request.id });
    if (responseError) {
      const missingFunction = responseError.message?.includes("Could not find the function public.create_blood_donation_request") || responseError.code === "PGRST202";
      response.textContent = missingFunction ? "Donation setup is not active yet. Run SUPABASE_BLOOD_REQUEST_SETUP.sql in Supabase, then refresh." : (responseError.message || "Unable to send your donation request.");
      response.classList.add("is-error");
      button.disabled = false;
      return;
    }
    button.textContent = "Donation request sent";
    response.textContent = "Your response was sent to the requester.";
  });
});
