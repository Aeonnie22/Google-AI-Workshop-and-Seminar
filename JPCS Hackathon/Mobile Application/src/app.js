/**
 * QuadFlow Core System - Pure ES6 Standalone Client Logic
 * Powered by robust localStorage persistence and direct DOM reactive updates.
 * Implements the multi-suite Student Council workspace.
 */

// Initial Seed Data for offline database
const DEFAULT_TASKS = [
  {
    id: "task-101",
    title: "Produce SEC Liquidation for Freshmen Sports Fest",
    desc: "Verify food service vouchers, standard receipts, and digital logbook. Mandatory submission to SAO Auditor for release of next block funding.",
    division: "Finance & Logistics",
    status: "Progress",
    priority: "High",
    blockers: [],
    assigneeId: "charles-fin",
    due_date: "2026-05-25",
    isReallocated: false,
    originalAssigneeId: null
  },
  {
    id: "task-102",
    title: "Draft Turnover SOP Guidelines v3",
    desc: "Translate tribal knowledge of equipment reservation forms and Dean's approval letter rules into markdown files.",
    division: "Heritage & Admin",
    status: "Progress",
    priority: "High",
    blockers: ["Waiting for old G-Drive credentials from previous PRO"],
    assigneeId: "aly-pres",
    due_date: "2026-05-26",
    isReallocated: false,
    originalAssigneeId: null
  },
  {
    id: "task-103",
    title: "Coordinate with SAO Liaison on Food Vouchers template",
    desc: "Obtain official sample formats for Student Council meal allocations to prevent audit liquidations failures.",
    division: "Finance & Logistics",
    status: "Completed",
    priority: "Normal",
    blockers: [],
    assigneeId: "gab-aud",
    due_date: "2026-05-20",
    isReallocated: false,
    originalAssigneeId: null
  },
  {
    id: "task-104",
    title: "Publish Council Newsletter - Term 3 Launch",
    desc: "Design poster template, retrieve Dean's greetings, draft spotlight articles on budget compliance.",
    division: "Public Relations",
    status: "Progress",
    priority: "Normal",
    blockers: ["Awaiting terminal budget allocation review"],
    assigneeId: "miggy-pro",
    due_date: "2026-05-28",
    isReallocated: false,
    originalAssigneeId: null
  }
];

const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-501",
    title: "Sports Fest Catering Vouchers",
    category: "Meal Allocations",
    amount: 14500,
    type: "Disbursement",
    audited: true,
    auditedBy: "Maria Gabrielle (Auditor)",
    receiptUploaded: true,
    receiptName: "freshmen_catering_rec_2026.png",
    date: "2026-05-18",
    justification: "Catering service for 50 volunteer marshals during the freshman orientation championship."
  },
  {
    id: "tx-502",
    title: "Co-working Space Whiteboards",
    category: "Office Supplies",
    amount: 3250,
    type: "Disbursement",
    audited: false,
    auditedBy: null,
    receiptUploaded: false,
    receiptName: null,
    date: "2026-05-21",
    justification: "Dry-erase whiteboards for student lounge task coordination."
  }
];

const SOP_REPOSITORY = [
  {
    category: "SAO Liquidation Rules",
    title: "School Rule Part IV: General Receipts Validation",
    content: "All liquidations must contain: 1. Official Receipt explicitly matching Student Council Name. 2. Date of transaction not older than 14 days from active event. 3. Handwritten signature of receiving officer at the back of paper vouchers."
  },
  {
    category: "Equipment Booking SOP",
    title: "Section 12: AVR and Multi-Purpose Sports Courts Reservation",
    content: "File requisition form directly to PGSO (Facilities Support Office) at least 5 business days in advance. Requires signature endorsements from Director of Student Affairs."
  },
  {
    category: "Emergency Grant Liquidation",
    title: "Annex B: Spot Disbursements under ₱5,000",
    content: "Emergency petty cash must be backed by a handwritten letter of emergency justification verified by the Treasurer. No software license purchase is allowed via petty cash."
  }
];

const ROLES = [
  {
    id: "aly-pres",
    name: "Alyssa Valdez",
    role: "President",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    committee: "Executive Board"
  },
  {
    id: "charles-fin",
    name: "Charles Cheng",
    role: "Treasurer",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    committee: "Finance Team"
  },
  {
    id: "gab-aud",
    name: "Maria Gabrielle",
    role: "Auditor",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    committee: "Compliance Officer"
  },
  {
    id: "miggy-pro",
    name: "Miggy Pineda",
    role: "PRO Officer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    committee: "Heritage & Media"
  }
];

// Persistent State Storage Interface
class StateStore {
  constructor() {
    this.keyPrefix = "quadflow_v1_";
    this.init();
  }

  init() {
    if (!localStorage.getItem(this.keyPrefix + "tasks")) {
      localStorage.setItem(this.keyPrefix + "tasks", JSON.stringify(DEFAULT_TASKS));
    }
    if (!localStorage.getItem(this.keyPrefix + "transactions")) {
      localStorage.setItem(this.keyPrefix + "transactions", JSON.stringify(DEFAULT_TRANSACTIONS));
    }
    if (!localStorage.getItem(this.keyPrefix + "isHellWeekActive")) {
      localStorage.setItem(this.keyPrefix + "isHellWeekActive", "false");
    }
    if (!localStorage.getItem(this.keyPrefix + "currentRoleIndex")) {
      localStorage.setItem(this.keyPrefix + "currentRoleIndex", "0");
    }
  }

  get(key) {
    const raw = localStorage.getItem(this.keyPrefix + key);
    try {
      return JSON.parse(raw);
    } catch {
      return raw === "true" ? true : raw === "false" ? false : raw;
    }
  }

  set(key, value) {
    localStorage.setItem(this.keyPrefix + key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }

  resetAll() {
    localStorage.removeItem(this.keyPrefix + "tasks");
    localStorage.removeItem(this.keyPrefix + "transactions");
    localStorage.removeItem(this.keyPrefix + "isHellWeekActive");
    localStorage.removeItem(this.keyPrefix + "currentRoleIndex");
    location.reload();
  }
}

const store = new StateStore();

// Runtime Application Engine
class App {
  constructor() {
    this.tasks = store.get("tasks");
    this.transactions = store.get("transactions");
    this.isHellWeekActive = store.get("isHellWeekActive") === true;
    this.currentRoleIndex = parseInt(store.get("currentRoleIndex"), 10) || 0;
    this.currentRole = ROLES[this.currentRoleIndex];
    this.activeTab = "tasks"; // 'tasks', 'finance', 'heritage'
    this.activeTaskFilter = "All";

    this.budgetLimit = 45000; // SAO Term Budget Limit in Philippine Peso (PHP)

    // Modals visibility state
    this.activeModal = null; // 'create_task', 'upload_receipt', 'view_compliance'
    this.selectedTransactionId = null; 
    this.receiptFileName = null; // temporary simulated state

    // Initialize DOM links and render
    document.addEventListener("DOMContentLoaded", () => {
      this.initTimeWatcher();
      this.bindEvents();
      this.render();
    });
  }

  // Live time ticker
  initTimeWatcher() {
    const updateTime = () => {
      const timeEl = document.getElementById("native-clock-time");
      if (timeEl) {
        const d = new Date();
        const hrs = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        timeEl.textContent = `${hrs}:${mins} UTC`;
      }
    };
    updateTime();
    setInterval(updateTime, 30000);
  }

  // Update State & Re-render
  updateState(key, value) {
    this[key] = value;
    store.set(key, value);
    this.render();
  }

  // Switch roles simulation to view different constraints immediately
  cycleProfileRole() {
    const nextIdx = (this.currentRoleIndex + 1) % ROLES.length;
    this.currentRoleIndex = nextIdx;
    this.currentRole = ROLES[nextIdx];
    store.set("currentRoleIndex", nextIdx);
    this.render();
  }

  // Execute Hell Week Mode re-allocation rules to keep board unstuck
  toggleHellWeek(active) {
    this.isHellWeekActive = active;
    store.set("isHellWeekActive", active);

    if (active) {
      // Automatic re-routings of blocked deliverables under Hell Week
      let changed = false;
      this.tasks = this.tasks.map(t => {
        if (t.status === "Progress" && t.blockers && t.blockers.length > 0 && !t.isReallocated) {
          // Fallback logic: move task to President ('aly-pres') or Auditor ('gab-aud') bypass bottleneck
          t.originalAssigneeId = t.assigneeId;
          t.assigneeId = "aly-pres"; 
          t.isReallocated = true;
          t.priority = "Urgent Prio";
          changed = true;
        }
        return t;
      });
      if (changed) {
        store.set("tasks", this.tasks);
      }
    } else {
      // Revert allocations
      let changed = false;
      this.tasks = this.tasks.map(t => {
        if (t.isReallocated && t.originalAssigneeId) {
          t.assigneeId = t.originalAssigneeId;
          t.originalAssigneeId = null;
          t.isReallocated = false;
          t.priority = "High";
          changed = true;
        }
        return t;
      });
      if (changed) {
        store.set("tasks", this.tasks);
      }
    }
    this.render();
  }

  // Bind direct UI actions neatly
  bindEvents() {
    // Emulator layout switcher
    document.getElementById("btn-toggle-frame")?.addEventListener("click", () => {
      const chassis = document.getElementById("phone-chassis-id");
      const btn = document.getElementById("btn-toggle-frame");
      if (chassis && btn) {
        const isFull = chassis.classList.toggle("full-view");
        btn.querySelector(".view-txt").textContent = isFull ? "FULL WIDTH" : "MOBILE DESIGN";
        btn.classList.toggle("active", !isFull);
      }
    });

    // Reset data
    document.addEventListener("click", (e) => {
      // Global simulation reset
      if (e.target.closest("#btn-global-reset")) {
        store.resetAll();
      }

      // Close modal by clicking scrim
      if (e.target.classList.contains("overlay-scrim")) {
        this.closeModal();
      }
    });
  }

  // Open modal engine
  openModal(modalName, dataId = null) {
    this.activeModal = modalName;
    if (dataId) {
      this.selectedTransactionId = dataId;
    }
    this.render();
  }

  closeModal() {
    this.activeModal = null;
    this.selectedTransactionId = null;
    this.receiptFileName = null;
    this.render();
  }

  // Core Render Loops
  render() {
    this.renderHeaderAndRole();
    this.renderHellWeekControl();
    this.renderTabContents();
    this.renderNavigationDock();
    this.renderModals();
  }

  renderHeaderAndRole() {
    // Render user profile panel
    const pContainer = document.getElementById("role-panel-inject");
    if (!pContainer) return;

    pContainer.innerHTML = `
      <div class="role-switcher-card">
        <div style="display:flex; align-items:center;">
          <div class="role-user-avatar">
            <img src="${this.currentRole.avatar}" alt="${this.currentRole.name}">
            <div class="role-indicator"></div>
          </div>
          <div class="role-info">
            <div class="role-badge">${this.currentRole.role}</div>
            <div class="role-name">${this.currentRole.name}</div>
            <div class="role-committee">${this.currentRole.committee}</div>
          </div>
        </div>
        <button class="role-switch-trigger" id="btn-switch-role">
          <svg style="width:12px; height:12px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          SWITCH ROLE
        </button>
      </div>
      <div class="account-drawer" id="sec-account-drawer">
        <div class="drawer-header">SWITCH COUNCIL ROLE (SIMULATION CONTEXT)</div>
        ${ROLES.map((r, i) => `
          <button class="account-option-btn ${i === this.currentRoleIndex ? 'active' : ''}" data-idx="${i}">
            <img src="${r.avatar}" style="width:1.5rem; height:1.5rem; border-radius:50%; border:1px solid #fff;">
            <div>
              <div style="font-size:0.7rem; font-weight:bold;">${r.name}</div>
              <div style="font-size:0.55rem; color:var(--banana-muted);">${r.role}  (${r.committee})</div>
            </div>
          </button>
        `).join('')}
      </div>
    `;

    // Hook listeners
    const trigger = pContainer.querySelector("#btn-switch-role");
    const drawer = pContainer.querySelector("#sec-account-drawer");
    trigger?.addEventListener("click", () => {
      drawer?.classList.toggle("open");
    });

    drawer?.querySelectorAll(".account-option-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        this.currentRoleIndex = idx;
        this.currentRole = ROLES[idx];
        store.set("currentRoleIndex", idx);
        drawer.classList.remove("open");
        this.render();
      });
    });
  }

  renderHellWeekControl() {
    const hwContainer = document.getElementById("hell-week-panel-inject");
    if (!hwContainer) return;

    hwContainer.innerHTML = `
      <div class="hell-week-panel ${this.isHellWeekActive ? 'active' : ''}">
        <div class="hell-week-header">
          <div class="hell-week-info">
            <div class="hell-week-icon-box">🔥</div>
            <div>
              <div class="hell-week-title-lbl">OFFICIAL ACADEMIC ALTIMETER</div>
              <div class="hell-week-state-text" style="color: ${this.isHellWeekActive ? 'var(--banana-red)' : 'var(--banana-cream)'}">
                ${this.isHellWeekActive ? '💥 HELL WEEK ACTIVE' : '🌱 ORDINARY WEEK'}
              </div>
            </div>
          </div>
          <label class="switch-box">
            <input type="checkbox" id="hellweek-toggle-cb" ${this.isHellWeekActive ? 'checked' : ''}>
            <span class="switch-slider"></span>
          </label>
        </div>
        <div class="hell-week-desc">
          When activated, blocked deliverables trigger the auto-routing module, transferring blocked responsibilities to executive heads to maintain compliance velocities.
        </div>
        <div class="hell-week-warning-tray">
          <div class="warning-alert-bubble">
            <strong style="color:var(--banana-red)">SAO WARNING:</strong> Re-routing protocol is engaged. Responsibilities of bottlenecked officers have safely re-routed to <strong>${ROLES[0].name} (President)</strong> to prevent terminal deadline failures!
          </div>
        </div>
      </div>
    `;

    // Switch hook
    hwContainer.querySelector("#hellweek-toggle-cb")?.addEventListener("change", (e) => {
      this.toggleHellWeek(e.target.checked);
    });
  }

  renderNavigationDock() {
    const dock = document.getElementById("app-nav-dock-inject");
    if (!dock) return;

    dock.innerHTML = `
      <button class="nav-dock-btn ${this.activeTab === 'tasks' ? 'active' : ''}" data-tab="tasks">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
        DELIVERABLES
      </button>
      <button class="nav-dock-btn ${this.activeTab === 'finance' ? 'active' : ''}" data-tab="finance">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        FINANCE LEDGER
      </button>
      <button class="nav-dock-btn ${this.activeTab === 'heritage' ? 'active' : ''}" data-tab="heritage">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        HERITAGE VAULT
      </button>
    `;

    // Tabs events
    dock.querySelectorAll(".nav-dock-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const t = btn.getAttribute("data-tab");
        this.activeTab = t;
        this.render();
      });
    });
  }

  renderTabContents() {
    const container = document.getElementById("main-inject-point");
    if (!container) return;

    if (this.activeTab === "tasks") {
      this.renderTasksTab(container);
    } else if (this.activeTab === "finance") {
      this.renderFinanceTab(container);
    } else if (this.activeTab === "heritage") {
      this.renderHeritageTab(container);
    }
  }

  renderTasksTab(el) {
    // Generate filtered tasks
    let filtered = this.tasks;
    if (this.activeTaskFilter === "Mine") {
      filtered = this.tasks.filter(t => t.assigneeId === this.currentRole.id);
    } else if (this.activeTaskFilter === "Finance") {
      filtered = this.tasks.filter(t => t.division === "Finance & Logistics");
    } else if (this.activeTaskFilter === "Heritage") {
      filtered = this.tasks.filter(t => t.division === "Heritage & Admin");
    }

    const uncompletedCount = this.tasks.filter(t => t.status !== "Completed").length;
    const completedCount = this.tasks.filter(t => t.status === "Completed").length;
    const bottleneckCount = this.tasks.filter(t => t.blockers && t.blockers.length > 0 && t.status !== "Completed").length;

    el.innerHTML = `
      <!-- Quick Filter Deck -->
      <div class="filters-deck">
        <button class="filter-chip ${this.activeTaskFilter === 'All' ? 'active' : ''}" data-filter="All">🎯 ALL COUNCIL DELIVERABLES</button>
        <button class="filter-chip ${this.activeTaskFilter === 'Mine' ? 'active' : ''}" data-filter="Mine">👤 ASSIGNED TO ME</button>
        <button class="filter-chip ${this.activeTaskFilter === 'Finance' ? 'active' : ''}" data-filter="Finance">💸 FINANCE BOARD</button>
        <button class="filter-chip ${this.activeTaskFilter === 'Heritage' ? 'active' : ''}" data-filter="Heritage">📦 HERITAGE & ADMIN</button>
      </div>

      <!-- Statistics Panel -->
      <div class="stats-strip">
        <div class="stat-item">
          <div class="stat-title">Uncompleted</div>
          <div class="stat-value" style="color:var(--banana-yellow)">${uncompletedCount}</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">Bottlenecks</div>
          <div class="stat-value" style="color:${bottleneckCount > 0 ? 'var(--banana-red)' : 'var(--banana-muted)'}">${bottleneckCount}</div>
        </div>
        <div class="stat-item">
          <div class="stat-title">Fully Resolved</div>
          <div class="stat-value" style="color:var(--banana-lime)">${completedCount}</div>
        </div>
      </div>

      <!-- Action trigger header -->
      <div class="section-trigger-header">
        <div class="section-trigger-title">
          <svg style="width:12px; height:12px; color:var(--banana-yellow);" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2M19 11V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
          ${this.activeTaskFilter.toUpperCase()} ACTIONS
        </div>
        <button class="action-trigger-btn" id="btn-open-create-task">
          <svg style="width:10px; height:10px;" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path></svg>
          CREATE PROPOSAL
        </button>
      </div>

      <!-- Task Items Grid -->
      <div class="core-feed-list" id="task-feed-list-inject">
        ${filtered.length === 0 ? `
          <div style="padding:2rem; text-align:center; color:var(--banana-muted); font-size:0.75rem;">
            No items in this division filter layout.
          </div>
        ` : filtered.map(task => {
          const matchedAssignee = ROLES.find(r => r.id === task.assigneeId);
          const isCompleted = task.status === "Completed";
          const hasBlockers = task.blockers && task.blockers.length > 0;

          return `
            <div class="task-card ${task.isReallocated ? 're-routed' : ''}">
              <div class="task-card-header">
                <span class="task-division-tag">${task.division}</span>
                <div class="task-badge-row">
                  ${task.isReallocated ? `
                    <span class="task-badge re-routed-prio">🔥 RE-ALLOCATED</span>
                  ` : ''}
                  <span class="task-badge ${isCompleted ? 'completed' : 'progress'}">
                    ${task.status}
                  </span>
                  <span class="task-badge high">${task.priority}</span>
                </div>
              </div>

              <div class="task-title">${task.title}</div>
              <div class="task-desc">${task.desc}</div>

              <!-- Blockers section -->
              ${hasBlockers && !isCompleted ? `
                <div style="margin-top:0.5rem; background-color:rgba(239, 68, 68, 0.08); border:1px solid rgba(239, 68, 68, 0.15); border-radius:6px; padding:0.4rem; font-size:0.6rem;">
                  <strong style="color:var(--banana-red)">STUCK BLOCKED:</strong> 
                  <span style="color:var(--banana-muted)">${task.blockers[0]}</span>
                </div>
              ` : ''}

              <!-- If task is re-allocated notify user they can clear or audit -->
              ${task.isReallocated ? `
                <div class="task-reallocation-banner">
                  <span style="color:var(--banana-lime); font-weight:800;">AUTO-ALTIMETER REROUTING ENGAGED</span>
                  <div style="color:var(--banana-muted); margin-top:0.15rem;">
                    This task stalled during Hell Week. Responsibilities were auto-promoted to keep executive status clear.
                  </div>
                  <button class="realloc-act-btn" data-unstick-id="${task.id}">
                    Unstick & Revoke
                  </button>
                </div>
              ` : ''}

              <div class="task-footer">
                <div class="task-assignee-box">
                  <div class="task-assignee-avatar">
                    <img src="${matchedAssignee ? matchedAssignee.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}" alt="">
                  </div>
                  <div class="task-assignee-details">
                    <div class="task-assignee-name">${matchedAssignee ? matchedAssignee.name : 'Unassigned'}</div>
                    <div class="task-assignee-role">${matchedAssignee ? matchedAssignee.role : 'Staff'}</div>
                  </div>
                </div>

                <div style="display:flex; align-items:center;">
                  <div class="task-due-box">
                    <div>DEADLINE</div>
                    <div class="task-due-val">${task.due_date}</div>
                  </div>
                  
                  <div class="task-btn-group">
                    <button class="task-block-btn ${hasBlockers ? 'blocked' : ''}" data-block-id="${task.id}">
                      Block
                    </button>
                    <button class="task-block-btn completed ${isCompleted ? 'active' : ''}" 
                            style="background-color: ${isCompleted ? 'var(--banana-lime)' : 'var(--banana-gray)'}; color: ${isCompleted ? '#000' : '#fff'};"
                            data-complete-id="${task.id}">
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Filter chip handlers
    el.querySelectorAll(".filter-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        this.activeTaskFilter = chip.getAttribute("data-filter");
        this.render();
      });
    });

    // Create task proposal button
    el.querySelector("#btn-open-create-task")?.addEventListener("click", () => {
      this.openModal("create_task");
    });

    // Block/unblock/done handlers in standard loop
    el.querySelectorAll("[data-block-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-block-id");
        this.tasks = this.tasks.map(t => {
          if (t.id === id) {
            if (t.blockers && t.blockers.length > 0) {
              t.blockers = [];
            } else {
              t.blockers = ["Dynamic user-session blocker flag triggered for review"];
            }
          }
          return t;
        });
        store.set("tasks", this.tasks);
        this.render();
      });
    });

    el.querySelectorAll("[data-complete-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-complete-id");
        this.tasks = this.tasks.map(t => {
          if (t.id === id) {
            t.status = t.status === "Completed" ? "Progress" : "Completed";
          }
          return t;
        });
        store.set("tasks", this.tasks);
        this.render();
      });
    });

    el.querySelectorAll("[data-unstick-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-unstick-id");
        this.tasks = this.tasks.map(t => {
          if (t.id === id) {
            t.isReallocated = false;
            if (t.originalAssigneeId) {
              t.assigneeId = t.originalAssigneeId;
              t.originalAssigneeId = null;
            }
            t.priority = "High";
            t.blockers = []; // Clear bottlenecks
          }
          return t;
        });
        store.set("tasks", this.tasks);
        this.render();
      });
    });
  }

  renderFinanceTab(el) {
    const utilizedBudget = this.transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const availableBudget = this.budgetLimit - utilizedBudget;
    const isCritical = availableBudget < 10000;
    const depletionPercent = Math.min(100, Math.floor((utilizedBudget / this.budgetLimit) * 100));

    el.innerHTML = `
      <!-- Term budget ledger visualization gauge -->
      <div class="ledger-allocation-widget">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:0.75rem; font-weight:800; text-transform:uppercase;">SAO APPROVED budget ledger</h3>
          <span style="font-size:0.5rem; font-family:var(--font-mono); color:var(--banana-lime);">TERM 3</span>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; margin-top:0.4rem; gap:0.5rem;">
          <div>
            <div style="font-size:0.5rem; color:var(--banana-muted)">TOTAL ENCUMBERED</div>
            <div style="font-size:0.85rem; font-weight:900; color:var(--banana-yellow);">₱${utilizedBudget.toLocaleString()}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.5rem; color:var(--banana-muted)">LIQUID CASH RESERVES</div>
            <div style="font-size:0.85rem; font-weight:900; color:${isCritical ? 'var(--banana-red)' : 'var(--banana-lime)'}">
              ₱${availableBudget.toLocaleString()}
            </div>
          </div>
        </div>

        <div class="ledger-depletion-meter">
          <div class="ledger-depletion-fill ${isCritical ? 'critical' : ''}" style="width: ${depletionPercent}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.5rem; margin-top:0.25rem; color:var(--banana-muted);">
          <span>Utilized budget density indicator: <strong>${depletionPercent}%</strong></span>
          <span>₱${this.budgetLimit.toLocaleString()} CAP</span>
        </div>
      </div>

      <!-- Compliance summary liquation trigger banner -->
      <div style="padding:0 0.75rem 0.5rem 0.75rem;">
        <button class="action-trigger-btn" style="width:100%; display:flex; justify-content:center; gap:0.5rem; padding:0.55rem; background-color:var(--banana-yellow); font-size:0.65rem;"
                id="btn-export-liquidation">
          <svg style="width:14px; height:14px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          GENERATE FULL AUDITED LIQUIDATION SHEET
        </button>
      </div>

      <!-- Transactions table -->
      <div class="section-trigger-header">
        <div class="section-trigger-title">OFFICIAL DISBURSEMENT LOGS</div>
        <button class="action-trigger-btn" id="btn-open-upload-receipt">
          <svg style="width:10px; height:10px;" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"></path></svg>
          LOG EXPENSE
        </button>
      </div>

      <div class="core-feed-list">
        ${this.transactions.length === 0 ? `
          <div style="padding:2rem; text-align:center; color:var(--banana-muted);">
            No logged expenses. Click "Log Expense" above to initiate disbursements.
          </div>
        ` : this.transactions.map(tx => {
          return `
            <div class="tx-card ${tx.audited ? 'audited' : ''}">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <div style="font-size:0.5rem; font-family:var(--font-mono); color:var(--banana-lime); text-transform:uppercase;">
                    ${tx.category}
                  </div>
                  <div style="font-size:0.75rem; font-weight:800; color:var(--banana-cream); margin-top:0.1rem;">
                    ${tx.title}
                  </div>
                  <div style="font-size:0.6rem; color:var(--banana-muted); margin-top:0.15rem; line-height:1.2;">
                    ${tx.justification}
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:0.8rem; font-weight:900; color:var(--banana-yellow);">
                    ₱${tx.amount.toLocaleString()}
                  </div>
                  <div style="font-size:0.5rem; font-family:var(--font-mono); color:var(--banana-muted); margin-top:0.15rem;">
                    ${tx.date}
                  </div>
                </div>
              </div>

              <!-- Receipts upload & audit tracking actions interface -->
              <div style="margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.03); display:flex; justify-content:space-between; align-items:center;">
                <div style="font-size:0.55rem; color:var(--banana-muted); display:flex; align-items:center; gap:0.25rem;">
                  ${tx.receiptUploaded ? `
                    <span style="color:var(--banana-lime); display:inline-flex; align-items:center; gap:0.1rem;">
                      <svg style="width:10px; height:10px;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Receipt Attached (${tx.receiptName})
                    </span>
                  ` : `
                    <span style="color:var(--banana-yellow); cursor:pointer;" class="btn-attach-receipt-trigger" data-tx-id="${tx.id}">
                      ⚠️ No Receipt. Click to upload
                    </span>
                  `}
                </div>

                <div style="display:flex; align-items:center; gap:0.35rem;">
                  <!-- Authenticated audit check trigger (only auditor can sign off) -->
                  <button class="tx-audit-btn ${tx.audited ? 'checked' : ''}" data-audit-tx-id="${tx.id}">
                    ${tx.audited ? '✓ Signed Audited' : 'Sign Off Audit'}
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Sign off audit click check
    el.querySelectorAll("[data-audit-tx-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-audit-tx-id");
        this.transactions = this.transactions.map(tx => {
          if (tx.id === id) {
            tx.audited = !tx.audited;
            tx.auditedBy = tx.audited ? `${this.currentRole.name} (${this.currentRole.role})` : null;
          }
          return tx;
        });
        store.set("transactions", this.transactions);
        this.render();
      });
    });

    // Reattach inline file trigger modal
    el.querySelectorAll(".btn-attach-receipt-trigger").forEach(elTrigger => {
      elTrigger.addEventListener("click", () => {
        const id = elTrigger.getAttribute("data-tx-id");
        this.openModal("upload_receipt", id);
      });
    });

    // Log Expense Trigger
    el.querySelector("#btn-open-upload-receipt")?.addEventListener("click", () => {
      this.openModal("upload_receipt");
    });

    // View compliance PDF modal preview
    el.querySelector("#btn-export-liquidation")?.addEventListener("click", () => {
      this.openModal("view_compliance");
    });
  }

  renderHeritageTab(el) {
    // Audit compliance readiness calculation
    const totalChecklist = 5;
    let completedChecklistCount = 0;
    
    // Evaluate simulated checklist status from task and ledger values
    const hasAuditSignoffs = this.transactions.every(tx => tx.audited);
    const hasAllReceipts = this.transactions.every(tx => tx.receiptUploaded);
    const hasTasksProgressed = this.tasks.filter(t => t.status === "Completed").length >= 2;
    const isBudgetHealthy = (this.budgetLimit - this.transactions.reduce((s,t) => s+t.amount,0)) >= 5000;
    const isHeritageSopChecked = true; // Sim default

    if (hasAuditSignoffs) completedChecklistCount++;
    if (hasAllReceipts) completedChecklistCount++;
    if (hasTasksProgressed) completedChecklistCount++;
    if (isBudgetHealthy) completedChecklistCount++;
    if (isHeritageSopChecked) completedChecklistCount++;

    const readinessPercent = Math.floor((completedChecklistCount / totalChecklist) * 100);

    el.innerHTML = `
      <!-- Dynamic readiness indicator widget -->
      <div class="heritage-readiness-widget">
        <h3 style="font-size:0.75rem; font-weight:800; text-transform:uppercase;">TERM TURNOVER COMPLIANCE STATUS</h3>
        <p style="font-size:0.6rem; color:var(--banana-muted); margin-top:0.15rem;">
          To guarantee zero grant-funding delays for incoming officers, complete the multi-suite checklist:
        </p>

        <div class="readiness-ring-holder">
          <div style="font-size:1.75rem; font-weight:900; color:var(--banana-yellow); text-align:center;">
             ${readinessPercent}%
             <div style="font-size:0.5rem; font-family:var(--font-mono); color:var(--banana-muted);">READY FOR HANDOFF</div>
          </div>
          <div style="flex:1;">
             <div style="font-size:0.6rem; font-family:var(--font-mono); margin-bottom:0.15rem;">Liquidating parameters validation:</div>
             <div style="display:grid; grid-template-columns:12px 1fr; gap:0.25rem; font-size:0.55rem; color:var(--banana-muted);">
               <span>${hasAuditSignoffs ? '✓' : '✖'}</span> <span>Auditor verified ledger entries</span>
               <span>${hasAllReceipts ? '✓' : '✖'}</span> <span>Proof documents of purchases loaded</span>
               <span>${hasTasksProgressed ? '✓' : '✖'}</span> <span>Over 50% core deliverables finished</span>
               <span>${isBudgetHealthy ? '✓' : '✖'}</span> <span>Budget reserves strictly positive (₱5,000+)</span>
             </div>
          </div>
        </div>
      </div>

      <!-- Collapsible SOP Knowledge Accordion Search -->
      <div class="section-trigger-header" style="margin-top:0.4rem;">
        <div class="section-trigger-title">HERITAGE VAULT & SOP DIRECTORY</div>
      </div>

      <div style="padding: 0 0.75rem 0.5rem 0.75rem;">
        <input type="text" id="sop-search-input" placeholder="Search SOP clauses (e.g. SAO, Receipts, Grants)" 
               class="f-form-input" style="padding:0.45rem; font-size:0.65rem;" value="">
      </div>

      <div class="core-feed-list" id="sop-accordion-inject">
        <!-- Injected search filtered items layout -->
      </div>
    `;

    this.renderSopDirectory("");

    // Wire up dynamic search filter keystrokes
    const searchInp = el.querySelector("#sop-search-input");
    searchInp?.addEventListener("input", (e) => {
      this.renderSopDirectory(e.target.value);
    });
  }

  renderSopDirectory(query) {
    const sContainer = document.getElementById("sop-accordion-inject");
    if (!sContainer) return;

    const lowercase = query.toLowerCase();
    const filtered = SOP_REPOSITORY.filter(sop => {
      return sop.title.toLowerCase().includes(lowercase) || 
             sop.category.toLowerCase().includes(lowercase) ||
             sop.content.toLowerCase().includes(lowercase);
    });

    sContainer.innerHTML = filtered.length === 0 ? `
      <div style="padding:1rem; text-align:center; color:var(--banana-muted); font-size:0.65rem;">
        No SOP documents match search queries.
      </div>
    ` : filtered.map((sop, idx) => `
      <div style="background-color:var(--banana-dark); border:1px solid var(--banana-border); border-radius:8px; display:flex; flex-direction:column; overflow:hidden;">
        <button class="sop-accord-toggle-btn" data-sop-idx="${idx}"
                style="width:100%; padding:0.65rem; background:transparent; border:none; color:var(--banana-cream); font-weight:750; font-size:0.65rem; text-align:left; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
          <span style="display:flex; flex-direction:column;">
            <span style="font-size:0.5rem; color:var(--banana-lime); text-transform:uppercase; font-family:var(--font-mono);">${sop.category}</span>
            <span style="margin-top:0.1rem;">${sop.title}</span>
          </span>
          <span class="accord-arrow-indicator" style="font-size:0.5rem; color:var(--banana-muted)">Expand ▽</span>
        </button>
        <div class="sop-accord-body" id="sop-body-${idx}" style="display:none; padding:0.65rem; background-color:var(--banana-charcoal); border-top:1px solid var(--banana-border); font-size:0.6rem; color:var(--banana-muted); line-height:1.4;">
          ${sop.content}
        </div>
      </div>
    `).join('');

    // Accordion click bindings
    sContainer.querySelectorAll(".sop-accord-toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-sop-idx");
        const body = sContainer.querySelector(`#sop-body-${id}`);
        const arrow = btn.querySelector(".accord-arrow-indicator");
        if (body) {
          const isOpen = body.style.display === "block";
          body.style.display = isOpen ? "none" : "block";
          arrow.textContent = isOpen ? "Expand ▽" : "Collapse △";
          arrow.style.color = isOpen ? "var(--banana-muted)" : "var(--banana-yellow)";
        }
      });
    });
  }

  // Modals overlay UI injection point
  renderModals() {
    const overlay = document.getElementById("native-modals-overlay");
    if (!overlay) return;

    if (!this.activeModal) {
      overlay.style.display = "none";
      overlay.innerHTML = "";
      return;
    }

    overlay.style.display = "flex";

    if (this.activeModal === "create_task") {
      overlay.innerHTML = `
        <div class="f-modal-card">
          <div class="f-modal-header">
            <span class="font-mono text-xs font-bold text-banana-yellow">NEW TASK PROPOSAL INITIALIZATION</span>
            <button class="f-modal-close" id="btn-modal-close">×</button>
          </div>
          <form id="create-task-form">
            <div class="f-form-group">
              <label class="f-form-label">Task Headline Title</label>
              <input type="text" id="inp-task-title" required class="f-form-input" placeholder="e.g. Audit terminal G-space backup">
            </div>
            <div class="f-form-group">
              <label class="f-form-label">Brief Deliverable Description</label>
              <textarea id="inp-task-desc" required rows="2" class="f-form-textarea" placeholder="Identify tribal files, review liquidations v2 folders."></textarea>
            </div>
            <div class="f-form-group">
              <label class="f-form-label">Operational Division Committee</label>
              <select id="inp-task-division" class="f-form-select">
                <option value="Finance & Logistics">Finance & Logistics</option>
                <option value="Heritage & Admin">Heritage & Admin</option>
                <option value="Public Relations">Public Relations</option>
              </select>
            </div>
            <div class="f-form-group">
              <label class="f-form-label">Urgency Priority Status</label>
              <select id="inp-task-priority" class="f-form-select">
                <option value="High">High (Terminal Focus)</option>
                <option value="Normal">Normal Support</option>
              </select>
            </div>
            <div class="f-form-group">
              <label class="f-form-label">Target Completion Date</label>
              <input type="date" id="inp-task-due" value="2026-05-28" class="f-form-input" required>
            </div>
            <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
              <button type="button" class="task-block-btn" id="btn-cancel-modal">Cancel</button>
              <button type="submit" class="action-trigger-btn">PROPOSE & LAUNCH</button>
            </div>
          </form>
        </div>
      `;

      // Intercept submit
      const form = overlay.querySelector("#create-task-form");
      form?.addEventListener("submit", (e) => {
        e.preventDefault();
        const t = document.getElementById("inp-task-title").value;
        const d = document.getElementById("inp-task-desc").value;
        const div = document.getElementById("inp-task-division").value;
        const p = document.getElementById("inp-task-priority").value;
        const due = document.getElementById("inp-task-due").value;

        const newTask = {
          id: "task-" + Date.now(),
          title: t,
          desc: d,
          division: div,
          status: "Progress",
          priority: p,
          blockers: [],
          assigneeId: this.currentRole.id, // Autoassign to the creator context
          due_date: due,
          isReallocated: false,
          originalAssigneeId: null
        };

        this.tasks.unshift(newTask);
        store.set("tasks", this.tasks);
        this.closeModal();
      });

    } else if (this.activeModal === "upload_receipt") {
      const activeTx = this.selectedTransactionId 
        ? this.transactions.find(t => t.id === this.selectedTransactionId) 
        : null;

      overlay.innerHTML = `
        <div class="f-modal-card">
          <div class="f-modal-header">
            <span class="font-mono text-xs font-bold text-banana-yellow">
              ${activeTx ? 'ATTACH PROOF TO LOGGED DISBURSEMENT' : 'DISBURSEMENT LOG & RECEIPT FILING'}
            </span>
            <button class="f-modal-close" id="btn-modal-close">×</button>
          </div>
          <form id="ledger-expense-form">
            <div class="f-form-group">
              <label class="f-form-label">Expense Title/Item</label>
              <input type="text" id="inp-tx-title" required class="f-form-input" 
                     placeholder="e.g. Printer inks cartridge" 
                     value="${activeTx ? activeTx.title : ''}" 
                     ${activeTx ? 'disabled' : ''}>
            </div>
            <div class="f-form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
              <div>
                <label class="f-form-label">PHP Amount Required</label>
                <input type="number" id="inp-tx-amount" max="25000" required class="f-form-input" 
                       placeholder="₱ Amount" 
                       value="${activeTx ? activeTx.amount : ''}" 
                       ${activeTx ? 'disabled' : ''}>
              </div>
              <div>
                <label class="f-form-label">Budget Division Category</label>
                <select id="inp-tx-cat" class="f-form-select" ${activeTx ? 'disabled' : ''}>
                  <option value="Office Supplies" ${activeTx && activeTx.category === 'Office Supplies' ? 'selected' : ''}>Office Supplies</option>
                  <option value="Meal Allocations" ${activeTx && activeTx.category === 'Meal Allocations' ? 'selected' : ''}>Meal Allocations</option>
                  <option value="Equipment Bookings" ${activeTx && activeTx.category === 'Equipment Bookings' ? 'selected' : ''}>Equipment Bookings</option>
                </select>
              </div>
            </div>
            <div class="f-form-group">
              <label class="f-form-label">Liquidation Compliance Justification</label>
              <textarea id="inp-tx-just" required rows="2" class="f-form-textarea" 
                        placeholder="Detailed purpose for tracking audit requirements." 
                        ${activeTx ? 'disabled' : ''}>${activeTx ? activeTx.justification : ''}</textarea>
            </div>

            <!-- Drag & Drop container area -->
            <div class="f-form-group">
              <label class="f-form-label">Drag & Drop Proof Document</label>
              <div class="drag-drop-zone ${this.receiptFileName ? 'selected' : ''}" id="drag-drop-file-box">
                <svg style="width:1.5rem; height:1.5rem; color:var(--banana-muted); margin:0 auto 0.25rem auto;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                <div style="font-size:0.6rem; font-weight:bold;" id="drag-drop-label">
                  ${this.receiptFileName ? `✓ Attached File: ${this.receiptFileName}` : 'Drop official receipts JPEG / PNG or Click to browse'}
                </div>
              </div>
            </div>

            <div style="margin-top:1rem; display:flex; justify-content:flex-end; gap:0.5rem;">
              <button type="button" class="task-block-btn" id="btn-cancel-modal">Cancel</button>
              <button type="submit" class="action-trigger-btn">
                ${activeTx ? 'ATTACH RECEIPT FILE' : 'RECORD DISBURSEMENT'}
              </button>
            </div>
          </form>
        </div>
      `;

      // Drag and drop event handlers
      const dropzone = overlay.querySelector("#drag-drop-file-box");
      const label = overlay.querySelector("#drag-drop-label");

      dropzone?.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("hover");
      });

      dropzone?.addEventListener("dragleave", () => {
        dropzone.classList.remove("hover");
      });

      dropzone?.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("hover");
        const file = e.dataTransfer.files[0];
        if (file) {
          this.receiptFileName = file.name;
          dropzone.classList.add("selected");
          if (label) label.innerHTML = `✓ Attached File: ${file.name}`;
        }
      });

      dropzone?.addEventListener("click", () => {
        // Mock browse selection
        const mockName = "receipt_doc_" + Math.floor(Math.random() * 8899 + 1100) + ".png";
        this.receiptFileName = mockName;
        dropzone.classList.add("selected");
        if (label) label.innerHTML = `✓ Attached File: ${mockName}`;
      });

      // Submit handle
      const expenseForm = overlay.querySelector("#ledger-expense-form");
      expenseForm?.addEventListener("submit", (e) => {
        e.preventDefault();

        if (this.selectedTransactionId) {
          this.transactions = this.transactions.map(tx => {
            if (tx.id === this.selectedTransactionId) {
              tx.receiptUploaded = !!this.receiptFileName;
              tx.receiptName = this.receiptFileName || null;
            }
            return tx;
          });
          store.set("transactions", this.transactions);
          this.closeModal();
          return;
        }

        const t = document.getElementById("inp-tx-title").value;
        const amt = parseFloat(document.getElementById("inp-tx-amount").value);
        const cat = document.getElementById("inp-tx-cat").value;
        const just = document.getElementById("inp-tx-just").value;

        const newTx = {
          id: "tx-" + Date.now(),
          title: t,
          category: cat,
          amount: amt,
          type: "Disbursement",
          audited: false,
          auditedBy: null,
          receiptUploaded: !!this.receiptFileName,
          receiptName: this.receiptFileName || null,
          date: new Date().toISOString().split('T')[0],
          justification: just
        };

        this.transactions.unshift(newTx);
        store.set("transactions", this.transactions);
        this.closeModal();
      });

    } else if (this.activeModal === "view_compliance") {
      // Direct full liquidation sheet display matching Philippine student compliance guidelines
      const utilized = this.transactions.reduce((s,t) => s + t.amount, 0);

      overlay.innerHTML = `
        <div class="f-modal-card compliance-paper" style="max-width:395px; max-height:85vh; overflow-y:auto;">
          <div style="text-align:center; border-bottom:2px solid #1a202c; padding-bottom:0.75rem; margin-bottom:0.75rem;">
            <div style="font-family:serif; font-weight:bold; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.045em;">
              STUDENT AFFAIRS ACTIVITIES DEVELOPMENT OFFICE (SAO)
            </div>
            <div style="font-size:0.5rem; letter-spacing:0.045em; color:#4a5568;">
              Centralized Activities Compliance & Liquidation Form
            </div>
            <div style="font-size:0.55rem; font-family:var(--font-mono); margin-top:0.25rem;">
              DOC ID: SAO-LIQ-2026-T3-00891
            </div>
          </div>

          <div style="font-size:0.55rem; text-align:left; line-height:1.4;">
            <strong>REPORTING ENTITY:</strong> University Student Council Executive Office<br>
            <strong>SUBMITTED BY:</strong> ${this.currentRole.name} (${this.currentRole.role})<br>
            <strong>FISCAL PERIOD:</strong> Academic Term Year 2026<br>
            <strong>STATUS:</strong> ${this.isHellWeekActive ? '🚨 PRIORITY AUDITING ENGAGED' : 'STANDARD SUBMISSION'}
          </div>

          <table class="compliance-table">
            <thead>
              <tr>
                <th>REF ID</th>
                <th>EXPENSE DELIVERABLE / TITLE</th>
                <th>Justification</th>
                <th>RECEIPT FILER DOCUMENT</th>
                <th>AUDITED SIGNATURE</th>
                <th>₱ AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${this.transactions.map((tx, idx) => `
                <tr>
                  <td>${tx.id}</td>
                  <td><strong>${tx.title}</strong><br><span style="color:#718096; font-size:0.5rem;">${tx.category}</span></td>
                  <td>${tx.justification}</td>
                  <td>${tx.receiptUploaded ? `✓ Attached` : `<span style="color:var(--banana-red); font-weight:700;">STUCK MISSING</span>`}</td>
                  <td>${tx.audited ? `Verified` : `<span style="color:var(--banana-red)">Pending Signoff</span>`}</td>
                  <td style="font-weight:bold; text-align:right;">₱${tx.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr style="background-color:#edf2f7; font-weight:bold;">
                <td colspan="5" style="text-align:right;">TOTAL ENCUMBERED AMOUNT:</td>
                <td style="text-align:right; color:#2d3748;">₱${utilized.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:0.75rem; font-size:0.45rem; color:#718096; line-height:1.3; text-align:left;">
            <em>I hereby pledge on my honor as a Student Representative of the Student Council that the vouchers, receipts, and meal allocations compiled above are true, audited, and compatible with statutory legal frameworks of Academic Liquidation.</em>
          </div>

          <div style="margin-top:1rem; display:flex; justify-content:space-between; align-items:flex-end;">
            <div style="text-align:left;">
              <div style="font-size:0.5rem; color:#718096;">Filing Signature:</div>
              <div style="font-family:serif; font-size:0.65rem; font-weight:bold; border-bottom:1px solid #1a202c; padding-top:0.5rem; width:100px;">
                ${this.currentRole.name}
              </div>
              <div style="font-size:0.45rem; color:#718096;">Verified Receiving Officer</div>
            </div>

            <button class="task-block-btn" id="btn-modal-close" style="background-color:#1a202c; color:#fff; border:none; padding:0.4rem 0.75rem;">
              Close liquidation preview
            </button>
          </div>
        </div>
      `;
    }

    // Modal helper cancel/dismiss hooks
    overlay.querySelector("#btn-modal-close")?.addEventListener("click", () => this.closeModal());
    overlay.querySelector("#btn-cancel-modal")?.addEventListener("click", () => this.closeModal());
  }
}

// Instantiate Global Runtime Coordinator
const appEngine = new App();
