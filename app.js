const STORE_KEY = "aftercopy:v1";

const prompts = [
  "What did I witness, in plain factual language?",
  "What stayed with me after the story was filed?",
  "What belongs to the story, and what belongs to me?",
  "What do I need to release today?",
  "What do I need before returning to work?",
  "Is there a person, place, image, or sound I should avoid revisiting tonight?"
];

const selfChecks = [
  "Sleep disruption",
  "Appetite change",
  "Irritability",
  "Numbness or shutdown",
  "Intrusive memories",
  "Social withdrawal"
];

const recoveryOptions = [
  "Rest block",
  "Family or trusted friend time",
  "Spiritual reflection",
  "Movement or exercise",
  "Therapy or counseling",
  "Limited footage review",
  "No graphic review tonight"
];

const professionalSupportTagline = "This is not a replacement for in-person care from a qualified mental health professional. If symptoms feel serious, worsening, or unsafe, please contact a licensed clinician, doctor, or local emergency support.";

const moodPrompts = {
  steady: [
    "Name one thing you did professionally well, without minimizing it.",
    "What routine would help you re-enter ordinary life tonight?"
  ],
  heavy: [
    "What image or sentence is still carrying weight, and where do you feel it in your body?",
    "What is one boundary you can set around footage, notes, or calls for the next 24 hours?"
  ],
  numb: [
    "If feeling is distant right now, what small signal tells you your body still needs care?",
    "What would be gentle enough to do for ten minutes without forcing emotion?"
  ],
  activated: [
    "What is your system trying to protect you from right now?",
    "What can wait until tomorrow, and who can help hold that boundary?"
  ]
};

const defaultState = {
  user: null,
  tab: "home",
  assignments: [],
  reminders: [],
  activeModal: null,
  copyNotice: ""
};

let state = loadState();

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem(STORE_KEY) || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    user: state.user,
    assignments: state.assignments,
    reminders: state.reminders
  }));
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function icon(name) {
  const icons = {
    home: "H",
    log: "J",
    check: "C",
    plan: "P",
    report: "R",
    insights: "I",
    shield: "S",
    bell: "B",
    plus: "+",
    lock: "L",
    pause: "II",
    copy: "CP"
  };
  return `<span class="glyph" aria-hidden="true">${icons[name] || "*"}</span>`;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function escapeHTML(value = "") {
  return value.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function render() {
  const app = document.querySelector("#app");
  app.innerHTML = state.user ? renderApp() : renderLogin();
  bindEvents();
}

function renderLogin() {
  return `
    <main class="shell login-screen">
      <section class="login-art">
        <div>
          <div class="brand-lockup">
            <img src="./assets/aftercopy-mark.svg" alt="" />
            <div><strong>AfterCopy</strong><span>After the story is filed</span></div>
          </div>
          <h1>A private decompression space for difficult assignments.</h1>
        </div>
      </section>
      <section class="login-card">
        <form data-action="login">
          <div class="field">
            <label for="name">Name or initials</label>
            <input id="name" name="name" autocomplete="name" placeholder="A. Reporter" required />
          </div>
          <div class="field">
            <label for="role">Beat or role</label>
            <input id="role" name="role" placeholder="Photojournalist, field producer..." required />
          </div>
          <button class="primary" type="submit">${icon("lock")} Enter private space</button>
        </form>
        <p class="tiny">Prototype privacy model: entries stay in this browser. AfterCopy is not diagnosis, therapy, or employer reporting.</p>
      </section>
    </main>
  `;
}

function renderApp() {
  return `
    <main class="shell">
      <section class="screen">
        ${renderHeader()}
        ${renderTab()}
        ${renderCreatorFooter()}
      </section>
      ${renderNav()}
      ${renderModal()}
    </main>
  `;
}

function renderCreatorFooter() {
  return `
    <footer class="creator-footer">
      created by Nabeel Tirmazi for more information
      <a href="https://www.nabeeltirmazi.com" target="_blank" rel="noopener">www.nabeeltirmazi.com</a>
    </footer>
  `;
}

function renderHeader() {
  return `
    <header class="app-header">
      <div class="brand-lockup">
        <img src="./assets/aftercopy-mark.svg" alt="" />
        <div><strong>AfterCopy</strong><span>${escapeHTML(state.user.role)}</span></div>
      </div>
      <button class="icon-btn" title="Sign out" data-action="logout">${icon("lock")}</button>
    </header>
  `;
}

function renderTab() {
  const tabs = {
    home: renderHome,
    log: renderLog,
    check: renderCheck,
    plan: renderPlan,
    report: renderReport,
    insights: renderInsights
  };
  return tabs[state.tab]();
}

function renderNav() {
  const items = [
    ["home", "Home", "home"],
    ["log", "Log", "log"],
    ["check", "Check", "check"],
    ["plan", "Plan", "plan"],
    ["report", "Report", "report"],
    ["insights", "Patterns", "insights"]
  ];
  return `<nav class="footer-nav">${items.map(([tab, label, glyph]) => `
    <button class="${state.tab === tab ? "active" : ""}" data-tab="${tab}">${icon(glyph)}<span>${label}</span></button>
  `).join("")}</nav>`;
}

function latestAssignment() {
  return [...state.assignments].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

function dueReminders() {
  const now = Date.now();
  return state.reminders.filter(reminder => !reminder.done && new Date(reminder.when).getTime() <= now);
}

function renderHome() {
  const latest = latestAssignment();
  const due = dueReminders();
  return `
    <section class="hero">
      <img src="./assets/aftercopy-hero.png" alt="AfterCopy reflection graphic for journalists after difficult assignments" />
    </section>
    <p class="hero-caption">Log what happened, check your nervous system, and set a short recovery plan before more work lands.</p>
    ${due.length ? `<div class="support-strip">${icon("bell")} ${due.length} reflection check-in${due.length > 1 ? "s are" : " is"} due. Open Patterns to review them.</div>` : ""}
    <div class="quick-grid">
      <button class="quick-card" data-modal="assignment">${icon("plus")}<strong>New assignment</strong><span>Debrief a completed story</span></button>
      <button class="quick-card" data-tab="check">${icon("check")}<strong>Self-check</strong><span>Sleep, appetite, intrusion, withdrawal</span></button>
      <button class="quick-card" data-tab="plan">${icon("shield")}<strong>Recovery plan</strong><span>Choose tonight's care steps</span></button>
      <button class="quick-card" data-modal="prompt">${icon("log")}<strong>AI prompts</strong><span>Private follow-up questions</span></button>
      <button class="quick-card" data-tab="report">${icon("report")}<strong>Wellness report</strong><span>Copy a plan prompt for your LLM</span></button>
    </div>
    <div class="section-title"><h2>Recent assignment</h2><button class="ghost" data-tab="log">View all</button></div>
    ${latest ? renderEntryCard(latest) : `<div class="empty">No assignment logged yet. Start with a short debrief after the next difficult file.</div>`}
    <div class="section-title"><h2>Footage review safety</h2></div>
    <div class="warning">${icon("pause")} Avoid graphic footage review immediately after fieldwork when possible. Use labels, ask for help, or delay review until you have slept.</div>
  `;
}

function renderLog() {
  return `
    <div class="section-title">
      <h2>Assignment log</h2>
      <button class="secondary" data-modal="assignment">${icon("plus")} Add</button>
    </div>
    <p class="section-intro">Keep source details out of entries unless they are already safe to store. Redact names, addresses, and unpublished identifiers.</p>
    <div class="prompt-list">
      ${state.assignments.length ? state.assignments.map(renderEntryCard).join("") : `<div class="empty">Your log is empty.</div>`}
    </div>
  `;
}

function renderEntryCard(entry) {
  const score = entry.checks?.length || 0;
  return `
    <article class="entry-card">
      <div>
        <h3>${escapeHTML(entry.title)}</h3>
        <div class="muted">${escapeHTML(entry.assignmentType)} · ${new Date(entry.date).toLocaleDateString()}</div>
      </div>
      <p>${escapeHTML(entry.summary || "No summary added.")}</p>
      <div class="tags">
        <span class="tag">${escapeHTML(entry.mood)}</span>
        <span class="tag">${score}/6 self-check</span>
        ${(entry.recovery || []).slice(0, 2).map(item => `<span class="tag">${escapeHTML(item)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderCheck() {
  const latest = latestAssignment();
  const checks = latest?.checks || [];
  return `
    <div class="section-title"><h2>Burnout self-check</h2></div>
    <p class="section-intro">This is a pattern signal, not a diagnosis. If you feel at risk of harming yourself or someone else, contact local emergency support now.</p>
    <section class="panel">
      ${selfChecks.map(item => `
        <label class="check-row">
          <span>${item}</span>
          <input type="checkbox" data-check="${item}" ${checks.includes(item) ? "checked" : ""} ${latest ? "" : "disabled"} />
        </label>
      `).join("")}
    </section>
    <div class="section-title"><h2>Current signal</h2></div>
    ${latest ? renderScore(checks.length) : `<div class="empty">Log an assignment first, then complete a self-check.</div>`}
  `;
}

function renderScore(count) {
  const label = count <= 1 ? "Low visible strain" : count <= 3 ? "Watch and recover" : "Support strongly recommended";
  const body = count <= 1
    ? "Keep the recovery plan small and specific."
    : count <= 3
      ? "Consider delaying footage review, reducing exposure, and checking in with a trusted person."
      : "This cluster can matter. Consider peer support, a trainer, counselor, or newsroom safety contact.";
  return `<div class="score"><strong>${count}/6</strong><b>${label}</b><span class="muted">${body}</span></div>`;
}

function renderPlan() {
  const latest = latestAssignment();
  const recovery = latest?.recovery || [];
  return `
    <div class="section-title"><h2>Recovery plan</h2></div>
    <p class="section-intro">Choose practical steps for the first recovery window. Keep them realistic enough to do today.</p>
    <section class="panel">
      ${recoveryOptions.map(item => `
        <label class="plan-row">
          <span>${item}</span>
          <input type="checkbox" data-plan="${item}" ${recovery.includes(item) ? "checked" : ""} ${latest ? "" : "disabled"} />
        </label>
      `).join("")}
    </section>
    <div class="section-title"><h2>Suggested decompression</h2></div>
    ${latest ? `<div class="prompt-card"><small>Generated privately</small><p>${escapeHTML(generateRecoveryPrompt(latest))}</p></div>` : `<div class="empty">Add an assignment to generate a recovery prompt.</div>`}
  `;
}

function renderReport() {
  const latest = latestAssignment();
  if (!latest) {
    return `
      <div class="section-title"><h2>Wellness report</h2></div>
      <div class="empty">Add an assignment first. AfterCopy will use your debrief, self-check, recovery plan, and notes to create one private report and one external LLM prompt.</div>
    `;
  }
  const report = generateWellnessReport(latest);
  const planPrompt = generateWellnessPlanPrompt(latest);
  return `
    <div class="section-title"><h2>Wellness report</h2></div>
    <p class="section-intro">This report is generated only from your saved inputs. It is for personal reflection and record-keeping, not diagnosis or employer review.</p>
    <div class="warning">${escapeHTML(professionalSupportTagline)}</div>
    ${state.copyNotice ? `<div class="support-strip">${escapeHTML(state.copyNotice)}</div>` : ""}
    <section class="panel report-panel">
      <div class="section-title compact"><h2>In-app report</h2><button class="ghost" data-copy="report">${icon("copy")} Copy</button></div>
      <pre id="wellness-report">${escapeHTML(report)}</pre>
    </section>
    <section class="panel report-panel">
      <div class="section-title compact"><h2>Prompt for your LLM</h2><button class="secondary" data-copy="prompt">${icon("copy")} Copy prompt</button></div>
      <p class="section-intro">Paste this into your preferred LLM to generate a comprehensive wellness plan and a Word-ready record. Review and redact anything sensitive before pasting.</p>
      <pre id="llm-prompt">${escapeHTML(planPrompt)}</pre>
    </section>
  `;
}

function renderInsights() {
  const total = state.assignments.length;
  const repeated = state.assignments.filter(a => (a.checks || []).length >= 4).length;
  return `
    <div class="section-title"><h2>Patterns</h2></div>
    <div class="insight-grid">
      <div class="metric"><strong>${total}</strong><span class="muted">Assignments logged</span></div>
      <div class="metric"><strong>${repeated}</strong><span class="muted">High-strain entries</span></div>
    </div>
    <div class="section-title"><h2>Reminder queue</h2></div>
    <div class="prompt-list">
      ${state.reminders.length ? state.reminders.map(renderReminder).join("") : `<div class="empty">No reminders yet.</div>`}
    </div>
    <div class="section-title"><h2>Private summary</h2></div>
    <div class="prompt-card"><small>For you only</small><p>${escapeHTML(generateSummary())}</p></div>
  `;
}

function renderReminder(reminder) {
  const due = new Date(reminder.when).getTime() <= Date.now() && !reminder.done;
  return `
    <article class="reminder-card ${due ? "due" : ""}">
      <b>${escapeHTML(reminder.label)} check-in</b>
      <span class="muted">${escapeHTML(reminder.title)} · ${formatDate(reminder.when)}</span>
      <button class="${reminder.done ? "ghost" : "secondary"}" data-reminder="${reminder.id}">${reminder.done ? "Completed" : "Mark complete"}</button>
    </article>
  `;
}

function renderModal() {
  if (!state.activeModal) return "";
  if (state.activeModal === "assignment") return renderAssignmentModal();
  if (state.activeModal === "prompt") return renderPromptModal();
  return "";
}

function renderAssignmentModal() {
  return `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal" role="dialog" aria-modal="true" aria-label="New assignment" data-modal-panel>
        <h2>Post-assignment debrief</h2>
        <form data-action="save-assignment">
          <div class="field"><label>Assignment title</label><input name="title" placeholder="Flood evacuation interviews" required /></div>
          <div class="field"><label>Assignment type</label>
            <select name="assignmentType">
              <option>Survivor interview</option>
              <option>Disaster</option>
              <option>Political unrest</option>
              <option>Violence or court reporting</option>
              <option>Road crash</option>
              <option>Displacement</option>
              <option>Graphic footage review</option>
              <option>Gender-based violence</option>
              <option>Child-focused story</option>
              <option>Harassment in the field</option>
              <option>Death, grief, or community tragedy</option>
            </select>
          </div>
          <div class="field"><label>Where did it happen?</label><input name="locationContext" placeholder="City, hospital, court, accident site, community location..." /></div>
          <div class="field"><label>Date completed</label><input type="date" name="date" value="${todayISO()}" /></div>
          <div class="field"><label>What happened?</label><textarea name="summary" placeholder="Use broad terms. Avoid source-identifying details."></textarea></div>
          <div class="field"><label>What affected you?</label><textarea name="affected" placeholder="Image, sound, conversation, pressure, deadline..."></textarea></div>
          <div class="field"><label>People you interacted with</label><input name="people" placeholder="Survivors, families, children, officials, witnesses..." /></div>
          <div class="field"><label>Images, sounds, smells, words, or moments replaying</label><textarea name="sensoryDetails" placeholder="Describe only what is safe to record."></textarea></div>
          <div class="field"><label>What are you feeling right now?</label><textarea name="emotions" placeholder="Sad, angry, numb, guilty, helpless, anxious, exhausted..."></textarea></div>
          <div class="field"><label>Strongest emotion</label><input name="strongestEmotion" placeholder="Anger, fear, guilt, numbness..." /></div>
          <div class="field"><label>Body reactions</label><textarea name="bodyReactions" placeholder="Headache, tight chest, fatigue, crying, sleep trouble, racing thoughts..."></textarea></div>
          <div class="field"><label>Are you feeling safe right now?</label>
            <select name="safetyLevel">
              <option>Yes</option>
              <option>No</option>
              <option>Not sure</option>
            </select>
          </div>
          <div class="field"><label>Can you continue normal work today?</label>
            <select name="workCapacity">
              <option>Yes</option>
              <option>No</option>
              <option>Not sure</option>
            </select>
          </div>
          <div class="field"><label>Newsroom support</label><textarea name="newsroomSupport" placeholder="What support did or did not happen before or after the assignment?"></textarea></div>
          <div class="field"><label>Current work pressure</label><textarea name="workPressure" placeholder="Deadline pressure, editing disturbing visuals, continuing coverage..."></textarea></div>
          <div class="field"><label>Dismissed or unsupported moments</label><textarea name="dismissed" placeholder="Anything treated as 'part of the job' or minimized?"></textarea></div>
          <div class="field"><label>What do you need before returning to work?</label><textarea name="need" placeholder="Sleep, colleague check-in, no footage review..."></textarea></div>
          <div class="field"><label>What do you need most right now?</label><input name="recoveryNeed" placeholder="Vent, sleep, stop replaying images, set boundaries..." /></div>
          <div class="field"><label>Tone for the external LLM prompt</label>
            <select name="tone">
              <option>Gentle</option>
              <option>Practical</option>
              <option>Comforting</option>
              <option>Reflective</option>
              <option>Direct</option>
              <option>Firm</option>
            </select>
          </div>
          <div class="field"><label>Private notes</label><textarea name="notes" placeholder="Optional notes for your record. Keep source identities out unless safe."></textarea></div>
          <div class="field"><label>Mood now</label>
            <select name="mood">
              <option value="steady">Steady</option>
              <option value="heavy">Heavy</option>
              <option value="numb">Numb</option>
              <option value="activated">Activated</option>
            </select>
          </div>
          <p class="consent">Reminders are private browser reminders for 24 hours, 72 hours, and 7 days. Browser notifications are optional.</p>
          <div class="form-actions"><button class="ghost" type="button" data-action="close-modal">Cancel</button><button class="primary" type="submit">Save debrief</button></div>
        </form>
      </section>
    </div>
  `;
}

function renderPromptModal() {
  const latest = latestAssignment();
  const generated = latest ? generateReflectionPrompts(latest) : prompts.slice(0, 3);
  return `
    <div class="modal-backdrop" data-close-modal>
      <section class="modal" role="dialog" aria-modal="true" aria-label="AI reflection prompts" data-modal-panel>
        <h2>Private reflection prompts</h2>
        <div class="prompt-list">
          ${generated.map((prompt, index) => `<div class="prompt-card"><small>Prompt ${index + 1}</small><p>${escapeHTML(prompt)}</p></div>`).join("")}
        </div>
        <div class="support-strip">Pause this exercise any time. If journaling increases distress, close the app and ground yourself through a person, place, or routine that feels safe.</div>
        <div class="form-actions"><button class="primary" type="button" data-action="close-modal">Done</button></div>
      </section>
    </div>
  `;
}

function generateReflectionPrompts(entry) {
  const base = moodPrompts[entry.mood] || moodPrompts.heavy;
  const type = entry.assignmentType.toLowerCase();
  const footage = type.includes("footage") ? "What boundary would make future footage review safer: timing, duration, labels, or company?" : "Which part of the assignment should remain in your notebook, and which part deserves care outside work?";
  return [
    base[0],
    footage,
    `For this ${entry.assignmentType.toLowerCase()} assignment, what support would you accept if it were offered without judgment?`
  ];
}

function generateRecoveryPrompt(entry) {
  const checkCount = entry.checks?.length || 0;
  if ((entry.recovery || []).includes("No graphic review tonight")) return "Keep tonight free of graphic material. Put footage, notes, and message threads behind one deliberate barrier.";
  if (checkCount >= 4) return "Choose one human contact and one body-based reset before any more assignment review.";
  if (entry.mood === "numb") return "Try a low-demand routine: shower, food, dim light, and a ten-minute check-in without forcing analysis.";
  if (entry.mood === "activated") return "Give your nervous system a hard stop: notifications down, feet on the floor, slow breathing, and no fresh interviews tonight.";
  return "Protect a short ordinary-life block: meal, movement, or quiet time before opening the story again.";
}

function generateSummary() {
  if (!state.assignments.length) return "No entries yet. Your summaries will stay private here once assignments are logged.";
  const recent = latestAssignment();
  const high = state.assignments.filter(a => (a.checks || []).length >= 4).length;
  const modes = state.assignments.map(a => a.mood);
  const commonMood = modes.sort((a, b) => modes.filter(v => v === a).length - modes.filter(v => v === b).length).pop();
  return `Across ${state.assignments.length} logged assignment${state.assignments.length > 1 ? "s" : ""}, the most recent mood is ${recent.mood}. ${high ? `${high} entry${high > 1 ? "ies show" : " shows"} a high-strain self-check pattern; consider support and lighter exposure windows.` : "No repeated high-strain pattern is visible yet."} Common recovery needs can be reviewed in your plan.`;
}

function valueOrBlank(value) {
  return value && String(value).trim() ? String(value).trim() : "Not recorded";
}

function userDisplayName() {
  return valueOrBlank(state.user?.name);
}

function listOrBlank(list) {
  return list && list.length ? list.join(", ") : "Not selected";
}

function assignmentSpecificSupport(entry) {
  const type = (entry.assignmentType || "").toLowerCase();
  const text = [];
  if (type.includes("violence") || type.includes("crime") || type.includes("conflict")) {
    text.push("Add support for anger, fear, shock, and moral injury.");
  }
  if (type.includes("disaster") || type.includes("flood") || type.includes("fire")) {
    text.push("Add support for helplessness, survivor guilt, sensory overload, and exhaustion.");
  }
  if (type.includes("road crash") || type.includes("accident")) {
    text.push("Add support for intrusive images, guilt, grief, and body tension.");
  }
  if (type.includes("gender-based")) {
    text.push("Add support for anger, disgust, personal triggering, safety concerns, and boundary repair.");
  }
  if (type.includes("child")) {
    text.push("Add support for grief, protective distress, and emotional heaviness.");
  }
  if (type.includes("harassment")) {
    text.push("Add support for fear, shame, anger, documentation, and safety planning.");
  }
  return text.length ? text.join("\n") : "Tailor support to the assignment type and the journalist's stated emotional and physical reactions.";
}

function generateWellnessReport(entry) {
  const name = userDisplayName();
  return `Aftercopy
For the weight journalists carry after the story.

Personal Wellness Report
Name: ${name}
Report date: ${valueOrBlank(entry.date)}

${name}, what you carried from this assignment deserves to be taken seriously. This record is written with respect for the pressure of field journalism and the human weight that can remain after the story is filed.

Assignment
Title: ${valueOrBlank(entry.title)}
Type: ${valueOrBlank(entry.assignmentType)}
Date completed: ${valueOrBlank(entry.date)}
Location/context: ${valueOrBlank(entry.locationContext)}

What happened
${valueOrBlank(entry.summary)}

What stayed with me
${valueOrBlank(entry.affected)}

People I interacted with
${valueOrBlank(entry.people)}

Disturbing details I am carrying
${valueOrBlank(entry.sensoryDetails)}

How I feel right now
Mood: ${valueOrBlank(entry.mood)}
Current emotions: ${valueOrBlank(entry.emotions)}
Strongest emotion: ${valueOrBlank(entry.strongestEmotion)}
Body reactions: ${valueOrBlank(entry.bodyReactions)}
Safety level: ${valueOrBlank(entry.safetyLevel)}
Able to continue normal work today: ${valueOrBlank(entry.workCapacity)}

Work pressure
Newsroom support: ${valueOrBlank(entry.newsroomSupport)}
Current pressure: ${valueOrBlank(entry.workPressure)}
Dismissed or unsupported moments: ${valueOrBlank(entry.dismissed)}

Self-check
Selected signs: ${listOrBlank(entry.checks)}
Signal count: ${(entry.checks || []).length}/6

Recovery needs
Before returning to work: ${valueOrBlank(entry.need)}
What I need most right now: ${valueOrBlank(entry.recoveryNeed)}
Selected recovery actions: ${listOrBlank(entry.recovery)}
Preferred support tone: ${valueOrBlank(entry.tone)}

Private notes
${valueOrBlank(entry.notes)}

Safety note
This report is a personal reflection record. It does not diagnose, treat, or replace professional mental health support. ${professionalSupportTagline} If I feel unsafe, at risk of harming myself, unable to function, or overwhelmed by flashbacks or panic, I should contact a trusted person or local emergency/mental health support immediately.`;
}

function generateWellnessPlanPrompt(entry) {
  const name = userDisplayName();
  return `Personalized Mental Wellness Prompt for My Assignment

I am ${name}, a female journalist who has just covered a difficult field assignment. I want a comprehensive wellness plan that helps me recover while maintaining my responsibility, clarity, ethics, and boundaries as a journalist.

Document Header And Style Requirements

The report you generate must begin with:

Aftercopy
For the weight journalists carry after the story.

Then include:
Name: ${name}
Report date: ${valueOrBlank(entry.date)}

Start the report by addressing me by name and opening with a serious empathy statement that acknowledges the weight of the assignment without using platitudes.

If creating a Word document, use black font throughout, Montserrat Black for the header, and Lora for the body text. Apply these style requirements silently. Do not include the sentence "Style requirement: Use black font throughout. Header font: Montserrat Black. Body font: Lora." or any similar style-instruction text inside the final document.

Assignment Context

I covered: ${valueOrBlank(entry.assignmentType)}
Location/context: ${valueOrBlank(entry.locationContext)}
What happened: ${valueOrBlank(entry.summary)}
What stayed with me: ${valueOrBlank(entry.affected)}
People I interacted with: ${valueOrBlank(entry.people)}
Disturbing details I am carrying: ${valueOrBlank(entry.sensoryDetails)}

How I Feel Right Now

My strongest emotions are: ${valueOrBlank(entry.strongestEmotion || entry.emotions)}
Other emotions I recorded: ${valueOrBlank(entry.emotions)}
My body is reacting through: ${valueOrBlank(entry.bodyReactions)}
My current safety level is: ${valueOrBlank(entry.safetyLevel)}
My ability to continue working today is: ${valueOrBlank(entry.workCapacity)}
My self-check signs are: ${listOrBlank(entry.checks)}

Work Pressure

Support from newsroom: ${valueOrBlank(entry.newsroomSupport)}
Current pressure: ${valueOrBlank(entry.workPressure)}
What I felt dismissed or unsupported about: ${valueOrBlank(entry.dismissed)}

What I Need

Right now I need help to: ${valueOrBlank(entry.recoveryNeed || entry.need)}
My selected recovery actions are: ${listOrBlank(entry.recovery)}
My private notes for context are: ${valueOrBlank(entry.notes)}
Please respond in a ${valueOrBlank(entry.tone).toLowerCase()} tone.

What I Want You To Do

Act as a trauma-informed reflective support assistant for a female field journalist.

Please help me process this assignment in a safe, grounded, and practical way. Do not diagnose me. Do not provide medical advice. Do not tell me to "just be strong." Do not romanticize trauma as courage. Do not blame me for emotional reactions. Help me return to stability, clarity, and self-respect while protecting my responsibilities as a journalist.

Create a comprehensive wellness plan and record based only on the inputs above. If your environment supports file creation, generate a Word document (.docx) for my personal record. The filename must include the report date in this format: Aftercopy_Wellness_Report_${valueOrBlank(entry.date)}.docx. If it does not support file creation, return a clean Word-ready document with headings that I can copy into a Word file.

Do the following:

1. Let Me Vent

Start by giving me space to express what I am carrying. Reflect back what you hear without judging, minimizing, or over-spiritualizing it.

2. Name What May Be Happening

Based on my inputs, help me identify possible signs of emotional overload, secondary trauma, burnout, moral distress, fear response, anger after witnessing injustice, numbness, or shutdown. Use simple language and do not diagnose me.

3. Separate My Role From the Pain

Help me separate what was my professional responsibility from what was never mine to carry alone. Include language that respects journalism ethics, source dignity, accuracy, and accountability without making me personally responsible for the harm I witnessed.

4. Ground Me

Give me a short grounding exercise I can do immediately in 2-3 minutes.

5. Healthy Recovery Strategy

Suggest a practical recovery plan for the next 30 minutes, tonight, the next 24 hours, and before my next assignment. Include this note in the recovery strategy section: "${professionalSupportTagline}"

6. Boundary Check

Help me identify one boundary I may need with my editor, my newsroom, sources, social media, and repeated exposure to visuals.

7. Reflection Questions

Ask me 5 gentle but useful reflection questions to help me process the assignment without getting stuck in it.

8. Responsible Journalism Continuity

Suggest how I can return to professional responsibilities safely: filing, edits, fact-checking, source follow-up, footage review, and newsroom communication. Include ways to ask for support without sharing private journal details.

9. Assignment-Specific Support

${assignmentSpecificSupport(entry)}

10. When to Seek Human Support

Tell me what warning signs would mean I should speak to a trusted person, counselor, therapist, doctor, peer support person, or emergency support service.

Safety note to include at the end:
If I feel unsafe, at risk of harming myself, unable to function, or overwhelmed by flashbacks or panic, I should contact a trusted person or local emergency/mental health support immediately. ${professionalSupportTagline}

Output requirement:
Generate only the final comprehensive wellness plan and Word-ready record. Make it personal, assignment-specific, emotionally safe, practical, non-clinical, and easy to save. Avoid generic wellness advice, spiritual cliches, "you are strong" platitudes, diagnosing trauma, or blaming me for emotional reactions.`;
}

function bindEvents() {
  document.querySelectorAll("[data-tab]").forEach(button => {
    button.addEventListener("click", () => setState({ tab: button.dataset.tab, activeModal: null }));
  });

  document.querySelectorAll("[data-modal]").forEach(button => {
    button.addEventListener("click", () => setState({ activeModal: button.dataset.modal }));
  });

  document.querySelectorAll("[data-action='close-modal']").forEach(button => {
    button.addEventListener("click", () => setState({ activeModal: null }));
  });

  document.querySelectorAll("[data-close-modal]").forEach(backdrop => {
    backdrop.addEventListener("click", event => {
      if (!event.target.closest("[data-modal-panel]")) setState({ activeModal: null });
    });
  });

  const login = document.querySelector("[data-action='login']");
  if (login) {
    login.addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(login);
      setState({ user: { name: form.get("name"), role: form.get("role") } });
    });
  }

  const logout = document.querySelector("[data-action='logout']");
  if (logout) {
    logout.addEventListener("click", () => setState({ user: null, tab: "home", activeModal: null }));
  }

  const assignment = document.querySelector("[data-action='save-assignment']");
  if (assignment) {
    assignment.addEventListener("submit", saveAssignment);
  }

  document.querySelectorAll("[data-check]").forEach(input => {
    input.addEventListener("change", () => updateLatestList("checks", input.dataset.check, input.checked));
  });

  document.querySelectorAll("[data-plan]").forEach(input => {
    input.addEventListener("change", () => updateLatestList("recovery", input.dataset.plan, input.checked));
  });

  document.querySelectorAll("[data-reminder]").forEach(button => {
    button.addEventListener("click", () => {
      const reminders = state.reminders.map(reminder => reminder.id === button.dataset.reminder ? { ...reminder, done: true } : reminder);
      setState({ reminders });
    });
  });

  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", () => copyGeneratedText(button.dataset.copy));
  });
}

async function copyGeneratedText(kind) {
  const latest = latestAssignment();
  if (!latest) return;
  const text = kind === "prompt" ? generateWellnessPlanPrompt(latest) : generateWellnessReport(latest);
  try {
    await navigator.clipboard.writeText(text);
    setState({ copyNotice: kind === "prompt" ? "LLM prompt copied. Review sensitive details before pasting into another tool." : "Wellness report copied." });
  } catch {
    setState({ copyNotice: "Copy was blocked by the browser. Select the text below and copy it manually." });
  }
}

function saveAssignment(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const createdAt = new Date().toISOString();
  const id = crypto.randomUUID();
  const entry = {
    id,
    title: form.get("title"),
    assignmentType: form.get("assignmentType"),
    locationContext: form.get("locationContext"),
    date: form.get("date"),
    summary: form.get("summary"),
    affected: form.get("affected"),
    people: form.get("people"),
    sensoryDetails: form.get("sensoryDetails"),
    emotions: form.get("emotions"),
    strongestEmotion: form.get("strongestEmotion"),
    bodyReactions: form.get("bodyReactions"),
    safetyLevel: form.get("safetyLevel"),
    workCapacity: form.get("workCapacity"),
    newsroomSupport: form.get("newsroomSupport"),
    workPressure: form.get("workPressure"),
    dismissed: form.get("dismissed"),
    need: form.get("need"),
    recoveryNeed: form.get("recoveryNeed"),
    tone: form.get("tone"),
    notes: form.get("notes"),
    mood: form.get("mood"),
    checks: [],
    recovery: [],
    createdAt
  };
  const reminders = [
    [24, "24-hour"],
    [72, "72-hour"],
    [168, "7-day"]
  ].map(([hours, label]) => ({
    id: crypto.randomUUID(),
    assignmentId: id,
    title: entry.title,
    label,
    when: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString(),
    done: false
  }));
  requestNotification(`${entry.title} saved. Check-ins queued for 24 hours, 72 hours, and 7 days.`);
  setState({
    assignments: [entry, ...state.assignments],
    reminders: [...reminders, ...state.reminders],
    activeModal: null,
    tab: "check"
  });
}

function updateLatestList(key, value, enabled) {
  const latest = latestAssignment();
  if (!latest) return;
  const assignments = state.assignments.map(entry => {
    if (entry.id !== latest.id) return entry;
    const list = new Set(entry[key] || []);
    enabled ? list.add(value) : list.delete(value);
    return { ...entry, [key]: [...list] };
  });
  setState({ assignments });
}

function requestNotification(message) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("AfterCopy", { body: message });
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") new Notification("AfterCopy", { body: message });
    });
  }
}

render();
