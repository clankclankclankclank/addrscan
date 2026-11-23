const form = document.querySelector('form');
const address = document.querySelector('#address');
const network = document.querySelector('#network');
const submit = form.querySelector('[type=submit]');
const samples = [...form.querySelectorAll('[data-address]')];
const submitLabel = document.querySelector('#submit-label');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const status = document.querySelector('#status');
const results = document.querySelector('#results');
const summary = document.querySelector('#risk-summary');
const coverage = document.querySelector('#coverage');
const signals = document.querySelector('#signals');
const details = document.querySelector('#details');
const explorer = document.querySelector('#explorer');
const providers = document.querySelector('#providers');
const loader = document.querySelector('#scan-loader');
const phase = document.querySelector('#scan-phase');

async function loadNetworks() {
  try {
    const response = await fetch('/api/networks');
    if (!response.ok) throw new Error();
    const supported = await response.json();
    network.replaceChildren(...supported.map(({ id, name }) => new Option(name, id)));
  } catch {
    status.textContent = 'The network list is unavailable. Ethereum lookup is still available.';
  }
}

loadNetworks();
for (const sample of samples) {
  sample.addEventListener('click', () => {
    network.value = 'ethereum';
    address.value = sample.dataset.address;
    form.requestSubmit();
  });
}

// Spendbay's CSV import lattice, adapted for concurrent provider requests.
for (const step of [0, 1, 2, 7, 8, 3, 6, 5, 4]) {
  const cell = document.createElement('i');
  cell.style.setProperty('--step', step);
  loader.querySelector('.lattice').append(cell);
}

// Adapted from Spendbay's React Bits Count Up. Keep the exact value accessible.
function animateBalance(element, { atomic, decimals, unit }) {
  if (reducedMotion.matches) return;
  const units = BigInt(atomic) / 10n ** BigInt(decimals - 4);
  if (units === 0n) return;
  const exact = element.textContent;
  const accessible = document.createElement('span');
  accessible.className = 'sr-only';
  accessible.textContent = exact;
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.textContent = `0.0000 ${unit}`;
  element.replaceChildren(accessible, visual);

  const start = performance.now();
  function tick(now) {
    if (!element.isConnected || results.hidden) return;
    const progress = Math.min(1, (now - start) / 650);
    if (progress >= 1 || reducedMotion.matches) {
      element.textContent = exact;
      return;
    }
    const eased = 1 - (1 - progress) ** 3;
    const digits = (units * BigInt(Math.floor(eased * 1000)) / 1000n).toString().padStart(5, '0');
    visual.textContent = `${digits.slice(0, -4)}.${digits.slice(-4)} ${unit}`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function providerRow(report) {
  const row = document.createElement('li');
  const provider = document.createElement('div');
  const name = document.createElement('strong');
  const metric = document.createElement('small');
  const value = document.createElement('div');
  name.textContent = report.name;
  metric.textContent = report.metric;
  provider.append(name, metric);
  value.className = `provider-value ${report.state}`;

  if (report.state === 'unsupported') {
    value.textContent = 'Unsupported on this network';
  } else if (report.state === 'error') {
    value.textContent = report.error;
  } else if (report.signals) {
    const flagged = report.signals.filter(signal => signal.status === 'Flagged').length;
    const unknown = report.signals.filter(signal => signal.status === 'Unknown').length;
    value.textContent = flagged ? `${flagged} flagged` : unknown === report.signals.length ? 'No risk data' : 'No flags reported';
    if (unknown && unknown !== report.signals.length) value.textContent += ` · ${unknown} unknown`;
    value.classList.toggle('flagged', flagged > 0);
  } else if (report.id === 'anchain') {
    value.textContent = `${report.score}/100 · ${['Low', 'Guarded', 'Elevated', 'Severe'][report.level - 1]}`;
    value.classList.toggle('flagged', report.level >= 3);
    if (report.labels.length) {
      const labels = document.createElement('small');
      labels.textContent = report.labels.join(', ');
      value.append(labels);
    }
  } else if (report.id === 'alchemy') {
    value.textContent = `${report.count.toLocaleString()} NFTs`;
  } else {
    const amount = document.createElement('span');
    amount.textContent = `${report.amount} ${report.unit}`;
    value.append(amount);
    animateBalance(amount, report);
    if (Number.isSafeInteger(report.transactions)) {
      const activity = document.createElement('small');
      activity.textContent = `${report.transactions.toLocaleString()} transactions`;
      value.append(activity);
    }
  }
  row.append(provider, value);
  return row;
}

function render(result) {
  const { reports } = result;
  const goplus = reports.find(report => report.id === 'goplus');
  const anchain = reports.find(report => report.id === 'anchain');
  const checks = goplus.signals ?? [];
  const flagged = checks.some(signal => signal.status === 'Flagged') || anchain.level >= 3;
  const assessed = checks.some(signal => signal.status !== 'Unknown') || anchain.state === 'ok';
  summary.textContent = flagged ? 'Risk signals reported' : assessed ? 'No elevated risk reported' : 'Risk data unavailable';
  summary.classList.toggle('flagged', flagged);
  const supported = reports.filter(report => report.state !== 'unsupported').length;
  const responded = reports.filter(report => report.state === 'ok').length;
  coverage.textContent = `${responded} of ${supported} applicable providers returned results`;
  explorer.hidden = !result.explorer;
  if (result.explorer) explorer.href = result.explorer;
  else explorer.removeAttribute('href');

  providers.replaceChildren(...reports.map(providerRow));
  signals.replaceChildren();
  details.hidden = !checks.length;
  details.open = false;
  for (const signal of checks) {
    const row = document.createElement('li');
    const label = document.createElement('span');
    const value = document.createElement('span');
    label.textContent = signal.label;
    value.textContent = signal.status;
    value.classList.toggle('flagged', signal.status === 'Flagged');
    row.append(label, value);
    signals.append(row);
  }
  status.textContent = `${result.network} · ${result.address}`;
  results.hidden = false;
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submit.disabled) return;

  results.hidden = true;
  const value = address.value.trim();
  if (!value) {
    status.textContent = 'Enter a public address.';
    address.focus();
    return;
  }

  submit.disabled = true;
  network.disabled = true;
  address.readOnly = true;
  submit.classList.add('is-loading');
  submitLabel.textContent = 'Scanning…';
  for (const sample of samples) sample.disabled = true;
  loader.hidden = false;
  status.textContent = '';
  phase.textContent = 'Requesting provider reports…';
  const nextPhase = setTimeout(() => { phase.textContent = 'Waiting for provider responses…'; }, 500);
  try {
    const params = new URLSearchParams({ address: value, network: network.value });
    const lookup = fetch(`/api/check?${params}`).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    });
    const minimum = new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 0 : 650));
    const [result] = await Promise.all([lookup, minimum]);
    render(result);
  } catch (error) {
    status.textContent = error.message || 'The check could not be completed.';
  } finally {
    clearTimeout(nextPhase);
    loader.hidden = true;
    submit.disabled = false;
    network.disabled = false;
    address.readOnly = false;
    submit.classList.remove('is-loading');
    submitLabel.textContent = 'Scan';
    for (const sample of samples) sample.disabled = false;
  }
});
