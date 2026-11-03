<script>
  let { onback = () => {} } = $props();
  import { wardrobeItems, addItem, removeItem, updateItem, exportJson, importJsonText } from './wardrobe.js';
  import { tracedFetch } from './telemetry.js';
  import { colourHexMap, allColors } from './data/colors.js';
  import { t } from './i18n.ts';
  import { language } from './store.ts';
  import { get } from 'svelte/store';

  function L(key) { return get(t)(key); }
function colorName(v) { return v ? L('color_' + String(v).replace(/\s+/g, '')) : '—'; }
function itemDetail(item) {
  if (item.type === 'Watch') {
    return `${L('strap_label')}: ${colorName(item.strap)} · ${L('case_label')}: ${colorName(item.case)} · ${L('dial_label')}: ${colorName(item.dial)}`;
  }
  return `${L('color_label')}: ${colorName(item.color)}${item.type === 'Handbag' || item.type === 'Jewelry' || !item.pattern ? '' : ' · ' + L('pattern_label') + ': ' + L('pattern_' + String(item.pattern).replace(/\s+/g, ''))}${item.secondary ? ' · ' + L('secondary_label') + ': ' + colorName(item.secondary) : ''}${item.itemType ? ' · ' + L('type_label') + ': ' + L('type_' + String(item.itemType).replace(/[\s-]+/g, '')) : ''}`;
}

let type = $state('Shirt');
  let g = $state('');
  let color = $state('White');
  let pattern = $state('Plain');
  let secondary = $state('');
  let itype = $state('');
  let strap = $state('');
  let caseC = $state('Silver');
  let dial = $state('White');
  const patternGarments = ['Shirt','Jacket','Tie','Pants','Blouse','Skirt','Dress','Pocket Square'];
  const typeGarments = ['Pants','Shoes','Skirt'];
  let isWatch = $derived(type === 'Watch');
  let hasPattern = $derived(patternGarments.includes(type));
  let hasType = $derived(typeGarments.includes(type));
  $effect(() => { type; g; color='White'; pattern='Plain'; secondary=''; itype=''; strap=''; caseC='Silver'; dial='White'; openField=''; });
  let genderSelected = $derived(!!g);
  let formOpen = $state(false);
  let editingId = $state(null);
  let editingName = $state('');
  let openField = $state('');
  let canAdd = $derived(genderSelected && type && (type === 'Watch' ? (strap && caseC && dial) : (color && (pattern === 'Plain' || secondary))) && (type !== 'Pants' && type !== 'Shoes' && type !== 'Skirt' || itype));
  let namePromptOpen = $state(false);
  let renamePromptOpen = $state(false);
  let renamingId = $state(null);
  let renameName = $state('');
  let wardrobeSearch = $state('');
  let renameValid = $derived(/^[A-Za-z0-9 ]{1,30}$/.test(renameName));
  let itemName = $state('');
  let nameValid = $derived(/^[A-Za-z0-9 ]{1,30}$/.test(itemName));
  let visibleWardrobeItems = $derived(($wardrobeItems || []).filter((item) => {
    const q = wardrobeSearch.trim().toLowerCase();
    if (!q) return true;
    return [item.name, item.type, item.color, item.strap, item.case, item.dial, item.itemType]
      .some((v) => String(v || '').toLowerCase().includes(q));
  }));
  let typeOpts = $derived.by(() => type === 'Pants' ? (g === 'woman' ? ['Wide-Leg','Straight','Tapered','Palazzo','Bootcut'] : ['Jeans','Chinos','Dress','Slim','Cargo']) : type === 'Shoes' ? (g === 'woman' ? ['Pump','Ballet Flat','Loafer','Sandal','Wedge','Ankle Boot','Closed-Toe Flat'] : ['Oxford','Derby','Loafer','Monk']) : type === 'Skirt' ? ['Midi','Pencil','A-Line','Pleated','Maxi','Mini'] : []);
  const menTypes = ['Shirt','Jacket','Tie','Belt','Watch','Pants','Shoes','Pocket Square'];
  const womenTypes = ['Blouse','Dress','Skirt','Pants','Shoes','Jacket','Handbag','Jewelry'];
  let availableTypes = $derived(g === 'woman' ? womenTypes : g === 'man' ? menTypes : []);
  $effect(() => { if (!availableTypes.includes(type)) type = availableTypes[0] || ''; });

  let photoOpen = $state(false);
  let multiAnalyzing = $state(false);
  let photoPreview = $state('');
  let photoBase64 = $state('');
  let analyzing = $state(false);
  let photoError = $state('');

  function extractJson(text) {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch (e) { return null; }
  }

  async function callVision(prompt) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const r = await tracedFetch('http://localhost:11434/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ model:'lfm3-vl:2b', stream:false, format:'json', messages:[{ role:'user', content: prompt, images:[photoBase64] }] }),
        signal: controller.signal
      });
      if (!r.ok) throw new Error('HTTP '+r.status);
      const data = await r.json();
      return data?.message?.content || '';
    } finally {
      clearTimeout(timer);
    }
  }

  function onPhotoFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    photoError = '';
    if (!file.type.startsWith('image/')) { photoError = $t('image_file_error'); e.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { photoError = $t('image_size_error'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => { photoError = $t('image_load_error'); };
      img.onload = () => {
        const max = 1024;
        let w = img.width, h = img.height;
        if (w > max || h > max) { const scale = max / Math.max(w,h); w = Math.round(w*scale); h = Math.round(h*scale); }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img,0,0,w,h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        photoPreview = dataUrl;
        photoBase64 = dataUrl.split(',')[1];
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function resizeFileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Image load failed'));
        img.onload = () => {
          const max = 1024;
          let w = img.width, h = img.height;
          if (w > max || h > max) { const scale = max / Math.max(w,h); w = Math.round(w*scale); h = Math.round(h*scale); }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function analyzeFileToItem(file) {
    const dataUrl = await resizeFileToDataUrl(file);
    const base64 = dataUrl.split(',')[1];
    const old = photoBase64;
    photoBase64 = base64;
    try {
      const t1 = await callVision('Identify the garment and wearer gender from the photo. Return JSON only with keys gender ("man" or "woman") and type (one of Shirt,Jacket,Tie,Belt,Watch,Pants,Shoes,Blouse,Skirt,Dress,Handbag,Jewelry,Pocket Square).');
      const j1 = extractJson(t1);
      if (!j1 || !j1.gender || !j1.type) throw new Error('Could not detect garment/type');
      const g = (j1.gender === 'woman') ? 'woman' : 'man';
      let type = j1.type;
      let color = 'White', pattern = 'Plain', secondary = '', itype = '';
      let strap = '', caseC = 'Silver', dial = 'White';
      await new Promise(r => setTimeout(r, 50));
      type = j1.type;
      await new Promise(r => setTimeout(r, 100));
      const typeOptions = type === 'Pants' ? (g === 'woman' ? ['Wide-Leg','Straight','Tapered','Palazzo','Bootcut'] : ['Jeans','Chinos','Dress','Slim','Cargo'])
        : type === 'Shoes' ? (g === 'woman' ? ['Pump','Ballet Flat','Loafer','Sandal','Wedge','Ankle Boot','Closed-Toe Flat'] : ['Oxford','Derby','Loafer','Monk'])
        : type === 'Skirt' ? ['Midi','Pencil','A-Line','Pleated','Maxi','Mini'] : [];
      const prompt2 = type === 'Watch'
        ? 'Return JSON only with keys strap, case, dial (colour names from: Silver, Gold, Black, White, Blue, Brown, Grey, Red).'
        : ['Shirt','Jacket','Tie','Pants','Blouse','Skirt','Dress','Pocket Square'].includes(type)
        ? 'Return JSON only with keys color (one colour), pattern (Plain/Stripes/Checks/Dots), secondary (colour or null if pattern is Plain).'
        : `Return JSON only with keys color (one colour), itemType (${typeOptions.length ? `one of: ${typeOptions.join(', ')}` : 'null'})`;
      const t2 = await callVision(prompt2);
      const j2 = extractJson(t2);
      if (j2) {
        if (type === 'Watch') { strap = j2.strap || strap; caseC = j2.case || caseC; dial = j2.dial || dial; color = ''; pattern = 'Plain'; }
        else { color = j2.color || color; pattern = j2.pattern || pattern; secondary = j2.secondary || secondary; itype = j2.itemType || itype; if (typeOptions.length && itype && !typeOptions.includes(itype)) itype = ''; }
      }
      const item = { gender: g, type, color, pattern, secondary: secondary || null, itemType: itype || null, name: null };
      if (type === 'Watch') { item.strap = strap; item.case = caseC; item.dial = dial; item.color = null; item.pattern = null; }
      return item;
    } finally {
      photoBase64 = old;
    }
  }

  async function processMultiplePhotos(files) {
    multiAnalyzing = true;
    photoError = '';
    let added = 0;
    for (const file of files) {
      try {
        const item = await analyzeFileToItem(file);
        addItem(item);
        added++;
      } catch (err) {
        photoError = err.message || $t('analysis_failed');
      }
    }
    multiAnalyzing = false;
    if (added) alert('Added ' + added + ' item(s) from photos.');
  }


  async function analyzePhoto() {
    if (!photoBase64) return;
    analyzing = true; photoError = '';
    try {
      // Pass 1: gender + type
      const t1 = await callVision('Identify the garment and wearer gender from the photo. Return JSON only with keys gender ("man" or "woman") and type (one of Shirt,Jacket,Tie,Belt,Watch,Pants,Shoes,Blouse,Skirt,Dress,Handbag,Jewelry,Pocket Square).');
      const j1 = extractJson(t1);
      if (!j1 || !j1.gender || !j1.type) throw new Error('Could not detect garment/type');
      g = (j1.gender === 'woman') ? 'woman' : 'man';
      // wait for reactive availableTypes
      await new Promise(r => setTimeout(r, 50));
      type = j1.type;
      await new Promise(r => setTimeout(r, 100));

      // Pass 2: params
      const typeOptions = type === 'Pants' ? (g === 'woman' ? ['Wide-Leg','Straight','Tapered','Palazzo','Bootcut'] : ['Jeans','Chinos','Dress','Slim','Cargo'])
        : type === 'Shoes' ? (g === 'woman' ? ['Pump','Ballet Flat','Loafer','Sandal','Wedge','Ankle Boot','Closed-Toe Flat'] : ['Oxford','Derby','Loafer','Monk'])
        : type === 'Skirt' ? ['Midi','Pencil','A-Line','Pleated','Maxi','Mini'] : [];
      const prompt2 = type === 'Watch'
        ? 'Return JSON only with keys strap, case, dial (colour names from: Silver, Gold, Black, White, Blue, Brown, Grey, Red).'
        : ['Shirt','Jacket','Tie','Pants','Blouse','Skirt','Dress','Pocket Square'].includes(type)
        ? 'Return JSON only with keys color (one colour), pattern (Plain/Stripes/Checks/Dots), secondary (colour or null if pattern is Plain).'
        : `Return JSON only with keys color (one colour), itemType (${typeOptions.length ? `one of: ${typeOptions.join(', ')}` : 'null'})`;
      const t2 = await callVision(prompt2);
      const j2 = extractJson(t2);
      if (j2) {
        if (type === 'Watch') { strap = j2.strap || strap; caseC = j2.case || caseC; dial = j2.dial || dial; color = ''; pattern = 'Plain'; }
        else { color = j2.color || color; pattern = j2.pattern || pattern; secondary = j2.secondary || secondary; itype = j2.itemType || itype; if (typeOptions.length && itype && !typeOptions.includes(itype)) itype = ''; }
      }
      photoOpen = false;
      formOpen = true;
    } catch (err) {
      photoError = err.message || $t('analysis_failed');
    } finally {
      analyzing = false;
    }
  }

  function onImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const res = importJsonText(reader.result); alert(`Imported ${res.imported} item(s); skipped ${res.skipped} invalid.` + (res.errors.length ? '\n' + res.errors.join('\n') : '')); } catch (err){ alert('Import failed: '+err.message);} };
    reader.readAsText(file);
    e.target.value = '';
  }

  function renameSelected() {
    if (renamingId && renameValid) {
      updateItem(renamingId, { name: renameName.trim() || null });
      renamePromptOpen = false;
      renamingId = null;
    }
  }

  async function startEdit(item) {
    editingId = item.id;
    editingName = item.name || '';
    g = item.gender || '';
    type = item.type || '';
    await new Promise(r => setTimeout(r, 0));
    if (type === 'Watch') {
      strap = item.strap || '';
      caseC = item.case || 'Silver';
      dial = item.dial || 'White';
      color = '';
      pattern = 'Plain';
      secondary = '';
      itype = '';
    } else {
      color = item.color || 'White';
      pattern = item.pattern || 'Plain';
      secondary = item.secondary || '';
      itype = item.itemType || '';
      strap = '';
    }
    formOpen = true;
  }

  function saveEdit() {
    if (!editingId || !canAdd) return;
    const patch = { gender: g, type, color, pattern: hasPattern ? pattern : 'Plain', secondary: (hasPattern && pattern !== 'Plain') ? (secondary || null) : null, itemType: hasType ? itype : null, name: editingName || null };
    if (type === 'Watch') { patch.strap = strap; patch.case = caseC; patch.dial = dial; patch.color = null; patch.pattern = null; }
    updateItem(editingId, patch);
    editingId = null;
    editingName = '';
    formOpen = false;
    namePromptOpen = false;
  }

  function handleSave() {
    if (editingId) { saveEdit(); return; }
    if (canAdd) { itemName = ''; namePromptOpen = true; }
  }

  function downloadTemplate() {
    const garments = [
      ...menTypes.map(g => ({ gender: 'man', type: g })),
      ...womenTypes.map(g => ({ gender: 'woman', type: g }))
    ];
    // unique gender+type
    const seen = new Set();
    const dedup = [];
    for (const g of garments) {
      const key = g.gender + '::' + g.type;
      if (seen.has(key)) continue;
      seen.add(key);
      dedup.push(g);
    }
    const out = dedup.map((g) => {
      if (g.type === 'Watch') {
        return { gender: g.gender, type: g.type, color: null, pattern: null, secondary: null, itemType: null, name: '', strap: 'Black', case: 'Silver', dial: 'White' };
      }
      return { gender: g.gender, type: g.type, color: 'White', pattern: 'Plain', secondary: null, itemType: (g.type === 'Pants' || g.type === 'Shoes' || g.type === 'Skirt') ? g.type === 'Skirt' ? 'Midi' : null : null, name: '' };
    });
    const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'wardrobe-template.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function add() {
    const item = { gender: g, type, color, pattern, secondary: secondary || null, itemType: itype || null, name: itemName.trim() || null };
    if (type === 'Watch') { item.strap = strap; item.case = caseC; item.dial = dial; item.color = null; item.pattern = null; }
    addItem(item);
    formOpen = false;
    namePromptOpen = false;
  }
</script>

<section class="wardrobe">
  <div class="wardrobe-header">
    <button class="ghost" onclick={onback}><span class="back-arrow">←</span> {$t('button_outfit')}</button>
    <h2>{$t('wardrobe')}</h2>
    <div class="lang-switch">
      <button class="ghost" class:active={$language === 'en'} onclick={() => language.set('en')}>EN</button>
      <button class="ghost" class:active={$language === 'pl'} onclick={() => language.set('pl')}>PL</button>
    </div>
  </div>
  <div class="actions" style="margin-bottom:1rem;">
    <input class="ghost" style="max-width:150px;min-width:120px;" type="search" bind:value={wardrobeSearch} placeholder={$t('search_wardrobe')} />
    <button class="primary" onclick={() => { editingId=null; editingName=''; formOpen=true; }}>{$t('add_item')}</button>
    <button class="ghost" onclick={() => photoOpen = true}>{$t('add_from_photo')}</button>
    <button class="ghost" onclick={exportJson}>{$t('export_json')}</button>
    <button class="ghost" onclick={downloadTemplate}>{$t('download_template')}</button>
    <label class="ghost" style="cursor:pointer;">{$t('import_json')} <input type="file" accept="application/json" onchange={onImport} hidden /></label>
  </div>

  {#if formOpen}
    <div class="wardrobe-form">
      <label>{$t('gender_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'g' ? '' : 'g')} type="button" disabled={!!editingId}>{g ? $t('gender_'+g) : $t('select')}</button>{#if openField === 'g'}<div class="dropdown-panel">{#each ['man','woman'] as v}<button class="dropdown-option" onclick={() => { g = v; openField=''; }} type="button">{$t('gender_'+v)}</button>{/each}</div>{/if}</div></label>
      <label>{$t('type_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'type' ? '' : 'type')} disabled={!!editingId || !genderSelected} type="button">{type ? $t('garment_'+type.replace(/\s+/g,'')) : $t('select')}</button>{#if openField === 'type'}<div class="dropdown-panel">{#each availableTypes as v}<button class="dropdown-option" onclick={() => { type = v; openField=''; }} type="button">{$t('garment_'+v.replace(/\s+/g,''))}</button>{/each}</div>{/if}</div></label>
      {#if type === 'Watch'}
        <label>{$t('strap_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'strap' ? '' : 'strap')} disabled={!genderSelected} type="button"><span class="swatch" style="background:{colourHexMap[strap]||'#888'}"></span> {strap ? $t('color_'+strap.replace(/\s+/g,'')) : $t('select')}</button>{#if openField === 'strap'}<div class="dropdown-panel">{#each allColors as c}<button class="dropdown-option" onclick={() => { strap=c; openField=''; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}</div>{/if}</div></label>
        <label>{$t('case_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'caseC' ? '' : 'caseC')} disabled={!genderSelected} type="button"><span class="swatch" style="background:{colourHexMap[caseC]||'#888'}"></span> {caseC ? $t('color_'+caseC.replace(/\s+/g,'')) : $t('select')}</button>{#if openField === 'caseC'}<div class="dropdown-panel">{#each ['Silver','Gold','Black'] as c}<button class="dropdown-option" onclick={() => { caseC=c; openField=''; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}</div>{/if}</div></label>
        <label>{$t('dial_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'dial' ? '' : 'dial')} disabled={!genderSelected} type="button"><span class="swatch" style="background:{colourHexMap[dial]||'#888'}"></span> {dial ? $t('color_'+dial.replace(/\s+/g,'')) : $t('select')}</button>{#if openField === 'dial'}<div class="dropdown-panel">{#each ['White','Black','Blue','Silver','Gold'] as c}<button class="dropdown-option" onclick={() => { dial=c; openField=''; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}</div>{/if}</div></label>
      {:else}
        <label>{$t('color_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'color' ? '' : 'color')} disabled={!genderSelected} type="button"><span class="swatch" style="background:{colourHexMap[color]||'#888'}"></span> {$t('color_'+color.replace(/\s+/g,''))}</button>{#if openField === 'color'}<div class="dropdown-panel">{#each allColors as c}<button class="dropdown-option" onclick={() => { color=c; openField=''; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}</div>{/if}</div></label>
        {#if hasPattern}
        <label>{$t('pattern_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'pattern' ? '' : 'pattern')} disabled={!genderSelected} type="button">{$t('pattern_'+pattern.replace(/\s+/g,''))}</button>{#if openField === 'pattern'}<div class="dropdown-panel">{#each ['Plain','Stripes','Checks','Dots'] as c}<button class="dropdown-option" onclick={() => { pattern=c; openField=''; }} type="button">{$t('pattern_'+c)}</button>{/each}</div>{/if}</div></label>
        {#if pattern !== 'Plain'}<label>{$t('secondary_label')} <div class="dropdown"><button class="dropdown-trigger" onclick={() => (openField = openField === 'secondary' ? '' : 'secondary')} disabled={!genderSelected} type="button"><span class="swatch" style="background:{colourHexMap[secondary]||'#ccc'}"></span> {secondary ? $t('color_'+secondary.replace(/\s+/g,'')) : $t('select')}</button>{#if openField === 'secondary'}<div class="dropdown-panel">{#each allColors as c}<button class="dropdown-option" onclick={() => { secondary=c; openField=''; }} type="button"><span class="swatch" style="background:{colourHexMap[c]||'#888'}"></span> {$t('color_'+c.replace(/\s+/g,''))}</button>{/each}</div>{/if}</div></label>{/if}
        {/if}
        {#if hasType}
          <label>{$t('type_label')}
            <div class="dropdown">
              <button class="dropdown-trigger" onclick={() => (openField = openField === 'itype' ? '' : 'itype')} disabled={!genderSelected} type="button">{itype ? $t('type_'+itype.replace(/[\s-]+/g,'')) : $t('select')}</button>
              {#if openField === 'itype'}
                <div class="dropdown-panel">
                  {#if type === 'Pants'}
                    {#each (g === 'woman' ? ['Wide-Leg','Straight','Tapered','Palazzo','Bootcut'] : ['Jeans','Chinos','Dress','Slim','Cargo']) as c}<button class="dropdown-option" onclick={() => { itype = c; openField=''; }} type="button">{$t('type_'+c.replace(/[\s-]+/g,''))}</button>{/each}
                  {:else if type === 'Shoes'}
                    {#each (g === 'woman' ? ['Pump','Ballet Flat','Loafer','Sandal','Wedge','Ankle Boot','Closed-Toe Flat'] : ['Oxford','Derby','Loafer','Monk']) as c}<button class="dropdown-option" onclick={() => { itype = c; openField=''; }} type="button">{$t('type_'+c.replace(/[\s-]+/g,''))}</button>{/each}
                  {:else if type === 'Skirt'}
                    {#each ['Midi','Pencil','A-Line','Pleated','Maxi','Mini'] as c}<button class="dropdown-option" onclick={() => { itype = c; openField=''; }} type="button">{$t('type_'+c.replace(/[\s-]+/g,''))}</button>{/each}
                  {/if}
                </div>
              {/if}
            </div>
          </label>
        {/if}
      {/if}
      <div class="actions"><button class="ghost" onclick={() => { formOpen=false; editingId=null; editingName=''; }}>{$t('cancel')}</button><button class="primary" onclick={handleSave} disabled={!canAdd || !genderSelected}>{$t('save_item')}</button></div>
    </div>
  {/if}

  {#if namePromptOpen}
    <div class="modal-backdrop" onclick={() => namePromptOpen=false} role="presentation"></div>
    <div class="modal">
      <h3>{$t('custom_name')}</h3>
      <input bind:value={itemName} maxlength="30" placeholder={$t('custom_name_ph')} />
      <div class="actions">
        <button class="ghost" onclick={() => namePromptOpen=false}>{$t('cancel')}</button>
        <button class="primary" onclick={add} disabled={!nameValid}>{$t('save_item')}</button>
      </div>
    </div>
  {/if}

  {#if renamePromptOpen}
    <div class="modal-backdrop" onclick={() => renamePromptOpen=false} role="presentation"></div>
    <div class="modal">
      <h3>{$t('custom_name')}</h3>
      <input bind:value={renameName} maxlength="30" placeholder={$t('rename_ph')} />
      <div class="actions">
        <button class="ghost" onclick={() => renamePromptOpen=false}>{$t('cancel')}</button>
        <button class="primary" onclick={renameSelected} disabled={!renameValid}>{$t('button_save')}</button>
      </div>
    </div>
  {/if}

  {#if photoOpen}
    <div class="modal-backdrop" onclick={() => { if(!analyzing) photoOpen=false; }} role="presentation"></div>
    <div class="modal">
      <h3>{$t('add_from_photo')}</h3>
      <label class="ghost" style="cursor:pointer;width:100%;text-align:center;">{$t('select_photo')} <input type="file" accept="image/*" onchange={onPhotoFile} hidden /></label>
      {#if !photoPreview}<p class="muted" style="font-size:.85rem;margin:.25rem 0;">{$t('photo_req')}</p>{/if}
      {#if photoPreview}<img src={photoPreview} alt="preview" style="width:100%;border-radius:12px;margin:.5rem 0;" />{/if}
      {#if photoError}<p style="color:var(--accent-error)">{photoError}</p>{/if}
      <div class="actions">
        <button class="ghost" onclick={() => { photoOpen=false; photoPreview=''; photoBase64=''; }} disabled={analyzing}>{$t('cancel')}</button>
        <button class="primary" onclick={analyzePhoto} disabled={!photoBase64 || analyzing}>{analyzing ? $t('analyzing') : $t('analyze')}</button>
      </div>
    </div>
  {/if}

  <div class="wardrobe-list">
    {#each visibleWardrobeItems as item}
      <div class="wardrobe-card">
        <strong>{item.name || $t('unnamed_item')}</strong>
        <div class="wardrobe-card-meta">{item.gender ? $t('gender_'+item.gender) : '—'} · {item.type ? $t('garment_'+item.type.replace(/\s+/g,'')) : '—'}{item.itemType ? ' (' + $t('type_'+item.itemType.replace(/[\s-]+/g,'')) + ')' : ''}</div>
                <div><span class="swatch" style="background:{colourHexMap[item.color || item.strap || item.case || item.dial] || '#ccc'}"></span> {itemDetail(item)}</div>
                <div class="wardrobe-card-actions">
          <button class="ghost" onclick={() => startEdit(item)}>{$t('edit')}</button>
                    <button class="ghost" onclick={() => { renamingId = item.id; renameName = item.name || ''; renamePromptOpen = true; }}>{$t('rename')}</button>
                    <button class="ghost" onclick={() => removeItem(item.id)}>{$t('remove')}</button>
        </div>
      </div>
    {/each}
  </div>
</section>
