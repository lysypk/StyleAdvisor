<script>
  import { occasion as occStore } from './store.ts';
  import { tracedFetch } from './telemetry.js';
  import { wardrobeItems } from './wardrobe.js';
  import { colourHexMap, defaultColors, watchStrapColors, watchCaseColors, watchDialColors, womenBlouseColors, womenDressColors, womenSkirtColors, womenPantsColors, womenShoesColors, womenBagColors, womenJewelryColors, patterns } from './data/colors.js';
  import { t } from './i18n.ts';
import { get } from 'svelte/store';
  import { language } from './store.ts';
import { activeGarmentModal } from './store.ts';
  import { typeCriteria } from './data/types.js';
  import { garmentSpecificRules, rulesFor } from './data/rules.js';
let { garment, garmentKey = null, gender = null, optional = false, selections, occasion = null, conflicts = [] } = $props();

  let sel = $derived($selections[garmentKey || garment] || {});
  let open = $state(false);
  const svgMap = { Shirt:'shirt.svg', Jacket:'jacket.svg', Pants:'pants.svg', Shoes:'shoes.svg', Belt:'belt.svg', Watch:'watch.svg', Tie:'tie.svg', Blouse:'blouse.svg', Skirt:'skirt.svg', Dress:'dress.svg', Handbag:'handbag.svg', Jewelry:'jewelry.svg', 'Pocket Square':'pocket_square.svg' };
  const womenVariantMap = { Jacket:'jacket_woman.svg', Pants:'pants_woman.svg', Shoes:'shoes_woman.svg', Belt:'belt_woman.svg', Watch:'watch_woman.svg' };
  let svg = $derived((gender?.who === 'woman' && womenVariantMap[garment]) ? womenVariantMap[garment] : (svgMap[garment] || null));

  
const keyLabelsEn = { color:'Color', pattern:'Pattern', secondary:'Secondary Colour', strap:'Strap Colour', case:'Case Colour', dial:'Dial Colour', type:'Type', name:'Name', wardrobeItemId:null };
const keyLabelsPl = { color:'Kolor', pattern:'Wzór', secondary:'Dodatkowy kolor', strap:'Kolor paska', case:'Kolor koperty', dial:'Kolor tarczy', type:'Typ', name:'Nazwa', wardrobeItemId:null };
const keyLabel = (k, lang = 'en') => { const map = (lang === 'pl' || lang === 'pl') ? keyLabelsPl : keyLabelsEn; return map[k] || k; };
function fieldsFor(g) {
    if (g === 'Watch') return [
      { key:'strap', label:'Strap colour', type:'WatchStrap', color:true },
      { key:'case', label:'Case colour', type:'WatchCase', color:true },
      { key:'dial', label:'Dial colour', type:'WatchDial', color:true },
    ];
    const f = [
      { key:'color', label:'Colour', type:g, color:true },
      { key:'pattern', label:'Pattern', pattern:true },
    ];
    if (['Shirt','Jacket','Tie','Pants','Skirt','Dress','Pocket Square'].includes(g))
      f.push({ key:'secondary', label:'Secondary colour', type:g+'-secondary', color:true, secondary:true });
    if (g === 'Pants' || g === 'Shoes')
      f.push({ key:'type', label:g+' type', type:g+'Type', istype:true });
    return f;
  }
let values = {};
  let optionsByType = {};
  let loading = {};

  let color = $state('White');
  let pattern = $state('Plain');
  let optsPattern = $state([]);
  let loadingPattern = $state(false);
  let patternOpen = $state(false);
  let secondary = $state('');
  let included = $state(true);
  let useWardrobe = $state(false);
  let wardrobePick = $state('');
  let wardrobeOpen = $state(false);
  let optsWardrobe = $state([]);
  let loadingWardrobe = $state(false);
  let wardrobeView = $derived(($wardrobeItems || []).filter(i => i.gender === (gender?.who||'man') && i.type === garment));
  let optsSecondary = $state([]);
  let loadingSecondary = $state(false);
  let secondaryOpen = $state(false);
  let optsColor = $state([]);
  let loadingColor = $state(false);
  let colorFetchStatus = $state('');
  let statusPattern = $state('');
  let statusSecondary = $state('');
  let colorOpen = $state(false);
  const AI_SCORE_CACHE = {};
  let showLow = $state({});
  function toggleLow(type) { showLow = { ...showLow, [type]: !showLow[type] }; }
  function visibleOpts(type, list) { return showLow[type] ? list : (list || []).filter((o) => (o.prob ?? 0) >= 70 || o.prob === null); }
  function hasLow(type, list) { return (list || []).some((o) => (o.prob ?? 100) < 70); }
  let typeOpen = $state(false);
    async function fetchColors(type, setOpts, setLoading, exclude) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    setLoading(true);
    const cacheKey = type + '::' + (gender?.who || 'man') + '::' + (occ()?.category || '') + ':' + (occ()?.variant || '') + '::' + garment;
    if (AI_SCORE_CACHE[cacheKey]) {
      const cached = AI_SCORE_CACHE[cacheKey].map((o) => ({ ...o }));
      setOpts(cached);
      if (type === garment) colorFetchStatus = '';
      clearTimeout(timer); setLoading(false); return;
    }
    if (type === garment) colorFetchStatus = 'loading';
    if (type === 'Pattern') statusPattern = 'loading';
    if (typeof type === 'string' && type.includes('-secondary')) statusSecondary = 'loading';
    try {
      const isType = type.endsWith('Type');
      const allowedPatterns = ['Plain','Stripes','Checks','Dots', 'Melange','Houndstooth','Pinstripes', 'Geometric', 'Floral'];
      const allowedColors = type === 'WatchStrap' ? watchStrapColors : type === 'WatchCase' ? watchCaseColors : type === 'WatchDial' ? watchDialColors : type === 'Blouse' ? womenBlouseColors : type === 'Dress' ? womenDressColors : type === 'Skirt' ? womenSkirtColors : type === 'Pants' && gender?.who === 'woman' ? womenPantsColors : type === 'Shoes' && gender?.who === 'woman' ? womenShoesColors : type === 'Handbag' ? womenBagColors : type === 'Jewelry' ? womenJewelryColors : type === 'Pattern' ? allowedPatterns : defaultColors;
      // Absolute suitability using noul independent questions for all options
      const candidateList = isType ? Object.keys(typeCriteria[type] || {})
        : (type === 'Pattern' ? allowedPatterns : allowedColors.filter((c) => !exclude || c !== exclude));
      const noulQuestions = {};
      for (const c of candidateList) {
        noulQuestions[c] = { type: 'noul', instructions: `Score ${c} 0-100 for absolute suitability for this ${garment} (${type}) in this occasion and person. Return a decimal probability 0-1, not normalized within the set.`, criteria: { true: 'Suitable fit', false: 'Unsuitable' } };
      }
      if (Object.keys(noulQuestions).length) {
        const payload = {
          model: 'tev1:4b',
          state: JSON.stringify({ occasion: occ(), selections: $selections }),
          questions: noulQuestions,
          rules: rulesFor(occ(), garment, $selections, gender)
        };
        const r = await tracedFetch('http://localhost:11434/v1/systemone', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal
        }, { name: 'choice-' + type, model: 'tev1:4b', garment });
        const data = await r.json();
        const answers = data?.answers || {};
        const toDecimal = (v) => { const n = Number(v); if (!Number.isFinite(n)) return 0; return n > 1 ? n / 100 : n; };
        const finalOpts = candidateList.map((c) => ({
          name: c,
          prob: Math.round(toDecimal(answers?.[c]?.noul) * 100),
          hex: (type === 'Pattern' || isType) ? null : (colourHexMap[c] || '#000000')
        })).sort((a, b) => b.prob - a.prob);
        const allHundred = finalOpts.length > 0 && finalOpts.every((o) => o.prob === 100);
        const allMissing = finalOpts.length > 0 && finalOpts.every((o) => o.prob === null || o.prob === undefined);
        AI_SCORE_CACHE[cacheKey] = finalOpts.map((o) => ({ ...o }));
        if (allHundred || allMissing) {
          AI_SCORE_CACHE[cacheKey] = undefined;
          setOpts([]);
        } else {
          setOpts(finalOpts);
        }
        if (type === garment) colorFetchStatus = '';
        if (type === 'Pattern') statusPattern = '';
        if (typeof type === 'string' && type.includes('-secondary')) statusSecondary = '';
        clearTimeout(timer);
        setLoading(false);
        return;
      }
      let criteria;
      if (isType) criteria = typeCriteria[type] || {};
      else if (type === 'Pattern') {
        criteria = {};
        for (const pn of allowedPatterns) criteria[pn] = pn;
      } else {
        criteria = {};
        for (const cn of allowedColors) if (colourHexMap[cn]) criteria[cn] = colourHexMap[cn];
        if (exclude && criteria[exclude]) delete criteria[exclude];
      }
      const payload = {
        model: 'tev1:4b',
        state: JSON.stringify({ occasion: occ(), selections: $selections }),
        questions: { suggest: { type: 'choice', instructions: `For each candidate, return an independent 0-100 suitability score for this ${type} in this garment and occasion. Use only candidates from criteria. Return each probability as a decimal 0-1 (not 0-100). 100 means ideal; below 40 means wrong.`, criteria } },
        rules: rulesFor(occ(), garment, $selections, gender)
      };
      const r = await tracedFetch('http://localhost:11434/v1/systemone', {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), signal: controller.signal
      });
      const data = await r.json();
      const probs = data?.answers?.suggest?.probabilities || {};
      let sorted = Object.entries(probs).map(([name,p])=>({name,prob:Math.round(p*100),hex:isType?null:(colourHexMap[name]||'#000')})).sort((a,b)=>b.prob-a.prob);
      let finalOpts = sorted;
      if (!isType) {
        const defs = (type === 'Pattern' ? allowedPatterns : allowedColors).filter(c=>!sorted.some(s=>s.name===c)).map(c=>({name:c,prob:null,hex:null}));
        finalOpts = (sorted.length>=5?sorted.slice(0,5):[...sorted,...defs]).slice(0,5);
      } else {
        finalOpts = sorted.slice(0,5);
      }
      setOpts(finalOpts);
      if (type === garment) colorFetchStatus = '';
      if (type === 'Pattern') statusPattern = '';
      if (typeof type === 'string' && type.includes('-secondary')) statusSecondary = '';
    } catch(e) { console.error('AI fetch error', type, e); setOpts([]);
      if (type === garment) colorFetchStatus = 'Model unavailable — using fallback' + (e?.message ? ` (${e.message})` : '');
      if (type === 'Pattern') statusPattern = 'Model unavailable — using fallback' + (e?.message ? ` (${e.message})` : '');
      if (typeof type === 'string' && type.includes('-secondary')) statusSecondary = 'Model unavailable — using fallback' + (e?.message ? ` (${e.message})` : '');
    }
    clearTimeout(timer);
    setLoading(false);
  }

function triggerColor() { clearCache(); optsColor=[]; loadingColor=false; fetchColors(garment, (v)=>optsColor=v, (v)=>loadingColor=v, null); }
  function triggerPattern() { clearCache(); optsPattern=[]; loadingPattern=false; fetchColors('Pattern', (v)=>optsPattern=v, (v)=>loadingPattern=v, null); }
  function triggerSecondary() { clearCache(); optsSecondary=[]; loadingSecondary=false; fetchColors(garment+'-secondary', (v)=>optsSecondary=v, (v)=>loadingSecondary=v, color); }
  let typeValue = $state('');
  let strap = $state('');
  let caseC = $state('');
  let dial = $state('');
  let optsStrap = $state([]);
  let optsCase = $state([]);
  let optsDial = $state([]);
  let loadingStrap = $state(false);
  let loadingCase = $state(false);
  let loadingDial = $state(false);
  let strapOpen = $state(false);
  let caseOpen = $state(false);
  let dialOpen = $state(false);
  function triggerStrap() { clearCache(); optsStrap=[]; loadingStrap=false; fetchColors('WatchStrap', (v)=>optsStrap=v, (v)=>loadingStrap=v, null); }
  function triggerCase() { clearCache(); optsCase=[]; loadingCase=false; fetchColors('WatchCase', (v)=>optsCase=v, (v)=>loadingCase=v, null); }
  function triggerDial() { clearCache(); optsDial=[]; loadingDial=false; fetchColors('WatchDial', (v)=>optsDial=v, (v)=>loadingDial=v, null); }
  let optsPantsType = $state([]);
  let optsShoesType = $state([]);
  let loadingPantsType = $state(false);
  let loadingShoesType = $state(false);
  function triggerType() { const tk = typeKey(); clearCache(); optsPantsType=[]; optsShoesType=[]; loadingPantsType=false; loadingShoesType=false; fetchColors(tk, (v)=>{ optsPantsType=v; optsShoesType=v; }, (v)=>{ loadingPantsType=v; loadingShoesType=v; }, null); }
  async function fetchWardrobe() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    const items = wardrobeView || [];
    if (!items.length) { optsWardrobe = []; return; }
    if (optsWardrobe.length) return;
    loadingWardrobe = true;
    const criteria = {};
    const idByName = {};
    const itemKeys = [];
    const itemNameByKey = {};
    for (const it of items) {
      const key = 'item_' + items.indexOf(it);
      const displayName = it.name || (it.type + ' - ' + (it.color || it.strap || ''));
      criteria[key] = (it.color||it.strap||'') + (it.pattern ? (', ' + it.pattern) : '') + (it.itemType ? (', ' + it.itemType) : '') + (it.secondary ? (', secondary ' + it.secondary) : '');
      idByName[key] = it.id;
      itemKeys.push(key);
      itemNameByKey[key] = displayName;
    }
    try {
      const noulQuestions = {};
      for (const key of itemKeys) {
        noulQuestions[key] = { type: 'noul', instructions: `Is saved ${garment} item ${itemNameByKey[key]} an excellent independent fit for this occasion and person? Score relative to zero, not relative to other items.`, criteria: { true: 'Excellent fit', false: 'Poor fit' } };
      }
      const payload = {
        model: 'tev1:4b',
        state: JSON.stringify({ occasion: occ(), selections: $selections }),
        questions: noulQuestions,
        rules: rulesFor(occ(), garment, $selections, gender)
      };
      const r = await tracedFetch('http://localhost:11434/v1/systemone', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload), signal: controller.signal }, { name: 'wardrobe-score', model: 'tev1:4b', garment });
      const data = await r.json();
      const answers = data?.answers || {};
      const toDecimal = (v) => { const n = Number(v); if (!Number.isFinite(n)) return 0; return n > 1 ? n / 100 : n; };
      const sorted = itemKeys.map((key) => ({ name: itemNameByKey[key], prob: Math.round(toDecimal(answers?.[key]?.noul) * 100), id: idByName[key] })).sort((a,b)=>b.prob-a.prob);
      optsWardrobe = sorted.length ? sorted : itemKeys.map(key => ({ name: itemNameByKey[key], prob: null, id: idByName[key] }));
    } catch (e) {
      console.error('wardrobe ai error', e);
      optsWardrobe = itemKeys.map(key => ({ name: itemNameByKey[key], prob: null, id: idByName[key] }));
    }
    clearTimeout(timer);
    loadingWardrobe = false;
  }

  function closeAllDropdowns() {
  wardrobeOpen = false;
  strapOpen = false;
  caseOpen = false;
  dialOpen = false;
  colorOpen = false;
  patternOpen = false;
  secondaryOpen = false;
  typeOpen = false;
}

function openModal() {
  activeGarmentModal.set(garmentKey || garment);
  open = true;
  init();
}
$effect(() => { console.log('[GC lang]', $language, 'grey=', get(t)('color_Grey')); });
$effect(() => { if (secondary && secondary === color) secondary = ''; });

  function clearCache() {
  Object.keys(AI_SCORE_CACHE).forEach((k) => delete AI_SCORE_CACHE[k]);
}

function typeKey() {
    const g = gender?.who || 'man';
    if (garment === 'Pants') return g === 'woman' ? 'WomenPantsType' : 'PantsType';
    if (garment === 'Skirt') return 'WomenSkirtType';
    if (garment === 'Shoes') return g === 'woman' ? 'WomenShoesType' : 'ShoesType';
    return garment + 'Type';
  }
  function occ() {
    return occasion || ($occStore || null);
  }

  
async function fetchFor(field) {
    const type = field.type;
    loading = { ...loading, [type]: true };
    try {
      const occ = getOccasion();
      const primary = values.color;
      const isTypeDropdown = type.endsWith('Type');
      const base = { ...colourHexMap };
      let criteria;
      if (isTypeDropdown) {
        criteria = typeCriteria[type] || {};
      } else {
        criteria = { ...base };
        if (type.endsWith('-secondary') && primary && criteria[primary]) delete criteria[primary];
      }
      const payload = {
        model: 'tev1:4b',
        state: JSON.stringify({ occasion: occ, selections: values }),
        questions: {
          suggest: {
            type: 'choice',
            instructions: `Suggest 5 best ${type} options for this garment and occasion. Use only candidates from criteria. Return probability (0-100) for each.`,
            criteria
          }
        },
        rules: rulesFor(occ)
      };
      const resp = await tracedFetch('http://localhost:11434/v1/systemone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      const probs = data?.answers?.suggest?.probabilities || {};
      const toDecimal = (v) => { const n = Number(v); if (!Number.isFinite(n)) return 0; return n > 1 ? n / 100 : n; };
      let sorted = Object.entries(probs).map(([name, p]) => ({
        name, prob: Math.round(toDecimal(p) * 100),
        hex: isTypeDropdown ? null : (colourHexMap[name] || '#000000')
      })).sort((a,b) => b.prob - a.prob);
      let finalOpts = sorted;
      if (!isTypeDropdown) {
        const defs = defaultColors.filter(c => !sorted.some(s=>s.name===c)).map(c=>({name:c,prob:null,hex:colourHexMap[c]}));
        finalOpts = (sorted.length >= 5 ? sorted.slice(0,5) : [...sorted, ...defs]).slice(0,5);
      } else {
        finalOpts = sorted.slice(0,5);
      }
      optionsByType = { ...optionsByType, [type]: finalOpts };
    } catch (e) {
      console.error('AI fetch error', e);
      optionsByType = { ...optionsByType, [type]: [] };
    }
    loading = { ...loading, [type]: false };
  }

  function init() {
    optsWardrobe = [];
    wardrobePick = wardrobePick || '';
    color = sel.color || 'White';
    pattern = sel.pattern || 'Plain';
    secondary = sel.secondary || '';
    included = sel.included !== false;
    typeValue = sel.type || '';
    strap = sel.strap || '';
    caseC = sel.case || '';
    dial = sel.dial || '';
    optsStrap = []; optsCase = []; optsDial = [];
    loadingStrap = false; loadingCase = false; loadingDial = false;
    optsPantsType = [];
    optsShoesType = [];
    loadingPantsType = false;
    loadingShoesType = false;
    optsColor = [];
    loadingColor = false;
    optsPattern = [];
    loadingPattern = false;
    optsSecondary = [];
    loadingSecondary = false;
    colorOpen = false;
    typeOpen = false;
    secondaryOpen = false;
    // fetch deferred until dropdown focus
  }

  function save() {
    if (useWardrobe && wardrobePick) {
      const item = ($wardrobeItems || []).find(i => i.id === wardrobePick);
      if (item) {
        const out = { ...item, included, wardrobeItemId: item.id };
        delete out.id;
        delete out.gender;
        delete out.wardrobeItemId;
        selections.update(s => ({ ...s, [garmentKey || garment]: out }));
      }
      open = false;
      activeGarmentModal.set(null);
      return;
    }
    const out = { color, pattern, secondary, included };
    if (garment === 'Belt' || garment === 'Handbag' || garment === 'Jewelry') delete out.pattern;
    if ('gender' in out) delete out.gender;
    if ('wardrobeItemId' in out) delete out.wardrobeItemId;
    if (secondary === '') delete out.secondary;
    if (garment === 'Pants' || garment === 'Shoes' || garment === 'Skirt') out.type = typeValue;
    if (garment === 'Watch') { out.strap = strap; out.case = caseC; out.dial = dial; delete out.color; delete out.pattern; delete out.secondary; }
    const selectionKey = garmentKey || garment;
    selections.update(s => ({ ...s, [selectionKey]: out }));
    open = false;
    activeGarmentModal.set(null);
  }

  function cancel() { open = false; activeGarmentModal.set(null); }
  function clearSelection() { const selectionKey = garmentKey || garment; selections.update(s => { const c = { ...s }; delete c[selectionKey]; return c; }); }

  function isSaveAllowed() {
    if (optional && !included) return true;
    if (useWardrobe) return !!wardrobePick;
    if (garment === 'Watch') return strap !== '' && caseC !== '' && dial !== '';
    if (!color) return false;
    if (secondary && secondary === color) return false;
    if (['Shirt','Jacket','Tie','Pants','Skirt','Dress','Pocket Square'].includes(garment) && pattern !== 'Plain' && !secondary) return false;
    if ((garment === 'Pants' || garment === 'Shoes') && !typeValue) return false;
    return true;
  }

  let tr = (key) => key;
  t.subscribe((value) => { tr = value; });
  function renderValue(k, v) {
    const norm = String(v || '').replace(/[\s-]+/g, '');
    const prefix = (k === 'pattern') ? 'pattern_' : 'color_';
    const lookup = get(t);
    if (k === 'color' || k === 'strap' || k === 'case' || k === 'dial' || k === 'secondary' || String(k).includes('color')) {
      const translated = lookup(prefix + norm);
      return translated === prefix + norm ? String(v ?? '') : translated;
    }
    if (k === 'pattern' && typeof v === 'string') {
      const key = 'pattern_' + norm;
      const translated = lookup(key);
      return translated === key ? String(v) : translated;
    }
    if (k === 'type' && typeof v === 'string') {
      const key = 'type_' + norm;
      const translated = lookup(key);
      return translated === key ? String(v) : translated;
    }
    return String(v ?? '');
  }

</script>
<div class="card" class:def={conflicts && conflicts.length}>
  <button class="svg" onclick={openModal} type="button">
    {#if svg}<img src={`/${svg}`} alt={garment} class={garment.toLowerCase()} />{/if}
  </button>
  <div class="card-head">
    <button class="mini-clear" title="Clear selection" onclick={clearSelection} type="button">🗑️</button>
    <h3 class="name">{$t('garment_' + garment.replace(/\s+/g, ''))}</h3>
  </div>
  {#if Object.keys(sel).length && sel.included !== false}
    <div class="summary">{keyLabel('color', $language)}: {renderValue('color', sel.color || '', $language)}</div>
  {/if}
  {#if Object.keys(sel).length && sel.included !== false}
    <div class="summary">
      {#each Object.entries(sel).filter(([k,v]) => k !== 'included' && k !== 'gender' && k !== 'wardrobeItemId' && v !== null && v !== '' && !((garment==='Shoes' || garment==='Belt' || garment==='Handbag' || garment==='Jewelry') && k==='pattern')) as [k,v], i}
        {#if i>0} • {/if}
        {#if k==='color'||k==='strap'||k==='case'||k==='dial'||k==='secondary'}<span class="swatch" style="background:{colourHexMap[v]||'#888'}"></span>{/if}
        {keyLabel(k, $language)}: {renderValue(k, v, $language)}
      {/each}
    </div>
  {/if}
</div>

{#if open && $activeGarmentModal === (garmentKey || garment)}
   <div class="modal">
    <h3>{$t('garment_' + garment.replace(/\s+/g, ''))} {$t('details')}</h3>
    <label class="wardrobe-toggle"><input type="checkbox" bind:checked={useWardrobe} onchange={() => { optsWardrobe = []; if (useWardrobe) fetchWardrobe(); }} /> {$t('use_wardrobe_only')}</label>
    {#if useWardrobe}
      <label>Owned {garment}<div class="dropdown"><button class="dropdown-trigger" onclick={() => { const _n = !wardrobeOpen; closeAllDropdowns(); wardrobeOpen = _n; if (wardrobeOpen && !optsWardrobe.length) fetchWardrobe(); }} type="button">{(wardrobeView.find(i=>i.id===wardrobePick)?.name) || 'Select item…'}</button>
        {#if wardrobeOpen}<div class="dropdown-panel">
          {#if !wardrobeView.length}<div class="dropdown-option">No items</div>{/if}
        </div>{/if}</div></label>
    {:else}
      {#if garment === "Watch"}
        {#if optional && !included}<p style="color:var(--muted)">{$t('garment_excluded')}</p>
        {:else}
          <label>{$t('strap_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => { const _n = !strapOpen; closeAllDropdowns(); strapOpen = _n; if (strapOpen) triggerStrap(); }} type="button">{strap ? $t('color_'+strap.replace(/\s+/g,'')) : ($language === 'pl' ? 'Wybierz kolor' : 'Select')}</button>
            {#if strapOpen}
              <div class="dropdown-panel">
                {#if loadingStrap}<div class="dropdown-option">{$t('loading')}</div>
                {:else}
                {#each visibleOpts('strap', optsStrap) as o}<button class="dropdown-option" onclick={() => { strap = o.name; strapOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[o.name]||'#888'}"></span> {$t('color_'+o.name.replace(/\s+/g,''))}{o.prob !== null ? ' ' + o.prob + '%' : ''}</button>{/each}
                {#if !optsStrap.length}{#each watchStrapColors as c}<button class="dropdown-option" onclick={() => { strap = c; strapOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}{/if}
                {#if hasLow('strap', optsStrap) && !showLow.strap}<button class="dropdown-option" onclick={() => toggleLow('strap')}>{$t('lower_percent_options')}</button>{/if}
                {/if}
              </div>
            {/if}
          </div></label>
          <label>{$t('case_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => { const _n = !caseOpen; closeAllDropdowns(); caseOpen = _n; if (caseOpen) triggerCase(); }} type="button">{caseC ? $t('color_'+caseC.replace(/\s+/g,'')) : ($language === 'pl' ? 'Wybierz kolor' : 'Select')}</button>
            {#if caseOpen}
              <div class="dropdown-panel">
                {#if loadingCase}<div class="dropdown-option">{$t('loading')}</div>
                {:else}
                {#each visibleOpts('case', optsCase) as o}<button class="dropdown-option" onclick={() => { caseC = o.name; caseOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[o.name]||'#888'}"></span> {$t('color_'+o.name.replace(/\s+/g,''))}{o.prob !== null ? ' ' + o.prob + '%' : ''}</button>{/each}
                {#if !optsCase.length}{#each watchCaseColors as c}<button class="dropdown-option" onclick={() => { caseC = c; caseOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}{/if}
                {#if hasLow('case', optsCase) && !showLow.case}<button class="dropdown-option" onclick={() => toggleLow('case')}>{$t('lower_percent_options')}</button>{/if}
                {/if}
              </div>
            {/if}
          </div></label>
          <label>{$t('dial_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => { const _n = !dialOpen; closeAllDropdowns(); dialOpen = _n; if (dialOpen) triggerDial(); }} type="button">{dial ? $t('color_'+dial.replace(/\s+/g,'')) : ($language === 'pl' ? 'Wybierz kolor' : 'Select')}</button>
            {#if dialOpen}
              <div class="dropdown-panel">
                {#if loadingDial}<div class="dropdown-option">{$t('loading')}</div>
                {:else}
                {#each visibleOpts('dial', optsDial) as o}<button class="dropdown-option" onclick={() => { dial = o.name; dialOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[o.name]||'#888'}"></span> {$t('color_'+o.name.replace(/\s+/g,''))}{o.prob !== null ? ' ' + o.prob + '%' : ''}</button>{/each}
                {#if !optsDial.length}{#each watchDialColors as c}<button class="dropdown-option" onclick={() => { dial = c; dialOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}{/if}
                {#if hasLow('dial', optsDial) && !showLow.dial}<button class="dropdown-option" onclick={() => toggleLow('dial')}>{$t('lower_percent_options')}</button>{/if}
                {/if}
              </div>
            {/if}
          </div></label>
        {/if}
      {:else}
        {#if optional && !included}
          <p style="color:var(--muted)">{$t('garment_excluded')}</p>
        {:else}
          {#if !useWardrobe}
            <label>{$t('color_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => { const _n = !colorOpen; closeAllDropdowns(); colorOpen = _n; if (colorOpen) triggerColor(); }} type="button">{$t('color_'+color.replace(/\s+/g,''))}</button>
            {#if colorOpen}
              <div class="dropdown-panel">
                {#if loadingColor}<div class="dropdown-option">{$t('loading')}</div>
                {:else}
                  {#each visibleOpts('color', optsColor.filter(o => o.name !== secondary)) as o}<button class="dropdown-option" onclick={() => { color = o.name; colorOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[o.name]||'#888'}"></span> {$t('color_'+o.name.replace(/\s+/g,''))}{o.prob !== null ? ' ' + o.prob + '%' : ''}</button>{/each}
                  {#if !optsColor.length}{#each defaultColors.filter(c => c !== secondary) as c}<button class="dropdown-option" onclick={() => { color = c; colorOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}{/if}
                  {#if hasLow('color', optsColor.filter(o => o.name !== secondary)) && !showLow.color}<button class="dropdown-option" onclick={() => toggleLow('color')}>{$t('lower_percent_options')}</button>{/if}
                {/if}
              </div>
            {/if}
          </div></label>
          {#if ['Shirt','Jacket','Tie','Pants','Skirt','Dress','Pocket Square'].includes(garment)}
            <label>{$t('pattern_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => { const _n = !patternOpen; closeAllDropdowns(); patternOpen = _n; if (patternOpen) triggerPattern(); }} type="button">{$t('pattern_'+pattern.replace(/\s+/g,''))}</button>
              {#if patternOpen}
                <div class="dropdown-panel">
                  {#if loadingPattern}<div class="dropdown-option">{$t('loading')}</div>
                  {:else}
                  {#each visibleOpts('pattern', optsPattern) as o}<button class="dropdown-option" onclick={() => { pattern = o.name; patternOpen=false; }} type="button">{$t('pattern_'+o.name.replace(/\s+/g,''))}{o.prob !== null ? ' ' + o.prob + '%' : ''}</button>{/each}
                  {#if !optsPattern.length}{#each patterns as pp}<button class="dropdown-option" onclick={() => { pattern = pp; patternOpen=false; }} type="button">{pp}</button>{/each}{/if}
                  {#if hasLow('pattern', optsPattern) && !showLow.pattern}<button class="dropdown-option" onclick={() => toggleLow('pattern')}>{$t('lower_percent_options')}</button>{/if}
                  {/if}
                </div>
              {/if}
            </div></label>
          {/if}
          {#if pattern !== 'Plain' && ['Shirt','Jacket','Tie','Pants','Skirt','Dress','Pocket Square'].includes(garment)}
            <label>{$t('secondary_label')} <div class="dropdown">
              <button class="dropdown-trigger" onclick={() => { const _n = !secondaryOpen; closeAllDropdowns(); secondaryOpen = _n; if (secondaryOpen) triggerSecondary(); }} type="button">{secondary ? $t('color_'+secondary.replace(/\s+/g,'')) : ($language === 'pl' ? 'Wybierz kolor' : 'Select')}</button>
              {#if secondaryOpen}
                <div class="dropdown-panel">
                  {#if loadingSecondary}<div class="dropdown-option">{$t('loading')}</div>
                  {:else}
                  {#each visibleOpts('secondary', optsSecondary.filter(o => o.name !== color)) as o}<button class="dropdown-option" onclick={() => { secondary = o.name; secondaryOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[o.name]||'#888'}"></span> {$t('color_'+o.name.replace(/\s+/g,''))}{o.prob !== null ? ' ' + o.prob + '%' : ''}</button>{/each}
                  {#if !optsSecondary.length}{#each defaultColors.filter(c => c !== color) as c}<button class="dropdown-option" onclick={() => { secondary = c; secondaryOpen=false; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}{/if}
                  {#if hasLow('secondary', optsSecondary.filter(o => o.name !== color)) && !showLow.secondary}<button class="dropdown-option" onclick={() => toggleLow('secondary')}>{$t('lower_percent_options')}</button>{/if}
                  {/if}
                </div>
              {/if}
            </div></label>
          {/if}
          {#if garment === 'Pants' || garment === 'Shoes' || garment === 'Skirt'}
            <label>{$t('type_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => { const _n = !typeOpen; closeAllDropdowns(); typeOpen = _n; if (typeOpen) triggerType(); }} type="button">{typeValue ? ($t('type_' + typeValue.replace(/[\s-]+/g,'')) === 'type_' + typeValue.replace(/[\s-]+/g,'') ? typeValue : $t('type_' + typeValue.replace(/[\s-]+/g,''))) : ($language === 'pl' ? 'Wybierz' : 'Select')}</button>
              {#if typeOpen}
                <div class="dropdown-panel">
                  {#if (loadingPantsType || loadingShoesType)}<div class="dropdown-option">{$t('loading')}</div>
                  {:else}
                  {#each visibleOpts('type', (optsPantsType.length?optsPantsType:[])) as o}<button class="dropdown-option" onclick={() => { typeValue = o.name; typeOpen=false; }} type="button">{$t('type_' + o.name.replace(/[\s-]+/g,''))}{o.prob !== null ? ' ' + o.prob + '%' : ''}</button>{/each}
                  {#if hasLow('type', (optsPantsType.length?optsPantsType:[])) && !showLow.type}<button class="dropdown-option" onclick={() => toggleLow('type')}>{$t('lower_percent_options')}</button>{/if}
                  {#if !(optsPantsType.length || optsShoesType.length)}
                    {#each Object.keys(typeCriteria[typeKey()]) as c}
                      <button class="dropdown-option" onclick={() => { typeValue = c; typeOpen=false; }} type="button">{($t('type_' + c.replace(/[\s-]+/g,'')) === 'type_' + c.replace(/[\s-]+/g,'')) ? c : $t('type_' + c.replace(/[\s-]+/g,''))}</button>
                    {/each}
                  {/if}
                  {/if}
                </div>
              {/if}
            </div></label>
          {/if}
        {/if}
      {/if}
      {/if}
    {/if}
    {#if optional}<label><input type="checkbox" bind:checked={included} /> {$t('include')}</label>{/if}
    <div class="actions">
      <button class="ghost" onclick={cancel}>{$t('cancel')}</button>
      <button class="primary" onclick={save} disabled={!isSaveAllowed()}>{$t('save_item')}</button>
    </div>
  </div>
{/if}
