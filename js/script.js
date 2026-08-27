const API_BASE =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "https://lifelink-p8se.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
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
