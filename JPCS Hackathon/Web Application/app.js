/**
 * ==========================================================================
 * QuadFlow Core Client Execution System & High Velocity App State Module Controller
 * ==========================================================================
 */
// Global Application Persistent State Object (Fallback defaults)
const defaultAppState = {
    currentView: 'dashboard',
    userRole: 'officer', // Options: 'officer' | 'admin'
    hellWeekMode: false,
    financials: {
        totalBudget: 50000.00,
        spentAmount: 0.00
    },
    tasks: [
        { id: 'task-1', title: 'Submit Terminal Financial Clearance Decks', committee: 'Finance', status: 'progress', isAcademicRisk: true },
        { id: 'task-2', title: 'Draft Marketing Publication Materials for Org Week', committee: 'Marketing', status: 'backlog', isAcademicRisk: false },
        { id: 'task-3', title: 'Secure Multi-purpose Sports Center Processing Forms', committee: 'Logistics', status: 'completed', isAcademicRisk: false }
    ],
    ledger: [
        { id: 'TXN-984321', description: 'Procurement of Core Logistics Tarpaulins', amount: 3450.00, ref: '2023948591024', committee: 'Logistics', status: 'verified', receiptFile: null },
        { id: 'TXN-104928', description: 'Facebook Boost Marketing Campaigns', amount: 1200.00, ref: '4019284920491', committee: 'Marketing', status: 'verified', receiptFile: null }
    ],
    turnoverChecklist: [
        { id: 'check-1', label: 'Consolidate and link central digital drive keys', done: true },
        { id: 'check-2', label: 'Sanitize structural legacy budget allocation templates', done: false },
        { id: 'check-3', label: 'Revoke outdated execution access authorization keys', done: false }
    ]
};
let appState = { ...defaultAppState };
// File attachment temporary storage
let uploadedReceiptData = null;
// Application Initialize Entry Assembly
document.addEventListener("DOMContentLoaded", () => {
    loadStateFromLocalStorage();
    initializeSession();
    registerNavigationRouting();
    registerEventHandlers();
    initializeSopAccordions();
    setupDragAndDrop();
    executeCoreRenderPipeline();
    showToast("QuadFlow Workspace initialized successfully", "info");
});
/**
 * ==========================================================================
 * Local Storage & Persistence Handlers
 * ==========================================================================
 */
function saveStateToLocalStorage() {
    localStorage.setItem('quadflow_appstate', JSON.stringify(appState));
}
function loadStateFromLocalStorage() {
    const stored = localStorage.getItem('quadflow_appstate');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Deep merge keys
            appState = {
                ...defaultAppState,
                ...parsed,
                financials: { ...defaultAppState.financials, ...parsed.financials },
                tasks: parsed.tasks || defaultAppState.tasks,
                ledger: parsed.ledger || defaultAppState.ledger,
                turnoverChecklist: parsed.turnoverChecklist || defaultAppState.turnoverChecklist
            };
        } catch (e) {
            console.error("Failed to parse local storage state", e);
            appState = { ...defaultAppState };
        }
    }
}
/**
 * ==========================================================================
 * Toast Notification System Engine
 * ==========================================================================
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Choose icon based on toast type
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'danger') icon = '🚨';
    
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 4000);
}
/**
 * ==========================================================================
 * Application Engine Routing & Layout Subroutines
 * ==========================================================================
 */
function initializeSession() {
    // Attempt cache restoration from local storage
    const cachedRole = sessionStorage.getItem('quadflow_role') || appState.userRole;
    appState.userRole = cachedRole;
    sessionStorage.setItem('quadflow_role', appState.userRole);
    
    // Sync UI control elements
    document.getElementById('roleSelector').value = appState.userRole;
    
    // Setup date string display
    const dateDisplay = document.getElementById('liveDateDisplay');
    if (dateDisplay) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.innerText = new Date().toLocaleDateString('en-US', options);
    }
}
function registerNavigationRouting() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    
    function navigateToSection(targetId) {
        navItems.forEach(nav => {
            const match = nav.getAttribute('data-target') === targetId;
            nav.classList.toggle('active', match);
        });
        
        sections.forEach(sec => {
            const match = sec.getAttribute('id') === targetId;
            sec.classList.toggle('active', match);
        });
        
        appState.currentView = targetId.replace('-section', '');
        saveStateToLocalStorage();
    }
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = item.getAttribute('data-target');
            navigateToSection(targetSectionId);
        });
    });
    // Make metric cards in dashboard redirecting links
    const linkableCards = document.querySelectorAll('.linkable-card');
    linkableCards.forEach(card => {
        card.addEventListener('click', () => {
            const target = card.getAttribute('data-target');
            if (target) {
                navigateToSection(target);
                // Scroll main-content viewport back to top
                document.querySelector('.main-content').scrollTop = 0;
            }
        });
    });
}
function registerEventHandlers() {
    // Session Role Switcher
    document.getElementById('roleSelector').addEventListener('change', (e) => {
        appState.userRole = e.target.value;
        sessionStorage.setItem('quadflow_role', appState.userRole);
        saveStateToLocalStorage();
        executeCoreRenderPipeline();
        showToast(`Identity authorization shifted to: ${appState.userRole === 'admin' ? 'Executive Board Admin' : 'Committee Officer'}`, "info");
    });
    // Hell Week Core Switcher
    document.getElementById('hellWeekToggle').addEventListener('click', () => {
        appState.hellWeekMode = !appState.hellWeekMode;
        saveStateToLocalStorage();
        executeCoreRenderPipeline();
        
        if (appState.hellWeekMode) {
            showToast("HELL WEEK MODE ENGAGED. Workspace prioritizing risk mitigations.", "danger");
        } else {
            showToast("Hell Week Mode disabled. Normal workload guidelines apply.", "success");
        }
    });
    // Admin Zone: Task Injection form handler
    document.getElementById('taskForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Block non-admin deliverables additions
        if (appState.userRole !== 'admin') {
            showToast("Unauthorized: Creating deliverables requires Admin clearance.", "danger");
            return;
        }
        
        const titleInput = document.getElementById('taskTitle');
        const committeeInput = document.getElementById('taskCommittee');
        
        const newTask = {
            id: 'task-' + Date.now(),
            title: titleInput.value.trim(),
            committee: committeeInput.value,
            status: 'backlog',
            isAcademicRisk: false
        };
        
        appState.tasks.push(newTask);
        saveStateToLocalStorage();
        
        titleInput.value = '';
        executeCoreRenderPipeline();
        showToast(`Deliverable "${newTask.title.substring(0, 25)}..." initialized`, "success");
    });
    // File input attachment visual display binding
    const fileInput = document.getElementById('receiptFile');
    const fileLabel = document.querySelector('.file-label-text');
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileLabel.innerText = file.name;
            fileLabel.style.color = "var(--accent-lime)";
            
            // Read file data URL for mock previewer
            const reader = new FileReader();
            reader.onload = (event) => {
                uploadedReceiptData = event.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            fileLabel.innerText = "Select Image File...";
            fileLabel.style.color = "var(--text-secondary)";
            uploadedReceiptData = null;
        }
    });
    // Expense log ledger form submit handler
    document.getElementById('ledgerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const descInput = document.getElementById('ledgerDesc');
        const amountInput = document.getElementById('ledgerAmount');
        const refInput = document.getElementById('ledgerRef');
        const committeeInput = document.getElementById('ledgerCommittee');
        
        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            showToast("Invalid transaction amount", "warning");
            return;
        }
        // Budget protection validation rule
        const remaining = appState.financials.totalBudget - appState.financials.spentAmount;
        if (amount > remaining) {
            showToast(`Transaction REJECTED: ₱${amount.toLocaleString()} exceeds remaining budget of ₱${remaining.toLocaleString()}`, "danger");
            return;
        }
        
        const newVoucher = {
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            description: descInput.value.trim(),
            amount: amount,
            ref: refInput.value.trim(),
            committee: committeeInput.value,
            status: 'verified',
            receiptFile: uploadedReceiptData // store image data URL
        };
        
        appState.ledger.push(newVoucher);
        saveStateToLocalStorage();
        
        // Clear variables inputs
        descInput.value = '';
        amountInput.value = '';
        refInput.value = '';
        fileInput.value = '';
        fileLabel.innerText = "Select Image File...";
        fileLabel.style.color = "var(--text-secondary)";
        uploadedReceiptData = null;
        
        executeCoreRenderPipeline();
        showToast(`Disbursement block logged: -₱${amount.toFixed(2)}`, "success");
    });
    // Search and Filters on Ledger Table
    document.getElementById('ledgerSearchInput').addEventListener('input', renderInstitutionalLedgerLog);
    document.getElementById('ledgerFilterCommittee').addEventListener('change', renderInstitutionalLedgerLog);
    // Search bar for Heritage SOP guides
    document.getElementById('sopSearchInput').addEventListener('input', filterSopDirectories);
    // Add turnover objective form handler
    document.getElementById('addTurnoverItemForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('newTurnoverLabel');
        const text = input.value.trim();
        if (!text) return;
        const newItem = {
            id: 'check-' + Date.now(),
            label: text,
            done: false
        };
        appState.turnoverChecklist.push(newItem);
        saveStateToLocalStorage();
        
        input.value = '';
        executeCoreRenderPipeline();
        showToast("Turnover target objective injected", "success");
    });
    // Task details modal close buttons bindings
    document.getElementById('closeTaskModalBtn').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTaskModalBtn').addEventListener('click', closeTaskModal);
    document.getElementById('closeReceiptModalBtn').addEventListener('click', closeReceiptModal);
    document.getElementById('closeReceiptBtn').addEventListener('click', closeReceiptModal);
    document.getElementById('printReceiptBtn').addEventListener('click', () => {
        window.print();
    });
    document.getElementById('exportLedgerBtn').addEventListener('click', () => {
        window.print();
    });
    // Handle Edit Task Form Submit
    document.getElementById('editTaskForm').addEventListener('submit', handleTaskEditSubmit);
    
    // Handle Delete Task in Modal
    document.getElementById('deleteTaskBtn').addEventListener('click', handleTaskDelete);
    
    // Close modals on clicking overlay backdrop
    window.addEventListener('click', (e) => {
        const taskOverlay = document.getElementById('taskModal');
        const receiptOverlay = document.getElementById('receiptModal');
        if (e.target === taskOverlay) closeTaskModal();
        if (e.target === receiptOverlay) closeReceiptModal();
    });
}
/**
 * ==========================================================================
 * Standard Operating Procedures (SOPs) Collapsing Accordions
 * ==========================================================================
 */
function initializeSopAccordions() {
    const items = document.querySelectorAll('.sop-item');
    
    items.forEach(item => {
        const trigger = item.querySelector('.sop-trigger');
        const content = item.querySelector('.sop-content');
        
        trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            
            // Close other SOPs
            items.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('open');
                    otherItem.querySelector('.sop-content').style.maxHeight = '0';
                }
            });
            
            // Toggle current SOP
            if (isOpen) {
                item.classList.remove('open');
                content.style.maxHeight = '0';
            } else {
                item.classList.add('open');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
}
function filterSopDirectories() {
    const query = document.getElementById('sopSearchInput').value.toLowerCase().trim();
    const items = document.querySelectorAll('.sop-item');
    
    items.forEach(item => {
        const keywords = item.getAttribute('data-sop-keywords') || '';
        const titleText = item.querySelector('h4').innerText.toLowerCase();
        const contentText = item.querySelector('.sop-body-inner').innerText.toLowerCase();
        
        const isMatch = keywords.includes(query) || titleText.includes(query) || contentText.includes(query);
        
        if (isMatch) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
            // ensure it closes if hidden
            item.classList.remove('open');
            item.querySelector('.sop-content').style.maxHeight = '0';
        }
    });
}
/**
 * ==========================================================================
 * Dynamic Render Orchestration Engine
 * ==========================================================================
 */
function executeCoreRenderPipeline() {
    syncStructuralColorwaysAndAccessClasses();
    computeAndRenderFinancialMetrics();
    renderAcademicSyncedKanbanMatrix();
    renderInstitutionalLedgerLog();
    renderInstitutionalTurnoverStructure();
}
function syncStructuralColorwaysAndAccessClasses() {
    const rootBody = document.body;
    const banner = document.getElementById('hellWeekBanner');
    const diagHell = document.getElementById('diagHellWeekStatus');
    
    // Toggle structural state modifier classes
    if (appState.hellWeekMode) {
        rootBody.classList.add('hell-week-active');
        document.getElementById('toggleStatus').innerText = "ACTIVE";
        if (banner) banner.style.display = 'flex';
        if (diagHell) {
            diagHell.innerText = "CRITICAL (Hell Week Active)";
            diagHell.className = "diag-value text-crimson";
        }
    } else {
        rootBody.classList.remove('hell-week-active');
        document.getElementById('toggleStatus').innerText = "OFF";
        if (banner) banner.style.display = 'none';
        if (diagHell) {
            diagHell.innerText = "Normal Workspace Load";
            diagHell.className = "diag-value";
        }
    }
    
    // Apply role permission variations classes
    if (appState.userRole === 'admin') {
        rootBody.classList.remove('role-officer');
        rootBody.classList.add('role-admin');
        document.getElementById('currentRoleDisplay').innerText = "Executive Board (Admin)";
    } else {
        rootBody.classList.remove('role-admin');
        rootBody.classList.add('role-officer');
        document.getElementById('currentRoleDisplay').innerText = "Committee Officer";
    }
}
function computeAndRenderFinancialMetrics() {
    // Recalculations pipeline math
    const totalBudget = appState.financials.totalBudget;
    const spentAmount = appState.ledger.reduce((accum, block) => accum + block.amount, 0);
    appState.financials.spentAmount = spentAmount;
    
    const remaining = totalBudget - spentAmount;
    const spentPercentage = Math.round((spentAmount / totalBudget) * 100);
    
    // Inundate dashboard layout values
    const formattedBudgetRemaining = '₱' + remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    document.getElementById('dashBudget').innerText = formattedBudgetRemaining;
    document.getElementById('dashBudgetDetails').innerText = `Spent: ₱${spentAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} of ₱${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    
    const operationalIncompleteCount = appState.tasks.filter(t => t.status !== 'completed').length;
    document.getElementById('dashActiveTasks').innerText = `${operationalIncompleteCount} Tasks`;
    
    const countAcademicRisk = appState.tasks.filter(t => t.isAcademicRisk && t.status !== 'completed').length;
    document.getElementById('dashAcademicRiskSub').innerText = `${countAcademicRisk} Flagged as Academic Risk`;
    
    document.getElementById('dashPendingReceipts').innerText = `${appState.ledger.length} Logs`;
    
    // Update Circular Chart analytics
    const circleProgress = document.getElementById('budgetCircleProgress');
    const percentText = document.getElementById('budgetPercentText');
    if (circleProgress && percentText) {
        // SVG circle radius is 15.9155, circumference is 100
        circleProgress.setAttribute('stroke-dasharray', `${spentPercentage}, 100`);
        percentText.innerText = `${spentPercentage}%`;
        
        // Dynamically change color based on budget utilization
        if (spentPercentage > 85) {
            circleProgress.style.stroke = "var(--accent-crimson)";
        } else if (spentPercentage > 60) {
            circleProgress.style.stroke = "var(--accent-canary)";
        } else {
            circleProgress.style.stroke = "var(--accent-lime)";
        }
    }
    
    // Update linear diagnostics bar
    const progressFill = document.getElementById('budgetProgressFill');
    const percentLabel = document.getElementById('budgetPercentLabel');
    if (progressFill && percentLabel) {
        progressFill.style.width = `${spentPercentage}%`;
        percentLabel.innerText = `${spentPercentage}%`;
        if (spentPercentage > 85) {
            progressFill.style.background = "var(--accent-crimson)";
        } else if (spentPercentage > 60) {
            progressFill.style.background = "var(--accent-canary)";
        } else {
            progressFill.style.background = "linear-gradient(to right, var(--accent-lime), var(--accent-canary))";
        }
    }
}
function renderAcademicSyncedKanbanMatrix() {
    const columns = {
        backlog: document.querySelector('#col-backlog .column-body'),
        progress: document.querySelector('#col-progress .column-body'),
        blocked: document.querySelector('#col-blocked .column-body'),
        completed: document.querySelector('#col-completed .column-body')
    };
    
    // Flush active columns
    Object.keys(columns).forEach(key => { 
        if (columns[key]) columns[key].innerHTML = ''; 
    });
    
    // Populate task board
    appState.tasks.forEach(task => {
        // Enforce implicit redirection mutation during Hell Week
        let exactStatusTarget = task.status;
        if (appState.hellWeekMode && task.isAcademicRisk && task.status !== 'completed') {
            exactStatusTarget = 'blocked';
        }
        
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.isAcademicRisk ? 'academic-risk' : ''}`;
        taskCard.setAttribute('draggable', 'true');
        taskCard.setAttribute('id', task.id);
        
        // Click to edit
        taskCard.addEventListener('click', (e) => {
            // Prevent trigger if clicking internal flags buttons
            if (e.target.closest('.btn-flag')) return;
            openTaskModal(task.id);
        });
        // Setup Drag Start and End
        taskCard.addEventListener('dragstart', (e) => {
            taskCard.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        taskCard.addEventListener('dragend', () => {
            taskCard.classList.remove('dragging');
        });
        
        const comClass = task.committee ? task.committee.toLowerCase() : '';
        
        taskCard.innerHTML = `
            <h4>${task.title}</h4>
            <div class="task-meta">
                <span class="tag-committee ${comClass}">${task.committee}</span>
                ${exactStatusTarget !== 'completed' ? `
                    <button class="btn-flag ${exactStatusTarget === 'blocked' ? 'active-blocked' : ''}" 
                            title="Academic risk status toggle">
                        <span>${exactStatusTarget === 'blocked' ? '💥 Blocked' : '⚠️ Risk'}</span>
                    </button>
                ` : `
                    <span class="card-done-indicator">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Done
                    </span>
                `}
            </div>
        `;
        
        // Setup flag click listener
        const flagBtn = taskCard.querySelector('.btn-flag');
        if (flagBtn) {
            flagBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                triggerAcademicBlockage(task.id);
            });
        }
        
        if (columns[exactStatusTarget]) {
            columns[exactStatusTarget].appendChild(taskCard);
        }
    });
    
    // Update numerical headers counts
    Object.keys(columns).forEach(key => {
        const countNode = document.querySelector(`.count-${key}`);
        if (countNode && columns[key]) {
            countNode.innerText = columns[key].children.length;
        }
    });
}
function renderInstitutionalLedgerLog() {
    const outputTargetTableBody = document.getElementById('ledgerBody');
    outputTargetTableBody.innerHTML = '';
    
    // Get search filters values
    const query = document.getElementById('ledgerSearchInput').value.toLowerCase().trim();
    const comFilter = document.getElementById('ledgerFilterCommittee').value;
    const filteredLedger = appState.ledger.filter(item => {
        const matchesQuery = item.id.toLowerCase().includes(query) || 
                             item.description.toLowerCase().includes(query) ||
                             item.ref.toLowerCase().includes(query);
                             
        const matchesCommittee = (comFilter === 'all') || (item.committee === comFilter);
        
        return matchesQuery && matchesCommittee;
    });
    // Update totals label
    document.getElementById('ledgerSummaryLabel').innerText = `${filteredLedger.length} entries shown (${appState.ledger.length} total verified)`;
    
    if (filteredLedger.length === 0) {
        outputTargetTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 2rem;">No matching transaction records logged.</td></tr>`;
        return;
    }
    
    filteredLedger.forEach(item => {
        const row = document.createElement('tr');
        const isOfficer = appState.userRole === 'officer';
        
        row.innerHTML = `
            <td><code>${item.id}</code></td>
            <td>
                <strong>${item.description}</strong><br>
                <small>Ref: ${item.ref}</small>
            </td>
            <td><span class="tag-committee ${item.committee.toLowerCase()}">${item.committee}</span></td>
            <td><span class="amount-span">₱${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
            <td>
                <span class="status-pill verified" title="Click to view digital receipt voucher">✓ Receipt</span>
            </td>
            <td class="admin-only-cell">
                <button class="btn-icon btn-refund-action" title="Refund/Delete record invoice">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        
        // Receipt viewer modal listener
        row.querySelector('.status-pill').addEventListener('click', (e) => {
            e.stopPropagation();
            openReceiptModal(item.id);
        });
        // Admin Refund listener
        const refundBtn = row.querySelector('.btn-refund-action');
        if (refundBtn) {
            refundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                refundDisbursementBlock(item.id);
            });
        }
        
        outputTargetTableBody.appendChild(row);
    });
}
function renderInstitutionalTurnoverStructure() {
    const checklistTargetNode = document.getElementById('turnoverChecklist');
    checklistTargetNode.innerHTML = '';
    
    const listLength = appState.turnoverChecklist.length;
    const completedCount = appState.turnoverChecklist.filter(item => item.done).length;
    const percentage = listLength > 0 ? Math.round((completedCount / listLength) * 100) : 0;
    // Render elements
    appState.turnoverChecklist.forEach((item, index) => {
        const itemLiNode = document.createElement('li');
        itemLiNode.className = `checklist-item ${item.done ? 'done' : ''}`;
        
        itemLiNode.innerHTML = `
            <input type="checkbox" id="${item.id}" ${item.done ? 'checked' : ''}>
            <label for="${item.id}">${item.label}</label>
            <button class="btn-icon btn-delete-turnover" title="Remove requirement" style="margin-left: auto; width:20px; height:20px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;
        
        // Bind item click
        itemLiNode.querySelector('input').addEventListener('change', () => {
            appState.turnoverChecklist[index].done = !appState.turnoverChecklist[index].done;
            saveStateToLocalStorage();
            executeCoreRenderPipeline();
            
            if (appState.turnoverChecklist[index].done) {
                showToast("Objective marked as complete", "success");
            }
        });
        // Bind delete objective click
        itemLiNode.querySelector('.btn-delete-turnover').addEventListener('click', (e) => {
            e.stopPropagation();
            appState.turnoverChecklist.splice(index, 1);
            saveStateToLocalStorage();
            executeCoreRenderPipeline();
            showToast("Turnover objective removed", "info");
        });
        
        checklistTargetNode.appendChild(itemLiNode);
    });
    // Animate radial turnover checklist chart
    const progressCircle = document.getElementById('turnoverProgressCircle');
    const percentText = document.getElementById('turnoverPercentageText');
    if (progressCircle && percentText) {
        progressCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
        percentText.innerText = `${percentage}%`;
    }
}
/**
 * ==========================================================================
 * Interactive Task Mutators & Modals Control
 * ==========================================================================
 */
function triggerAcademicBlockage(taskId) {
    const index = appState.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
        const originalStatus = appState.tasks[index].isAcademicRisk;
        appState.tasks[index].isAcademicRisk = !originalStatus;
        saveStateToLocalStorage();
        executeCoreRenderPipeline();
        
        if (appState.tasks[index].isAcademicRisk) {
            showToast(`Academic Risk flagged for: "${appState.tasks[index].title.substring(0,25)}..."`, "warning");
        } else {
            showToast("Academic Risk cleared", "success");
        }
    }
}
// Modal open and close handlers
function openTaskModal(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskCommittee').value = task.committee;
    document.getElementById('editTaskStatus').value = task.status;
    document.getElementById('editTaskAcademicRisk').checked = task.isAcademicRisk;
    document.getElementById('taskModal').classList.add('open');
}
function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('open');
}
function handleTaskEditSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editTaskId').value;
    const taskIndex = appState.tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        // Capture edits
        appState.tasks[taskIndex].title = document.getElementById('editTaskTitle').value.trim();
        appState.tasks[taskIndex].committee = document.getElementById('editTaskCommittee').value;
        appState.tasks[taskIndex].status = document.getElementById('editTaskStatus').value;
        appState.tasks[taskIndex].isAcademicRisk = document.getElementById('editTaskAcademicRisk').checked;
        
        // If dragged out of blocked status, clean up logic
        if (appState.tasks[taskIndex].status !== 'blocked' && !document.getElementById('editTaskAcademicRisk').checked) {
            appState.tasks[taskIndex].isAcademicRisk = false;
        } else if (appState.tasks[taskIndex].status === 'blocked') {
            appState.tasks[taskIndex].isAcademicRisk = true;
        }
        saveStateToLocalStorage();
        closeTaskModal();
        executeCoreRenderPipeline();
        showToast("Committee deliverable updated", "success");
    }
}
function handleTaskDelete() {
    const id = document.getElementById('editTaskId').value;
    const taskIndex = appState.tasks.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
        const title = appState.tasks[taskIndex].title;
        appState.tasks.splice(taskIndex, 1);
        saveStateToLocalStorage();
        closeTaskModal();
        executeCoreRenderPipeline();
        showToast(`Deliverable removed: "${title.substring(0, 20)}..."`, "info");
    }
}
// Receipt Modal Viewers
function openReceiptModal(txnId) {
    const txn = appState.ledger.find(t => t.id === txnId);
    if (!txn) return;
    const ticketNode = document.getElementById('receiptTicket');
    
    // Construct receipt elements inside modal
    if (txn.receiptFile) {
        ticketNode.innerHTML = `
            <div class="receipt-ticket-header">
                <div class="receipt-ticket-logo">QUAD<span>FLOW</span></div>
                <p>Digital Clearances & Auditing System</p>
            </div>
            <div class="receipt-details" style="text-align: center;">
                <p style="font-size: 0.85rem; font-weight:600; color:var(--text-muted); margin-bottom: 0.75rem;">Verified Image Attachment:</p>
                <img src="${txn.receiptFile}" alt="Receipt attachment" style="max-width: 100%; border-radius: var(--radius-sm); border:1px solid #cbd5e1; box-shadow: var(--shadow-sm);">
            </div>
            <div class="receipt-details">
                <div class="receipt-row total-row">
                    <span class="label-col">TOTAL AMOUNT</span>
                    <span class="value-col">₱${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="receipt-row" style="margin-top: 0.5rem;">
                    <span class="label-col">Transaction ID</span>
                    <span class="value-col" style="font-family:var(--font-code); font-size:0.75rem;">${txn.id}</span>
                </div>
            </div>
        `;
    } else {
        // Generate simulated ticket data
        const mockMerchant = txn.committee === 'Logistics' ? 'Divergent Prints Inc.' : 
                             txn.committee === 'Marketing' ? 'Meta Ads Inc.' : 
                             txn.committee === 'Finance' ? 'National Book Store' : 'General Merchandise';
        
        ticketNode.innerHTML = `
            <div class="receipt-ticket-header">
                <div class="receipt-ticket-logo">QUAD<span>FLOW</span></div>
                <p>Digital Clearances & Auditing System</p>
            </div>
            <div class="receipt-details">
                <div class="receipt-row">
                    <span class="label-col">Voucher ID</span>
                    <span class="value-col">${txn.id}</span>
                </div>
                <div class="receipt-row">
                    <span class="label-col">Merchant</span>
                    <span class="value-col">${mockMerchant}</span>
                </div>
                <div class="receipt-row">
                    <span class="label-col">Purpose</span>
                    <span class="value-col">${txn.description}</span>
                </div>
                <div class="receipt-row">
                    <span class="label-col">Ref Number</span>
                    <span class="value-col">${txn.ref}</span>
                </div>
                <div class="receipt-row">
                    <span class="label-col">Authorized by</span>
                    <span class="value-col">Committee: ${txn.committee}</span>
                </div>
                <div class="receipt-row">
                    <span class="label-col">Status</span>
                    <span class="value-col" style="color:#10b981; font-weight:700;">✓ SECURED</span>
                </div>
                <div class="receipt-row total-row">
                    <span class="label-col">DISBURSED</span>
                    <span class="value-col">₱${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
            <div class="receipt-barcode">
                <div class="barcode-lines"></div>
                <div class="barcode-text">${txn.id}-${txn.ref.substring(0, 4)}</div>
            </div>
        `;
    }
    document.getElementById('receiptModal').classList.add('open');
}
function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('open');
}
// Admin ledger reverse actions
function refundDisbursementBlock(txnId) {
    if (appState.userRole !== 'admin') {
        showToast("Unauthorized: Transaction reversal requires Admin privileges.", "danger");
        return;
    }
    const index = appState.ledger.findIndex(t => t.id === txnId);
    if (index !== -1) {
        const refundedAmount = appState.ledger[index].amount;
        const description = appState.ledger[index].description;
        
        // Remove from ledger array
        appState.ledger.splice(index, 1);
        saveStateToLocalStorage();
        executeCoreRenderPipeline();
        
        showToast(`Reversed: "${description.substring(0, 20)}..." (+₱${refundedAmount.toFixed(2)} refunded)`, "success");
    }
}
/**
 * ==========================================================================
 * HTML5 Standard Drag-And-Drop Handlers
 * ==========================================================================
 */
function setupDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-column .column-body');
    
    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.classList.add('dragover');
        });
        
        col.addEventListener('dragleave', () => {
            col.classList.remove('dragover');
        });
        
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('dragover');
            
            const taskId = e.dataTransfer.getData('text/plain');
            const targetColumnKey = col.getAttribute('data-status');
            const task = appState.tasks.find(t => t.id === taskId);
            
            if (task && targetColumnKey) {
                const oldStatus = task.status;
                
                // If dropping on identical column, do nothing
                if (oldStatus === targetColumnKey) return;
                
                // State Mutator logic
                task.status = targetColumnKey;
                
                // Manage academic risks indicators automatically
                if (targetColumnKey === 'blocked') {
                    task.isAcademicRisk = true;
                    showToast(`Task blocked. Flagged as Academic Risk.`, "warning");
                } else if (oldStatus === 'blocked') {
                    task.isAcademicRisk = false;
                    showToast(`Task moved out of Blocked. Risk flags cleared.`, "success");
                } else {
                    showToast(`Task moved to ${targetColumnKey.toUpperCase()}`, "info");
                }
                
                saveStateToLocalStorage();
                executeCoreRenderPipeline();
            }
        });
    });
}