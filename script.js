const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const balance = $("#total-balance");
const income = $("#total-income");
const expense = $("#total-expense");
const list = $("#transaction-list");
const form = $("#transaction-form");
const descriptionInput = $("#description");
const amountInput = $("#amount");
const categoryInput = $("#category");
const modal = $("#modalOverlay");
const openModalBtn = $("#openModal");
const closeModalBtn = $("#closeModal");
const searchInput = $("#search-input");
const filterBtns = $$(".filter-btn");

const categoryIcons = {
  salary:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v8"></path><path d="M9.5 10.2c0-1.1 1-2 2.5-2s2.5.9 2.5 2-1 2-2.5 2-2.5.9-2.5 2 1 2 2.5 2 2.5-.9 2.5-2"></path></svg>',
  food:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3v8"></path><path d="M11 3v8"></path><path d="M8 7h3"></path><path d="M9.5 11v10"></path><path d="M15 3v20"></path><path d="M15 3c2.5 0 3 2.8 3 5.5S17.5 14 15 14"></path></svg>',
  entertainment:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="M10 9.5L15 12l-5 2.5z"></path></svg>',
  shopping:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1.2 11H6.2z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg>',
  utilities:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L5 13h6l-1 9 8-11h-6z"></path></svg>',
  other:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M9 12h6"></path><path d="M12 9v6"></path></svg>',
};

const deleteIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V5h6v2"></path><path d="M8 7l1 12h6l1-12"></path><path d="M10.5 10.5v6"></path><path d="M13.5 10.5v6"></path></svg>';

function loadTransactions() {
  const raw = localStorage.getItem("transactions");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => {
      const aId = Number(a?.id);
      const bId = Number(b?.id);
      if (Number.isFinite(aId) && Number.isFinite(bId)) return aId - bId;
      return 0;
    });
  } catch {
    return [];
  }
}

let transactions = loadTransactions();
let currentFilter = "all";

function addTransaction(e) {
  e.preventDefault();

  const type = $('input[name="transaction-type"]:checked').value;
  const category = categoryInput.value;
  const description = descriptionInput.value.trim();
  const rawAmount = Number.parseFloat(amountInput.value);

  if (!description || Number.isNaN(rawAmount) || rawAmount <= 0) return;

  const signedAmount =
    type === "expense" ? -Math.abs(rawAmount) : Math.abs(rawAmount);

  const transaction = {
    id: Date.now(),
    text: description,
    amount: signedAmount,
    type,
    category,
    date: new Date().toLocaleDateString(),
  };

  transactions.push(transaction);
  updateLocalStorage();
  init();

  form.reset();
  modal.classList.remove("active");
}

function removeTransaction(id) {
  const transactionId = Number(id);
  transactions = transactions.filter((t) => t.id !== transactionId);
  updateLocalStorage();
  init();
}

window.removeTransaction = removeTransaction;

function updateLocalStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function updateValues() {
  const totals = transactions.reduce(
    (acc, transaction) => {
      const amt = Number(transaction.amount) || 0;
      acc.total += amt;
      if (amt >= 0) acc.inc += amt;
      else acc.exp += amt;
      return acc;
    },
    { total: 0, inc: 0, exp: 0 },
  );

  balance.innerText = `$${totals.total.toFixed(2)}`;
  income.innerText = `$${totals.inc.toFixed(2)}`;
  expense.innerText = `$${Math.abs(totals.exp).toFixed(2)}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTransactions() {
  list.innerHTML = "";

  let filtered = [...transactions];
  const query = searchInput.value.trim().toLowerCase();

  if (query) {
    filtered = filtered.filter((t) =>
      String(t.text || "")
        .toLowerCase()
        .includes(query),
    );
  }

  if (currentFilter !== "all") {
    filtered = filtered.filter((t) => t.type === currentFilter);
  }

  filtered.forEach((transaction) => {
    const amountValue = Number(transaction.amount) || 0;
    const sign = amountValue < 0 ? "-" : "+";
    const itemClass = amountValue < 0 ? "amount-expense" : "amount-income";
    const item = document.createElement("li");

    item.classList.add("transaction-item");
    item.innerHTML = `
      <div class="item-icon" aria-hidden="true">${categoryIcons[transaction.category] || categoryIcons.other}</div>
      <div class="item-details">
        <p>${escapeHtml(String(transaction.text || ""))}</p>
        <span>${escapeHtml(String(transaction.date || ""))}</span>
      </div>
      <div class="item-amount ${itemClass}">
        ${sign}$${Math.abs(amountValue).toFixed(2)}
      </div>
      <button type="button" class="delete-btn" onclick="removeTransaction(${transaction.id})" aria-label="Delete transaction">
        ${deleteIcon}
      </button>
    `;

    list.appendChild(item);
  });
}

function init() {
  renderTransactions();
  updateValues();
}

form.addEventListener("submit", addTransaction);
openModalBtn.addEventListener("click", () => modal.classList.add("active"));
closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.remove("active");
});

searchInput.addEventListener("input", renderTransactions);

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTransactions();
  });
});

init();
