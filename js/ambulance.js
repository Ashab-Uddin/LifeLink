document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("ambulance-list");
  const requestList = document.getElementById("ambulance-request-list");
  const modal = document.getElementById("ambulance-request-modal");
  const form = document.getElementById("ambulance-request-form");
  const closeButton = document.getElementById("ambulance-modal-close");
  const useLocationButton = document.getElementById("ambulance-use-location");
  const formMessage = document.getElementById("ambulance-form-message");
  const locationMessage = document.getElementById("ambulance-location-message");
  const registrationModal = document.getElementById("ambulance-registration-modal");
  const registrationForm = document.getElementById("ambulance-registration-form");
  const registrationMessage = document.getElementById("ambulance-registration-message");
  const registrationLocationMessage = document.getElementById("registration-location-message");
  const bookingDestination = document.getElementById("booking-destination");
  const bookingOtherField = document.getElementById("booking-other-destination-field");
  const bookingMessage = document.getElementById("booking-destination-message");
  const bookingPickupSearch = document.getElementById("booking-pickup-search");
  const bookingUseDefaultLocationBtn = document.getElementById("booking-use-default-location");
  const bookingChangePickupBtn = document.getElementById("booking-change-pickup");
  const bookingLocationMessage = document.getElementById("booking-location-message");
  const ambulanceUseDefaultLocationBtn = document.getElementById("ambulance-use-default-location");
  const ambulanceDefaultLocationMessage = document.getElementById("ambulance-default-location-message");
  const ambulancePickupLocation = document.getElementById("ambulance-pickup-location");
  const ambulancePickupCoordinates = document.getElementById("ambulance-pickup-coordinates");
  if (!list || typeof supabaseClient === "undefined") return;

  let currentUser = null;
  let selectedAmbulance = null;
  let ambulances = [];
  let currentLocation = null;
  let defaultLocation = null;
  let selectedDestination = null;
  let selectedPickup = null;
  let locationSearchSequence = 0;
  const nearbyAmbulanceRadiusKm = 50;
  const hospitalSuggestions = [
    { display_name: "Cox's Bazar District Hospital, Cox's Bazar, Bangladesh", lat: 21.4390, lon: 92.0090 },
    { display_name: "Cox's Bazar Sadar Hospital, Cox's Bazar, Bangladesh", lat: 21.4382, lon: 92.0081 },
    { display_name: "Cox's Bazar Medical College Hospital, Cox's Bazar, Bangladesh", lat: 21.4225, lon: 92.0390 }
  ];
  const value = id => document.getElementById(id)?.value.trim() || "";
  const escapeValue = valueToEscape => String(valueToEscape ?? "").replace(/[&<>\"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character]));
  const money = valueToFormat => `৳${Number(valueToFormat || 0).toFixed(2).replace(/\.00$/, "")}`;
  const formatDate = valueToFormat => valueToFormat ? new Date(valueToFormat).toLocaleString() : "-";

  function registrationValue(id) {
    return document.getElementById(id)?.value.trim() || "";
  }

  function validPhone(phone) {
    return /^[0-9]{11}$/.test(phone);
  }

  function distanceInKm(latitudeOne, longitudeOne, latitudeTwo, longitudeTwo) {
    const earthRadius = 6371;
    const latitudeDelta = (latitudeTwo - latitudeOne) * Math.PI / 180;
    const longitudeDelta = (longitudeTwo - longitudeOne) * Math.PI / 180;
    const latitudeOneRadians = latitudeOne * Math.PI / 180;
    const latitudeTwoRadians = latitudeTwo * Math.PI / 180;
    const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(latitudeOneRadians) * Math.cos(latitudeTwoRadians) * Math.sin(longitudeDelta / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  function updateFarePreview() {
    if (!selectedAmbulance) return;
    const pickupLatitude = Number(value("ambulance-pickup-lat"));
    const pickupLongitude = Number(value("ambulance-pickup-lng"));
    const destinationLatitude = Number(value("ambulance-destination-lat"));
    const destinationLongitude = Number(value("ambulance-destination-lng"));
    const validCoordinates = [pickupLatitude, pickupLongitude, destinationLatitude, destinationLongitude].every(Number.isFinite);
    const distance = validCoordinates ? distanceInKm(pickupLatitude, pickupLongitude, destinationLatitude, destinationLongitude) : null;
    document.getElementById("ambulance-distance").textContent = distance === null ? "-- km" : `${distance.toFixed(1)} km`;
    document.getElementById("ambulance-estimated-fare").textContent = distance === null ? "৳---" : money(selectedAmbulance.base_fare + distance * selectedAmbulance.per_km_rate);
  }

  function updateDestinationCoordinates() {
    const destinationSelect = document.getElementById("ambulance-destination");
    const selectedOption = destinationSelect.options[destinationSelect.selectedIndex];
    const otherDestination = document.getElementById("ambulance-other-destination-field");
    const isOther = destinationSelect.value === "Other";
    otherDestination.hidden = !isOther;
    document.getElementById("ambulance-destination-lat").value = selectedOption?.dataset.lat || "";
    document.getElementById("ambulance-destination-lng").value = selectedOption?.dataset.lng || "";
    updateFarePreview();
  }

  function updateBookingDestination(name, latitude, longitude) {
    bookingOtherField.hidden = true;
    selectedDestination = name && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
      ? { name, latitude: Number(latitude), longitude: Number(longitude) }
      : null;
    if (selectedDestination) {
      bookingDestination.value = selectedDestination.name;
      document.getElementById("ambulance-destination").value = selectedDestination.name;
      document.getElementById("ambulance-destination-lat").value = selectedDestination.latitude;
      document.getElementById("ambulance-destination-lng").value = selectedDestination.longitude;
      bookingMessage.textContent = "Available ambulances near your pickup location:";
    } else {
      bookingMessage.textContent = "Choose a destination suggestion to find available ambulances.";
    }
    if (selectedDestination && currentLocation) ambulances.sort((first, second) => (distanceFromCurrentLocation(first) ?? Number.MAX_VALUE) - (distanceFromCurrentLocation(second) ?? Number.MAX_VALUE));
    renderAmbulances();
  }

  function destinationName() {
    return value("ambulance-destination");
  }

  async function searchLocations(query, container, onSelect) {
    const searchSequence = ++locationSearchSequence;
    if (query.trim().length < 3) {
      if (container === bookingDestinationSuggestions) {
        const matches = hospitalSuggestions.filter(result => result.display_name.toLowerCase().includes(query.trim().toLowerCase()));
        container.innerHTML = matches.map((result, index) => `<button type="button" data-location-index="${index}">${escapeValue(result.display_name)}</button>`).join("");
        container.hidden = matches.length === 0;
        container.querySelectorAll("[data-location-index]").forEach(button => button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          locationSearchSequence += 1;
          onSelect(matches[Number(button.dataset.locationIndex)]);
          container.hidden = true;
        }));
        return;
      }
      container.hidden = true;
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&accept-language=en&q=${encodeURIComponent(query.trim())}`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Location search failed.");
      const remoteResults = await response.json();
      if (searchSequence !== locationSearchSequence) return;
      const normalizedQuery = query.trim().toLowerCase();
      const localResults = container === bookingDestinationSuggestions
        ? hospitalSuggestions.filter(result => result.display_name.toLowerCase().includes(normalizedQuery))
        : [];
      const results = [...localResults, ...remoteResults.filter(result => !localResults.some(local => Number(local.lat) === Number(result.lat) && Number(local.lon) === Number(result.lon)))].sort((first, second) => {
        const firstIsHospital = /hospital|medical college|clinic/i.test(`${first.display_name} ${first.type || ""} ${first.category || ""}`);
        const secondIsHospital = /hospital|medical college|clinic/i.test(`${second.display_name} ${second.type || ""} ${second.category || ""}`);
        return Number(secondIsHospital) - Number(firstIsHospital);
      }).slice(0, 8);
      container.innerHTML = results.length ? results.map((result, index) => `<button type="button" data-location-index="${index}">${escapeValue(result.display_name)}</button>`).join("") : "<span>No locations found.</span>";
      container.hidden = false;
      container.querySelectorAll("[data-location-index]").forEach(button => button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        locationSearchSequence += 1;
        onSelect(results[Number(button.dataset.locationIndex)]);
        container.hidden = true;
      }));
    } catch (error) {
      container.innerHTML = "<span>Unable to search locations. Enter coordinates manually in the request form.</span>";
      container.hidden = false;
    }
  }

  function distanceFromCurrentLocation(ambulance) {
    if (!currentLocation || !Number.isFinite(Number(ambulance.latitude)) || !Number.isFinite(Number(ambulance.longitude))) return null;
    return distanceInKm(currentLocation.latitude, currentLocation.longitude, Number(ambulance.latitude), Number(ambulance.longitude));
  }

  function openRequest(ambulance) {
    selectedAmbulance = ambulance;
    document.getElementById("ambulance-id").value = ambulance.id;
    document.getElementById("ambulance-modal-title").textContent = `Request ${ambulance.name}`;
    document.getElementById("ambulance-modal-vehicle").textContent = `${ambulance.type} · ${ambulance.location}`;
    document.getElementById("ambulance-base-fare").textContent = money(ambulance.base_fare);
    document.getElementById("ambulance-per-km").textContent = `${money(ambulance.per_km_rate)}/km`;
    if (selectedDestination) {
      document.getElementById("ambulance-destination").value = selectedDestination.name;
      document.getElementById("ambulance-destination-lat").value = selectedDestination.latitude;
      document.getElementById("ambulance-destination-lng").value = selectedDestination.longitude;
    }
    if (selectedPickup) {
      document.getElementById("ambulance-pickup-location").value = selectedPickup.name;
      document.getElementById("ambulance-pickup-lat").value = selectedPickup.latitude;
      document.getElementById("ambulance-pickup-lng").value = selectedPickup.longitude;
    }
    formMessage.textContent = "";
    locationMessage.textContent = "";
    updateFarePreview();
    modal.hidden = false;
    document.getElementById("ambulance-patient-name").focus();
  }

  function renderAmbulances() {
    const nearbyAmbulances = selectedDestination && currentLocation
      ? ambulances.filter(ambulance => {
        const pickupDistance = distanceFromCurrentLocation(ambulance);
        return pickupDistance !== null && pickupDistance <= nearbyAmbulanceRadiusKm;
      })
      : ambulances;
    if (!nearbyAmbulances.length) {
      list.innerHTML = selectedDestination && currentLocation
        ? `<p class="muted">No available ambulance can reach this pickup area within ${nearbyAmbulanceRadiusKm} km. Please choose another pickup location or call 999.</p>`
        : '<p class="muted">No available ambulance is currently registered. Please call 999 for immediate help.</p>';
      return;
    }
    list.innerHTML = nearbyAmbulances.map(ambulance => {
      const isOwnAmbulance = Boolean(currentUser?.id && ambulance.provider_user_id === currentUser.id);
      const stationDistance = distanceFromCurrentLocation(ambulance);
      const distanceLabel = stationDistance === null ? "" : `<span class="ambulance-distance">${stationDistance.toFixed(1)} km away</span>`;
      const tripDistance = currentLocation && selectedDestination ? distanceInKm(currentLocation.latitude, currentLocation.longitude, selectedDestination.latitude, selectedDestination.longitude) : null;
      const tripFare = tripDistance === null ? "Select destination for fare" : `Estimated fare: ${money(ambulance.base_fare + tripDistance * ambulance.per_km_rate)}`;
      return `<article class="card emergency ambulance-card"><div class="person-card"><div class="avatar">&#128656;</div><div><h3>${escapeValue(ambulance.name)}</h3><span class="badge badge-danger">${escapeValue(ambulance.type)}</span><p class="muted">${escapeValue(ambulance.location)} · ${escapeValue(ambulance.phone || "Phone unavailable")}</p>${distanceLabel}</div></div><div class="ambulance-pricing"><span>Base fare: <strong>${money(ambulance.base_fare)}</strong></span><span>Per kilometer: <strong>${money(ambulance.per_km_rate)}</strong></span>${selectedDestination ? `<span>Trip distance: <strong>${tripDistance === null ? "--" : `${tripDistance.toFixed(1)} km`}</strong></span><span>${tripFare}</span>` : "<span>Fare calculated after destination selection</span>"}</div><div class="ambulance-card-actions"><button class="btn btn-danger ambulance-request-button" type="button" data-ambulance-id="${escapeValue(ambulance.id)}"${isOwnAmbulance ? " disabled" : ""}>${isOwnAmbulance ? "Your Ambulance" : "Request Ambulance"}</button>${ambulance.phone ? `<a class="btn btn-outline" href="tel:${escapeValue(ambulance.phone)}">Call</a>` : ""}</div></article>`;
    }).join("");
    list.querySelectorAll(".ambulance-request-button").forEach(button => button.addEventListener("click", () => {
      if (!currentUser) {
        window.location.href = "/index/login.html";
        return;
      }
      if (!selectedDestination) {
        bookingMessage.textContent = "Please select a destination before requesting an ambulance.";
        bookingDestination.focus();
        return;
      }
      const ambulance = nearbyAmbulances.find(item => item.id === button.dataset.ambulanceId);
      if (ambulance) openRequest(ambulance);
    }));
  }

  async function loadRequests() {
    if (!requestList || !currentUser) return;
    const { data, error } = await supabaseClient.from("ambulance_requests").select("id,patient_name,emergency_type,pickup_location,destination_hospital,distance_km,estimated_fare,final_distance_km,final_fare,status,requested_at,completed_at,ambulances(name,type)").eq("user_id", currentUser.id).order("requested_at", { ascending: false });
    if (error || !data?.length) {
      requestList.innerHTML = '<p class="muted">No ambulance requests yet.</p>';
      return;
    }
    requestList.innerHTML = `<table class="ambulance-request-table"><thead><tr><th>Ambulance</th><th>Trip</th><th>Distance / Fare</th><th>Status</th><th>Requested</th></tr></thead><tbody>${data.map(request => `<tr><td><strong>${escapeValue(request.ambulances?.name || "Ambulance")}</strong><small>${escapeValue(request.ambulances?.type || "")}</small></td><td><strong>${escapeValue(request.patient_name)}</strong><small>${escapeValue(request.pickup_location)} → ${escapeValue(request.destination_hospital)}</small></td><td>${request.final_distance_km ? `${Number(request.final_distance_km).toFixed(1)} km · ${money(request.final_fare)}` : `${Number(request.distance_km || 0).toFixed(1)} km · ${money(request.estimated_fare)}`}</td><td><span class="ambulance-status ambulance-status-${escapeValue(request.status)}">${escapeValue(request.status).replaceAll("_", " ")}</span></td><td>${escapeValue(formatDate(request.requested_at))}</td></tr>`).join("")}</tbody></table>`;
  }

  const locationStatus = document.getElementById("ambulance-current-location-status");
  function getCurrentLocation() {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        locationStatus.textContent = "Location access is unavailable. You can enter pickup coordinates manually.";
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(position => {
        currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        defaultLocation = { 
          name: "My Current Location", 
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude 
        };
        
        // Set default in booking section
        bookingPickupSearch.value = "My Current Location";
        bookingPickupSearch.dataset.isEditable = "false";
        ambulancePickupCoordinates.textContent = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
        bookingUseDefaultLocationBtn.hidden = false;
        bookingChangePickupBtn.hidden = true;
        bookingLocationMessage.textContent = "Default location detected: " + position.coords.latitude.toFixed(4) + ", " + position.coords.longitude.toFixed(4);
        
        // Set default in request modal
        ambulancePickupLocation.value = "My Current Location";
        ambulancePickupLocation.dataset.defaultLocation = JSON.stringify(defaultLocation);
        document.getElementById("ambulance-pickup-lat").value = position.coords.latitude.toFixed(6);
        document.getElementById("ambulance-pickup-lng").value = position.coords.longitude.toFixed(6);
        
        locationStatus.textContent = `Current location detected: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        
        selectedPickup = defaultLocation;
        resolve(currentLocation);
      }, () => {
        locationStatus.textContent = "Unable to get your current location. Please enable location access or enter pickup coordinates manually.";
        bookingLocationMessage.textContent = "Location permission denied; enter pickup manually.";
        resolve(null);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    });
  }

  const { data: authData } = await supabaseClient.auth.getUser();
  currentUser = authData?.user || null;
  await getCurrentLocation();
  const { data, error } = await supabaseClient.from("ambulances").select("id,name,type,phone,location,latitude,longitude,provider_user_id,base_fare,per_km_rate").eq("status", "available").order("created_at", { ascending: true });
  if (!error) ambulances = data || [];
  if (selectedDestination) ambulances.sort((first, second) => (distanceFromCurrentLocation(first) ?? Number.MAX_VALUE) - (distanceFromCurrentLocation(second) ?? Number.MAX_VALUE));
  renderAmbulances();
  await loadRequests();

  ["ambulance-pickup-lat", "ambulance-pickup-lng", "ambulance-destination-lat", "ambulance-destination-lng"].forEach(id => document.getElementById(id)?.addEventListener("input", updateFarePreview));
  const bookingDestinationSuggestions = document.getElementById("booking-destination-suggestions");
  const bookingPickupSuggestions = document.getElementById("booking-pickup-suggestions");
  let destinationSearchTimer;
  let pickupSearchTimer;
  bookingDestination?.addEventListener("input", () => {
    selectedDestination = null;
    document.getElementById("ambulance-destination-lat").value = "";
    document.getElementById("ambulance-destination-lng").value = "";
    renderAmbulances();
    clearTimeout(destinationSearchTimer);
    destinationSearchTimer = setTimeout(() => searchLocations(bookingDestination.value, bookingDestinationSuggestions, result => updateBookingDestination(result.display_name, Number(result.lat), Number(result.lon))), 350);
  });
  bookingDestination?.addEventListener("focus", () => {
    if (!bookingDestination.value.trim()) searchLocations("", bookingDestinationSuggestions, result => updateBookingDestination(result.display_name, Number(result.lat), Number(result.lon)));
  });
  document.getElementById("booking-pickup-search")?.addEventListener("input", () => {
    if (bookingPickupSearch.dataset.isEditable === "false") {
      bookingPickupSearch.dataset.isEditable = "true";
      bookingUseDefaultLocationBtn.hidden = true;
      bookingChangePickupBtn.hidden = false;
    }
    selectedPickup = null;
    currentLocation = null;
    ambulancePickupCoordinates.textContent = "Select a pickup suggestion to set coordinates.";
    clearTimeout(pickupSearchTimer);
    pickupSearchTimer = setTimeout(() => searchLocations(value("booking-pickup-search"), bookingPickupSuggestions, result => {
      selectedPickup = { name: result.display_name, latitude: Number(result.lat), longitude: Number(result.lon) };
      currentLocation = selectedPickup;
      ambulancePickupCoordinates.textContent = `${selectedPickup.latitude.toFixed(6)}, ${selectedPickup.longitude.toFixed(6)}`;
      bookingLocationMessage.textContent = "Pickup location updated.";
      bookingPickupSearch.dataset.isEditable = "true";
      bookingUseDefaultLocationBtn.hidden = true;
      bookingChangePickupBtn.hidden = false;
      ambulances.sort((first, second) => (distanceFromCurrentLocation(first) ?? Number.MAX_VALUE) - (distanceFromCurrentLocation(second) ?? Number.MAX_VALUE));
      renderAmbulances();
    }), 350);
  });
  bookingUseDefaultLocationBtn?.addEventListener("click", async () => {
    bookingLocationMessage.textContent = "Setting default location...";
    if (defaultLocation) {
      bookingPickupSearch.value = defaultLocation.name;
      bookingPickupSearch.dataset.isEditable = "false";
      ambulancePickupCoordinates.textContent = `${defaultLocation.latitude.toFixed(6)}, ${defaultLocation.longitude.toFixed(6)}`;
      bookingLocationMessage.textContent = "Default location restored.";
      bookingUseDefaultLocationBtn.hidden = false;
      bookingChangePickupBtn.hidden = true;
      selectedPickup = defaultLocation;
      currentLocation = defaultLocation;
      ambulances.sort((first, second) => (distanceFromCurrentLocation(first) ?? Number.MAX_VALUE) - (distanceFromCurrentLocation(second) ?? Number.MAX_VALUE));
      renderAmbulances();
    } else {
      const location = await getCurrentLocation();
      if (location) {
        bookingLocationMessage.textContent = "Default location detected and set.";
        bookingUseDefaultLocationBtn.hidden = false;
        bookingChangePickupBtn.hidden = true;
        ambulances.sort((first, second) => (distanceFromCurrentLocation(first) ?? Number.MAX_VALUE) - (distanceFromCurrentLocation(second) ?? Number.MAX_VALUE));
        renderAmbulances();
      }
    }
  });

  bookingChangePickupBtn?.addEventListener("click", () => {
    bookingPickupSearch.value = "";
    bookingPickupSearch.focus();
    bookingLocationMessage.textContent = "Enter a new pickup location.";
  });
  closeButton?.addEventListener("click", () => { modal.hidden = true; });
  modal?.addEventListener("click", event => { if (event.target === modal) modal.hidden = true; });
  useLocationButton?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      locationMessage.textContent = "GPS is unavailable. Enter pickup coordinates manually.";
      return;
    }
    locationMessage.textContent = "Finding your location...";
    navigator.geolocation.getCurrentPosition(position => {
      currentLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      document.getElementById("ambulance-pickup-lat").value = position.coords.latitude.toFixed(6);
      document.getElementById("ambulance-pickup-lng").value = position.coords.longitude.toFixed(6);
      ambulancePickupLocation.value = "My Current Location";
      locationMessage.textContent = "Pickup coordinates added.";
      locationStatus.textContent = `Current location detected: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
      ambulances.sort((first, second) => (distanceFromCurrentLocation(first) ?? Number.MAX_VALUE) - (distanceFromCurrentLocation(second) ?? Number.MAX_VALUE));
      renderAmbulances();
      updateFarePreview();
    }, () => { locationMessage.textContent = "Location permission was unavailable. Enter pickup coordinates manually."; });
  });

  ambulanceUseDefaultLocationBtn?.addEventListener("click", () => {
    if (defaultLocation) {
      ambulancePickupLocation.value = defaultLocation.name;
      document.getElementById("ambulance-pickup-lat").value = defaultLocation.latitude.toFixed(6);
      document.getElementById("ambulance-pickup-lng").value = defaultLocation.longitude.toFixed(6);
      ambulanceDefaultLocationMessage.textContent = "Default location restored.";
      updateFarePreview();
    } else {
      ambulanceDefaultLocationMessage.textContent = "Default location not available. Use 'Use my location' button instead.";
    }
  });

  ambulancePickupLocation?.addEventListener("input", () => {
    ambulanceDefaultLocationMessage.textContent = "Click 'Use Default Location' to restore your current location.";
  });
  document.getElementById("open-ambulance-registration")?.addEventListener("click", () => {
    if (!currentUser) {
      window.location.href = "/index/login.html";
      return;
    }
    registrationMessage.textContent = "";
    registrationModal.hidden = false;
    document.getElementById("registration-name").focus();
  });
  document.getElementById("ambulance-registration-close")?.addEventListener("click", () => { registrationModal.hidden = true; });
  registrationModal?.addEventListener("click", event => { if (event.target === registrationModal) registrationModal.hidden = true; });
  document.getElementById("registration-use-location")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      registrationLocationMessage.textContent = "GPS is unavailable. Enter station coordinates manually.";
      return;
    }
    registrationLocationMessage.textContent = "Finding station location...";
    navigator.geolocation.getCurrentPosition(position => {
      document.getElementById("registration-lat").value = position.coords.latitude.toFixed(6);
      document.getElementById("registration-lng").value = position.coords.longitude.toFixed(6);
      registrationLocationMessage.textContent = "Station coordinates added.";
    }, () => { registrationLocationMessage.textContent = "Location permission was unavailable."; });
  });
  registrationForm?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentUser) return;
    registrationMessage.classList.remove("is-error");
    registrationMessage.textContent = "Registering ambulance...";
    if (!validPhone(registrationValue("registration-phone"))) {
      registrationMessage.textContent = "Enter an 11-digit phone number.";
      registrationMessage.classList.add("is-error");
      return;
    }
    const latitude = Number(registrationValue("registration-lat"));
    const longitude = Number(registrationValue("registration-lng"));
    const baseFare = Number(registrationValue("registration-base-fare"));
    const perKmRate = Number(registrationValue("registration-per-km"));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 || !Number.isFinite(baseFare) || baseFare < 0 || !Number.isFinite(perKmRate) || perKmRate < 0) {
      registrationMessage.textContent = "Enter valid station coordinates and pricing.";
      registrationMessage.classList.add("is-error");
      return;
    }
    const { error: registrationError } = await supabaseClient.rpc("register_ambulance", {
      p_name: registrationValue("registration-name"),
      p_type: registrationValue("registration-type"),
      p_phone: registrationValue("registration-phone"),
      p_location: registrationValue("registration-location"),
      p_latitude: latitude,
      p_longitude: longitude,
      p_base_fare: baseFare,
      p_per_km_rate: perKmRate,
      p_hospital: registrationValue("registration-hospital") || null
    });
    if (registrationError) {
      registrationMessage.textContent = registrationError.message || "Unable to register this ambulance.";
      registrationMessage.classList.add("is-error");
      return;
    }
    registrationModal.hidden = true;
    if (typeof toast === "function") toast("Ambulance registered successfully.", "success");
    const { data: refreshedAmbulances } = await supabaseClient.from("ambulances").select("id,name,type,phone,location,latitude,longitude,provider_user_id,base_fare,per_km_rate").eq("status", "available").order("created_at", { ascending: true });
    ambulances = refreshedAmbulances || ambulances;
    ambulances.sort((first, second) => (distanceFromCurrentLocation(first) ?? Number.MAX_VALUE) - (distanceFromCurrentLocation(second) ?? Number.MAX_VALUE));
    renderAmbulances();
  });
  form?.addEventListener("submit", async event => {
    event.preventDefault();
    if (!currentUser || !selectedAmbulance) return;
    formMessage.classList.remove("is-error");
    formMessage.textContent = "Sending ambulance request...";
    if (!validPhone(value("ambulance-patient-phone"))) {
      formMessage.textContent = "Enter an 11-digit phone number.";
      formMessage.classList.add("is-error");
      return;
    }
    const coordinates = ["ambulance-pickup-lat", "ambulance-pickup-lng", "ambulance-destination-lat", "ambulance-destination-lng"].map(id => Number(value(id)));
    if (!destinationName()) {
      formMessage.textContent = "Please select or enter a destination.";
      formMessage.classList.add("is-error");
      return;
    }
    if (coordinates.some(coordinate => !Number.isFinite(coordinate))) {
      formMessage.textContent = "Enter valid pickup and destination coordinates.";
      formMessage.classList.add("is-error");
      return;
    }
    const { error: requestError } = await supabaseClient.rpc("create_ambulance_request", { p_ambulance_id: selectedAmbulance.id, p_patient_name: value("ambulance-patient-name"), p_patient_phone: value("ambulance-patient-phone"), p_emergency_type: value("ambulance-emergency-type"), p_pickup_location: value("ambulance-pickup-location"), p_pickup_latitude: coordinates[0], p_pickup_longitude: coordinates[1], p_destination_hospital: destinationName(), p_destination_latitude: coordinates[2], p_destination_longitude: coordinates[3], p_notes: value("ambulance-notes") || null });
    if (requestError) {
      formMessage.textContent = requestError.message || "Unable to create ambulance request.";
      formMessage.classList.add("is-error");
      return;
    }
    modal.hidden = true;
    if (typeof toast === "function") toast("Ambulance request submitted.", "success");
    await loadRequests();
  });
});
