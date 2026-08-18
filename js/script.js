
const API_BASE =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000/api"
    : "https://lifelink-p8se.onrender.com/api";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-menu-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(".navbar")?.classList.toggle("open");
    });
  });

  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link, .side-link").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });

  document.querySelectorAll(".reveal").forEach(el => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting){e.target.classList.add("show");io.unobserve(e.target);} });
    }, {threshold:.12});
    io.observe(el);
  });

  initPrediction();
  initLogin();
  initSignup();
  renderHistory();
});

function toast(message){
  let t=document.querySelector(".toast");
  if(!t){t=document.createElement("div");t.className="toast";document.body.appendChild(t);}
  t.textContent=message;t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2600);
}

async function initPrediction(){
  const list=document.getElementById("symptom-list");
  if(!list) return;

  try{
    const res=await fetch(`${API_BASE}/symptoms`);
    const data=await res.json();
    const items=data.symptoms||[];
    list.innerHTML=items.map((s,i)=>`
      <label class="symptom-chip">
        <input type="checkbox" value="${escapeAttr(s)}">
        <span>${pretty(s)}</span>
      </label>`).join("");
  }catch(e){
   list.innerHTML="<div class='notice'>Unable to load symptoms. Please try again later.</div>";
    return;
  }

  const search=document.getElementById("symptom-search");
  search?.addEventListener("input",()=>{
    const q=search.value.toLowerCase();
    list.querySelectorAll(".symptom-chip").forEach(x=>{
      x.style.display=x.textContent.toLowerCase().includes(q)?"flex":"none";
    });
  });

  const predictBtn=document.getElementById("predict-btn");
  predictBtn?.addEventListener("click", predictDisease);
}

async function predictDisease(){
  const selected=[...document.querySelectorAll("#symptom-list input:checked")].map(x=>x.value);
  const model=document.getElementById("model-select")?.value || "RandomForest";
  const loader=document.getElementById("prediction-loader");
  const result=document.getElementById("prediction-result");

  if(!selected.length){toast("Please select at least one symptom.");return;}

  loader?.classList.add("active");
  result?.classList.remove("visible");

  try{
    const res=await fetch(`${API_BASE}/predict`,{
      method:"POST",
      headers:{"Content-Type":"application/json","accept":"application/json"},
      body:JSON.stringify({symptoms:selected,model})
    });
    const data=await res.json();
    if(!data.success) throw new Error(data.message||data.error||"Prediction failed");

    document.getElementById("disease-name").textContent=data.disease;
    document.getElementById("model-name").textContent=data.model || model;
    document.getElementById("accuracy").textContent=data.accuracy!=null ? `${(data.accuracy*100).toFixed(2)}%` : "N/A";
    document.getElementById("description").textContent=data.description||"No description available.";
    renderList("precautions",data.precautions);
    renderList("medications",data.medications);
    renderList("diet",data.diet);
    renderList("workout",data.workout);
    document.getElementById("result-symptoms").textContent=selected.map(pretty).join(", ");
    result?.classList.add("visible");
    saveHistory(data,selected);
    result?.scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){
    toast(e.message);
  }finally{
    loader?.classList.remove("active");
  }
}

function renderList(id,items){
  const el=document.getElementById(id);
  if(!el)return;
  el.innerHTML=(items||[]).flatMap(item=>{
    let v=String(item).trim();
    if(v.startsWith("[")&&v.endsWith("]")){
      try{const parsed=JSON.parse(v.replaceAll("'",'"')); if(Array.isArray(parsed))return parsed.map(x=>`<li>${escapeHtml(x)}</li>`)}catch(_){}
    }
    return `<li>${escapeHtml(v)}</li>`;
  }).join("") || "<li>No information available.</li>";
}

function saveHistory(data,symptoms){
  const h=JSON.parse(localStorage.getItem("lifelink_history")||"[]");
  h.unshift({disease:data.disease,model:data.model,accuracy:data.accuracy,symptoms,date:new Date().toLocaleString()});
  localStorage.setItem("lifelink_history",JSON.stringify(h.slice(0,20)));
}

function renderHistory(){
  const box=document.getElementById("history-list");
  if(!box)return;
  const h=JSON.parse(localStorage.getItem("lifelink_history")||"[]");
  if(!h.length){box.innerHTML="<div class='card'><p class='muted'>No prediction history yet.</p></div>";return;}
  box.innerHTML=h.map(x=>`<div class="card"><div class="result-title"><div><span class="badge">AI Prediction</span><h3 style="margin-top:8px">${escapeHtml(x.disease)}</h3></div><span class="muted">${escapeHtml(x.date)}</span></div><p class="muted">${escapeHtml(x.symptoms.map(pretty).join(", "))}</p><div class="card-actions"><span class="badge">Model: ${escapeHtml(x.model||"RandomForest")}</span><span class="badge">Accuracy: ${x.accuracy!=null?(x.accuracy*100).toFixed(2)+"%":"N/A"}</span></div></div>`).join("");
}

function initLogin(){
  const form=document.getElementById("login-form"); if(!form)return;
  form.addEventListener("submit",e=>{e.preventDefault();localStorage.setItem("lifelink_user",document.getElementById("login-email").value);location.href="dashboard.html";});
}
function initSignup(){
  const form=document.getElementById("signup-form"); if(!form)return;
  form.addEventListener("submit",e=>{e.preventDefault();localStorage.setItem("lifelink_user",document.getElementById("signup-email").value);location.href="login.html";});
}
function pretty(s){return String(s).replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase())}
function escapeAttr(s){return String(s).replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}
function escapeHtml(s){return escapeAttr(s)}

document.addEventListener("DOMContentLoaded",()=>{
  const stat=document.getElementById("stat-checks");
  if(stat){stat.textContent=JSON.parse(localStorage.getItem("lifelink_history")||"[]").length;}
});
