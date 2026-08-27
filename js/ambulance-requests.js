document.addEventListener("DOMContentLoaded", async () => {
  const historyList = document.getElementById("ambulance-history-list");
  const providerCard = document.getElementById("ambulance-provider-card");
  const providerList = document.getElementById("ambulance-provider-list");
  if (!historyList || typeof supabaseClient === "undefined") return;

  const escape = value => String(value ?? "").replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character]));
  const formatDate = value => value ? new Date(value).toLocaleString() : "Not provided";
  const formatNumber = value => value === null || value === undefined ? "Not provided" : Number(value).toFixed(2);
  const formatMoney = value => value === null || value === undefined ? "Not provided" : `৳${Number(value).toFixed(2).replace(/\.00$/, "")}`;

  const { data: authData } = await supabaseClient.auth.getUser();
  if (!authData?.user) {
    window.location.replace("/index/login.html");
    return;
  }

  const { data: requests, error } = await supabaseClient.from("ambulance_requests")
    .select("id,patient_name,patient_phone,emergency_type,pickup_location,pickup_latitude,pickup_longitude,destination_hospital,destination_latitude,destination_longitude,notes,distance_km,base_fare,per_km_rate,estimated_fare,final_distance_km,final_fare,status,requested_at,pickup_at,completed_at,provider_location,provider_latitude,provider_longitude,estimated_arrival_at,accepted_at,ambulances(name,type,phone)")
    .eq("user_id", authData.user.id).order("requested_at", { ascending: false });

  if (error) {
    historyList.innerHTML = `<p class="profile-message is-error">${escape(error.message || "Unable to load ambulance requests.")}</p>`;
    return;
  }
  if (!requests?.length) {
    historyList.innerHTML = '<p class="muted">No ambulance requests yet. Use the button above to request an ambulance.</p>';
  } else {
    historyList.innerHTML = requests.map(request => {
      const completed = request.final_fare !== null && request.final_fare !== undefined;
      const distance = completed ? request.final_distance_km : request.distance_km;
      const fare = completed ? request.final_fare : request.estimated_fare;
      return `<article class="ambulance-history-item"><div class="ambulance-history-item-heading"><div><span class="badge">${escape(request.ambulances?.type || "Ambulance")}</span><h2>${escape(request.ambulances?.name || "Ambulance")}</h2></div><span class="ambulance-status ambulance-status-${escape(request.status)}">${escape(String(request.status || "requested").replaceAll("_", " "))}</span></div><div class="ambulance-history-details"><div><span>Patient</span><strong>${escape(request.patient_name)}</strong></div><div><span>Phone</span><strong>${escape(request.patient_phone)}</strong></div><div><span>Emergency</span><strong>${escape(request.emergency_type)}</strong></div><div><span>Pickup</span><strong>${escape(request.pickup_location)}</strong></div><div><span>Destination</span><strong>${escape(request.destination_hospital)}</strong></div><div><span>Distance</span><strong>${formatNumber(distance)} km</strong></div><div><span>${completed ? "Final fare" : "Estimated fare"}</span><strong>${formatMoney(fare)}</strong></div><div><span>Base / rate</span><strong>${formatMoney(request.base_fare)} + ${formatMoney(request.per_km_rate)}/km</strong></div><div><span>Provider location</span><strong>${escape(request.provider_location || "Not available yet")}</strong></div><div><span>Estimated arrival</span><strong>${escape(formatDate(request.estimated_arrival_at))}</strong></div><div><span>Pickup coordinates</span><strong>${formatNumber(request.pickup_latitude)}, ${formatNumber(request.pickup_longitude)}</strong></div><div><span>Destination coordinates</span><strong>${formatNumber(request.destination_latitude)}, ${formatNumber(request.destination_longitude)}</strong></div><div><span>Requested</span><strong>${escape(formatDate(request.requested_at))}</strong></div><div><span>Accepted</span><strong>${escape(formatDate(request.accepted_at))}</strong></div><div><span>Picked up</span><strong>${escape(formatDate(request.pickup_at))}</strong></div><div><span>Completed</span><strong>${escape(formatDate(request.completed_at))}</strong></div><div class="ambulance-history-notes"><span>Additional information</span><strong>${escape(request.notes || "Not provided")}</strong></div></div></article>`;
    }).join("");
  }

  if (!providerCard || !providerList) return;

  const { data: ownedAmbulances, error: ownedAmbulanceError } = await supabaseClient.from("ambulances")
    .select("id").eq("provider_user_id", authData.user.id);
  if (ownedAmbulanceError) {
    providerCard.hidden = false;
    providerList.innerHTML = `<p class="profile-message is-error">${escape(ownedAmbulanceError.message || "Unable to load your ambulance.")}</p>`;
    return;
  }
  const ownedAmbulanceIds = (ownedAmbulances || []).map(ambulance => ambulance.id);
  if (!ownedAmbulanceIds.length) return;
  providerCard.hidden = false;

  const loadProviderRequests = async () => {
    const { data: providerRequests, error: providerRequestError } = await supabaseClient.from("ambulance_requests")
      .select("id,ambulance_id,patient_name,patient_phone,emergency_type,pickup_location,destination_hospital,distance_km,estimated_fare,status,requested_at,provider_location,estimated_arrival_at,ambulances(name,type)")
      .in("ambulance_id", ownedAmbulanceIds).order("requested_at", { ascending: false });
    if (providerRequestError) {
      providerList.innerHTML = `<p class="profile-message is-error">${escape(providerRequestError.message || "Unable to load incoming requests.")}</p>`;
      return;
    }
    if (!providerRequests?.length) {
      providerList.innerHTML = '<p class="muted">No incoming ambulance requests.</p>';
      return;
    }
    providerList.innerHTML = `<table class="ambulance-request-table"><thead><tr><th>Ambulance</th><th>Patient</th><th>Trip</th><th>Fare</th><th>Status / Action</th></tr></thead><tbody>${providerRequests.map(request => `<tr><td><strong>${escape(request.ambulances?.name || "Ambulance")}</strong><small>${escape(request.ambulances?.type || "")}</small></td><td><strong>${escape(request.patient_name)}</strong><small>${escape(request.patient_phone)} · ${escape(request.emergency_type)}</small></td><td><small>${escape(request.pickup_location)} → ${escape(request.destination_hospital)}</small><br>${Number(request.distance_km || 0).toFixed(1)} km</td><td>৳${Number(request.estimated_fare || 0).toFixed(2).replace(/\.00$/, "")}</td><td><span class="ambulance-status ambulance-status-${escape(request.status)}">${escape(String(request.status || "requested").replaceAll("_", " "))}</span><div class="ambulance-provider-actions">${request.status === "requested" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="accepted">Accept</button><button class="btn btn-outline provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="rejected">Reject</button>` : request.status === "accepted" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="on_the_way">On the way</button>` : request.status === "on_the_way" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="picked_up">Picked up</button>` : request.status === "picked_up" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="arrived">Arrived</button>` : request.status === "arrived" ? `<button class="btn btn-primary provider-ambulance-status" type="button" data-request-id="${escape(request.id)}" data-status="completed">Complete</button>` : ""}</div></td></tr>`).join("")}</tbody></table>`;
    providerList.querySelectorAll(".provider-ambulance-status").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true;
      const { error } = await supabaseClient.rpc("update_ambulance_request_status", { p_request_id: button.dataset.requestId, p_status: button.dataset.status });
      if (error) {
        button.disabled = false;
        if (typeof toast === "function") toast(error.message || "Unable to update ambulance request.", "error");
        return;
      }
      await loadProviderRequests();
    }));
  };

  await loadProviderRequests();
  supabaseClient.channel(`ambulance-provider-${authData.user.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "ambulance_requests" }, payload => {
      if (payload.new?.ambulance_id && ownedAmbulanceIds.includes(payload.new.ambulance_id)) {
        if (payload.eventType === "INSERT" && typeof toast === "function") toast("New ambulance request received.", "success");
        loadProviderRequests();
      }
    })
    .subscribe();
});
