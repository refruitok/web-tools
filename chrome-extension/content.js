// The QC tool has moved to the Chrome Side Panel.
// Click the extension icon to open it.

let highlightOverlay = null;

const US_TO_UK = {
  // -or vs -our
  'color': 'colour', 'colors': 'colours', 'colored': 'coloured', 'coloring': 'colouring', 'colorist': 'colourist',
  'honor': 'honour', 'honors': 'honours', 'honored': 'honoured', 'honoring': 'honouring', 'honorary': 'honourary',
  'neighbor': 'neighbour', 'neighbors': 'neighbours', 'neighborhood': 'neighbourhood', 'neighborly': 'neighbourly',
  'favorite': 'favourite', 'favorites': 'favourites',
  'flavor': 'flavour', 'flavors': 'flavours', 'flavored': 'flavoured', 'flavoring': 'flavouring',
  'humor': 'humour', 'humors': 'humours', 'humored': 'humoured', 'humoring': 'humouring', 'humorist': 'humourist',
  'labor': 'labour', 'labors': 'labours', 'labored': 'laboured', 'laboring': 'labouring', 'laborer': 'labourer',
  'behavior': 'behaviour', 'behaviors': 'behaviours', 'behavioral': 'behavioural',
  'harbor': 'harbour', 'harbors': 'harbours', 'harbored': 'harboured', 'harboring': 'harbouring',
  'armor': 'armour', 'armored': 'armoured', 'armory': 'armoury',
  'endeavor': 'endeavour', 'endeavors': 'endeavours', 'endeavored': 'endeavoured', 'endeavoring': 'endeavouring',
  'fervor': 'fervour', 'glamor': 'glamour', 'odor': 'odour', 'odors': 'odours', 'parlor': 'parlour',
  'rancor': 'rancour', 'rigor': 'rigour', 'savior': 'saviour', 'saviors': 'saviours',
  'savor': 'savour', 'savored': 'savoured', 'savoring': 'savouring', 'savory': 'savoury',
  'splendor': 'splendour', 'tumor': 'tumour', 'tumors': 'tumours',
  'valor': 'valour', 'vapor': 'vapour', 'vapors': 'vapours', 'vigor': 'vigour', 'demeanor': 'demeanour',
  'candor': 'candour', 'clamor': 'clamour', 'dolor': 'dolour', 'enamor': 'enamour', 'enamored': 'enamoured',

  // -ize vs -ise
  'organize': 'organise', 'organized': 'organised', 'organizer': 'organiser', 'organizers': 'organisers', 'organizing': 'organising', 'organization': 'organisation', 'organizations': 'organisations',
  'realize': 'realise', 'realized': 'realised', 'realizes': 'realises', 'realizing': 'realising', 'realization': 'realisation', 'realizations': 'realisations',
  'recognize': 'recognise', 'recognized': 'recognised', 'recognizes': 'recognises', 'recognizing': 'recognising', 'recognition': 'recognisation',
  'analyze': 'analyse', 'analyzed': 'analysed', 'analyzes': 'analyses', 'analyzing': 'analysing',
  'apologize': 'apologise', 'apologized': 'apologised', 'apologizes': 'apologises', 'apologizing': 'apologising',
  'authorize': 'authorise', 'authorized': 'authorised', 'authorizes': 'authorises', 'authorizing': 'authorising', 'authorization': 'authorisation',
  'characterize': 'characterise', 'characterized': 'characterised', 'characterizes': 'characterises', 'characterizing': 'characterising', 'characterization': 'characterisation',
  'civilize': 'civilise', 'civilized': 'civilised', 'civilizing': 'civilising', 'civilization': 'civilisation',
  'criticize': 'criticise', 'criticized': 'criticised', 'criticizes': 'criticises', 'criticizing': 'criticising',
  'emphasize': 'emphasise', 'emphasized': 'emphasised', 'emphasizes': 'emphasises', 'emphasizing': 'emphasising',
  'finalize': 'finalise', 'finalized': 'finalised', 'finalizes': 'finalises', 'finalizing': 'finalising',
  'generalize': 'generalise', 'generalized': 'generalised', 'generalizes': 'generalises', 'generalizing': 'generalising', 'generalization': 'generalisation',
  'harmonize': 'harmonise', 'harmonized': 'harmonised', 'harmonizes': 'harmonises', 'harmonizing': 'harmonising',
  'idealize': 'idealise', 'idealized': 'idealised', 'idealizes': 'idealises', 'idealizing': 'idealising',
  'industrialize': 'industrialise', 'industrialized': 'industrialised', 'industrializing': 'industrialising', 'industrialization': 'industrialisation',
  'itemize': 'itemise', 'itemized': 'itemised', 'itemizes': 'itemises', 'itemizing': 'itemising',
  'memorize': 'memorise', 'memorized': 'memorised', 'memorizes': 'memorises', 'memorizing': 'memorising',
  'minimize': 'minimise', 'minimized': 'minimised', 'minimizes': 'minimises', 'minimizing': 'minimising',
  'mobilize': 'mobilise', 'mobilized': 'mobilised', 'mobilizes': 'mobilises', 'mobilizing': 'mobilising', 'mobilization': 'mobilisation',
  'modernize': 'modernise', 'modernized': 'modernised', 'modernizes': 'modernises', 'modernizing': 'modernising', 'modernization': 'modernisation',
  'monopolize': 'monopolise', 'monopolized': 'monopolised', 'monopolizes': 'monopolises', 'monopolizing': 'monopolising', 'monopolization': 'monopolisation',
  'moralize': 'moralise', 'moralized': 'moralised', 'moralizes': 'moralises', 'moralizing': 'moralising',
  'normalize': 'normalise', 'normalized': 'normalised', 'normalizes': 'normalises', 'normalizing': 'normalising', 'normalization': 'normalisation',
  'optimize': 'optimise', 'optimized': 'optimised', 'optimizes': 'optimises', 'optimizing': 'optimising', 'optimization': 'optimisation',
  'ostracize': 'ostracise', 'ostracized': 'ostracised', 'ostracizes': 'ostracises', 'ostracizing': 'ostracising',
  'personalize': 'personalise', 'personalized': 'personalised', 'personalizes': 'personalises', 'personalizing': 'personalising', 'personalization': 'personalisation',
  'polarize': 'polarise', 'polarized': 'polarised', 'polarizes': 'polarises', 'polarizing': 'polarising', 'polarization': 'polarisation',
  'popularize': 'popularise', 'popularized': 'popularised', 'popularizes': 'popularises', 'popularizing': 'popularising', 'popularization': 'popularisation',
  'prioritize': 'prioritise', 'prioritized': 'prioritised', 'prioritizes': 'prioritises', 'prioritizing': 'prioritising', 'prioritization': 'prioritisation',
  'privatize': 'privatise', 'privatized': 'privatised', 'privatizes': 'privatises', 'privatizing': 'privatising', 'privatization': 'privatisation',
  'publicize': 'publicise', 'publicized': 'publicised', 'publicizes': 'publicises', 'publicizing': 'publicising',
  'rationalize': 'rationalise', 'rationalized': 'rationalised', 'rationalizes': 'rationalises', 'rationalizing': 'rationalising',
  'revolutionize': 'revolutionise', 'revolutionized': 'revolutionised', 'revolutionizes': 'revolutionises', 'revolutionizing': 'revolutionising',
  'satirize': 'satirise', 'satirized': 'satirised', 'satirizes': 'satirises', 'satirizing': 'satirising',
  'sensitize': 'sensitise', 'sensitized': 'sensitised', 'sensitizes': 'sensitises', 'sensitizing': 'sensitising',
  'signalize': 'signalise', 'signalized': 'signalised', 'signalizes': 'signalises', 'signalizing': 'signalising',
  'socialize': 'socialise', 'socialized': 'socialised', 'socializes': 'socialises', 'socializing': 'socialising',
  'specialize': 'specialise', 'specialized': 'specialised', 'specializes': 'specialises', 'specializing': 'specialising', 'specialization': 'specialisation',
  'standardize': 'standardise', 'standardized': 'standardised', 'standardizes': 'standardises', 'standardizing': 'standardising', 'standardization': 'standardisation',
  'summarize': 'summarise', 'summarized': 'summarised', 'summarizes': 'summarises', 'summarizing': 'summarising',
  'symbolize': 'symbolise', 'symbolized': 'symbolised', 'symbolizes': 'symbolises', 'symbolizing': 'symbolising',
  'sympathize': 'sympathise', 'sympathized': 'sympathised', 'sympathizes': 'sympathises', 'sympathizing': 'sympathising',
  'utilize': 'utilise', 'utilized': 'utilised', 'utilizes': 'utilises', 'utilizing': 'utilising', 'utilization': 'utilisation',
  'visualize': 'visualise', 'visualized': 'visualised', 'visualizes': 'visualises', 'visualizing': 'visualising', 'visualization': 'visualisation',
  'westernize': 'westernise', 'westernized': 'westernised', 'westernizes': 'westernises', 'westernizing': 'westernising',

  // -yze vs -yse
  'analyze': 'analyse', 'analyzed': 'analysed', 'analyzes': 'analyses', 'analyzing': 'analysing',
  'paralyze': 'paralyse', 'paralyzed': 'paralysed', 'paralyzes': 'paralyses', 'paralyzing': 'paralysing',
  'catalyze': 'catalyse', 'catalyzed': 'catalysed', 'catalyzes': 'catalyses', 'catalyzing': 'catalysing',
  'electrolyze': 'electrolyse', 'electrolyzed': 'electrolysed', 'electrolyzes': 'electrolyses', 'electrolyzing': 'electrolysing',
  'hydrolyze': 'hydrolyse', 'hydrolyzed': 'hydrolysed', 'hydrolyzes': 'hydrolyses', 'hydrolyzing': 'hydrolysing',

  // -er vs -re
  'center': 'centre', 'centers': 'centres', 'centered': 'centred', 'centering': 'centring',
  'theater': 'theatre', 'theaters': 'theatres',
  'meter': 'metre', 'meters': 'metres',
  'kilometer': 'kilometre', 'kilometers': 'kilometres',
  'centimeter': 'centimetre', 'centimeters': 'centimetres',
  'millimeter': 'millimetre', 'millimeters': 'millimetres',
  'liter': 'litre', 'liters': 'litres',
  'milliliter': 'millilitre', 'milliliters': 'millilitres',
  'fiber': 'fibre', 'fibers': 'fibres', 'fibrous': 'fibrous',
  'caliber': 'calibre', 'luster': 'lustre', 'meager': 'meagre', 'somber': 'sombre', 'specter': 'spectre',
  'maneuver': 'manoeuvre', 'maneuvers': 'manoeuvres', 'maneuvered': 'manoeuvred', 'maneuvering': 'manoeuvring',
  'miter': 'mitre', 'nitre': 'nitre', 'ocher': 'ochre', 'reconnoiter': 'reconnoitre', 'saber': 'sabre', 'sepulcher': 'sepulchre',

  // Double consonants (L)
  'canceled': 'cancelled', 'canceling': 'cancelling', 'cancelation': 'cancellation',
  'traveled': 'travelled', 'traveling': 'travelling', 'traveler': 'traveller', 'travelers': 'travellers',
  'fueled': 'fuelled', 'fueling': 'fuelling',
  'labeled': 'labelled', 'labeling': 'labelling',
  'marveled': 'marvelled', 'marveling': 'marvelling',
  'modeled': 'modelled', 'modeling': 'modelling', 'modeler': 'modeller',
  'quarreled': 'quarrelled', 'quarreling': 'quarrelling',
  'signaled': 'signalled', 'signaling': 'signalling',
  'tunneled': 'tunnelled', 'tunneling': 'tunnelling',
  'channeled': 'channelled', 'channeling': 'channelling',
  'counseled': 'counselled', 'counseling': 'counselling', 'counselor': 'counsellor', 'counselors': 'counsellors',
  'equaled': 'equalled', 'equaling': 'equalling',
  'jeweled': 'jewelled',
  'paneled': 'panelled', 'paneling': 'panelling',
  'shoveled': 'shovelled', 'shoveling': 'shovelling',
  'spiraled': 'spiralled', 'spiraling': 'spiralling',
  'swiveled': 'swivelled', 'swiveling': 'swivelling',
  'totaled': 'totalled', 'totaling': 'totalling',
  'unraveled': 'unravelled', 'unraveling': 'unravelling',

  // -ense vs -ence
  'defense': 'defence', 'defenseless': 'defenceless',
  'offense': 'offence',
  'pretense': 'pretence', 'license': 'licence', 'licensed': 'licenced', 'licensing': 'licencing',

  // -og vs -ogue
  'catalog': 'catalogue', 'catalogs': 'catalogues', 'cataloged': 'catalogued', 'cataloging': 'cataloguing',
  'dialog': 'dialogue', 'dialogs': 'dialogues',
  'analog': 'analogue', 'analogs': 'analogues',
  'monolog': 'monologue', 'monologs': 'monologues',
  'prolog': 'prologue', 'prologs': 'prologues',
  'epilog': 'epilogue', 'epilogs': 'epilogues',
  'travelog': 'travelogue', 'travelogs': 'travelogues',

  // Miscellaneous Spelling Variations
  'gray': 'grey', 'grays': 'greys', 'graying': 'greying',
  'artifact': 'artefact', 'artifacts': 'artefacts',
  'ax': 'axe',
  'cozy': 'cosy', 'cozier': 'cosier', 'coziest': 'cosiest', 'cozily': 'cosily',
  'mold': 'mould', 'molds': 'moulds', 'molded': 'moulded', 'molding': 'moulding', 'moldy': 'mouldy',
  'plow': 'plough', 'plows': 'ploughs', 'plowed': 'ploughed', 'plowing': 'ploughing',
  'sulfur': 'sulphur',
  'skeptical': 'sceptical', 'skeptically': 'sceptically', 'skepticism': 'scepticism',
  'skillful': 'skilful', 'skillfully': 'skilfully',
  'willful': 'wilful', 'willfully': 'wilfully',
  'enroll': 'enrol', 'enrolls': 'enrols', 'enrollment': 'enrolment',
  'fulfill': 'fulfil', 'fulfills': 'fulfils', 'fulfillment': 'fulfilment',
  'installment': 'instalment', 'installments': 'instalments',
  'instill': 'instil', 'instills': 'instils',
  'enthrall': 'enthral', 'enthralls': 'enthrals',
  'appall': 'appal', 'appalls': 'appals',
  'distill': 'distil', 'distills': 'distils',
  'judgment': 'judgement', 'judgments': 'judgements',
  'acknowledgment': 'acknowledgement', 'acknowledgments': 'acknowledgements',
  'aging': 'ageing',
  'annex': 'annexe',
  'omelet': 'omelette', 'omelets': 'omelettes',

  // -ae-, -oe- medical/scientific
  'anemia': 'anaemia', 'anemic': 'anaemic', 'anesthesia': 'anaesthesia', 'anesthetic': 'anaesthetic',
  'anesthetize': 'anaesthetise', 'anesthetist': 'anaesthetist', 'cesarean': 'caesarean', 'diarrhea': 'diarrhoea',
  'estrogen': 'oestrogen', 'fetus': 'foetus', 'gynecology': 'gynaecology', 'hemoglobin': 'haemoglobin',
  'hemophilia': 'haemophilia', 'leukemia': 'leukaemia', 'orthopedic': 'orthopaedic', 'pediatric': 'paediatric',
  'pediatrician': 'paediatrician', 'homeopathy': 'homoeopathy',

  // -ward vs -wards
  'backward': 'backwards', 'forward': 'forwards', 'toward': 'towards', 'afterward': 'afterwards', 'downward': 'downwards',
  'inward': 'inwards', 'outward': 'outwards', 'upward': 'upwards',

  // More specific differences
  'checkered': 'chequered',
  'chili': 'chilli', 'chilies': 'chillies',
  'disk': 'disc', 'disks': 'discs',
  'eon': 'aeon', 'eons': 'aeons',
  'esthete': 'aesthete', 'esthetes': 'aesthetes',
  'etiology': 'aetiology',
  'fetal': 'foetal',
  'gram': 'gramme', 'grams': 'grammes',
  'groveled': 'grovelled',
  'inflection': 'inflexion', 'inflections': 'inflexions',
  'kidnaped': 'kidnapped', 'kidnaping': 'kidnapping', 'kidnaper': 'kidnapper',
  'louver': 'louvre', 'louvers': 'louvres',
  'marshaled': 'marshalled', 'marshaling': 'marshalling',
  'misdemeanor': 'misdemeanour', 'misdemeanors': 'misdemeanours',
  'niter': 'nitre',
  'ocher': 'ochre',
  'pedaler': 'pedaller', 'pedalers': 'pedallers',
  'pipet': 'pipette', 'pipets': 'pipettes',
  'quintet': 'quintette', 'quintets': 'quintettes',
  'raccoon': 'racoon', 'raccoons': 'racoons',
  'raveled': 'ravelled', 'raveling': 'ravelling',
  'rivaled': 'rivalled', 'rivaling': 'rivalling',
  'shriveled': 'shrivelled', 'shriveling': 'shrivelling',
  'siphon': 'syphon', 'siphons': 'syphons',
  'skeptic': 'sceptic', 'skeptics': 'sceptics',
  'sniveled': 'snivelled', 'sniveling': 'snivelling',
  'tricolor': 'tricolour', 'tricolors': 'tricolours',
  'woolen': 'woollen', 'woolens': 'woollens',
  'worshiper': 'worshipper', 'worshipers': 'worshippers',
  'worshiped': 'worshipped', 'worshiping': 'worshipping',
  'yogurt': 'yoghurt', 'yogurts': 'yoghurts'
};

let spottedHighlights = [];

// ============ FEEDBACK MARKERS ============
let markerPlacementMode = false;
let pageMarkers = [];
let markerContainer = null;

let markerObserver = null;

function ensureMarkerContainer() {
  if (markerContainer) return markerContainer;
  markerContainer = document.createElement('div');
  markerContainer.id = 'qc-marker-container';
  markerContainer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 2147483646;
  `;
  // Append to body but handle positioning relative to document root
  document.documentElement.appendChild(markerContainer);

  // Setup Observer for layout changes
  if (!markerObserver) {
    let ticking = false;
    markerObserver = new MutationObserver(() => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.querySelectorAll('.qc-feedback-marker').forEach(updateMarkerPosition);
          ticking = false;
        });
        ticking = true;
      }
    });
    markerObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class']
    });
  }

  return markerContainer;
}

function createMarkerElement(marker) {
  const isArea = marker.tool === 'area-note' || (marker.raw && marker.raw.selection);
  const el = document.createElement('div');
  el.className = 'qc-feedback-marker';
  el.dataset.id = marker.id;
  el.dataset.num = marker.markerNum;
  el.dataset.resolved = !!marker.resolvedAt;
  el.dataset.tool = marker.tool;
  
  if (isArea) {
    el.classList.add('qc-area-marker');
    const selection = marker.raw?.selection || {};
    el.dataset.areaLeft = selection.left;
    el.dataset.areaTop = selection.top;
    el.dataset.areaWidth = selection.width;
    el.dataset.areaHeight = selection.height;
    el.dataset.docW = selection.docW;
    el.dataset.docH = selection.docH;
  } else {
    // Store anchoring and original viewport data
    if (marker.markerSelector) {
      el.dataset.selector = marker.markerSelector;
      el.dataset.offsetX = marker.markerOffsetX;
      el.dataset.offsetY = marker.markerOffsetY;
    }
    el.dataset.markerX = marker.markerX;
    el.dataset.markerY = marker.markerY;
    el.dataset.windowW = marker.markerWindowW;
    el.dataset.windowH = marker.markerWindowH;
    el.dataset.docW = marker.markerDocW;
    el.dataset.docH = marker.markerDocH;
    el.dataset.textContext = marker.textContext || '';
    el.dataset.ariaLabel = marker.ariaLabel || '';
  }
  
  const isResolved = !!marker.resolvedAt;
  const color = marker.markerColor || '#ff4757';
  
  if (isArea) {
    el.style.cssText = `
      position: absolute;
      border: 2px solid ${isResolved ? '#2ed573' : color};
      background-color: ${isResolved ? 'rgba(46, 213, 115, 0.1)' : 'rgba(255, 71, 87, 0.1)'};
      pointer-events: auto;
      z-index: 2147483645;
      cursor: pointer;
      opacity: ${isResolved ? '0.6' : '1'};
    `;
    
    // Add a small number badge to the area marker
    const badge = document.createElement('div');
    badge.className = 'qc-marker-badge';
    badge.textContent = marker.markerNum || '';
    badge.style.cssText = `
      position: absolute;
      top: -12px;
      left: -12px;
      width: 24px;
      height: 24px;
      background-color: ${isResolved ? '#2ed573' : color};
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    `;
    el.appendChild(badge);
  } else {
    el.style.cssText = `
      position: absolute;
      width: 24px;
      height: 24px;
      background-color: ${isResolved ? '#2ed573' : color};
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      border: 2px solid white;
      transform: translate(-50%, -50%);
      transition: transform 0.2s, box-shadow 0.2s;
      user-select: none;
      opacity: ${isResolved ? '0.6' : '1'};
      z-index: 2147483646;
    `;
  }
  if (!isArea) {
    el.textContent = marker.markerNum || '';
  }
  
  updateMarkerPosition(el);
  
  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'qc-marker-tooltip';
  tooltip.style.cssText = `
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    margin-bottom: 8px;
    display: none;
    pointer-events: none;
  `;
  tooltip.textContent = `${marker.authorName}${isResolved ? ' (Resolved)' : ''}`;
  el.appendChild(tooltip);
  
  el.onmouseenter = () => {
    tooltip.style.display = 'block';
    if (!isArea) {
      el.style.transform = 'translate(-50%, -50%) scale(1.2)';
    } else {
      el.style.transform = 'scale(1.02)';
    }
    el.style.zIndex = '2147483647';
  };
  el.onmouseleave = () => {
    tooltip.style.display = 'none';
    if (!isArea) {
      el.style.transform = 'translate(-50%, -50%) scale(1)';
    } else {
      el.style.transform = 'none';
    }
    el.style.zIndex = isArea ? '2147483645' : '2147483646';
  };
  
  el.onclick = (e) => {
    e.stopPropagation();
    chrome.runtime.sendMessage({
      action: 'jumpToComment',
      feedbackId: marker.id
    });
  };
  
  return el;
}

function renderMarkers(markers) {
  const container = ensureMarkerContainer();
  container.innerHTML = '';
  pageMarkers = markers;
  
  markers.forEach(marker => {
    if (marker.markerX !== null && marker.markerY !== null) {
      container.appendChild(createMarkerElement(marker));
    }
  });
}

function toggleMarkersVisibility(visible) {
  const container = document.getElementById('qc-marker-container');
  if (container) {
    container.style.display = visible ? 'block' : 'none';
  }
}

function findElementFuzzy(text, aria, fallbackX, fallbackY) {
  if (!text && !aria) return null;
  
  // Try finding by aria-label first (usually more unique)
  if (aria) {
    const byAria = document.querySelector(`[aria-label="${CSS.escape(aria)}"], [title="${CSS.escape(aria)}"]`);
    if (byAria) return byAria;
  }
  
  // Try finding by exact text match for short unique strings
  if (text && text.length > 4) {
    // Find elements with this text
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, {
      acceptNode: (node) => {
        if (node.innerText?.trim() === text) return NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_SKIP;
      }
    });
    
    let bestMatch = null;
    let minDistance = Infinity;
    
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const rect = node.getBoundingClientRect();
      const centerX = window.scrollX + rect.left + rect.width / 2;
      const centerY = window.scrollY + rect.top + rect.height / 2;
      
      const distance = Math.sqrt(Math.pow(centerX - fallbackX, 2) + Math.pow(centerY - fallbackY, 2));
      
      // If within 300px of fallback, consider it a potential match
      if (distance < 300 && distance < minDistance) {
        minDistance = distance;
        bestMatch = node;
      }
    }
    if (bestMatch) return bestMatch;
  }
  
  return null;
}

function updateMarkerPosition(el) {
  if (el.dataset.tool === 'area-note') {
    const areaLeft = parseFloat(el.dataset.areaLeft);
    const areaTop = parseFloat(el.dataset.areaTop);
    const areaWidth = parseFloat(el.dataset.areaWidth);
    const areaHeight = parseFloat(el.dataset.areaHeight);
    const origDocW = parseFloat(el.dataset.docW);
    const origDocH = parseFloat(el.dataset.docH);
    
    const currentDocW = document.documentElement.scrollWidth;
    const currentDocH = document.documentElement.scrollHeight;
    
    // Scale the area based on document size changes (simple ratio)
    const scaleX = currentDocW / origDocW;
    const scaleY = currentDocH / origDocH;
    
    el.style.left = `${areaLeft * scaleX}px`;
    el.style.top = `${areaTop * scaleY}px`;
    el.style.width = `${areaWidth * scaleX}px`;
    el.style.height = `${areaHeight * scaleY}px`;
    return;
  }

  const selector = el.dataset.selector;
  const offsetX = parseFloat(el.dataset.offsetX);
  const offsetY = parseFloat(el.dataset.offsetY);
  const textContext = el.dataset.textContext;
  const ariaLabel = el.dataset.ariaLabel;
  
  const currentDocH = document.documentElement.scrollHeight;
  const currentDocW = document.documentElement.scrollWidth;
  const currentWindowW = window.innerWidth;

  const origWindowW = parseFloat(el.dataset.windowW) || currentWindowW;
  const origDocW = parseFloat(el.dataset.docW) || currentDocW;
  const origDocH = parseFloat(el.dataset.docH) || currentDocH;
  
  const xPercent = parseFloat(el.dataset.markerX);
  const yPercent = parseFloat(el.dataset.markerY);
  
  // Ideal fallback position (absolute document pixels)
  const fallbackX = (xPercent / 100) * currentDocW;
  const fallbackY = (yPercent / 100) * currentDocH;

  let anchoredSuccessfully = false;
  let target = selector ? document.querySelector(selector) : null;

  // Fuzzy matching if selector failed
  if (!target && (textContext || ariaLabel)) {
    target = findElementFuzzy(textContext, ariaLabel, fallbackX, fallbackY);
  }

  if (target) {
    const rect = target.getBoundingClientRect();
    const style = window.getComputedStyle(target);
    
    if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0) {
      // Handle fixed or sticky elements
      let isStickyOrFixed = style.position === 'fixed' || style.position === 'sticky';
      let parent = target.parentElement;
      while (parent && !isStickyOrFixed) {
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position === 'fixed' || parentStyle.position === 'sticky') {
          isStickyOrFixed = true;
        }
        parent = parent.parentElement;
      }

      if (isStickyOrFixed) {
        el.style.position = 'fixed';
        el.style.left = `${rect.left + (rect.width * (offsetX / 100))}px`;
        el.style.top = `${rect.top + (rect.height * (offsetY / 100))}px`;
      } else {
        el.style.position = 'absolute';
        const left = window.pageXOffset + rect.left + (rect.width * (offsetX / 100));
        const top = window.pageYOffset + rect.top + (rect.height * (offsetY / 100));
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      }
      
      el.style.display = 'flex';
      anchoredSuccessfully = true;
    }
  }
  
  // Fallback: Ratio-based positioning with centered-layout awareness
  if (!anchoredSuccessfully) {
    if (el.dataset.markerX && el.dataset.markerY) {
      el.style.position = 'absolute';
      
      const xPercent = parseFloat(el.dataset.markerX);
      const yPercent = parseFloat(el.dataset.markerY);
      
      let xPos = (xPercent / 100) * currentDocW;
      
      // Heuristic for centered layouts (fixed-width containers):
      // If the document width changed significantly AND the marker was in the middle 60%,
      // it's likely part of a centered layout that doesn't scale with the document width.
      if (Math.abs(currentDocW - origDocW) > 50 && xPercent > 20 && xPercent < 80) {
        // Find the offset shift. If it's centered, both sides grow/shrink equally.
        const centerShift = (currentDocW - origDocW) / 2;
        // Adjust the X position by the shift to keep it relative to the centered content
        xPos = ((xPercent / 100) * origDocW) + centerShift;
      }

      const yPos = (yPercent / 100) * currentDocH;
      
      el.style.left = `${xPos}px`;
      el.style.top = `${yPos}px`;
      el.style.display = 'flex';
      
      el.style.opacity = '0.4';
      el.title = "(Approximate position - anchored element hidden or layout changed)";
    } else {
      el.style.display = 'none';
    }
  } else {
    const isResolved = el.dataset.resolved === 'true';
    el.style.opacity = isResolved ? '0.6' : '1';
    el.title = "";
  }
}

let selectionMode = false;
let isDragging = false;
let startX, startY;
let selectionEl = null;
let selectionSource = 'feedback';

function startMarkerPlacement(source) {
  selectionSource = source || 'feedback';
  selectionMode = true;
  document.body.style.cursor = 'crosshair';
  
  // Show hint
  const hint = document.createElement('div');
  hint.id = 'qc-placement-hint';
  hint.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #ff4757;
    color: white;
    padding: 10px 20px;
    border-radius: 30px;
    font-weight: 600;
    z-index: 2147483647;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    pointer-events: none;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  const hintLabel = selectionSource === 'bug' ? 'Drag to select an area for bug report' : 'Drag to select an area for feedback';
  hint.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="3"></line></svg>
    ${hintLabel}
  `;
  document.body.appendChild(hint);

  // Add event listeners for drag selection
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('mouseup', handleMouseUp, true);
}

function handleMouseDown(e) {
  if (!selectionMode) return;
  if (e.button !== 0) return; // Left click only
  
  // Don't start selection if clicking on our own UI
  if (e.target.closest('#qc-marker-container') || 
      e.target.closest('#qc-placement-hint') ||
      e.target.closest('#qc-mobile-wrapper')) {
    return;
  }

  isDragging = true;
  startX = e.pageX;
  startY = e.pageY;

  if (!selectionEl) {
    selectionEl = document.createElement('div');
    selectionEl.id = 'qc-selection-area';
    selectionEl.style.cssText = `
      position: absolute;
      border: 2px solid #ff4757;
      background: rgba(255, 71, 87, 0.1);
      z-index: 2147483645;
      pointer-events: none;
      display: none;
    `;
    document.body.appendChild(selectionEl);
  }

  e.preventDefault();
  e.stopPropagation();
}

function handleMouseMove(e) {
  if (!isDragging || !selectionEl) return;

  const currentX = e.pageX;
  const currentY = e.pageY;

  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  selectionEl.style.left = `${left}px`;
  selectionEl.style.top = `${top}px`;
  selectionEl.style.width = `${width}px`;
  selectionEl.style.height = `${height}px`;
  selectionEl.style.display = 'block';

  e.preventDefault();
  e.stopPropagation();
}

async function handleMouseUp(e) {
  if (!isDragging) return;
  isDragging = false;

  if (!selectionEl || selectionEl.offsetWidth < 5 || selectionEl.offsetHeight < 5) {
    // Too small selection, ignore
    if (selectionEl) selectionEl.style.display = 'none';
    return;
  }

  const rect = selectionEl.getBoundingClientRect();
  const selectionData = {
    left: window.pageXOffset + rect.left,
    top: window.pageYOffset + rect.top,
    width: rect.width,
    height: rect.height,
    pageX: window.pageXOffset,
    pageY: window.pageYOffset,
    windowW: window.innerWidth,
    windowH: window.innerHeight,
    docW: document.documentElement.scrollWidth,
    docH: document.documentElement.scrollHeight
  };

  // Capture crop
  try {
    const cropDataUrl = await captureAreaCrop(selectionData);
    
    chrome.runtime.sendMessage({
      action: 'areaSelected',
      selection: selectionData,
      screenshot: cropDataUrl,
      source: selectionSource
    });
    
    stopMarkerPlacement();
  } catch (err) {
    console.error('Failed to capture crop:', err);
  }

  e.preventDefault();
  e.stopPropagation();
}

async function captureAreaCrop(selection) {
  // We use html2canvas to capture the page, then crop it.
  // Note: html2canvas is already loaded via manifest
  
  // Temporarily hide our UI
  const container = document.getElementById('qc-marker-container');
  const hint = document.getElementById('qc-placement-hint');
  if (container) container.style.display = 'none';
  if (hint) hint.style.display = 'none';
  if (selectionEl) selectionEl.style.display = 'none';

  const canvas = await html2canvas(document.body, {
    x: selection.left,
    y: selection.top,
    width: selection.width,
    height: selection.height,
    scrollX: 0,
    scrollY: 0,
    useCORS: true,
    allowTaint: true,
    scale: 2 // Higher quality
  });

  if (container) container.style.display = 'block';
  if (selectionEl) selectionEl.style.display = 'block';

  return canvas.toDataURL('image/png');
}

function stopMarkerPlacement() {
  selectionMode = false;
  isDragging = false;
  document.body.style.cursor = 'default';
  
  const hint = document.getElementById('qc-placement-hint');
  if (hint) hint.remove();
  
  if (selectionEl) {
    selectionEl.remove();
    selectionEl = null;
  }

  document.removeEventListener('mousedown', handleMouseDown, true);
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('mouseup', handleMouseUp, true);
}

function getUniqueSelector(el) {
  if (!(el instanceof Element)) return null;
  
  // Priority 1: ID (if unique and not dynamic)
  if (el.id && !/^\d/.test(el.id) && document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
    return `#${CSS.escape(el.id)}`;
  }
  
  // Priority 2: Semantic data attributes
  const dataAttrs = ['data-testid', 'data-qa', 'data-cy', 'data-component', 'data-name'];
  for (const attr of dataAttrs) {
    const val = el.getAttribute(attr);
    if (val && document.querySelectorAll(`[${attr}="${CSS.escape(val)}"]`).length === 1) {
      return `[${attr}="${CSS.escape(val)}"]`;
    }
  }
  
  // Priority 3: Stable class names + Tag
  // Filter out potentially dynamic classes (long random strings, tailwind-like utility classes if too many)
  const classes = Array.from(el.classList).filter(c => !/\d/.test(c) && c.length > 3 && c.length < 30);
  if (classes.length > 0) {
    for (const cls of classes) {
      const selector = `${el.tagName.toLowerCase()}.${CSS.escape(cls)}`;
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }
  }
  
  // Priority 4: Path-based selector (resilient)
  const path = [];
  let current = el;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let selector = current.nodeName.toLowerCase();
    
    if (current.id && !/^\d/.test(current.id)) {
      selector += `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break;
    } else {
      let nth = 1;
      let sib = current.previousElementSibling;
      while (sib) {
        if (sib.nodeName.toLowerCase() === current.nodeName.toLowerCase()) {
          nth++;
        }
        sib = sib.previousElementSibling;
      }
      if (nth > 1) {
        selector += `:nth-of-type(${nth})`;
      }
    }
    path.unshift(selector);
    current = current.parentNode;
    
    // Stop at body
    if (current && current.nodeName.toLowerCase() === 'body') break;
  }
  return path.join(" > ");
}

// Global click listener for placement
document.addEventListener('click', (e) => {
  if (!markerPlacementMode) return;
  
  // Don't place marker if clicking on our own UI
  if (e.target.closest('#qc-marker-container') || 
      e.target.closest('#qc-image-info-overlay') || 
      e.target.closest('#qc-alignment-overlay') ||
      e.target.closest('#qc-mobile-wrapper') ||
      e.target.closest('#qc-placement-hint')) {
    return;
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  const target = e.target;
  const rect = target.getBoundingClientRect();
  const selector = getUniqueSelector(target);
  
  // Robust text/aria context for fuzzy matching
  const textContext = target.innerText?.trim().substring(0, 50) || '';
  const ariaLabel = target.getAttribute('aria-label') || target.getAttribute('title') || '';
  
  // Calculate relative offset within the clicked element (as percentage)
  const offsetX = ((e.clientX - rect.left) / rect.width) * 100;
  const offsetY = ((e.clientY - rect.top) / rect.height) * 100;
  
  // Absolute page coordinates relative to document total dimensions for robust fallback
  const docW = document.documentElement.scrollWidth;
  const docH = document.documentElement.scrollHeight;
  const markerX = (e.pageX / docW) * 100;
  const markerY = (e.pageY / docH) * 100;
  
  // Create a temporary visual marker
  const tempMarker = document.getElementById('qc-temp-marker') || document.createElement('div');
  tempMarker.id = 'qc-temp-marker';
  tempMarker.style.cssText = `
    position: absolute;
    left: ${e.pageX}px;
    top: ${e.pageY}px;
    width: 24px;
    height: 24px;
    background-color: #ff4757;
    border: 2px solid white;
    border-radius: 50%;
    z-index: 2147483647;
    transform: translate(-50%, -50%);
    pointer-events: none;
    box-shadow: 0 0 15px rgba(255, 71, 87, 0.5);
    animation: qc-pulse 1.5s infinite;
  `;
  
  // Add animation if not already there
  if (!document.getElementById('qc-marker-styles')) {
    const style = document.createElement('style');
    style.id = 'qc-marker-styles';
    style.textContent = `
      @keyframes qc-pulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.8; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(tempMarker);
  
  chrome.runtime.sendMessage({
    action: 'markerPlaced',
    markerX: markerX,
    markerY: markerY,
    markerSelector: selector,
    markerOffsetX: offsetX,
    markerOffsetY: offsetY,
    markerWindowW: window.innerWidth,
    markerWindowH: window.innerHeight,
    markerDocW: document.documentElement.scrollWidth,
    markerDocH: document.documentElement.scrollHeight,
    textContext: textContext,
    ariaLabel: ariaLabel
  });
  
  // We keep placement mode active until user cancels or saves, but let's hide the hint
  const hint = document.getElementById('qc-placement-hint');
  if (hint) hint.style.display = 'none';
}, true);

// Handle resize and scroll to ensure markers stay in correct relative position
let resizeTicking = false;
window.addEventListener('resize', () => {
  if (!resizeTicking) {
    window.requestAnimationFrame(() => {
      document.querySelectorAll('.qc-feedback-marker').forEach(updateMarkerPosition);
      resizeTicking = false;
    });
    resizeTicking = true;
  }
});

// Also update on scroll
let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      document.querySelectorAll('.qc-feedback-marker').forEach(updateMarkerPosition);
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

// Helper to scroll to a marker
function scrollToMarker(feedbackId) {
  const container = ensureMarkerContainer();
  const el = container.querySelector(`[data-id="${feedbackId}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Pulse effect
    const isArea = el.classList.contains('qc-area-marker');
    const originalTransform = isArea ? 'none' : 'translate(-50%, -50%)';
    const scaleTransform = isArea ? 'scale(1.1)' : 'translate(-50%, -50%) scale(2)';
    
    el.style.transform = scaleTransform;
    el.style.zIndex = '2147483647';
    
    setTimeout(() => {
      el.style.transform = originalTransform;
      el.style.zIndex = isArea ? '2147483645' : '2147483646';
    }, 1000);
  }
}

// Screenshot helper - anchor fixed/sticky elements so they appear only once at the top
let modifiedStickyElements = [];

function anchorStickyElements() {
  modifiedStickyElements = [];
  const allElements = document.getElementsByTagName('*');
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  
  const targets = [];
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (el.id === 'qc-highlight-overlay' || el.id === 'qc-alignment-overlay') continue;
    
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'sticky') {
      targets.push(el);
    }
  }

  targets.forEach(el => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0 || style.display === 'none' || style.visibility === 'hidden') {
      return;
    }

    const absTop = rect.top + scrollY;
    const absLeft = rect.left + scrollX;

    modifiedStickyElements.push({
      element: el,
      parent: el.parentElement,
      nextSibling: el.nextSibling,
      originalPosition: el.style.position,
      originalTop: el.style.top,
      originalLeft: el.style.left,
      originalRight: el.style.right,
      originalBottom: el.style.bottom,
      originalZIndex: el.style.zIndex,
      originalTransform: el.style.transform,
      originalWidth: el.style.width,
      originalMargin: el.style.margin,
      originalBoxSizing: el.style.boxSizing,
      originalVisibility: el.style.visibility,
      originalOpacity: el.style.opacity
    });

    const computedWidth = style.width;

    // Move to body to avoid parent clipping/overflow issues
    document.body.appendChild(el);
    
    el.style.setProperty('position', 'absolute', 'important');
    el.style.setProperty('top', `${absTop}px`, 'important');
    el.style.setProperty('left', `${absLeft}px`, 'important');
    el.style.setProperty('width', computedWidth, 'important');
    el.style.setProperty('margin', '0', 'important');
    el.style.setProperty('right', 'auto', 'important');
    el.style.setProperty('bottom', 'auto', 'important');
    el.style.setProperty('transform', 'none', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('z-index', '2147483647', 'important');
    el.style.setProperty('box-sizing', 'border-box', 'important');
  });
  
  return modifiedStickyElements.length;
}

function restoreStickyElements() {
  for (let i = modifiedStickyElements.length - 1; i >= 0; i--) {
    const item = modifiedStickyElements[i];
    const el = item.element;
    
    try {
      if (item.parent) {
        if (item.nextSibling && item.nextSibling.parentNode === item.parent) {
          item.parent.insertBefore(el, item.nextSibling);
        } else {
          item.parent.appendChild(el);
        }
      }
    } catch (e) {
      console.warn('QCHF: Could not restore element to original DOM position', e);
    }

    el.style.position = item.originalPosition;
    el.style.top = item.originalTop;
    el.style.left = item.originalLeft;
    el.style.right = item.originalRight;
    el.style.bottom = item.originalBottom;
    el.style.zIndex = item.originalZIndex;
    el.style.width = item.originalWidth;
    el.style.margin = item.originalMargin;
    el.style.boxSizing = item.originalBoxSizing;
    el.style.visibility = item.originalVisibility;
    el.style.opacity = item.originalOpacity;
    if (item.originalTransform !== undefined) {
      el.style.transform = item.originalTransform;
    }
  }
  modifiedStickyElements = [];
}

async function capturePageScreenshot(mode = 'whole') {
  if (typeof html2canvas === 'undefined') {
    throw new Error('html2canvas library not loaded. Please reload the page.');
  }

  const isWholePage = mode === 'whole';
  const originalScrollY = window.scrollY;
  const originalScrollX = window.scrollX;
  
  if (isWholePage) {
    // Scroll to top first so sticky elements (like menu bars) are captured at the top
    window.scrollTo(0, 0);
    // Wait for any layout adjustments or animations to finish
    await new Promise(resolve => setTimeout(resolve, 500)); 
    anchorStickyElements();
  }

  try {
    const options = {
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scale: 1, // Capture at 1x scale to maintain browser width and minimize file size
      ignoreElements: (el) => {
        return el.id === 'qc-highlight-overlay' || el.id === 'qc-alignment-overlay' || el.className === 'qc-link-url-label';
      }
    };

    if (mode === 'section') {
      const canvas = await html2canvas(document.documentElement, {
        ...options,
        width: window.innerWidth,
        height: window.innerHeight,
        x: window.scrollX,
        y: window.scrollY,
        scrollX: 0,
        scrollY: 0
      });
      // Compress to JPEG 0.8
      return canvas.toDataURL('image/jpeg', 0.8);
    } else {
      // Whole page mode - Scroll and Stitch logic
      const totalHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.offsetHeight
      );
      
      // Use window.innerWidth to match the "width of the browser" exactly
      const totalWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Safety cap for extremely long pages to prevent browser crash/canvas limits
      // Most modern browsers handle up to 16,384px well. We'll use 15,000 as a safe limit.
      const MAX_TOTAL_HEIGHT = 15000; 
      let scaleFactor = 1;
      if (totalHeight > MAX_TOTAL_HEIGHT) {
        scaleFactor = MAX_TOTAL_HEIGHT / totalHeight;
      }

      const masterCanvas = document.createElement('canvas');
      // Ensure width is based on browser width, scaled if height is excessive
      masterCanvas.width = totalWidth * scaleFactor;
      masterCanvas.height = totalHeight * scaleFactor;
      const ctx = masterCanvas.getContext('2d');
      
      // Clear background to white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, masterCanvas.width, masterCanvas.height);
      
      let currentY = 0;
      while (currentY < totalHeight) {
        window.scrollTo(0, currentY);
        // Wait for elements to settle and lazy loads to trigger
        await new Promise(resolve => setTimeout(resolve, 450)); 
        
        const captureHeight = Math.min(viewportHeight, totalHeight - currentY);
        
        const sectionCanvas = await html2canvas(document.documentElement, {
          ...options,
          width: totalWidth,
          height: captureHeight,
          x: window.scrollX,
          y: currentY,
          scrollX: 0,
          scrollY: 0,
          windowWidth: totalWidth,
          windowHeight: viewportHeight
        });
        
        // Draw to master with potential scaling
        ctx.drawImage(
          sectionCanvas, 
          0, 0, sectionCanvas.width, sectionCanvas.height,
          0, currentY * scaleFactor, masterCanvas.width, captureHeight * scaleFactor
        );
        
        currentY += captureHeight;
      }
      
      // Compression logic:
      // High quality for short pages, aggressive for long pages
      let quality = 0.7; // Default
      if (totalHeight > 10000) quality = 0.3; // Very aggressive for huge pages
      else if (totalHeight > 5000) quality = 0.4;
      else if (totalHeight > 2500) quality = 0.5;
      else quality = 0.7;
      
      console.log(`Screenshot capture complete. Final image: ${masterCanvas.width}x${masterCanvas.height} @ quality ${quality}`);
      return masterCanvas.toDataURL('image/jpeg', quality);
    }
  } finally {
    // Restore original scroll position
    window.scrollTo(originalScrollX, originalScrollY);
    if (isWholePage) {
      restoreStickyElements();
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleGapChecker") {
    if (request.active) {
      const count = spotWordGaps();
      sendResponse({ count });
    } else {
      removeHighlights();
      sendResponse({ count: 0 });
    }
  } else if (request.action === "toggleAmericanSpotter") {
    if (request.active) {
      const count = spotAmericanEnglish();
      sendResponse({ count });
    } else {
      removeHighlights();
      sendResponse({ count: 0 });
    }
  } else if (request.action === "jumpToHighlight") {
    jumpToHighlight(request.index);
    sendResponse({ success: true });
  } else if (request.action === "getPageText") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      sendResponse({ text: selectedText, isSelection: true });
    } else {
      sendResponse({ text: getVisibleText(), isSelection: false });
    }
  } else if (request.action === "showAiHighlights") {
    const count = showAiHighlights(request.errors);
    sendResponse({ count });
  } else if (request.action === "removeHighlights") {
    removeHighlights();
    sendResponse({ success: true });
  } else if (request.action === "showLinkUrls") {
    if (request.active) {
      const count = showLinkUrls();
      sendResponse({ count });
    } else {
      hideLinkUrls();
      sendResponse({ count: 0 });
    }
  } else if (request.action === "toggleAlignmentGuide") {
    if (request.active) {
      enableAlignmentGuide();
      sendResponse({ success: true });
    } else {
      disableAlignmentGuide();
      sendResponse({ success: true });
    }
  } else if (request.action === "getPageMetadata") {
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 
                    document.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                    'No meta description found.';
    sendResponse({ 
      title, 
      titleLength: title.length,
      description: metaDesc,
      descLength: metaDesc === 'No meta description found.' ? 0 : metaDesc.length
    });
  } else if (request.action === "detectTrackingPixels") {
    const pixels = [];

    // Gather all text sources: HTML, scripts, noscript tags, and network requests
    const html = document.documentElement.outerHTML;
    const scripts = document.querySelectorAll('script');
    const scriptTexts = Array.from(scripts).map(s => s.textContent).join('\n');
    const noscriptEls = document.querySelectorAll('noscript');
    const noscriptTexts = Array.from(noscriptEls).map(n => n.textContent || n.innerHTML).join('\n');
    
    // Check img/iframe src attributes directly in DOM (catches dynamically injected pixels)
    const imgSrcs = Array.from(document.querySelectorAll('img, iframe')).map(el => el.src || '').join('\n');
    
    // Check performance entries for network requests (catches Tealium/GTM loaded pixels)
    let networkUrls = '';
    try {
      const entries = performance.getEntriesByType('resource');
      networkUrls = entries.map(e => e.name).join('\n');
    } catch(e) {}

    const allText = [html, scriptTexts, noscriptTexts, imgSrcs, networkUrls].join('\n');

    function extractIds(patterns, text) {
      const ids = new Set();
      for (const pat of patterns) {
        let m;
        while ((m = pat.exec(text)) !== null) {
          ids.add(m[1]);
        }
      }
      return ids;
    }

    // Meta Pixel (Facebook) - expanded patterns for Tealium/GTM injection
    const metaIds = extractIds([
      /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/g,
      /facebook\.com\/tr[^"'\s]*[?&]id=(\d{10,20})/g,
      /facebook\.com\/tr\?id=(\d{10,20})/g,
      /["']pixel_id["']\s*:\s*["'](\d{10,20})["']/g,
      /fb_pixel_id["']\s*:\s*["'](\d{10,20})["']/g,
      /Pixel\s*ID:\s*(\d{10,20})/g,
      /Duplicate Pixel ID:\s*(\d{10,20})/g,
    ], allText);
    
    // Also scan network entries specifically for facebook pixel URLs
    try {
      const entries = performance.getEntriesByType('resource');
      entries.forEach(e => {
        const url = e.name || '';
        // Match facebook.com/tr?id=XXXXX or facebook.com/tr/?id=XXXXX
        const fbMatch = url.match(/facebook\.com\/tr[/?].*[?&]id=(\d{10,20})/);
        if (fbMatch) metaIds.add(fbMatch[1]);
        // Match pixel endpoint with id param
        const fbMatch2 = url.match(/facebook\.com\/(\d{10,20})\?/);
        if (fbMatch2) metaIds.add(fbMatch2[1]);
      });
    } catch(e) {}
    
    // Scan all img elements for facebook pixel tracking images
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.getAttribute('src') || '';
      const fbMatch = src.match(/facebook\.com\/tr[/?].*[?&]id=(\d{10,20})/);
      if (fbMatch) metaIds.add(fbMatch[1]);
    });
    
    // Scan noscript innerHTML directly for pixel img tags
    document.querySelectorAll('noscript').forEach(ns => {
      const inner = ns.innerHTML || '';
      const matches = inner.matchAll(/facebook\.com\/tr[^"']*[?&]id=(\d{10,20})/g);
      for (const m of matches) metaIds.add(m[1]);
    });
    
    // Collect all non-Meta pixels first (synchronous)
    // TikTok Pixel
    const tiktokIds = extractIds([
      /ttq\.load\s*\(\s*['"]([A-Z0-9]+)['"]/g,
      /analytics\.tiktok\.com\/i18n\/pixel\/events\.js\?sdkid=([A-Z0-9]+)/g,
      /tiktok_pixel_id["']\s*:\s*["']([A-Z0-9]+)["']/g,
    ], allText);
    if (tiktokIds.size > 0) {
      tiktokIds.forEach(id => pixels.push({ type: 'TikTok Pixel', id }));
    } else if (/analytics\.tiktok\.com/.test(allText)) {
      pixels.push({ type: 'TikTok Pixel', id: 'Detected (ID not found)' });
    }

    // Google Ads
    const gadsIds = extractIds([
      /gtag\s*\(\s*['"]config['"]\s*,\s*['"](AW-[A-Z0-9]+)['"]/g,
      /googleads\.g\.doubleclick\.net\/pagead\/viewthroughconversion\/(\d+)/g,
      /google_conversion_id\s*=\s*(\d+)/g,
      /[?&]id=(AW-[A-Z0-9]+)/g,
    ], allText);
    gadsIds.forEach(id => pixels.push({ type: 'Google Ads', id }));

    // Google Analytics (GA4 / UA)
    const gaIds = extractIds([
      /gtag\s*\(\s*['"]config['"]\s*,\s*['"](G-[A-Z0-9]+)['"]/g,
      /gtag\s*\(\s*['"]config['"]\s*,\s*['"](UA-[0-9]+-[0-9]+)['"]/g,
      /googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)/g,
      /googletagmanager\.com\/gtag\/js\?id=(UA-[0-9]+-[0-9]+)/g,
      /[?&]tid=(UA-[0-9]+-[0-9]+)/g,
      /[?&]tid=(G-[A-Z0-9]+)/g,
    ], allText);
    gaIds.forEach(id => pixels.push({ type: 'Google Analytics', id }));

    // Google Tag Manager
    const gtmIds = new Set();
    const gtmPatterns = [
      /googletagmanager\.com\/gtm\.js\?id=(GTM-[A-Z0-9]+)/g,
      /googletagmanager\.com\/ns\.html\?id=(GTM-[A-Z0-9]+)/g,
      /['"]GTM-([A-Z0-9]+)['"]/g,
    ];
    for (const pat of gtmPatterns) {
      let m;
      while ((m = pat.exec(allText)) !== null) {
        const id = m[1].startsWith('GTM-') ? m[1] : 'GTM-' + m[1];
        gtmIds.add(id);
      }
    }
    gtmIds.forEach(id => pixels.push({ type: 'Google Tag Manager', id }));

    // LinkedIn Insight Tag
    const liIds = extractIds([
      /_linkedin_partner_id\s*=\s*["'](\d+)["']/g,
      /snap\.licdn\.com\/li\.lms-analytics\/insight\.min\.js/g,
      /linkedin\.com\/px\?id=(\d+)/g,
    ], allText);
    liIds.forEach(id => pixels.push({ type: 'LinkedIn Insight', id }));

    // Tealium
    const tealiumIds = extractIds([
      /tags\.tiqcdn\.com\/utag\/([^/]+\/[^/]+)/g,
    ], allText);
    tealiumIds.forEach(id => pixels.push({ type: 'Tealium', id }));

    // Finalize Meta Pixel results
    if (metaIds.size > 0) {
      metaIds.forEach(id => pixels.unshift({ type: 'Meta Pixel', id }));
    } else if (/connect\.facebook\.net|fbevents\.js|fbq\s*\(/.test(allText)) {
      pixels.unshift({ type: 'Meta Pixel', id: 'Detected (ID not found)' });
    }

    sendResponse({ pixels });
  } else if (request.action === "toggleImageChecker") {
    if (request.active) {
      enableImageChecker();
      sendResponse({ success: true });
    } else {
      disableImageChecker();
      sendResponse({ success: true });
    }
  } else if (request.action === "toggleMobileView") {
    if (request.active) {
      enableMobileView(request.device);
      sendResponse({ success: true });
    } else {
      disableMobileView();
      sendResponse({ success: true });
    }
  } else if (request.action === "captureScreenshot") {
    capturePageScreenshot(request.mode)
      .then(dataUrl => {
        sendResponse({ success: true, dataUrl });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.message });
      });
  } else if (request.action === "hideStickyElements") {
    const count = anchorStickyElements();
    sendResponse({ success: true, hiddenCount: count });
  } else if (request.action === "showStickyElements") {
    restoreStickyElements();
    sendResponse({ success: true });
  } else if (request.action === "syncMarkers") {
    renderMarkers(request.markers);
    sendResponse({ success: true });
  } else if (request.action === "startMarkerPlacement") {
    startMarkerPlacement(request.source);
    sendResponse({ success: true });
  } else if (request.action === "stopMarkerPlacement") {
    stopMarkerPlacement();
    sendResponse({ success: true });
  } else if (request.action === "scrollToMarker") {
    scrollToMarker(request.feedbackId);
    sendResponse({ success: true });
  } else if (request.action === "toggleMarkersVisibility") {
    toggleMarkersVisibility(request.visible);
    sendResponse({ success: true });
  } else if (request.action === "cleanupAll") {
    removeHighlights();
    hideLinkUrls();
    disableAlignmentGuide();
    disableImageChecker();
    if (mobileViewActive) {
      disableMobileView();
    }
    stopMarkerPlacement();
    const markerContainer = document.getElementById('qc-marker-container');
    if (markerContainer) markerContainer.remove();
    sendResponse({ success: true });
  } else {
    sendResponse({ success: false, error: 'Unknown action' });
  }
  return true;
});

function showLinkUrls() {
  hideLinkUrls(); // Clear any existing
  
  const anchors = document.querySelectorAll('a[href]');
  let count = 0;
  
  anchors.forEach(a => {
    const url = a.href;
    if (!url || url.startsWith('javascript:')) return;
    
    // Check if visible
    const style = window.getComputedStyle(a);
    if (style.display === 'none' || style.visibility === 'hidden') return;
    
    const rect = a.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    
    // Create URL label below the link
    const label = document.createElement('div');
    label.className = 'qc-link-url-label';
    label.textContent = url;
    label.style.cssText = `
      display: block;
      font-size: 10px;
      color: #007bff;
      background: #e7f3ff;
      padding: 2px 4px;
      border-radius: 2px;
      margin-top: 2px;
      word-break: break-all;
      max-width: 100%;
      border: 1px solid #b3d7ff;
    `;
    
    // Insert after the link
    a.parentNode.insertBefore(label, a.nextSibling);
    count++;
  });
  
  return count;
}

function hideLinkUrls() {
  document.querySelectorAll('.qc-link-url-label').forEach(el => el.remove());
}

function getVisibleText() {
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  
  let node;
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent) continue;
    
    // Skip non-visible elements
    const tagName = parent.tagName;
    if (tagName === 'SCRIPT' || tagName === 'STYLE' || tagName === 'NOSCRIPT' || 
        tagName === 'TEXTAREA' || tagName === 'INPUT' || tagName === 'SVG' ||
        tagName === 'CODE' || tagName === 'PRE') continue;
    
    // Check if element is visible
    const style = window.getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
    
    // Check if element has dimensions (is rendered)
    const rect = parent.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    
    const text = node.nodeValue.trim();
    if (text.length > 0) {
      texts.push(text);
    }
  }
  
  return texts.join(' ');
}

function showAiHighlights(errors) {
  removeHighlights();
  spottedHighlights = [];

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const nodes = [];
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'TEXTAREA') continue;
    nodes.push(node);
  }

  errors.forEach(error => {
    const { original, correction, explanation } = error;
    const regex = new RegExp(escapeRegExp(original), 'gi');

    nodes.forEach(textNode => {
      const text = textNode.nodeValue;
      let match;
      while ((match = regex.exec(text)) !== null) {
        const rects = getCharRects(textNode, match.index, original.length);
        rects.forEach(rect => {
          spottedHighlights.push({
            rect,
            word: original,
            ukVersion: correction, // Reusing field for convenience
            explanation: explanation
          });
        });
      }
    });
  });

  renderHighlights(spottedHighlights);
  return spottedHighlights.length;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function spotWordGaps() {
  removeHighlights();
  spottedHighlights = [];
  
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  
  // Patterns to detect word gap issues
  const gapPatterns = [
    { regex: /\S {2,}\S/g, desc: 'Double/multiple spaces' },
    { regex: /\w--+\w/g, desc: 'Multiple dashes between words' },
    { regex: /\w \. \w/g, desc: 'Space before and after period' },
    { regex: /\w \, \w/g, desc: 'Space before comma' },
    { regex: /\w \; \w/g, desc: 'Space before semicolon' },
    { regex: /\w \: \w/g, desc: 'Space before colon' },
    { regex: /\w  +[.,;:!?]/g, desc: 'Multiple spaces before punctuation' },
    { regex: /[.,;:!?]{2,}/g, desc: 'Repeated punctuation' },
    { regex: /\( \w/g, desc: 'Space after opening bracket' },
    { regex: /\w \)/g, desc: 'Space before closing bracket' },
  ];

  let node;
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!parent) continue;
    const tag = parent.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'NOSCRIPT' || tag === 'CODE' || tag === 'PRE') continue;
    // Skip hidden elements
    if (parent.offsetParent === null && tag !== 'BODY') continue;

    const text = node.nodeValue;
    if (!text || text.trim().length === 0) continue;

    gapPatterns.forEach(pattern => {
      // Reset regex lastIndex
      pattern.regex.lastIndex = 0;
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        try {
          const rects = getCharRects(node, match.index, match[0].length);
          rects.forEach(rect => {
            if (rect.width > 0 && rect.height > 0) {
              spottedHighlights.push({
                rect,
                word: match[0],
                ukVersion: pattern.desc
              });
            }
          });
        } catch(e) {}
      }
    });
  }

  renderHighlights(spottedHighlights);
  return spottedHighlights.length;
}

function spotAmericanEnglish() {
  removeHighlights();
  spottedHighlights = [];
  
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  const usWords = Object.keys(US_TO_UK);

  let node;
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'TEXTAREA') continue;

    const text = node.nodeValue;
    usWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const rects = getCharRects(node, match.index, word.length);
        rects.forEach(rect => {
          spottedHighlights.push({
            rect,
            word: match[0],
            ukVersion: US_TO_UK[word.toLowerCase()]
          });
        });
      }
    });
  }

  renderHighlights(spottedHighlights);
  return spottedHighlights.length;
}

function jumpToHighlight(index) {
  const overlay = document.getElementById('qc-highlight-overlay');
  if (!overlay) return;

  const el = overlay.children[index];
  if (!el) return;

  // Get the actual position from the rendered element (already document-absolute)
  const elementTop = parseFloat(el.style.top);
  window.scrollTo({
    top: elementTop - (window.innerHeight / 2),
    behavior: 'smooth'
  });

  // Brief flash effect on the target
  const originalBg = el.style.backgroundColor;
  el.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
  el.style.boxShadow = '0 0 10px red';
  setTimeout(() => {
    el.style.backgroundColor = originalBg;
    el.style.boxShadow = 'none';
  }, 1000);
}

function getCharRects(textNode, offset, length) {
  const range = document.createRange();
  range.setStart(textNode, offset);
  range.setEnd(textNode, offset + length);
  return Array.from(range.getClientRects());
}

function renderHighlights(highlights) {
  highlightOverlay = document.createElement('div');
  highlightOverlay.id = 'qc-highlight-overlay';
  highlightOverlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  `;

  highlights.forEach(h => {
    const el = document.createElement('div');
    el.className = 'qc-american-highlight';
    el.style.cssText = `
      position: absolute;
      top: ${h.rect.top + window.scrollY}px;
      left: ${h.rect.left + window.scrollX}px;
      width: ${h.rect.width}px;
      height: ${h.rect.height}px;
      background-color: rgba(255, 255, 0, 0.4);
      border-bottom: 2px solid red;
      cursor: help;
      pointer-events: auto;
    `;
    el.title = h.explanation ? `Correction: "${h.ukVersion}"\n${h.explanation}` : `American spelling: "${h.word}". British: "${h.ukVersion}"`;
    highlightOverlay.appendChild(el);
  });

  document.body.appendChild(highlightOverlay);
}

function removeHighlights() {
  const existing = document.getElementById('qc-highlight-overlay');
  if (existing) {
    existing.remove();
  }
}

// Re-spot on resize to keep highlights aligned
let resizeTimeout;
window.addEventListener('resize', () => {
  if (document.getElementById('qc-highlight-overlay')) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      spotAmericanEnglish();
    }, 200);
  }
});

// ============ ALIGNMENT GUIDE ============
let alignmentGuideActive = false;
let alignmentGuideOverlay = null;
let lockedElement = null;

function enableAlignmentGuide() {
  if (alignmentGuideActive) return;
  alignmentGuideActive = true;
  
  // Create overlay for guides
  alignmentGuideOverlay = document.createElement('div');
  alignmentGuideOverlay.id = 'qc-alignment-overlay';
  alignmentGuideOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483646;
  `;
  document.body.appendChild(alignmentGuideOverlay);
  
  document.addEventListener('mouseover', handleAlignmentHover, true);
  document.addEventListener('click', handleAlignmentClick, true);
  console.log('Alignment Guide enabled');
}

function disableAlignmentGuide() {
  alignmentGuideActive = false;
  lockedElement = null;
  
  document.removeEventListener('mouseover', handleAlignmentHover, true);
  document.removeEventListener('click', handleAlignmentClick, true);
  
  if (alignmentGuideOverlay) {
    alignmentGuideOverlay.remove();
    alignmentGuideOverlay = null;
  }
  console.log('Alignment Guide disabled');
}

function handleAlignmentHover(e) {
  if (!alignmentGuideActive || lockedElement) return;
  drawAlignmentGuides(e.target);
}

function handleAlignmentClick(e) {
  if (!alignmentGuideActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  if (lockedElement === e.target) {
    // Unlock if clicking same element
    lockedElement = null;
  } else {
    // Lock to this element
    lockedElement = e.target;
    drawAlignmentGuides(e.target);
  }
}

function drawAlignmentGuides(element) {
  if (!alignmentGuideOverlay) return;
  
  // Clear existing guides
  alignmentGuideOverlay.innerHTML = '';
  
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  // Element highlight box
  const highlight = document.createElement('div');
  highlight.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: ${rect.left}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    background: rgba(253, 126, 20, 0.1);
    border: 2px solid #fd7e14;
    pointer-events: none;
    box-sizing: border-box;
  `;
  alignmentGuideOverlay.appendChild(highlight);
  
  // Vertical guide lines (left and right edges)
  const leftGuide = document.createElement('div');
  leftGuide.style.cssText = `
    position: fixed;
    top: 0;
    left: ${rect.left}px;
    width: 1px;
    height: 100%;
    background: rgba(253, 126, 20, 0.5);
    border-left: 1px dashed #fd7e14;
    pointer-events: none;
  `;
  alignmentGuideOverlay.appendChild(leftGuide);
  
  const rightGuide = document.createElement('div');
  rightGuide.style.cssText = `
    position: fixed;
    top: 0;
    left: ${rect.right}px;
    width: 1px;
    height: 100%;
    background: rgba(253, 126, 20, 0.5);
    border-left: 1px dashed #fd7e14;
    pointer-events: none;
  `;
  alignmentGuideOverlay.appendChild(rightGuide);
  
  // Horizontal guide lines (top and bottom edges)
  const topGuide = document.createElement('div');
  topGuide.style.cssText = `
    position: fixed;
    top: ${rect.top}px;
    left: 0;
    width: 100%;
    height: 1px;
    background: rgba(253, 126, 20, 0.5);
    border-top: 1px dashed #fd7e14;
    pointer-events: none;
  `;
  alignmentGuideOverlay.appendChild(topGuide);
  
  const bottomGuide = document.createElement('div');
  bottomGuide.style.cssText = `
    position: fixed;
    top: ${rect.bottom}px;
    left: 0;
    width: 100%;
    height: 1px;
    background: rgba(253, 126, 20, 0.5);
    border-top: 1px dashed #fd7e14;
    pointer-events: none;
  `;
  alignmentGuideOverlay.appendChild(bottomGuide);
  
  // Info label showing dimensions and position
  const infoLabel = document.createElement('div');
  infoLabel.style.cssText = `
    position: fixed;
    top: ${Math.max(rect.top - 28, 5)}px;
    left: ${rect.left}px;
    background: #fd7e14;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
  `;
  infoLabel.textContent = `${Math.round(rect.width)} × ${Math.round(rect.height)} | T:${Math.round(rect.top)} L:${Math.round(rect.left)}`;
  alignmentGuideOverlay.appendChild(infoLabel);
  
  // Show margin info if locked
  if (lockedElement) {
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginRight = parseFloat(style.marginRight) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    const marginLeft = parseFloat(style.marginLeft) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    
    const detailLabel = document.createElement('div');
    detailLabel.style.cssText = `
      position: fixed;
      top: ${rect.bottom + 5}px;
      left: ${rect.left}px;
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 10px;
      font-family: monospace;
      white-space: nowrap;
      pointer-events: none;
      z-index: 10;
      line-height: 1.5;
    `;
    detailLabel.innerHTML = `
      <div style="color: #fd7e14; font-weight: bold; margin-bottom: 2px;">🔒 Locked</div>
      <div>Margin: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft}</div>
      <div>Padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft}</div>
    `;
    alignmentGuideOverlay.appendChild(detailLabel);
  }
}

// ============ IMAGE CHECKER ============
let imageCheckerActive = false;
let imageInfoOverlay = null;

function enableImageChecker() {
  if (imageCheckerActive) return;
  imageCheckerActive = true;
  document.addEventListener('click', handleImageClick, true);
  document.body.style.cursor = 'help';
  console.log('Image Checker enabled');
}

function disableImageChecker() {
  imageCheckerActive = false;
  document.removeEventListener('click', handleImageClick, true);
  document.body.style.cursor = '';
  if (imageInfoOverlay) {
    imageInfoOverlay.remove();
    imageInfoOverlay = null;
  }
  console.log('Image Checker disabled');
}

async function handleImageClick(e) {
  if (!imageCheckerActive) return;

  let current = e.target;
  let imageUrl = null;
  let imageElement = null;

  // Try to find an <img> or background image by traversing up the DOM tree
  // This allows clicking on a child element to detect a background image on its container
  let depth = 0;
  while (current && current !== document.body && current !== document.documentElement && depth < 8) {
    // 1. Check if it's an <img>, <video> poster, or <picture> source
    if (current.tagName === 'IMG') {
      imageUrl = current.src;
      imageElement = current;
      break;
    } else if (current.tagName === 'VIDEO' && current.poster) {
      imageUrl = current.poster;
      imageElement = current;
      break;
    } else if (current.tagName === 'PICTURE') {
      const imgInPicture = current.querySelector('img');
      if (imgInPicture) {
        imageUrl = imgInPicture.currentSrc || imgInPicture.src;
        imageElement = imgInPicture;
        break;
      }
    }

    const style = window.getComputedStyle(current);
    const pseudoBefore = window.getComputedStyle(current, ':before');
    const pseudoAfter = window.getComputedStyle(current, ':after');

    // Helper to extract URL from various CSS properties
    const extractUrl = (str) => {
      if (!str || str === 'none' || !str.includes('url')) return null;
      // Handle multiple background images by taking the first one
      const match = str.match(/url\(['"]?(.*?)['"]?\)/);
      return match ? match[1] : null;
    };

    // 2. Check backgroundImage, listStyleImage, and maskImage on element and pseudo-elements
    imageUrl = extractUrl(style.backgroundImage) || 
               extractUrl(style.listStyleImage) ||
               extractUrl(style.maskImage) ||
               extractUrl(style.webkitMaskImage) ||
               extractUrl(style.borderImageSource) ||
               extractUrl(pseudoBefore.backgroundImage) || 
               extractUrl(pseudoAfter.backgroundImage) ||
               extractUrl(pseudoBefore.maskImage) ||
               extractUrl(pseudoBefore.webkitMaskImage) ||
               extractUrl(pseudoAfter.maskImage) ||
               extractUrl(pseudoAfter.webkitMaskImage);

    // 3. Check 'content' property on pseudo-elements (sometimes used for images/icons)
    if (!imageUrl) {
      imageUrl = extractUrl(pseudoBefore.content) || 
                 extractUrl(pseudoAfter.content);
    }

    if (imageUrl) {
      imageElement = current;
      break;
    }
    
    current = current.parentElement;
    depth++;
  }

  if (imageUrl) {
    e.preventDefault();
    e.stopPropagation();
    showImageInfo(imageElement, imageUrl);
  }
}

async function showImageInfo(element, url) {
  if (imageInfoOverlay) imageInfoOverlay.remove();

  // Show loading state
  const loadingOverlay = document.createElement('div');
  loadingOverlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    z-index: 2147483647;
    font-family: sans-serif;
  `;
  loadingOverlay.textContent = 'Analyzing image...';
  document.body.appendChild(loadingOverlay);

  try {
    const info = await fetchImageMetadata(url);
    loadingOverlay.remove();

    imageInfoOverlay = document.createElement('div');
    imageInfoOverlay.id = 'qc-image-info-overlay';
    imageInfoOverlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 280px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      overflow: hidden;
      border: 1px solid #dee2e6;
    `;

    const downloadSpeeds = calculateDownloadSpeeds(info.sizeBytes);

    imageInfoOverlay.innerHTML = `
      <div style="background: #6f42c1; color: white; padding: 12px; font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
        <span>Image Details</span>
        <button id="close-image-info" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px;">&times;</button>
      </div>
      <div style="padding: 15px;">
        <div style="margin-bottom: 12px; text-align: center;">
          <img src="${url}" style="max-width: 100%; max-height: 150px; border-radius: 4px; border: 1px solid #eee;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
          <div style="color: #6c757d;">Dimensions</div>
          <div style="font-weight: 500; text-align: right;">${info.width} &times; ${info.height}px</div>
          
          <div style="color: #6c757d;">File Size</div>
          <div style="font-weight: 500; text-align: right;">${formatBytes(info.sizeBytes)}</div>
          
          <div style="color: #6c757d;">Format</div>
          <div style="font-weight: 500; text-align: right; text-transform: uppercase;">${info.format}</div>
        </div>
        
        <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
          <div style="font-size: 11px; font-weight: 700; color: #6c757d; text-transform: uppercase; margin-bottom: 8px;">Est. Download Speed</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px;">
            <div style="color: #6c757d;">3G (1.5 Mbps)</div>
            <div style="font-weight: 500; text-align: right;">${downloadSpeeds.threeG}s</div>
            
            <div style="color: #6c757d;">4G (20 Mbps)</div>
            <div style="font-weight: 500; text-align: right;">${downloadSpeeds.fourG}s</div>
          </div>
        </div>
        
        <div style="margin-top: 12px; font-size: 10px; color: #adb5bd; word-break: break-all;">
          ${url.length > 100 ? url.substring(0, 100) + '...' : url}
        </div>
      </div>
    `;

    document.body.appendChild(imageInfoOverlay);
    document.getElementById('close-image-info').onclick = () => {
      imageInfoOverlay.remove();
      imageInfoOverlay = null;
    };

  } catch (err) {
    loadingOverlay.textContent = 'Error loading image details';
    setTimeout(() => loadingOverlay.remove(), 2000);
    console.error('Image Checker Error:', err);
  }
}

async function fetchImageMetadata(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const sizeBytes = parseInt(response.headers.get('content-length')) || 0;
        const contentType = response.headers.get('content-type') || '';
        
        // If content-length is not available, try to fetch the whole image (might be slow for large images)
        let actualSizeBytes = sizeBytes;
        if (sizeBytes === 0) {
          const fullResponse = await fetch(url);
          const blob = await fullResponse.blob();
          actualSizeBytes = blob.size;
        }

        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeBytes: actualSizeBytes,
          format: contentType.split('/')[1] || 'unknown'
        });
      } catch (err) {
        // Fallback for dimensions even if fetch fails
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeBytes: 0,
          format: 'unknown'
        });
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function calculateDownloadSpeeds(bytes) {
  if (bytes === 0) return { threeG: '?', fourG: '?' };
  
  const bits = bytes * 8;
  const threeG_bps = 1.5 * 1000 * 1000; // 1.5 Mbps
  const fourG_bps = 20 * 1000 * 1000;  // 20 Mbps
  
  return {
    threeG: (bits / threeG_bps).toFixed(2),
    fourG: (bits / fourG_bps).toFixed(2)
  };
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ============ MOBILE VIEW ============
let mobileViewActive = false;
let mobileWrapper = null;
let originalBodyStyles = null;
let currentMobileDevice = 'iphone-12';

const MOBILE_DEVICES = {
  'iphone-se': { width: 375, height: 667, name: 'iPhone SE/8' },
  'iphone-12': { width: 390, height: 844, name: 'iPhone 12/13' },
  'iphone-max': { width: 428, height: 926, name: 'iPhone Pro Max' }
};

function enableMobileView(device = 'iphone-12') {
  // If already active with same device, skip
  if (mobileViewActive && currentMobileDevice === device) return;
  
  // If switching devices, disable first
  if (mobileViewActive) {
    disableMobileView();
  }
  
  mobileViewActive = true;
  currentMobileDevice = device;
  
  const deviceInfo = MOBILE_DEVICES[device] || MOBILE_DEVICES['iphone-12'];

  // Store original body styles
  originalBodyStyles = {
    overflow: document.body.style.overflow,
    margin: document.body.style.margin,
    padding: document.body.style.padding
  };

  // Create mobile viewport wrapper
  mobileWrapper = document.createElement('div');
  mobileWrapper.id = 'qc-mobile-wrapper';
  mobileWrapper.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: ${deviceInfo.width}px;
    height: ${deviceInfo.height}px;
    border: 12px solid #1a1a1a;
    border-radius: 36px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.3), inset 0 0 0 2px #333;
    background: #fff;
    z-index: 2147483640;
    overflow: hidden;
  `;

  // Create iframe to show the page
  const iframe = document.createElement('iframe');
  iframe.id = 'qc-mobile-iframe';
  iframe.src = window.location.href;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
  `;

  // Create phone notch
  const notch = document.createElement('div');
  notch.id = 'qc-mobile-notch';
  notch.style.cssText = `
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 150px;
    height: 28px;
    background: #1a1a1a;
    border-radius: 0 0 18px 18px;
    z-index: 10;
  `;

  // Create home indicator
  const homeIndicator = document.createElement('div');
  homeIndicator.id = 'qc-mobile-home';
  homeIndicator.style.cssText = `
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 134px;
    height: 5px;
    background: #333;
    border-radius: 3px;
    z-index: 10;
  `;

  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.id = 'qc-mobile-close';
  closeBtn.innerHTML = '&times; Exit Mobile View';
  closeBtn.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #e83e8c;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 4px 12px rgba(232, 62, 140, 0.4);
  `;
  closeBtn.onclick = () => {
    disableMobileView();
    chrome.runtime.sendMessage({ action: "mobileViewDisabled" });
  };

  // Create size indicator
  const sizeIndicator = document.createElement('div');
  sizeIndicator.id = 'qc-mobile-size-indicator';
  sizeIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    z-index: 2147483647;
  `;
  sizeIndicator.textContent = `${deviceInfo.name} • ${deviceInfo.width} × ${deviceInfo.height}`;

  // Create backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'qc-mobile-backdrop';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    z-index: 2147483639;
  `;

  mobileWrapper.appendChild(notch);
  mobileWrapper.appendChild(iframe);
  mobileWrapper.appendChild(homeIndicator);

  document.body.appendChild(backdrop);
  document.body.appendChild(mobileWrapper);
  document.body.appendChild(closeBtn);
  document.body.appendChild(sizeIndicator);

  console.log(`Mobile View enabled: ${deviceInfo.name}`);
}

function disableMobileView() {
  mobileViewActive = false;

  // Remove mobile elements
  const wrapper = document.getElementById('qc-mobile-wrapper');
  const backdrop = document.getElementById('qc-mobile-backdrop');
  const closeBtn = document.getElementById('qc-mobile-close');
  const sizeIndicator = document.getElementById('qc-mobile-size-indicator');
  
  if (wrapper) wrapper.remove();
  if (backdrop) backdrop.remove();
  if (closeBtn) closeBtn.remove();
  if (sizeIndicator) sizeIndicator.remove();

  // Restore original body styles
  if (originalBodyStyles) {
    document.body.style.overflow = originalBodyStyles.overflow;
    document.body.style.margin = originalBodyStyles.margin;
    document.body.style.padding = originalBodyStyles.padding;
    originalBodyStyles = null;
  }

  mobileWrapper = null;
  console.log('Mobile View disabled');
}

