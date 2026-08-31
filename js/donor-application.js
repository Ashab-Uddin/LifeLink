document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("donor-application-form");
  const existing = document.getElementById("application-existing");
  const success = document.getElementById("application-success");
  const message = document.getElementById("application-message");
  const bloodGroupField = document.getElementById("application-blood-group");
  const userResult = await supabaseClient.auth.getUser();
  const user = userResult.data.user;

  if (!user) {
    window.location.replace("/index/login.html");
    return;
  }

  const { data: application, error: checkError } = await supabaseClient
    .from("blood_donor_applications")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (checkError) {
    message.textContent = checkError.message || "Unable to check your donor application.";
    form.hidden = false;
    return;
  }

  if (application || localStorage.getItem(`lifelink_donor_application_${user.id}`) === "submitted") {
    form.hidden = true;
    success.hidden = true;
    existing.hidden = false;
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("blood_group")
    .eq("id", user.id)
    .maybeSingle();

  const profileBloodGroup = String(profile?.blood_group || "").trim();
  if (profileBloodGroup && [...bloodGroupField.options].some(option => option.value === profileBloodGroup)) {
    bloodGroupField.value = profileBloodGroup;
  }

  form.hidden = false;
  document.getElementById("application-name").value = user.user_metadata?.full_name || "";

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const values = id => document.getElementById(id).value.trim() || null;
    const selectedBloodGroup = values("application-blood-group");

    if (!selectedBloodGroup) {
      message.textContent = "Please select your blood group.";
      return;
    }

    const normalizedBloodGroup = selectedBloodGroup.trim();

    const { error: profileError } = await supabaseClient
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: values("application-name") || user.user_metadata?.full_name || null,
        email: user.email || null,
        blood_group: normalizedBloodGroup
      }, { onConflict: "id" });

    if (profileError) {
      message.textContent = profileError.message || "Unable to save your blood group to your profile.";
      return;
    }

    const donationDate = new Date(values("application-last-donation"));
    const monthsSinceDonation = (Date.now() - donationDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (!Number.isFinite(monthsSinceDonation) || monthsSinceDonation < 3) {
      message.textContent = "Your last donation must be at least 3 months ago.";
      return;
    }

    const { data: duplicate } = await supabaseClient.from("blood_donor_applications")
      .select("id").eq("user_id", user.id).maybeSingle();
    if (duplicate) {
      form.hidden = true;
      existing.hidden = false;
      return;
    }

    const { error } = await supabaseClient.from("blood_donor_applications").insert({
      user_id: user.id,
      full_name: values("application-name"),
      blood_group: normalizedBloodGroup,
      phone: values("application-phone"),
      email: user.email || "",
      location: values("application-address"),
      last_donation_date: values("application-last-donation"),
      gender: values("application-gender"),
      date_of_birth: values("application-date-of-birth"),
      division: values("application-division"),
      district: values("application-district"),
      upazila: values("application-upazila"),
      address: values("application-address"),
      whatsapp: values("application-whatsapp"),
      facebook: values("application-facebook"),
      weight_kg: values("application-weight"),
      height: values("application-height"),
      emergency_phone: values("application-emergency-phone"),
      medical_conditions: values("application-medical-conditions"),
      current_medications: values("application-medications")
    });

    if (error) {
      message.textContent = error.message || "Unable to submit your application.";
      return;
    }
    localStorage.setItem(`lifelink_donor_application_${user.id}`, "submitted");
    form.hidden = true;
    success.hidden = false;
  });
});
