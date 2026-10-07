/* The talk's running order: the single source of truth for both decks.
   defense-outline.html (working drafts) and defense-final.html (pushed parts)
   both load parts in exactly this order.

   Chats never edit this file. Only Fer (or the coordinating session, at her
   request) adds, removes or reorders parts. Moving a part here moves it in
   both decks; nobody's slides change. */
const ORDER = [
  // part                  outline slides    what
  ['intro',               'title, 1–8',     'Title and intro (being redesigned)'],
  ['ch1-adv-vulnerability','9',            'Adversarial vulnerability + metamers of standard networks'],
  ['ch1-adv-training',    '10',            'Adversarial training + metamers of robust networks'],
  ['ch1-current-methods', '10–11',         'Bridge: how models are compared to the brain today (natural stimuli only)'],
  ['ch1-mms-logic',       '11–12',          'Logic of model-matched stimuli, research questions'],
  ['ch1-models',          '13',             'The three models'],
  ['ch1-sounds',          '15',             'Natural sounds'],
  ['ch1-synthesis',       '14',             'Synthesis of a model-matched sound'],
  ['ch1-experiment',      '16',             'The experiment (brain)'],
  ['ch1-scanning',        '17',             'Scanning paradigm'],
  ['ch1-nse',             '18',             'Normalized squared error'],
  ['ch1-regions',         '20–21',          'Regions: derivation (S4) + keep reliable voxels'],
  ['ch1-example-voxels',  '19',             'Two example voxels'],
  ['ch1-hypotheses',      '22',             'What would each outcome look like?'],
  ['ch1-results',         '23–26',          'Results maps, by region, by model, recap'],
  ['ch1-regression',      '27–30',          'Stage–region, regression, predictions'],
  ['ch1-negative-space',  '31',             'Why model-matched stimuli differentiate models'],
  ['ch1-summary',         '32',             'Chapter 1 summary'],
  ['ch2',                 '33–38',          'Chapter 2: sound textures'],
  ['ch4',                 '39–45',          'Chapter 4: audiovisual physics'],
  ['conclusion',          '46–47',          'Conclusion, acknowledgements'],
  // ---- backup slides (after the talk) ----
  ['backup-color-metamers','backup',        'Color metamers (backup, placeholder)'],
];
const PARTS = ORDER.map(r => r[0]);
