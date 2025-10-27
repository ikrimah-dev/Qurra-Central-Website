(function(){
  const data = (window.QURRA_DATA || []).slice(); // shallow copy to keep stable order
  // Elements
  const grid = document.getElementById('qariGrid');
  const q = id => document.getElementById(id);
  const searchInput = q('searchInput');
  const countrySelect = q('countrySelect');
  const paceSelect = q('paceSelect');
  const sortSelect = q('sortSelect');
  const ijazahOnly = q('ijazahOnly');

  // Populate countries
  const countries = Array.from(new Set(data.map(d => d.country))).sort();
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    countrySelect.appendChild(opt);
  });

  // Render helpers
  function badgeSet(qari){
    const badges = [];
    if (qari.ijazah) badges.push('<span class="badge badge-ijazah">Ijāzah</span>');
    if (qari.qiraat?.includes('Hafs')) badges.push('<span class="badge badge-hafs">Hafs</span>');
    if (qari.qiraat?.some(q=>/Sab/.test(q))) badges.push('<span class="badge badge-sabaa">Sab‘ah (7)</span>');
    if (qari.qiraat?.some(q=>/Ashr|‘Ashr|Ash/.test(q))) badges.push('<span class="badge badge-ashr">‘Ashr (10)</span>');
    if (qari.popular >= 8) badges.push('<span class="badge badge-popular">Popular</span>');
    return badges.join(' ');
  }

  function card(qari){
    const id = `rec-${qari.id}`;
    return `
      <article class="card" data-id="${qari.id}">
        <img class="card-img" src="${qari.portrait}" alt="${qari.name} portrait" />
        <div class="card-body">
          <h3>${qari.name}</h3>
          <div class="tags">${badgeSet(qari)}</div>
          <p class="muted">${qari.country}</p>
          <p>${qari.bio}</p>
          <div class="actions">
            <button class="btn btn-solid" data-toggle="${id}">Show recordings</button>
          </div>
          <p class="src">Source: <a href="${qari.sourceUrl}" target="_blank" rel="noopener">${qari.source}</a></p>
        </div>
        <div id="${id}" class="recordings" aria-hidden="true">
          ${qari.recordings.map(r => `
            <div class="rec">
              <strong>${r.title}</strong>
              <audio controls preload="none">
                <source src="${r.url}" type="audio/mpeg" />
              </audio>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }

  function applyFilters(){
    const term = (searchInput.value || "").toLowerCase().trim();
    const country = countrySelect.value;
    const pace = paceSelect.value;
    const ijOnly = ijazahOnly.checked;
    const sort = sortSelect.value;

    let rows = data.filter(d => {
      if (ijOnly && !d.ijazah) return false;
      if (country && d.country !== country) return false;
      if (pace && !(d.pace||[]).includes(pace)) return false;

      if (term){
        const hay = [
          d.name, d.country, d.bio,
          ...(d.qiraat||[]), ...(d.pace||[])
        ].join(" ").toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });

    if (sort === 'popular'){
      rows = rows.slice().sort((a,b)=> b.popular - a.popular);
    } else if (sort === 'qualified'){
      // Prioritize ‘Ashr, then Sab‘ah, then Hafs-only
      const rank = r => (r.qiraat?.some(q=>/Ashr|‘Ashr|Ash/.test(q)) ? 3 :
                         r.qiraat?.some(q=>/Sab/.test(q)) ? 2 :
                         r.qiraat?.includes('Hafs') ? 1 : 0);
      rows = rows.slice().sort((a,b)=> rank(b) - rank(a) || b.popular - a.popular);
    } // default = keep original order (stable)

    // Paint
    grid.innerHTML = rows.map(card).join("");

    // Bind toggles (no resorting on toggle, so order stays stable)
    grid.querySelectorAll('[data-toggle]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = btn.getAttribute('data-toggle');
        const el = document.getElementById(id);
        const isOpen = el.classList.contains('open');
        if (isOpen){
          el.classList.remove('open');
          el.setAttribute('aria-hidden','true');
          btn.textContent = 'Show recordings';
        } else {
          el.classList.add('open');
          el.setAttribute('aria-hidden','false');
          btn.textContent = 'Hide recordings';
        }
      });
    });
  }

  // Events
  [searchInput, countrySelect, paceSelect, sortSelect, ijazahOnly].forEach(el=>{
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
  });

  // Initial render
  applyFilters();
})();
