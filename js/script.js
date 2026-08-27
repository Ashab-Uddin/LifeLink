const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "https://lifelink-p8se.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  initMobileBottomNav();
  initProfileMobileMenu();
  initMobileNotificationIcon();

  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.inputMode = "numeric";
    input.pattern = "[0-9]{11}";
    input.maxLength = 11;
    input.minLength = 11;
    input.title = "Enter an 11-digit phone number";
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 11);
    });
  });

  document.querySelectorAll("[data-menu-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const navbar = document.querySelector(".navbar");
      const isOpen = navbar?.classList.toggle("open") ?? false;
      navbar?.classList.toggle("utilities-open", isOpen);
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  });

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link, .side-link").forEach((a) => {
    const linkPath =
      new URL(a.href, location.origin).pathname.split("/").pop() ||
      "index.html";
    if (linkPath === path) a.classList.add("active");
  });

  document.querySelectorAll("[data-service]").forEach((a) => {
    if (a.dataset.service === path) a.classList.add("is-current");
  });

  document.querySelectorAll(".reveal").forEach((el) => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("show");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(el);
  });

  initPrediction();
  renderHistory();
});

async function initMobileNotificationIcon() {
  const actions = document.querySelector(".navbar-actions");
  if (!actions || actions.querySelector(".mobile-notification-button")) return;
  const button = document.createElement("button");
  button.className = "mobile-notification-button";
  button.type = "button";
  button.setAttribute("aria-label", "Notifications");
  button.title = "Notifications";
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span class="mobile-notification-count" hidden></span>';
  button.addEventListener("click", async (e) => {
    e.preventDefault();
    const countElement = button.querySelector(".mobile-notification-count");
    if (countElement) countElement.hidden = true;
    button.setAttribute("aria-label", "Notifications");
    if (typeof supabaseClient !== "undefined") {
      const { data: { user } = {} } = await supabaseClient.auth.getUser();
      if (user) {
        await supabaseClient.from("blood_request_notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("recipient_user_id", user.id).is("read_at", null);
      }
    }
    const isProfilePage = location.pathname.endsWith("profile.html");
    if (isProfilePage) {
      if (location.hash !== "#profile-donations") {
        location.hash = "#profile-donations";
      }
      if (typeof window.showProfileView === "function") {
        window.showProfileView("donations");
      }
    } else {
      window.location.href = "/index/profile.html#profile-donations";
    }
  });
  actions.prepend(button);
  if (typeof supabaseClient === "undefined") return;
  const { data: { user } = {} } = await supabaseClient.auth.getUser();
  if (!user) return;
  const { count } = await supabaseClient.from("blood_request_notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", user.id).is("read_at", null);
  const countElement = button.querySelector(".mobile-notification-count");
  if (!countElement) return;
  const showCount = value => {
    countElement.textContent = value > 9 ? "9+" : String(value);
    countElement.hidden = value === 0;
    button.setAttribute("aria-label", value ? `${value} unread notifications` : "Notifications");
  };
  showCount(count || 0);
  if (!user) return;
  supabaseClient.channel(`mobile-notifications-${user.id}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "blood_request_notifications", filter: `recipient_user_id=eq.${user.id}` }, () => {
      const currentCount = countElement.hidden ? 0 : (countElement.textContent === "9+" ? 9 : Number(countElement.textContent) || 0);
      showCount(currentCount + 1);
    })
    .subscribe();
}

function initProfileMobileMenu() {
  const supportedPages = ["profile.html"];
  const currentPage = location.pathname.split("/").pop() || "index.html";
  if (!supportedPages.includes(currentPage) || document.querySelector("#profile-nav-toggle")) return;
  const container = document.querySelector("main .container");
  if (!container) return;
  document.body.classList.add("has-global-profile-menu");

  const items = [
    { label: "Overview", href: "/index/profile.html#profile-overview", icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><rect x='4' y='4' width='6' height='6' rx='1'/><rect x='14' y='4' width='6' height='6' rx='1'/><rect x='4' y='14' width='6' height='6' rx='1'/><rect x='14' y='14' width='6' height='6' rx='1'/></svg>" },
    { label: "Donations", href: "/index/profile.html#profile-donations", icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'/></svg>" },
    { label: "Ambulance", href: "/index/profile.html#profile-ambulance", icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M3 16V7a2 2 0 0 1 2-2h9v11H3Zm11 0h3l3 2v2h-3M5 20h1m8 0h1'/><circle cx='7' cy='20' r='2'/><circle cx='17' cy='20' r='2'/><path d='M14 9h3l2 3h-5z'/></svg>" },
    { label: "Health History", href: "/index/profile.html#profile-history", icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 12h3l2-5 4 10 2-5h5'/></svg>" },
    { label: "Logout", logout: true, icon: "<svg viewBox='0 0 24 24' aria-hidden='true'><path d='M10 5H5v14h5M14 8l4 4-4 4m4-4H9'/></svg>" }
  ];
  const toggle = document.createElement("button");
  toggle.id = "profile-nav-toggle";
  toggle.className = "profile-nav-toggle mobile-profile-nav-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "mobile-profile-section-nav");
  toggle.setAttribute("aria-label", "Open profile menu");
  toggle.title = "Open profile menu";
  toggle.innerHTML = "<span></span><span></span><span></span>";

  const nav = document.createElement("aside");
  nav.id = "mobile-profile-section-nav";
  nav.className = "profile-section-nav mobile-profile-section-nav";
  nav.setAttribute("aria-label", "Profile sections");
  const activeItem = currentPage === "ambulance-requests.html" ? "Ambulance" : currentPage === "history.html" ? "Health History" : location.hash === "#profile-donations" ? "Donations" : "Overview";
  nav.innerHTML = items.map(item => item.logout
    ? `<button class="profile-section-nav-link profile-sidebar-logout" type="button"><span aria-hidden="true">${item.icon}</span>${item.label}</button>`
    : `<a class="profile-section-nav-link${item.label === activeItem ? " is-active" : ""}" href="${item.href}"${item.label === activeItem ? ' aria-current="page"' : ""}><span aria-hidden="true">${item.icon}</span>${item.label}</a>`).join("");
  container.prepend(nav);
  container.prepend(toggle);

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close profile menu" : "Open profile menu");
    toggle.title = isOpen ? "Close profile menu" : "Open profile menu";
  });
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open profile menu");
  }));
  nav.querySelector(".profile-sidebar-logout")?.addEventListener("click", async () => {
    if (typeof supabaseClient !== "undefined") await supabaseClient.auth.signOut();
    window.location.href = "/index/login.html";
  });
}

function initMobileBottomNav() {
  if (document.querySelector(".mobile-bottom-nav")) return;
  const items = [
    { label: "Home", shortLabel: "Home", href: "/index/index.html", icon: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>' },
    { label: "AI Prediction", shortLabel: "AI", href: "/index/prediction.html", icon: '<path d="M12 3v4m0 10v4M3 12h4m10 0h4M5.6 5.6l2.8 2.8m6.2 6.2 2.8 2.8m0-11.8-2.8 2.8m-6.2 6.2-2.8 2.8"/><circle cx="12" cy="12" r="3"/>' },
    { label: "Doctors", shortLabel: "Doctors", href: "/index/doctor.html", icon: '<path d="M8 5a4 4 0 0 1 8 0v3a4 4 0 0 1-8 0zM5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M12 13v4m-2-2h4"/>' },
    { label: "Blood Donor", shortLabel: "Donor", href: "/index/blood.html", icon: '<path d="M12 21s7-4.6 7-11a7 7 0 0 0-14 0c0 6.4 7 11 7 11z"/>' },
    { label: "My Profile", shortLabel: "Profile", href: "/index/profile.html", icon: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>' },
    { label: "Ambulance", shortLabel: "Ambulance", href: "/index/ambulance.html", danger: true, icon: '<path d="M3 16V7a2 2 0 0 1 2-2h9v11H3zm11 0h3l3 2v2h-3m-14 0h2m8 0h2"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/><path d="M14 9h3l2 3h-5z"/>' }
  ];
  const currentPath = location.pathname.split("/").pop() || "index.html";
  const nav = document.createElement("nav");
  nav.className = "mobile-bottom-nav";
  nav.setAttribute("aria-label", "Mobile navigation");
  nav.innerHTML = items.map(item => {
    const active = item.href.endsWith(currentPath);
    return `<a class="mobile-bottom-nav-item${active ? " is-active" : ""}${item.danger ? " is-danger" : ""}" href="${item.href}"${active ? ' aria-current="page"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg><span>${item.shortLabel}</span><span class="sr-only">${item.label}</span></a>`;
  }).join("");
  document.body.appendChild(nav);
}

function toast(message, type = "") {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.classList.toggle("toast-success", type === "success");
  t.classList.toggle("toast-error", type === "error");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2600);
}

function renderAmbulanceTimeline(request, escape = value => String(value ?? "")) {
  const steps = [
    { status: "requested", label: "Requested", time: request.requested_at },
    { status: "accepted", label: "Accepted", time: request.accepted_at },
    { status: "on_the_way", label: "On the way" },
    { status: "picked_up", label: "Picked up", time: request.pickup_at },
    { status: "arrived", label: "Arrived" },
    { status: "completed", label: "Completed", time: request.completed_at }
  ];
  const terminal = ["rejected", "cancelled"].includes(request.status);
  const currentIndex = steps.findIndex(step => step.status === request.status);
  const activeIndex = currentIndex < 0 ? (terminal ? 0 : 0) : currentIndex;
  const formatTime = value => value ? new Date(value).toLocaleString() : "";
  const items = steps.map((step, index) => {
    const state = terminal ? (index === 0 ? "is-complete" : "is-upcoming") : index < activeIndex ? "is-complete" : index === activeIndex ? "is-current" : "is-upcoming";
    const time = step.time ? `<small>${escape(formatTime(step.time))}</small>` : "";
    return `<li class="ambulance-timeline-step ${state}"><span class="ambulance-timeline-marker" aria-hidden="true"></span><span class="ambulance-timeline-label">${escape(step.label)}${time}</span></li>`;
  }).join("");
  const terminalLabel = terminal ? `<span class="ambulance-timeline-terminal is-error">${escape(String(request.status).replaceAll("_", " "))}</span>` : "";
  return `<div class="ambulance-timeline" aria-label="Ambulance request timeline"><ol>${items}</ol>${terminalLabel}</div>`;
}

function uiText(message) {
  return typeof lifeLinkText === "function" ? lifeLinkText(message) : message;
}

function symptomLabel(symptom) {
  return typeof lifeLinkSymptomLabel === "function"
    ? lifeLinkSymptomLabel(symptom)
    : pretty(symptom);
}

function healthText(value) {
  return typeof lifeLinkHealthText === "function"
    ? lifeLinkHealthText(value)
    : String(value);
}

async function initPrediction() {
  const list = document.getElementById("symptom-list");
  if (!list) return;

  try {
    const res = await fetch(`${API_BASE}/symptoms`);
    const data = await res.json();
    const items = data.symptoms || [];
    list.innerHTML = items
      .map(
        (s, i) => `
      <label class="symptom-chip">
        <input type="checkbox" value="${escapeAttr(s)}">
        <span>${escapeHtml(symptomLabel(s))}</span>
      </label>`,
      )
      .join("");
  } catch (e) {
    list.innerHTML =
      "<div class='notice'>Unable to load symptoms. Please try again later.</div>";
    return;
  }

  const search = document.getElementById("symptom-search");
  search?.addEventListener("input", () => {
    const q = search.value.toLowerCase();
    list.querySelectorAll(".symptom-chip").forEach((x) => {
      x.style.display = x.textContent.toLowerCase().includes(q)
        ? "flex"
        : "none";
    });
  });

  const predictBtn = document.getElementById("predict-btn");
  predictBtn?.addEventListener("click", predictDisease);

  const clearSymptomsBtn = document.getElementById("clear-symptoms-btn");
  clearSymptomsBtn?.addEventListener("click", () => {
    list.querySelectorAll("input[type=checkbox]:checked").forEach((input) => {
      input.checked = false;
    });
    if (search) search.value = "";
    list.querySelectorAll(".symptom-chip").forEach((chip) => {
      chip.style.display = "flex";
    });
    document.getElementById("prediction-result")?.classList.remove("visible");
    document.getElementById("prediction-loader")?.classList.remove("active");
    toast(uiText("Symptom selection cleared."));
  });
}

async function predictDisease() {
  const selected = [
    ...document.querySelectorAll("#symptom-list input:checked"),
  ].map((x) => x.value);
  const model =
    document.getElementById("model-select")?.value || "RandomForest";
  const loader = document.getElementById("prediction-loader");
  const result = document.getElementById("prediction-result");

  if (!selected.length) {
    toast(uiText("Please select at least one symptom."));
    return;
  }

  loader?.classList.add("active");
  result?.classList.remove("visible");

  try {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ symptoms: selected, model }),
    });
    const data = await res.json();
    if (!data.success)
      throw new Error(data.message || data.error || "Prediction failed");

    document.getElementById("disease-name").textContent = healthText(
      data.disease,
    );
    document.getElementById("model-name").textContent = data.model || model;
    document.getElementById("accuracy").textContent =
      data.accuracy != null ? `${(data.accuracy * 100).toFixed(2)}%` : "N/A";
    document.getElementById("description").textContent = healthText(
      data.description || "No description available.",
    );
    renderList("precautions", data.precautions);
    renderList("medications", data.medications);
    renderList("diet", data.diet);
    renderList("workout", data.workout);
    document.getElementById("result-symptoms").textContent = selected
      .map(symptomLabel)
      .join(", ");
    const doctorLink = document.getElementById("doctor-link");
    if (doctorLink)
      doctorLink.href = `/index/doctor.html?disease=${encodeURIComponent(data.disease)}`;
    const findDoctorBtn = document.querySelector('a[href="/index/doctor.html"]');
    if (findDoctorBtn)
      findDoctorBtn.href = `/index/doctor.html?disease=${encodeURIComponent(data.disease)}`;

    result?.classList.add("visible");
    saveHistory(data, selected);
    requestAnimationFrame(() => {
      result?.scrollIntoView({ behavior: "smooth", block: "start" });
      result?.focus({ preventScroll: true });
    });
  } catch (e) {
    toast(uiText(e.message));
  } finally {
    loader?.classList.remove("active");
  }
}

function renderList(id, items) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML =
    (items || [])
      .flatMap((item) => {
        const value = String(item).trim();
        if (value.startsWith("[") && value.endsWith("]")) {
          try {
            const parsed = JSON.parse(value.replaceAll("'", '"'));
            if (Array.isArray(parsed))
              return parsed.map(
                (itemValue) => `<li>${escapeHtml(healthText(itemValue))}</li>`,
              );
          } catch (_) {}
        }
        return `<li>${escapeHtml(healthText(value))}</li>`;
      })
      .join("") || "<li>No information available.</li>";
}

async function getSignedInUser() {
  if (typeof supabaseClient === "undefined") return null;
  try {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    return user || null;
  } catch (_) {
    return null;
  }
}

async function saveHistory(data, symptoms) {
  const user = await getSignedInUser();
  const historyItem = {
    disease: data.disease,
    model: data.model,
    accuracy: data.accuracy,
    symptoms,
  };

  if (user) {
    const { error } = await supabaseClient.from("prediction_history").insert({
      user_id: user.id,
      disease: historyItem.disease,
      model: historyItem.model || "RandomForest",
      accuracy: historyItem.accuracy,
      symptoms: historyItem.symptoms,
    });
    if (error) {
      console.error("Database history save error:", error);
      toast(uiText("Prediction completed, but history could not be saved."));
    }
    return;
  }

  const h = JSON.parse(localStorage.getItem("lifelink_history") || "[]");
  h.unshift({ ...historyItem, date: new Date().toLocaleString() });
  localStorage.setItem("lifelink_history", JSON.stringify(h.slice(0, 20)));
}

async function renderHistory() {
  const box = document.getElementById("history-list");
  if (!box) return;
  const user = await getSignedInUser();
  let h = [];

  if (user) {
    const { data, error } = await supabaseClient
      .from("prediction_history")
      .select("id,disease,model,accuracy,symptoms,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("Database history load error:", error);
      box.innerHTML = `<div class="notice history-error"><strong>${uiText("Unable to load your prediction history.")}</strong><span>${escapeHtml(error.message || uiText("Database request failed."))}</span><small>${uiText("Run SUPABASE_HISTORY_SETUP.sql in Supabase SQL Editor, then refresh this page.")}</small></div>`;
      return;
    }
    h = data || [];
  } else {
    h = JSON.parse(localStorage.getItem("lifelink_history") || "[]");
  }

  if (!h.length) {
    box.innerHTML = `<div class="card"><p class="muted">${uiText("No prediction history yet.")}</p></div>`;
    return;
  }
  box.innerHTML = h
    .map(
      (x) =>
        `<div class="card"><div class="result-title"><div><span class="badge">AI Prediction</span><h3 style="margin-top:8px">${escapeHtml(healthText(x.disease))}</h3></div><span class="muted">${escapeHtml(x.date || new Date(x.created_at).toLocaleString())}</span></div><p class="muted">${escapeHtml((Array.isArray(x.symptoms) ? x.symptoms : []).map(symptomLabel).join(", "))}</p><div class="card-actions"><span class="badge">Model: ${escapeHtml(x.model || "RandomForest")}</span><span class="badge">Accuracy: ${x.accuracy != null ? (x.accuracy * 100).toFixed(2) + "%" : "N/A"}</span></div></div>`,
    )
    .join("");
}

function pretty(s) {
  return String(s)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function escapeAttr(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
function escapeHtml(s) {
  return escapeAttr(s);
}

document.addEventListener("DOMContentLoaded", () => {
  const stat = document.getElementById("stat-checks");
  if (!stat) return;
  getSignedInUser()
    .then(async (user) => {
      if (!user) {
        stat.textContent = JSON.parse(
          localStorage.getItem("lifelink_history") || "[]",
        ).length;
        return;
      }
      const { count, error } = await supabaseClient
        .from("prediction_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (!error) stat.textContent = count || 0;
    })
    .catch(() => {});
});
