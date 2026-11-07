<script>
  import { t } from './i18n.ts';
  import { get } from 'svelte/store';
  import { scoreOutfit, conflictsByGarment } from './data/scoring.js';
  import { language } from './store.ts';
  import { occasion, gender, selections, activeGarmentModal } from './store.ts';
  import { tracedFetch } from './telemetry.js';
  import { onMount } from 'svelte';
  const AI_TEXT_MODEL = import.meta.env.VITE_AI_MODEL || 'nimble-v3:9b';
  import './global.css';
  import GarmentCard from './GarmentCard.svelte';
  import Welcome from './Welcome.svelte';
  import WardrobeView from './WardrobeView.svelte';
  import { menFormal, menInformal, womenFormal, womenSemi, womenFuneral, womenDate, coupleFormal } from './data/garments.js';

  let keyLabelLang = 'en';
  language.subscribe((l) => { keyLabelLang = l; });
  const keyLabel = (lang, k) => ({
      en: { color:'Color', pattern:'Pattern', secondary:'Secondary Color', strap:'Strap Color', case:'Case Colour', dial:'Dial Colour', type:'Type', name:'Name', wardrobeItemId:null },
      pl: { color:'Kolor', pattern:'Wzór', secondary:'Dodatkowy kolor', strap:'Kolor paska', case:'Kolor koperty', dial:'Kolor tarczy', type:'Typ', name:'Nazwa', wardrobeItemId:null }
    })[lang || 'en'][k] || k;
  let activeSide = $state('man');
  let view = $state('outfit');
  const activeGender = $derived($gender?.who === 'couple' ? activeSide : ($gender?.who || 'man'));
  let viewport = $state(null);
  let canLeft = $state(false);
  let canRight = $state(false);
  let dragging = $state(false);
  let startX = 0;
  let startScroll = 0;
  let moved = $state(false);
  function updateScroll() {
    if (!viewport) return;
    canLeft = viewport.scrollLeft > 6;
    canRight = viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 6;
  }
  function scrollByAmount(dx) { viewport?.scrollBy({ left: dx, behavior: 'smooth' }); setTimeout(updateScroll, 300); }
  function onDown(e) { if (!viewport) return; dragging = true; moved = false; startX = (e.touches && e.touches[0]) ? e.touches[0].pageX : e.pageX; startScroll = viewport.scrollLeft; }
    function onMove(e) { if (!dragging || !viewport) return; const pageX = (e.touches && e.touches[0]) ? e.touches[0].pageX : e.pageX; const dx = pageX - startX; if (Math.abs(dx) > 6) moved = true; viewport.scrollLeft = startScroll - dx; if (e.touches) e.preventDefault(); }
    function onUp() { if (!dragging) return; dragging = false; updateScroll(); }
  function onClickCapture(e) { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } updateScroll(); }
  onMount(() => {
    updateScroll();
    if (viewport) viewport.addEventListener('scroll', updateScroll);
    window.addEventListener('resize', updateScroll);
    return () => {
      if (viewport) viewport.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', updateScroll);
    };
  });

  $effect(() => { if (viewport) setTimeout(updateScroll, 0); });

  function garmentList(gender, occ) {
    const g = gender?.who || 'man';
    if (g === 'woman') {
      if (occ?.category === 'funeral') return womenFuneral;
      if (occ?.category === 'formalBusiness') return womenFormal;
      if (occ?.category === 'informalMeeting') return womenDate;
      return womenSemi;
    }
    if (g === 'couple') return (occ?.category === 'informalMeeting' ? menInformal : menFormal);
    return (occ?.category === 'informalMeeting' ? menInformal : menFormal);
  }
  const keyOf = (g) => `${activeGender}:${g}`;
  const occasionLabels = { weddingCloseFamily:'Wedding (close family)', weddingGuest:'Wedding (guest)', funeral:'Funeral', formalBusiness:'Formal business meeting', informalMeeting:'Date / Smart casual' };
  function occasionText(o, lang) {
    if (!o) return '';
    const __t = (enKey, plValue) => lang === 'pl' ? plValue : enKey;
    if (o.category === 'wedding') return o.variant === 'closeFamily' ? __t('Wedding (close family)', 'Ślub jako członek rodziny') : __t('Wedding (guest)', 'Ślub jako gość');
    if (o.category === 'funeral') return lang === 'pl' ? 'Pogrzeb' : 'Funeral';
    if (o.category === 'formalBusiness') return lang === 'pl' ? 'Formalne spotkanie biznesowe' : 'Formal business meeting';
    if (o.category === 'informalMeeting') return lang === 'pl' ? 'Randka / smart casual' : 'Date / Smart casual';
    return o.category;
  }
  let garments = $derived($occasion ? garmentList({ who: activeGender }, $occasion) : []);
  let selObj = $derived($selections);
  let outfitScore = $derived(scoreOutfit(selObj, $occasion, activeGender, $language));
  let aiFitMan = $state(null);
  let aiFitWoman = $state(null);
  let aiFitLoading = $state(false);
  let fitTimer;
  $effect(() => {
    const selectionKeys = Object.keys($selections || {});
    if (!selectionKeys.length) { aiFitMan = null; aiFitWoman = null; return; }
    aiFitLoading = true;
    if (fitTimer) clearTimeout(fitTimer);
    fitTimer = setTimeout(async () => {
      try {
        const r = await tracedFetch('http://localhost:11434/v1/systemone', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: AI_TEXT_MODEL,
            state: JSON.stringify({ occasion: $occasion, selections: $selections }),
            questions: {
              man_fit: { type: 'noul', instructions: `Is the complete men's outfit suitable and coherent for the occasion?`, criteria: { true: 'Suitable', false: 'Not suitable' } },
              woman_fit: { type: 'noul', instructions: `Is the complete women's outfit suitable and coherent for the occasion?`, criteria: { true: 'Suitable', false: 'Not suitable' } }
            },
            rules: 'Evaluate dress code, colour harmony, pattern discipline, accessory matching.'
          })
        }, { name: 'fit-score', model: AI_TEXT_MODEL });
        const data = await r.json();
        const answers = data?.answers || {};
        const toDecimal = (v) => { const n = Number(v); if (!Number.isFinite(n)) return 0; return n > 1 ? n / 100 : n; };
        if (answers?.man_fit?.noul !== undefined) aiFitMan = Math.round(toDecimal(answers.man_fit.noul) * 100);
        if (answers?.woman_fit?.noul !== undefined) aiFitWoman = Math.round(toDecimal(answers.woman_fit.noul) * 100);
      } catch (_e) {
        // fallback remains heuristic
      } finally {
        aiFitLoading = false;
      }
    }, 700);
    return () => { if (fitTimer) clearTimeout(fitTimer); };
  });
  let singleDisplayScore = $derived(activeGender === 'woman' ? (aiFitWoman ?? outfitScore.score) : (aiFitMan ?? outfitScore.score));
  let manDisplayScore = $derived(aiFitMan ?? manScore.score);
  let womanDisplayScore = $derived(aiFitWoman ?? womanScore.score);  let outfitConflicts = $derived(conflictsByGarment(selObj, $occasion, activeGender));
  let manScore = $derived(scoreOutfit(selObj, $occasion, 'man', $language));
  let womanScore = $derived(scoreOutfit(selObj, $occasion, 'woman', $language));
  let manHasSelections = $derived(garmentsFor('man').some(g => selObj['man:'+g] && selObj['man:'+g].included !== false));
  let womanHasSelections = $derived(garmentsFor('woman').some(g => selObj['woman:'+g] && selObj['woman:'+g].included !== false));

  function translateChipValue(lang, k, v) {
    const lookup = get(t);
    let prefix = '';
    if (k === 'pattern') prefix = 'pattern_';
    else if (k === 'color' || k === 'strap' || k === 'case' || k === 'dial' || k === 'secondary' || String(k).includes('color')) prefix = 'color_';
    if (k === 'type') {
      const key = 'type_' + String(v ?? '').replace(/[\s-]+/g, '');
      const out = lookup(key);
      return out === key ? String(v ?? '') : out;
    }
    if (!prefix) return String(v ?? '');
    const key = prefix + String(v ?? '').replace(/\s+/g, '');
    const out = lookup(key);
    return out === key ? String(v ?? '') : out;
  }
  let visibleGarments = $derived.by(() => garments.filter(g => {
        if (g === 'Pocket Square') {
          if (!garments.includes('Jacket')) return false;
          const jacketSel = (selObj || {})[`${activeGender}:Jacket`];
          if (jacketSel && jacketSel.included === false) return false;
        }
        if (activeGender !== 'woman') return true;
      const s = selObj || {};
      const dressActive = s[keyOf('Dress')] && s[keyOf('Dress')].included !== false;
      if (dressActive) return !['Pants','Skirt','Blouse'].includes(g);
      if (s[keyOf('Pants')] && s[keyOf('Pants')].included !== false) return g !== 'Skirt' && g !== 'Dress';
      if (s[keyOf('Skirt')] && s[keyOf('Skirt')].included !== false) return g !== 'Pants' && g !== 'Dress';
      return true;
  }));
  let selectedItems = $derived(visibleGarments.filter(g => selObj[keyOf(g)] && selObj[keyOf(g)].included !== false));

  function start(o,g){
  selections.update(s => {
    const next = { ...s };
    for (const key of Object.keys(next)) {
      const [side, garment] = key.split(':');
      if ((side === 'man' || side === 'woman') && !garmentList({ who: side }, o).includes(garment)) delete next[key];
    }
    return next;
  });
  occasion.set(o); gender.set(g); activeSide='man';
 }
  function reset(){ occasion.set(null); gender.set(null); selections.set({}); activeGarmentModal.set(null); activeSide='man'; }
  function garmentsFor(side){ return garmentList({ who: side }, $occasion); }
  function clear(){ selections.set({}); }
</script>

{#if !$occasion || !$gender}
  <Welcome onselect={start} />
{:else if view === 'wardrobe'}
  <WardrobeView onback={() => view='outfit'} />
{:else}
  <header class="top">
    <button class="ghost" onclick={reset}><span class="back-arrow">←</span> {$t('button_back_welcome')}</button>
    <h1>{$t('welcome_title')}{ $occasion ? ' - ' + occasionText($occasion, $language) : '' }</h1>
    <div class="top-actions">
      <div class="lang-switch">
        <button class="ghost" class:active={$language === 'en'} onclick={() => language.set('en')}>EN</button>
        <button class="ghost" class:active={$language === 'pl'} onclick={() => language.set('pl')}>PL</button>
      </div>
      <button class="ghost" onclick={() => view = view === 'outfit' ? 'wardrobe' : 'outfit'}>{view === 'outfit' ? $t('button_wardrobe') : $t('button_outfit')}</button>
    </div>
    {#if $gender?.who === 'couple'}
      <div class="side-switcher">
        <button class="ghost" class:active={activeSide==='man'} onclick={() => activeSide='man'}>{$t('gender_man')}</button>
                <button class="ghost" class:active={activeSide==='woman'} onclick={() => activeSide='woman'}>{$t('gender_woman')}</button>
      </div>
    {/if}
  </header>
  <div class="carousel">
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <main class="grid" bind:this={viewport} onclickcapture={onClickCapture} onmousedown={onDown} onmousemove={onMove} onmouseup={onUp} onmouseleave={onUp} ontouchstart={onDown} ontouchmove={onMove} ontouchend={onUp} class:dragging={dragging}>
      {#each visibleGarments as g}
        <GarmentCard garment={g} garmentKey={`${activeGender}:${g}`} gender={{ who: activeGender }} optional={g==='Watch'||g==='Belt'||g==='Handbag'||g==='Jewelry'||g==='Pocket Square'||(g==='Jacket' && $occasion?.category==='informalMeeting')} {selections} occasion={$occasion} conflicts={outfitConflicts[g] || []} />
      {/each}
    </main>
    {#if canLeft}
      <button class="carousel-arrow left" onclick={() => scrollByAmount(-320)} type="button" aria-label="Previous">‹</button>
    {/if}
    {#if canRight}
      <button class="carousel-arrow right" onclick={() => scrollByAmount(320)} type="button" aria-label="Next">›</button>
    {/if}
  </div>
  {#if $gender?.who === 'couple'}
    <section class="summary-panel">
    <h2>{$t('man_side')}</h2>
      <div class="score-line"><strong>{$t('fit_score')} ({$t('gender_man')}):</strong> {manHasSelections ? (manDisplayScore) : '-'}/100 ({$t('ai_if_available')}{aiFitLoading ? ': ' + $t('analyzing_fit') : ''})
        {#if manScore.warnings.length}
          <ul class="score-warnings">{#each manScore.warnings as w}<li>{w}</li>{/each}</ul>
        {/if}
      </div>
      {#if garmentsFor('man').some(g => selObj['man:'+g] && selObj['man:'+g].included !== false)}
        <div class="chips">
          {#each garmentsFor('man') as g}
            {#if selObj['man:'+g] && selObj['man:'+g].included !== false}
              <div class="chip">
                <strong>{$t(`garment_${g.replace(/\s+/g,'')}`)}</strong>
                <span class="chip-details">{Object.entries(selObj['man:'+g]).filter(([k,v]) => k !== 'included' && k !== 'gender' && k !== 'wardrobeItemId' && v !== null && v !== '' && !((g==='Shoes' || g==='Belt' || g==='Handbag' || g==='Jewelry') && k==='pattern')).map(([k,v]) => keyLabel($language, k) + ': ' + translateChipValue($language, k, v)).join(', ')}</span>
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <p>{$t('no_garments_man')}</p>
      {/if}
    </section>
    <section class="summary-panel">
    <h2>{$t('women_side')}</h2>
      <div class="score-line"><strong>{$t('fit_score')} ({$t('gender_woman')}):</strong> {womanHasSelections ? (womanDisplayScore) : '-'}/100 ({$t('ai_if_available')}{aiFitLoading ? ': ' + $t('analyzing_fit') : ''})
        {#if womanScore.warnings.length}
          <ul class="score-warnings">{#each womanScore.warnings as w}<li>{w}</li>{/each}</ul>
        {/if}
      </div>
      {#if garmentsFor('woman').some(g => selObj['woman:'+g] && selObj['woman:'+g].included !== false)}
        <div class="chips">
          {#each garmentsFor('woman') as g}
            {#if selObj['woman:'+g] && selObj['woman:'+g].included !== false}
              <div class="chip">
                <strong>{$t(`garment_${g.replace(/\s+/g,'')}`)}</strong>
                <span class="chip-details">{Object.entries(selObj['woman:'+g]).filter(([k,v]) => k !== 'included' && k !== 'gender' && k !== 'wardrobeItemId' && v !== null && v !== '' && !((g==='Shoes' || g==='Belt' || g==='Handbag' || g==='Jewelry') && k==='pattern')).map(([k,v]) => keyLabel($language, k) + ': ' + translateChipValue($language, k, v)).join(', ')}</span>
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <p>{$t('no_garments_woman')}</p>
      {/if}
    </section>
  {:else}
    <section class="summary-panel">
    <h2>{$t('selected_outfit')}</h2>
    <div class="score-line"><strong>{$t('fit_score')}:</strong> {selectedItems.length ? singleDisplayScore : '-'}/100 ({$t('ai_if_available')}{aiFitLoading ? ': ' + $t('analyzing_fit') : ''})
      {#if outfitScore.warnings.length}
        <ul class="score-warnings">
          {#each outfitScore.warnings as w}<li>{w}</li>{/each}
        </ul>
      {/if}
    </div>
      {#if selectedItems.length}
        <div class="chips">
          {#each selectedItems as g}
            <div class="chip">
              <strong>{$t('garment_' + g.replace(/\s+/g,''))}</strong>
              <span class="chip-details">{Object.entries(selObj[keyOf(g)]).filter(([k,v]) => k !== 'included' && k !== 'gender' && k !== 'wardrobeItemId' && v !== null && v !== '' && !((g==='Shoes' || g==='Belt' || g==='Handbag' || g==='Jewelry') && k==='pattern')).map(([k,v]) => keyLabel($language, k) + ': ' + translateChipValue($language, k, v)).join(', ')}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p>{$t('no_garments_yet')}</p>
      {/if}
    </section>
  {/if}
  <div class="action-bar">
    <button class="ghost" onclick={clear}>{$t('button_reset')}</button>
        <button class="primary" onclick={() => window.print()}>{$t('button_save')}</button>
  </div>
{/if}
