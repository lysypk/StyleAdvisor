<script lang="ts">
  import { language } from './store.ts';
  import { t } from './i18n.ts';

  export let onselect: (occasion: any, gender: any) => void;
  const occasions: Array<{ key: string; value: { category: string; variant?: string } }> = [
    { key: 'occ_wedding_close', value: { category: 'wedding', variant: 'closeFamily' } },
    { key: 'occ_wedding_guest', value: { category: 'wedding', variant: 'guest' } },
    { key: 'occ_funeral', value: { category: 'funeral' } },
    { key: 'occ_formal_business', value: { category: 'formalBusiness' } },
    { key: 'occ_date_smart', value: { category: 'informalMeeting' } }
  ];
  let occasion: { category: string; variant?: string } | null = null;
  let gender: { who: string } | null = null;
  $: if (occasion && gender) onselect(occasion, gender);
</script>

<section class="welcome">
  <div class="welcome-card">
  <div class="lang-switch">
    <button class="ghost" class:active={$language === 'en'} onclick={() => language.set('en')}>EN</button>
    <button class="ghost" class:active={$language === 'pl'} onclick={() => language.set('pl')}>PL</button>
  </div>
    <h1>{$t('welcome_title')}</h1>
    <p class="sub">{$t('welcome_sub')}</p>
    <div class="steps">
      <span class="step">{$t('step_occasion')}</span>
      <span class="step-dot">→</span>
      <span class="step">{$t('step_who')}</span>
      <span class="step-dot">→</span>
      <span class="step">{$t('step_garments')}</span>
    </div>
    <div class="occasions">
      {#each occasions as o}
          <button class:active={occasion===o.value} onclick={() => occasion=o.value}>{o.key ? $t(o.key) : ''}</button>
      {/each}
    </div>
    <div class="genders">
      <button class:active={gender?.who==='man'} onclick={() => gender={who:'man'}} aria-label={$t('gender_man')}>
        <span class="symbol">♂</span><span class="gender-label">{$t('gender_man')}</span>
      </button>
      <button class:active={gender?.who==='woman'} onclick={() => gender={who:'woman'}} aria-label={$t('gender_woman')}>
        <span class="symbol">♀</span><span class="gender-label">{$t('gender_woman')}</span>
      </button>
      <button class:active={gender?.who==='couple'} onclick={() => gender={who:'couple'}} aria-label={$t('gender_couple')}>
        <span class="symbol">♂♀</span><span class="gender-label">{$t('gender_couple')}</span>
      </button>
    </div>
    <p class="footnote">{$t('powered_by')}</p>
  </div>
</section>
