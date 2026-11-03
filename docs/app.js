'use strict';
// Touch focus must not inherit a native keyboard focus ring on iOS.
document.addEventListener('pointerdown',()=>{document.documentElement.dataset.input='pointer';},{passive:true,capture:true});
document.addEventListener('keydown',e=>{if(e.key==='Tab')document.documentElement.dataset.input='keyboard';},true);
const paths={home:'M3 11 12 3l9 8M5 9v12h14V9M9 21v-7h6v7',vehicle:'M3 11l2-6h14l2 6v7H3z M3 11h18M6 15h2m8 0h2M5 18v3m14-3v3',person:'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4 21v-3c0-3 3-5 8-5s8 2 8 5v3',bolt:'m14 2-9 12h6l-1 8 9-12h-6z',chip:'M6 6h12v12H6z M9 9h6v6H9z M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4',pack:'M5 7h14v14H5z M9 7V3h6v4M5 12h14m-9 0v3h4v-3',journal:'M5 3h14v18H5z M9 7h6m-6 5h6m-6 5h4',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',target:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 1v5m0 12v5M1 12h5m12 0h5',command:'M3 5h18v14H3z M7 9l3 3-3 3m6 0h4',body:'m5 8 3-4h3v6l3-2 4 2 3 6-4 4H8l-5-4z',reflex:'m13 2-5 7 6 2-6 11m6-11 5 3M3 7h3m-5 6h4m-1 5h3',heart:'M12 21 3 12C-2 5 7 0 12 6c5-6 14-1 9 6ZM3 12h5l2-4 3 8 2-4h6',brain:'M12 3C8-1 4 5 6 7 1 7 1 14 5 15c-2 5 4 8 7 4V3Zm0 0c4-4 8 2 6 4 5 0 5 7 1 8 2 5-4 8-7 4M7 8l3 3m-5 4h4m8-7-3 3m5 4h-4',tool:'M14 3a6 6 0 0 0-7 8L2 17l5 5 6-6a6 6 0 0 0 8-7l-4 4-5-5z',cool:'M4 8h6l2 2 2-2h6l-1 7h-5l-2-3-2 3H5z M2 8h20M7 3h10',info:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 10v7m0-10v1',arrow:'M4 12h16m-6-6 6 6-6 6',shield:'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6z',warning:'m12 3 10 18H2z M12 9v6m0 2v1'};
const icon=n=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.chip}"/></svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>n>=0?`+${n}`:`−${Math.abs(n)}`;
const skills=[['Athletics','BOD'],['Acrobatics','REF'],['Sleight of Hand','REF'],['Stealth','REF'],['Technology','INT'],['Science','INT'],['History','INT'],['Investigation','INT'],['Nature','INT'],['Animal Handling','COOL'],['Insight','COOL'],['Medicine','TECH'],['Perception','INT'],['Survival','INT'],['Deception','COOL'],['Intimidation','COOL'],['Performance','COOL'],['Persuasion','COOL']];
const nav=[['character','person','Character'],['programs','bolt','Programs'],['cyberware','chip','Cyberware'],['inventory','pack','Inventory'],['journal','journal','Journal']];
let selectedChrome='eyes';
let classReference=null;
const level=()=>sheet.identity.level;
const attrMod=key=>sheet.attributes.find(a=>a.key===key).modifier;
const fragmentActive=()=>sheet.cyberware.some(c=>c.id==='fragment'&&c.installed);
const formatMoment=value=>{const [date,time]=value.split('T');return date.split('-').reverse().join(' / ')+' · '+time.slice(0,5);};
let sheet,active='character',programFilter='all',programSearch='',returnFocus=null;
const scrollPositions={};
let inventoryViewMode='on-you';
let inventoryLocation=null;
const inventorySelections={};
const softwareOnline=()=>sheet.resources.software_online!==false;
const slotDisplay=()=>softwareOnline()?`${sheet.resources.slots_current??sheet.resources.slots_preview} / ${sheet.resources.slot_max}`:'OFFLINE';
const programDisplay=()=>softwareOnline()?`Attack ${signed(sheet.derived.program_attack)} · Save DC ${sheet.derived.program_dc}`:'Runtime not installed';
const main=document.getElementById('main');
const dialog=document.getElementById('detail');
function row(id,name,sub,side='',symbol='chip'){return `<button class="record-row" data-detail="${esc(id)}"><span class="record-icon">${icon(symbol)}</span><span class="record-main"><strong>${esc(name)}</strong><small>${esc(sub)}</small></span>${side?`<span class="record-side">${side}</span>`:''}<span class="chevron"></span></button>`;}
function title(kicker,name,right=''){return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${name}</h1></div>${right}</div>`;}
function render(){
 document.getElementById('navigation').innerHTML=nav.map(([id,i,n])=>`<a href="#${id}" class="nav-link"${active===id?' aria-current="page"':''}>${icon(i)}<span>${n}</span></a>`).join('');
 const renderers={character:characterView,programs:programsView,cyberware:cyberwareView,inventory:inventoryView,journal:journalView};
 main.innerHTML=renderers[active]();
 renderClock();
 document.getElementById('sheet-footer').textContent=`${sheet.identity.name.toUpperCase()} / ${sheet.identity.class.toUpperCase()} ${level()}`;
 document.title=`${nav.find(x=>x[0]===active)[2]} · RONIN`;
 if(active==='programs')renderProgramList();
 if(active==='inventory')renderInventoryResults();
}
function renderClock(){const c=sheet.clock,pad=n=>n==null?'—':String(n).padStart(2,'0');document.getElementById('story-clock').innerHTML=`<span>${esc(c.location.toUpperCase())}</span><time aria-label="Story date and local time">${pad(c.day)} / ${pad(c.month)} / ${c.year} <b>${pad(c.hour)}:${pad(c.minute)}</b></time>`;}
function characterView(){const d=sheet.derived;return `${title('Personal Record','Character',`<span class="tag">${esc(sheet.identity.architecture||"Architecture Unselected")}</span>`)}
 <div class="character-layout"><section class="portrait-card" aria-label="Fen Vikutā appearance"><span class="corner"></span><div class="portrait"><img src="./${sheet.identity.art}?v=${encodeURIComponent(sheet.snapshot.release)}" alt="Fen, with silver-white hair, cyan eyes, a charcoal jacket over a black Kevlar vest and grey shirt, with black trousers"></div><div class="portrait-bottom"><div class="eyebrow">CORPORATE RESEARCHER</div><h2>FEN<br>VIKUTĀ</h2><p>${sheet.identity.age} · ${esc(sheet.identity.origin)}</p><p>${esc(sheet.identity.class)}${sheet.identity.architecture?" / "+esc(sheet.identity.architecture):""}</p><p class="muted">${esc(sheet.identity.specialty)}</p></div><button class="portrait-open" data-detail="profile" aria-label="Fen Vikutā — Personal Record"></button></section>
 <div class="stats-column"><div class="level-strip"><div class="level-box"><small>LEVEL</small>${String(level()).padStart(2,'0')}</div><div class="xp-track"><div class="meter-label"><span>EXPERIENCE</span><span>${sheet.resources.xp} / ${sheet.resources.next_level_xp}</span></div><div class="meter" role="progressbar" aria-label="Experience toward level ${level()+1}" aria-valuenow="${sheet.resources.xp}" aria-valuemin="0" aria-valuemax="${sheet.resources.next_level_xp}"><span style="width:${Math.min(100,sheet.resources.xp/sheet.resources.next_level_xp*100)}%"></span></div></div><div class="cash"><small>AVAILABLE</small>€$ ${sheet.finances.cash}</div></div>
 <div class="vitals"><button class="vital" data-detail="health"><label>Health</label><strong>${sheet.resources.hp_current ?? "—"} <em>/ ${d.hp_max}</em></strong><small>${sheet.resources.hp_current===d.hp_max?"Full health":"Current HP"}</small></button><button class="vital" data-detail="defence"><label>Armour Class</label><strong>${d.ac}</strong><small>${esc(sheet.inventory.find(i=>i.equipped&&i.armour_category)?.name||"Unarmoured")}</small></button><button class="vital" data-detail="initiative"><label>Initiative</label><strong>${signed(d.initiative)}</strong><small>Reflexes</small></button><button class="vital" data-detail="movement"><label>Movement</label><strong>${d.speed_ft} <em>ft</em></strong><small>${Math.round(d.speed_ft*0.3048)} metres</small></button></div>
 <div class="section-label">Attributes <small>27 / 27 POINT BUY · HUMAN</small></div><div class="attributes">${sheet.attributes.map((a,i)=>`<button class="attribute" data-detail="attr-${a.key}" aria-label="${a.name} ${a.score}, modifier ${signed(a.modifier)}"><div class="attr-top"><span class="attr-name">${a.name}</span>${icon(['body','reflex','heart','brain','tool','cool'][i])}</div><strong>${a.score}</strong><span class="modifier">${signed(a.modifier)}<small>MODIFIER</small></span></button>`).join('')}</div>
 <div class="two-col"><section class="panel"><h2>Burst Processing</h2><div class="resource-line">${slotDisplay()} <span class="muted">TIER ${sheet.resources.slot_tier}</span></div><p>${programDisplay()}</p><button class="text-button" data-detail="burst-processing">Execution Rules ${icon('arrow')}</button></section><section class="panel"><h2>Neural Capacity</h2><div class="resource-line">${d.load} / ${d.current_tolerance} <span class="muted">LOAD</span></div><p>${fragmentActive()?'Fragment-enhanced Tolerance':'Native Tolerance + Adaptation'}</p><button class="text-button" data-detail="capacity">Capacity Rules ${icon('arrow')}</button></section></div>
 <div class="wide-section condition">${icon('warning')}<div>RESTRICTED OPTICS<span>Disadvantage on sight-based Perception.</span></div></div></div></div>
 <section class="wide-section class-reference-entry"><div class="record-list">${row('class-reference','Contractor [Warlock]','Class Reference · Progression, Architectures & Software','','journal')}</div></section>
 <section class="wide-section"><div class="section-label">Abilities & Training <small>LEVEL ${level()}</small></div><div class="two-col"><div class="record-list">${row('skills','Skills & Saving Throws','All 18 skills, six saves and passive checks',`${signed(sheet.proficiencies.bonus)}<small>PROFICIENCY</small>`,'brain')}${sheet.features.filter(f=>!['burst-processing','research-network'].includes(f.id)).map(f=>row(f.id,f.name,(!softwareOnline()&&f.id==='semantic-link')?'Offline · Runtime not installed':f.summary,'','target')).join('')}</div><div class="record-list">${row('research-network','Research Network','Corporate Researcher background','','journal')}${row('training','Training & Progression','Languages, tools, equipment proficiencies and next level','','tool')}</div></div></section>`;}
function programsView(){return `${title('Operational software','Programs',`<span class="tag">${sheet.programs.filter(p=>p.tier===0).length} UTILITIES · ${sheet.programs.filter(p=>p.tier>0).length} / ${sheet.resources.programs_known_max} PROGRAMS</span>`)}<div class="two-col"><section class="panel"><div class="resource-line">${slotDisplay()} <span class="muted">EXECUTION SLOTS · TIER ${sheet.resources.slot_tier}</span></div><p>Restored by a Short Rest or Long Rest. Utilities cost no Execution Slot.</p></section><section class="panel"><div class="resource-line">${programDisplay()}</div><p>Cool-based execution · Technology ${signed(attrMod('INT')+sheet.proficiencies.bonus)} for intrusion</p></section></div><div class="toolbar"><input class="search" id="program-search" type="search" placeholder="Search programs or original names…" aria-label="Search programs" value="${esc(programSearch)}">${[['all','All Software'],['utility','Utilities'],['tier1','Tier 1']].map(([id,label])=>`<button class="filter" data-filter="${id}" aria-pressed="${programFilter===id}">${label}</button>`).join('')}</div><div id="program-list" class="program-grid" aria-live="polite"></div><button class="text-button" data-detail="intrusion">Electronic Access ${icon('arrow')}</button>`;}
function renderProgramList(){const found=sheet.programs.filter(p=>(programFilter==='all'||(programFilter==='utility'?p.tier===0:p.tier===1))&&`${p.name} ${p.original} ${p.summary}`.toLowerCase().includes(programSearch.toLowerCase()));document.getElementById('program-list').innerHTML=found.map(p=>`<button class="program-card" data-detail="program-${p.id}"><span class="program-top">${icon(p.icon)}<span>${!softwareOnline()?'OFFLINE':p.tier===0?'UTILITY · AT WILL':'TIER 1 · 1 SLOT'}</span></span><h2>${p.name}</h2><div class="source-name">[${p.original}]</div><p>${p.summary}</p><div class="program-meta"><span>${p.action.toUpperCase()}</span><span>${p.range.toUpperCase()}</span><span>${p.concentration?'CONCENTRATION':p.duration.toUpperCase()}</span></div><span class="chevron"></span></button>`).join('')||'<div class="empty"><strong>No matching software</strong></div>';}
function chromeDetail(){const c=sheet.cyberware.find(c=>c.id===selectedChrome)||sheet.cyberware[0];return `<div class="hardware-detail-top"><span class="eyebrow">${esc(c.site)}</span><span>${c.load} LOAD</span></div><h2>${esc(c.name)}</h2><p class="hardware-model">${esc(c.model)}</p><div class="hardware-condition ${c.id==='eyes'?'impaired':''}">${icon(c.id==='eyes'?'warning':'chip')}<span>${c.id==='eyes'?'Restricted Vision':(c.condition||'Obsolete External Retrofit')}</span></div>${ruleSections(c.detail,c.id==='fragment'?[["Socket","Occupies"],["Active Benefits","While operating"],["Execution","Supplies"],["Removal","Removal"]]:c.id==='neuroport'?[["Construction","Decades-old"],["Connections","Two exposed"],["Concealment","Fen conceals"],["Exposed Parts","Exposed connections"],["Functions","Retains"]]:[["Optics","Cyclops"],["Option Slots","Each eye"],["Advertising","Persistent"],["Passive Perception","Passive Perception"]])}`;}
function cyberwareView(){const d=sheet.derived;return `${title('Installed cyberware','Cyberware')}
<section class="chrome-capacity" aria-label="Cyberware capacity"><div class="chrome-load"><span>LOAD</span><strong>${d.load}<small> / ${d.current_tolerance}</small></strong></div><div class="chrome-capacity-track"><div class="chrome-capacity-label"><span>NEURAL TOLERANCE</span><span>CURRENT CAPACITY</span></div><div class="chrome-rail" aria-hidden="true"><span style="width:${Math.min(100,d.load/d.current_tolerance*100)}%"></span></div><div class="chrome-capacity-label"><span>${d.native_tolerance} native${fragmentActive()?' × 2 Fragment':''}</span><span>+${d.adaptation} Adaptation</span></div></div></section>
<div class="hardware-workbench"><div class="hardware-catalogue" role="group" aria-label="Installed cyberware">${sheet.cyberware.map(c=>`<button class="hardware-tile" data-chrome="${c.id}" aria-pressed="${selectedChrome===c.id}" aria-controls="hardware-details"><span class="hardware-site">${icon(c.icon)}${esc(c.site)}</span><span class="hardware-art ${c.id}" aria-hidden="true"></span><span class="hardware-title">${esc(c.name)}</span><span class="hardware-grade">${esc(c.display_grade||(c.id==='neuroport'?'SALVAGE':'REFURBISHED'))} <span>${c.load} LOAD</span></span></button>`).join('')}</div><section id="hardware-details" class="hardware-details" aria-live="polite">${chromeDetail()}</section></div>
`;}
function selectChrome(id){if(!sheet.cyberware.some(c=>c.id===id))return;selectedChrome=id;document.querySelectorAll('[data-chrome]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.chrome===id));document.getElementById('hardware-details').innerHTML=chromeDetail();}
// Category is a presentation label; location and holdings remain authoritative.
const inventoryCategories=[['weapons','Weapons'],['armour-clothing','Armour & Clothing'],['tech-tools','Tech & Tools'],['medical','Medical'],['personal','Personal Items'],['vehicles','Vehicles'],['food-drink','Food & Drink'],['furnishings','Furnishings & Storage'],['other','Other Gear']];
const inventoryCoreCategories=['weapons','armour-clothing','tech-tools','medical','personal','vehicles'];
const inventoryCategoryById={
 'tamayura':'weapons','clothes-0133':'armour-clothing','kevlar-vest-0216':'armour-clothing',
 'tamayura-holster':'armour-clothing','tamayura-spare-magazine':'weapons','tamayura-ammunition':'weapons',
 'agent-grade-a':'tech-tools','keys-unit4':'personal','cigarettes-shinsei-red':'personal','lighter':'personal',
 'shard-case':'furnishings','folding-cot-0218':'furnishings','blankets-0218':'furnishings','pillow-0218':'furnishings',
 'meals':'food-drink','water':'food-drink'
};
const inventoryCategoryIcons={weapons:'target','armour-clothing':'shield','tech-tools':'tool',medical:'heart',vehicles:'vehicle','food-drink':'pack',personal:'person',furnishings:'pack',other:'pack'};
function inventoryCategory(item){const id=item.category||inventoryCategoryById[item.id];return inventoryCategories.some(c=>c[0]===id)?id:'other';}
function inventoryTile(attribute,id,label,sub,symbol,count){return `<button class="inventory-tile" ${attribute}="${esc(id)}"><span class="inventory-tile-top">${icon(symbol)}<small>${count} ${count===1?'ENTRY':'ENTRIES'}</small></span><strong>${esc(label)}</strong>${sub?`<span class="inventory-tile-sub">${esc(sub)}</span>`:''}<span class="chevron" aria-hidden="true"></span></button>`;}
function renderInventoryResults(focusSelector=null){
 const root=document.getElementById('inventory-results');
 const location=inventoryViewMode==='on-you'?{id:'on-person',name:'On You',area:''}:sheet.storage_locations.find(l=>l.id===inventoryLocation);
 let html='';
 if(!location){
  inventoryLocation=null;
  html=`<h2 class="inventory-heading" tabindex="-1">Storage Locations</h2><div class="inventory-tiles inventory-locations">${sheet.storage_locations.map(l=>inventoryTile('data-inventory-location',l.id,l.name,l.area,'home',sheet.inventory.filter(i=>i.location_id===l.id).length)).join('')}</div>`;
  if(!sheet.storage_locations.length)html+='<p class="muted">No storage locations.</p>';
 }else{
  const items=sheet.inventory.filter(i=>i.location_id===location.id);
  const available=inventoryCategories.filter(([id])=>inventoryCoreCategories.includes(id)||items.some(i=>inventoryCategory(i)===id));
  let chosen=inventorySelections[location.id];
  if(!available.some(([id])=>id===chosen))chosen=inventorySelections[location.id]=null;
  const category=available.find(([id])=>id===chosen);
  if(category){
   const selected=items.filter(i=>inventoryCategory(i)===chosen);
   html=`<button class="inventory-back" data-inventory-back="categories">${icon('arrow')} ${esc(location.name)}</button><h2 class="inventory-heading" tabindex="-1">${esc(category[1])}</h2><div class="record-list">${selected.map(i=>row('item-'+i.id,i.name,i.summary,`<small>${esc(i.status.toUpperCase())}</small>`,i.icon)).join('')}</div>`;
   if(!selected.length)html+=`<p class="muted">${chosen==='vehicles'?'No vehicles recorded here.':'No items in this category.'}</p>`;
  }else{
   html=`${inventoryViewMode==='storage'?`<button class="inventory-back" data-inventory-back="locations">${icon('arrow')} Storage Locations</button>`:''}<h2 class="inventory-heading" tabindex="-1">${esc(location.name)}</h2>${location.area?`<p class="inventory-area">${esc(location.area)}</p>`:''}<div class="inventory-tiles">${available.map(([id,label])=>inventoryTile('data-inventory-category',id,label,'',inventoryCategoryIcons[id],items.filter(i=>inventoryCategory(i)===id).length)).join('')}</div>`;
   if(!items.length)html+='<p class="muted">Nothing stored here.</p>';
  }
 }
 root.innerHTML=html;
 if(focusSelector){const target=root.querySelector(focusSelector)||root.querySelector('.inventory-heading');target?.focus({preventScroll:true});}
}
function inventoryView(){return `${title('Possessions','Inventory',`<span class="inventory-cash"><small>CASH</small>€$ ${sheet.finances.cash}</span>`)}
 <div class="inventory-modes" role="group" aria-label="Inventory location">${[['on-you','On You','person'],['storage','Storage','pack']].map(([id,label,symbol])=>`<button data-inventory-view="${id}" aria-controls="inventory-results" aria-pressed="${inventoryViewMode===id}">${icon(symbol)}${label}</button>`).join('')}</div>
 <div id="inventory-results" class="inventory-group"></div>
 <details class="reference-disclosure inventory-account"><summary>Accounts & Living Arrangements</summary><table class="detail-table"><tbody><tr><td>Corporate Accounts</td><td>${esc(sheet.finances.bank)}</td></tr><tr><td>Debt</td><td>${esc(sheet.finances.debt)}</td></tr><tr><td>Trauma Team</td><td>${esc(sheet.finances.trauma_team)}</td></tr><tr><td>Housing</td><td>${esc(sheet.finances.housing)}</td></tr><tr><td>Carry Capacity</td><td>${sheet.derived.carry_lb} lb</td></tr></tbody></table></details>`;
}
document.addEventListener('click',e=>{
 const mode=e.target.closest('[data-inventory-view]');
 if(mode){inventoryViewMode=mode.dataset.inventoryView;document.querySelectorAll('[data-inventory-view]').forEach(b=>b.setAttribute('aria-pressed',b===mode));renderInventoryResults();return;}
 const place=e.target.closest('[data-inventory-location]');
 if(place&&sheet.storage_locations.some(l=>l.id===place.dataset.inventoryLocation)){inventoryLocation=place.dataset.inventoryLocation;inventorySelections[inventoryLocation]=null;renderInventoryResults('.inventory-heading');return;}
 const category=e.target.closest('[data-inventory-category]');
 const locationId=inventoryViewMode==='on-you'?'on-person':inventoryLocation;
 if(category&&inventoryCategories.some(([id])=>id===category.dataset.inventoryCategory)){inventorySelections[locationId]=category.dataset.inventoryCategory;renderInventoryResults('.inventory-heading');return;}
 const back=e.target.closest('[data-inventory-back]');
 if(back){if(back.dataset.inventoryBack==='locations'){const old=inventoryLocation;inventoryLocation=null;renderInventoryResults(`[data-inventory-location="${old}"]`);}else{const old=inventorySelections[locationId];inventorySelections[locationId]=null;renderInventoryResults(`[data-inventory-category="${old}"]`);}}
});
function journalView(){return `${title('Campaign record','Journal',`<span class="tag">${sheet.snapshot.story_started?'CURRENT':'PRE-STORY'}</span>`)}<section class="panel current-scene"><h2>${esc(sheet.snapshot.phase)}</h2><p>${esc(sheet.snapshot.location)}</p></section><div class="journal-layout"><div>${sheet.journal.map(j=>`<article class="journal-entry"><div class="eyebrow">${esc(j.date)} / ${esc(j.type)}</div><h2>${esc(j.title)}</h2>${j.body.split(/\n\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}</article>`).join('')}</div><div><section class="panel"><h2>Field Reference</h2><div class="record-list">${row('health','Rest & Medical Recovery','Resources, HP and persistent injuries','','heart')}${row('intrusion','Electronic Access','Targets, intrusion and execution requirements','','chip')}${row('overrides','Cyberware Overuse & Speedware','Overrides, acceleration and timing','','chip')}${row('training','Progression','XP and the next Contractor unlocks','','journal')}</div></section></div></div>`;}
function openDetail(id){if(id==='class-reference'){openClassReference();return;}dialog.classList.remove('class-reference-dialog');returnFocus=document.activeElement;document.getElementById('detail-kicker').textContent='RONIN / RECORD';let html='';const d=sheet.derived;
 const feature=sheet.features.find(f=>f.id===id);if(feature)html=`<h2>${feature.name}</h2><div class="source-name">[${feature.original}]</div>${!softwareOnline()&&['burst-processing','semantic-link'].includes(feature.id)?'<p class="tag">OFFLINE · RUNTIME NOT INSTALLED</p>':''}${ruleSections(feature.detail,feature.id==='burst-processing'?[["Execution","Cool is"],["Slots & Recovery",`${sheet.resources.slot_max===1?"One tier-1 slot":"Two tier-1 slots"}`],["Concentration","One Concentration"],["Action Economy","If you execute a Bonus Action"],["Requirements","All programs"]]:[])}`;
 if(id.startsWith('program-')){const p=sheet.programs.find(x=>x.id===id.slice(8));if(p)html=`<div class="eyebrow">${p.tier?'TIER 1 PROGRAM':'UTILITY'} / ${p.channel==='D'?'DIRECT QUICKHACK':'PHYSICAL OPERATION'}</div><h2>${p.name}</h2><div class="source-name">[${p.original}]</div><div class="detail-stats"><div><small>Execution</small><strong>${p.action}</strong></div><div><small>Range</small><strong>${p.range}</strong></div><div><small>Duration</small><strong>${p.duration}</strong></div></div>${p.concentration?'<span class="tag">CONCENTRATION</span>':''}${!softwareOnline()?'<p class="tag">OFFLINE · RUNTIME NOT INSTALLED</p>':''}<h3>Effect</h3>${ruleSections(p.effect,p.id==='overheat'?[["Target & Save","One powered"],["Damage","On failure"],["Repeat Saves","After each"],["Shutdown","The target can"]]:p.id==='neural-seizure'?[["Target & Save","Choose one"],["On Failure","On failure"],["Repeat Saves","At the end"],["Incapacitated","Incapacitated creatures"]]:p.id==='short-circuit'?[["Attack","Make one"],["On Hit","On a hit"],["Additional Packets","At total levels"]]:p.id==='vulnerability-tag'?[["Target","Choose a visible"],["Damage & Checks","Your attacks"],["Transfer","After it reaches"],["Software & Mixed Damage","A software-target"]]:p.id==='decoy-projection'?[["Projection","Create one"],["Detection","Physical interaction"],["Ending the Effect","Ends on"]]:[])}<h3>Hardware & Access</h3>${ruleSections(p.requirements)}<h3>Progression</h3>${ruleSections(p.scaling)}`;}
 if(id.startsWith('chrome-')){const c=sheet.cyberware.find(x=>x.id===id.slice(7));if(c)html=`<div class="eyebrow">${c.site} / LOAD ${c.load}</div><h2>${c.name}</h2><div class="source-name">${c.model} · ${c.grade}</div>${ruleSections(c.detail)}<h3>Status</h3><p>${c.status}</p>`;}
 if(id.startsWith('item-')){const i=sheet.inventory.find(x=>x.id===id.slice(5));if(i)html=`<div class="eyebrow">${esc(i.location)} / ${esc(i.status)}</div><h2>${esc(i.name)}</h2><p>${esc(i.summary)}</p>${ruleSections(i.detail)}${i.id==='tamayura'?`<h3>Handling</h3>${ruleSections(sheet.rules.weapon_handling,[["Fire","Arasaka"],["Reload","Detachable"],["Ammunition","Magazine capacity"]])}`:''}`;}
 if(id.startsWith('attr-')){const a=sheet.attributes.find(x=>x.key===id.slice(5));if(a)html=`<h2>${a.name}</h2><p>${a.description}</p><div class="detail-stats"><div><small>Score</small><strong>${a.score}</strong></div><div><small>Modifier</small><strong>${signed(a.modifier)}</strong></div><div><small>Saving Throw</small><strong>${signed(a.modifier+(a.save_proficient?sheet.proficiencies.bonus:0))}</strong></div></div><p>Point buy ${a.base} (${a.cost} points) + 1 standard human bonus. ${a.save_proficient?'Proficient in this Saving Throw.':'Not proficient in this Saving Throw.'}</p><h3>Linked Skills</h3>${skillTable(skills.filter(x=>x[1]===a.key))}${a.key==='TECH'?`<p>Technology uses Technical Ability for hardware work. With proficiency, that check is ${signed(attrMod('TECH')+sheet.proficiencies.bonus)}.</p>`:''}`;}
 if(id==='skills')html=`<h2>Skills & Saving Throws</h2><p>Proficiency bonus ${signed(sheet.proficiencies.bonus)}. Filled markers identify proficient skills; all others still use their attribute modifier.</p>${skillTable(skills)}<h3>Saving Throws</h3><table class="detail-table"><tbody>${sheet.attributes.map(a=>`<tr><td>${a.name}${a.save_proficient?' <span class="badge">PROFICIENT</span>':''}</td><td>${signed(a.modifier+(a.save_proficient?sheet.proficiencies.bonus:0))}</td></tr>`).join('')}</tbody></table><h3>Passive Checks</h3><table class="detail-table"><tbody><tr><td>Perception · other senses</td><td>${d.passive_perception}</td></tr><tr><td>Perception · sight</td><td>${d.passive_sight}</td></tr><tr><td>Investigation</td><td>${d.passive_investigation}</td></tr></tbody></table><p>Sight includes the passive-check adjustment for disadvantage: ${d.passive_perception} − 5 = ${d.passive_sight}.</p>`;
 if(id==='profile')html=`<div class="eyebrow">${sheet.identity.age} / HUMAN / CORPORATE RESEARCHER</div><h2>Fen Vikutā</h2><p>${sheet.identity.bio}</p><img class="full-art" src="./${sheet.identity.art}?v=${encodeURIComponent(sheet.snapshot.release)}" alt="Complete supplied character reference artwork">`;
 if(id==='health')html=`<h2>Health & Recovery</h2><p>${sheet.resources.hp_note}</p><div class="detail-stats"><div><small>Maximum HP</small><strong>${d.hp_max}</strong></div><div><small>Hit Dice</small><strong>${sheet.resources.hit_dice_current ?? d.hit_dice_total} / ${d.hit_dice_total} ${d.hit_die}</strong></div><div><small>CON modifier</small><strong>${signed(attrMod('CON'))}</strong></div></div><h3>Rest</h3>${ruleSections(sheet.rules.rests,[["Short Rest","Short Rest:"],["Long Rest","Long Rest:"],["HP Recovery","With adequate"]])}${sheet.resources.last_long_rest?`<p>Last Long Rest: ${formatMoment(sheet.resources.last_long_rest.end)}. Next Long Rest benefit: ${formatMoment(sheet.resources.last_long_rest.next_benefit_not_before)} or later.</p>`:''}${sheet.resources.last_sleep?`<p>Last sleep: ${formatMoment(sheet.resources.last_sleep.start)} – ${formatMoment(sheet.resources.last_sleep.end)}.</p>`:''}<h3>Convalescence</h3>${ruleSections(sheet.rules.convalescence,[["Care & Hit Dice","Once per"],["Treatment & Recovery","Critical injuries"]])}<h3>Critical Injuries</h3>${ruleSections(sheet.rules.injuries)}<p>Full HP does not erase an injury.</p>`;
 if(id==='defence')html=`<h2>Armour Class ${d.ac}</h2><p>${d.ac_basis}</p><p>Light armour proficient.</p>`;
 if(id==='initiative')html=`<h2>Initiative ${signed(d.initiative)}</h2><p>Roll d20 ${signed(d.initiative)}.</p>`;
 if(id==='movement')html=`<h2>Movement ${d.speed_ft} ft</h2><p>Approximately ${Math.round(d.speed_ft*0.3048)} metres per combat turn. Dash adds movement equal to speed using an Action. You may split movement around your actions.</p>`;
 if(id==='training')html=`<h2>Training & Progression</h2><h3>Background & Build</h3><p>${sheet.build.human_bonus}</p><h3>Proficiencies</h3><p>${sheet.proficiencies.armour.join('; ')}; ${sheet.proficiencies.weapons.join('; ')}. ${sheet.proficiencies.tools_note}</p><h3>Languages</h3><p>${sheet.proficiencies.languages.join(' · ')}</p><h3>Class Progression</h3>${ruleSections(sheet.rules.progression,[["Level 2","Level 2"],["Level 3","Level 3"]])}<h3>Point-buy Allocation</h3><table class="detail-table"><thead><tr><th>Attribute</th><th>Base → human</th><th>Cost</th></tr></thead><tbody>${sheet.attributes.map(a=>`<tr><td>${a.name}</td><td>${a.base} → ${a.score}</td><td>${a.cost}</td></tr>`).join('')}<tr><td>Total</td><td></td><td>27 / 27</td></tr></tbody></table>`;
 if(id==='overrides')html=`<h2>Cyberware Overuse & Speedware</h2>${ruleMarkdown(sheet.rules.cyberware_overrides)}`;
 if(id==='capacity')html=`<h2>Neural Capacity</h2>${ruleSections(sheet.rules.capacity,[["Native Tolerance","Native Neural"],["Adaptation & Load","Add earned"],["Ronin Fragment","Operating Ronin"]])}<button class="text-button" data-detail="overrides">Overuse & Speedware ${icon("arrow")}</button>`;
 if(id==='intrusion')html=`<h2>Electronic Access</h2><h3>Quickhacks</h3>${ruleSections(sheet.rules.intrusion,[["Upload & Resolution","Quickhacks"],["Execution Cost","Utilities"],["Physical Source","Effects need"]])}<h3>Secured Systems</h3>${ruleSections(sheet.rules.secured_intrusion,[["Ability Checks","Use Intelligence"],["Deep Dives","Active opposition"]])}`;
 if(id==='about')html=`<div class="eyebrow">CYBERPUNK STORIES</div><h2>RONIN</h2><p>A personal story companion, built around Fen’s 2014-based campaign sheet.</p><h3>Add to your iPhone</h3><ol class="install-steps"><li>Open this page in Safari.</li><li>Open the Share menu and choose <strong>Add to Home Screen</strong>.</li><li>If shown, leave <strong>Open as Web App</strong> enabled, then tap <strong>Add</strong>.</li></ol><p>The RONIN icon opens the companion from your home screen. Internet access is required to load the app and current record.</p><button class="button-primary" data-export="true">Download character sheet</button><h3>Credits & references</h3><p>Original companion interface and emblem. Character reference supplied by the player. Rajdhani typeface under the SIL Open Font License. Unofficial fan campaign; Cyberpunk belongs to its respective owners.</p><div class="app-links">${sheet.sources.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`).join('')}<a href="./assets/OFL.txt" target="_blank" rel="noopener">Font licence</a></div>`;
 if(!html)return;document.getElementById('detail-content').innerHTML=html;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.getElementById('close-detail').focus();
}
function skillTable(list){return `<table class="detail-table"><tbody>${list.map(([name,key])=>{const a=sheet.attributes.find(x=>x.key===key),p=sheet.proficiencies.skills.includes(name);return `<tr><td>${p?'●':'○'} ${name} <span class="muted">${key}</span></td><td>${signed(a.modifier+(p?sheet.proficiencies.bonus:0))}</td></tr>`}).join('')}</tbody></table>`;}
function closeDetail(){dialog.close();if(returnFocus?.isConnected)returnFocus.focus();}
function exportSheet(){const blob=new Blob([JSON.stringify(sheet,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Fen-Vikuta-character-sheet.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
document.addEventListener('click',e=>{const chrome=e.target.closest('[data-chrome]');if(chrome)selectChrome(chrome.dataset.chrome);const detail=e.target.closest('[data-detail]');if(detail)openDetail(detail.dataset.detail);const filter=e.target.closest('[data-filter]');if(filter){programFilter=filter.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',b===filter));renderProgramList();}if(e.target.closest('[data-export]'))exportSheet();});
document.addEventListener('input',e=>{if(e.target.id==='program-search'){programSearch=e.target.value;renderProgramList();}});
document.getElementById('close-detail').addEventListener('click',closeDetail);
dialog.addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)closeDetail();}});
document.getElementById('help-button').innerHTML=icon('info');
document.getElementById('help-button').addEventListener('click',()=>{if(sheet)openDetail('about');});
document.getElementById('sheet-export').addEventListener('click',()=>{if(sheet)exportSheet();});
window.addEventListener('hashchange',()=>{if(!sheet)return;scrollPositions[active]=window.scrollY;active=nav.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'character';render();window.scrollTo(0,scrollPositions[active]||0);});
fetch('./character.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Character record unavailable');return r.json();}).then(data=>{sheet=data;active=nav.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'character';render();}).catch(()=>{main.innerHTML='<div class="empty"><strong>Character record unavailable</strong>Check your connection and reload. Your campaign records have not changed.</div>';});


// All reference content is generated from the public rules owners, never NPC records.
function inlineRule(text){return esc(text).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<code>$1</code>');}
// Presentation only: retain source wording and order, including every qualifier.
function ruleProse(text){
 const chunks=text.split(/(?<=[.!?])\s+(?=[A-Z*])/),groups=[];
 for(const chunk of chunks){
  const last=groups[groups.length-1];
  if(last&&last.length+chunk.length<230&&!/^(?:At Higher Levels|At total levels|After |On |When |If |Uses:|\*\*)/.test(chunk))groups[groups.length-1]+=' '+chunk;
  else groups.push(chunk);
 }
 return groups.map(g=>'<p>'+inlineRule(g)+'</p>').join('');
}
function stripSectionLabel(text,label){const prefix=label+':';return text.startsWith(prefix)?text.slice(prefix.length).trimStart():text;}
function ruleSections(text,sections=[]){
 let cursor=0,html='';
 const found=sections.map(([label,start])=>({label,index:text.indexOf(start)})).filter(s=>s.index>=0).sort((a,b)=>a.index-b.index);
 if(!found.length)return '<div class="rules-copy">'+ruleProse(text)+'</div>';
 if(found[0].index>0)html+=ruleProse(text.slice(0,found[0].index).trim());
 found.forEach((s,i)=>{cursor=found[i+1]?.index??text.length;html+='<section class="rule-section"><h3>'+esc(s.label)+'</h3>'+ruleProse(stripSectionLabel(text.slice(s.index,cursor).trim(),s.label))+'</section>';});
 return '<div class="rules-copy">'+html+'</div>';
}
function programOperation(text){
 // Extract only the explicit source header. Unrecognised formats stay intact.
 const m=text.match(/^(.+?) Execution: (.+?) Range: (.+?) Duration: ((?:Concentration, up to )?(?:Instantaneous|\d+ (?:rounds?|minutes?|hours?|days?)))\s+([\s\S]+)$/);
 if(!m)return ruleMarkdown(text);
 return `<p class="source-name">${inlineRule(m[1])}</p><dl class="rule-facts">${[['Execution',m[2]],['Range',m[3]],['Duration',m[4]]].map(([k,v])=>`<div><dt>${k}</dt><dd>${inlineRule(v)}</dd></div>`).join('')}</dl><h4>Effect</h4>${ruleMarkdown(m[5])}`;
}
function ruleMarkdown(text){
 const lines=text.split('\n');let html='',i=0;
 while(i<lines.length){let l=lines[i].trim();if(!l){i++;continue;}
  if(l.startsWith('|')){const rows=[];while(i<lines.length&&lines[i].trim().startsWith('|'))rows.push(lines[i++].trim().split('|').slice(1,-1).map(c=>c.trim()));
   const data=rows.filter(r=>!r.every(c=>/^:?-+:?$/.test(c.replace(/\s/g,''))));
   html+='<div class="reference-table" tabindex="0" role="region" aria-label="Rules table"><table class="detail-table"><thead><tr>'+data[0].map(c=>'<th>'+inlineRule(c)+'</th>').join('')+'</tr></thead><tbody>'+data.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+inlineRule(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue;}
  if(/^#{1,4} /.test(l)){html+='<h3>'+inlineRule(l.replace(/^#+ /,''))+'</h3>';i++;continue;}
  if(/^\d+\. /.test(l)){html+='<ol>';while(i<lines.length&&/^\d+\. /.test(lines[i].trim()))html+='<li>'+inlineRule(lines[i++].trim().replace(/^\d+\. /,''))+'</li>';html+='</ol>';continue;}
  if(l.startsWith('- ')){html+='<ul>';while(i<lines.length&&lines[i].trim().startsWith('- '))html+='<li>'+inlineRule(lines[i++].trim().slice(2))+'</li>';html+='</ul>';continue;}
  const para=[];while(i<lines.length&&lines[i].trim()&&!/^(\||#{1,4} |- |\d+\. )/.test(lines[i].trim()))para.push(lines[i++].trim());
  const prose=para.join(' '),lead=prose.match(/^\*\*([^*]+)\*\*\s*([\s\S]+)$/);
  if(lead&&/[:：]$/.test(lead[1]))html+='<h4>'+inlineRule(lead[1])+'</h4>'+ruleProse(lead[2]);
  else html+=ruleProse(prose);
 }return html;
}
function ruleDisclosure(title,body,open=false,extra=''){return `<details class="reference-disclosure" ${open?'open':''} ${extra}><summary>${inlineRule(title)}</summary><div class="reference-copy">${body}</div></details>`;}
function choiceCards(text){
 const lines=text.split('\n'),start=lines.findIndex(l=>l.startsWith('|'));
 if(start<0)return ruleMarkdown(text);
 let end=start;while(end<lines.length&&lines[end].startsWith('|'))end++;
 const rows=lines.slice(start+2,end).map(l=>l.split('|').slice(1,-1).map(c=>c.trim()));
 return ruleMarkdown(lines.slice(0,start).join('\n'))+rows.map(r=>ruleDisclosure(r[0],`<p class="choice-prerequisite">${inlineRule(r[1])}</p>${ruleMarkdown(r.slice(2).join(' · '))}`)).join('')+ruleMarkdown(lines.slice(end).join('\n'));
}
function renderClassReference(){const r=classReference;
 const overview=r.sections.filter(s=>['Class foundation','Terms and progression'].includes(s.title));
 const features=r.sections.filter(s=>s.title.startsWith('Level'));
 const firmware=r.sections.find(s=>s.title.startsWith('All 32'));
 const pages=[
  ['overview','Overview',overview.map(s=>`<h3>${esc(s.title)}</h3>${ruleMarkdown(s.text)}`).join('')],
  ['features','Features',features.map(s=>ruleDisclosure(s.title,ruleMarkdown(s.text))).join('')],
  ['firmware','Firmware',choiceCards(firmware.text)],
  ['architectures','Architectures',ruleMarkdown(r.architectureIntro)+r.architectures.map(a=>ruleDisclosure(a.title,ruleMarkdown(a.text))).join('')],
  ['software','Software',`<label class="reference-search-label" for="class-program-search">Find a Program</label><input class="search" id="class-program-search" type="search" placeholder="Name, original name or tier…"><label class="reference-search-label" for="class-program-access">Program List</label><select id="class-program-access" class="search"><option value="">All Eligible Options</option><option>Contractor</option><option>Reserved Operation</option><option>Combat Architecture</option><option>Deception Architecture</option><option>Intrusion Architecture</option><option>Platform / Firmware</option><option>Program Archive</option><option>Slow-Mode Library</option></select><p class="muted">Expanded lists add learning choices. Platform and Firmware entries require the corresponding feature.</p><p id="class-program-count" aria-live="polite">${r.programs.length} entries</p><div id="class-program-results">${r.programs.map(p=>ruleDisclosure(p.title,`<p class="choice-prerequisite">${p.tier===0?'Utility':'Tier '+p.tier}${p.ritual?' · Slow Mode Eligible':''} · ${esc(p.access.join(' / '))}</p><h4>Requirements</h4>${ruleProse(p.requirements)}<h4>Operation</h4>${programOperation(p.text)}`,false,`data-program-search="${esc((p.title+' tier '+p.tier+' '+p.access.join(' ')).toLowerCase())}" data-program-access="${esc(JSON.stringify(p.access))}"`)).join('')}</div>`],
  ['chassis','Chassis',ruleDisclosure('Profile Rules & Eligibility',ruleMarkdown(r.profileRules))+r.profiles.map(p=>ruleDisclosure(p.title,ruleMarkdown(p.text))).join('')],
  ['feats','Feats',choiceCards(r.feats)],
  ['execution','Execution',ruleDisclosure('Shared Class Rules',ruleMarkdown(r.shared))+ruleMarkdown(r.execution)],
  ['recovery','Recovery',ruleMarkdown(r.recovery)]
 ];
 return `<div class="eyebrow">CLASS REFERENCE / 2014</div><h2>${esc(r.title)}</h2><p class="reference-lead">Cool · d8 Hit Die · 20 Levels · 3 Architectures</p><nav class="reference-tabs" aria-label="Class Reference sections">${pages.map(([id,name],i)=>`<button data-reference-tab="${id}" aria-pressed="${i===0}" aria-controls="reference-${id}">${name}</button>`).join('')}</nav>${pages.map(([id,name,html],i)=>`<section id="reference-${id}" class="reference-page" aria-label="${name}" ${i?'hidden':''}>${html}</section>`).join('')}<p class="reference-credit">${esc(r.licence)}</p>`;
}
async function openClassReference(){
 returnFocus=document.activeElement;dialog.classList.add('class-reference-dialog');document.getElementById('detail-kicker').textContent='CONTRACTOR / CLASS REFERENCE';
 const content=document.getElementById('detail-content');content.innerHTML='<h2>Contractor [Warlock]</h2><p role="status">Loading Class Reference…</p>';if(!dialog.open)dialog.showModal();dialog.scrollTop=0;document.getElementById('close-detail').focus();
 try{if(!classReference){const response=await fetch('./class-reference.json?v=0246.1',{cache:'no-cache'});if(!response.ok)throw Error('Reference unavailable');classReference=await response.json();}if(dialog.open&&dialog.classList.contains('class-reference-dialog'))content.innerHTML=renderClassReference();}
 catch(error){if(dialog.open&&dialog.classList.contains('class-reference-dialog'))content.innerHTML='<h2>Class Reference Unavailable</h2><p>Check your connection and try again.</p><button class="button-primary" data-detail="class-reference">Retry</button>';}
}
function filterClassPrograms(){const q=document.getElementById('class-program-search').value.trim().toLowerCase(),access=document.getElementById('class-program-access').value;let count=0;
 document.querySelectorAll('[data-program-search]').forEach(p=>{p.hidden=!(p.dataset.programSearch.includes(q)&&(!access||JSON.parse(p.dataset.programAccess).includes(access)));if(!p.hidden)count++;});document.getElementById('class-program-count').textContent=count?`${count} ${count===1?'entry':'entries'}`:'No matching Programs';
}
document.addEventListener('click',e=>{const button=e.target.closest('[data-reference-tab]');if(!button)return;document.querySelectorAll('[data-reference-tab]').forEach(b=>b.setAttribute('aria-pressed',b===button));document.querySelectorAll('.reference-page').forEach(p=>p.hidden=p.id!=='reference-'+button.dataset.referenceTab);dialog.scrollTop=0;});
document.addEventListener('input',e=>{if(['class-program-search','class-program-access'].includes(e.target.id))filterClassPrograms();});
