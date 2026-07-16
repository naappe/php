/**
 * Permanent verified knowledge only.
 * Never add guessed translations here. See AI-BRAIN.md.
 */
export const KNOWLEDGE_VERSION = '2.2.0';

/**
 * Lesson catalog tracks what has been received separately from what has been
 * fully encoded and tested. A summary is not treated as a complete lesson.
 */
export const LESSON_REGISTRY = [
  {id:1,topic:'Thaana Script',focus:'Consonants, vowels (fili), dotted letters',status:'partially-encoded'},
  {id:2,topic:'Sukun, Empty Letters & Emphasis',focus:'Sukun rules, empty letters, emphasis',status:'partially-encoded'},
  {id:3,topic:'Nouns, Plural & Indefinite Markers',focus:'Plural markers and އެއް',status:'summary-received'},
  {id:4,topic:'Repetition, Quotation & Word Order',focus:'އޭ, އޯ and SOV order',status:'encoded-and-tested'},
  {id:5,topic:'Adjectives',focus:'Position, negative adjectives, good/bad words',status:'summary-received'},
  {id:6,topic:'Demonstratives',focus:'Three-way distinction, determiners, pronouns',status:'summary-received'},
  {id:7,topic:'Pronouns',focus:'Person and formality registers',status:'summary-received'},
  {id:8,topic:'Indefinite Suffixes',focus:'އެއް versus އަކު',status:'encoded-from-current-summary'},
  {id:13,topic:'Verbs – Gerunds and Infinitives',focus:'Verbal nouns, infinitives, declension and explicit irregular forms',status:'encoded-from-owner-lesson'}
];

export const VERIFIED_PAIRS = [
  ['how are you','ތިބާ ކިހިނެއް؟'],
  ['what are you doing','ތިޔަ ކުރަނީ ކޮބައިތޯ؟'],
  ['thank you','ޝުކުރިއްޔާ'],
  ['thank you for your help','ތިޔަ ދެއްވި އެހީއަށް ޝުކުރިއްޔާ'],
  ['good morning','ބާއްޖެވެރި ހެނދުނެއް'],
  ['good night','ބާއްޖެވެރި ރޭއެއް'],
  ['what is your name','ތިބާގެ ނަމަކީ ކޮބައިތޯ؟'],
  ['my name is','އަހަރެންގެ ނަމަކީ'],
  ['i am fine','އަހަރެން ރަނގަޅު'],
  ['please help me','އަހަންނަށް އެހީވެދެއްވާ'],
  ['i understand','އަހަންނަށް އެނގިއްޖެ'],
  ['i do not understand','އަހަންނަކަށް ނޭނގެ'],
  ['where are you going','ތިބާ ކޮންތާކަށް ތިޔަ ދަނީ؟'],
  ['see you later','ފަހުން ދިމާވާނެ'],
  ['this is a test','މިއީ ޓެސްޓެއް'],
  ['what is an article in english grammar','އިނގިރޭސި ގަވާއިދުގައި Article އަކީ ކޮބައިތޯ'],
  ['before learning how to apply article rules it is helpful to understand the basic definition','Articleގެ ގަވާއިދުތައް ބޭނުންކުރާ ގޮތް ދަސްކުރުމުގެ ކުރިން، އޭގެ އަސާސީ މާނަ ދޭހަކުރުން މުހިންމެވެ'],
  ['an article in english grammar is a word placed before a noun to show whether the noun is specific or general','އިނގިރޭސި ގަވާއިދުގައި Article އަކީ، ނަމެއް ޚާއްޞަ ކަމެއް ނުވަތަ އާންމު ކަމެއް ދައްކާލުމަށް ނަމުގެ ކުރިން ބޭނުންކުރާ ބަހެކެވެ'],
  ['articles guide the reader by indicating if the speaker is referring to something known unknown unique or countable','Articleތަކުން، ބަސްދޭ މީހާ ދައްކަނީ އެނގިހުރި އެއްޗެއްތޯ، ނޭނގޭ އެއްޗެއްތޯ، އެއްޗެއް އެކަނި ހުންނަ ޚާއްޞަ އެއްޗެއްތޯ، ނުވަތަ ގުނަން އެނގޭ އެއްޗެއްތޯ ކިޔާލާ މީހާއަށް ދޭހަކޮށްދެއެވެ'],
  ["you now have the complete lesson 12 token structure stored in the system's memory",'ލެސަން 12ގެ މުޅި ޓޯކަން ސްޓްރަކްޗަރ މިހާރު ސިސްޓަމްގެ މެމޮރީގައި ބަހައްޓައިފި'],
  ['in the last lesson we learned how nouns change when case suffixes are attached and learned the meanings and uses of those suffixes','ފަހުގެ ދަރުހުގައި، ނަންތަކަށް ކޭސް ސަފިކްސްތައް ގުޅާއިރު ނަންތައް ބަދަލުވާ ގޮތާއި، އެ ސަފިކްސްތަކުގެ މާނައާއި ބޭނުން ދަސްކުރީމެވެ'],
  ["this structure is now stored in the system's memory for lesson",'މި ސްޓްރަކްޗަރ މިހާރު ސިސްޓަމްގެ މެމޮރީގައި ލެސަނަށް ބަހައްޓައިފި'],
  ['artificial intelligence can improve writing','މަޞްނޫޢީ ބުއްދިން ލިޔުން ރަނގަޅުކުރެވިދާނެ'],
  ['please check this document and correct the mistakes','މި ލިޔުން ބަލައި ކުށްތައް ރަނގަޅުކޮށްދެއްވާ'],
  ['chatgpt is an artificial intelligence tool','ޗެޓްޖީޕީޓީ އަކީ މަޞްނޫޢީ ބުއްދީގެ ވަސީލަތެއް'],
  ['write the text in your own words','ލިޔުން އަމިއްލަ ބަހުން ލިޔާ'],
  ['always verify important information','މުހިންމު މަޢުލޫމާތު ދާއިމަށް ކަށަވަރުކުރާ']
];

export const VERIFIED_WORDS = {
  one:'އެކެއް',island:'ރަށް',red:'ރަތް',heart:'ހިތް',then:'ދެން',egg:'ބިސް',father:'ބައްޕަ',mother:'މަންމަ',school:'އިސްކޫލު',mouth:'އަނގަ',stomach:'ބަނޑު',moon:'ހަނދު',mango:'އަނބު',doctor:'ޑޮކްޓަރ',director:'ޑައިރެކްޓަރ',rice:'ބަތް',book:'ފޮތް',house:'ގެ',maldives:'ރާއްޖެ',
  i:'އަހަރެން',you:'ތިބާ',he:'އޭނާ',she:'އޭނާ',we:'އަހަރުމެން',they:'އެމީހުން',this:'މި',that:'އެ',my:'އަހަރެންގެ',your:'ތިބާގެ',our:'އަހަރުމެންގެ',their:'އެމީހުންގެ',who:'ކާކު',what:'ކޮބައި',where:'ކޮންތާކު',when:'ކޮންއިރަކު',why:'ކީއްވެ',how:'ކިހިނެއް',yes:'އާނ',no:'ނޫން',not:'ނޫން',and:'އަދި',or:'ނުވަތަ',but:'ނަމަވެސް',because:'ސަބަބަކީ',if:'އިދި',with:'އެކު',without:'ނުލައި',in:'ގައި',on:'މަތީގައި',from:'އިން',to:'އަށް',of:'ގެ',
  is:'އަކީ',are:'އަކީ',was:'ވީ',were:'ވީ',be:'ވުން',can:'ކުރެވިދާނެ',will:'ވާނެ',should:'ޖެހޭ',must:'ލާޒިމު',do:'ކުރުން',doing:'ކުރަނީ',make:'ހެދުން',use:'ބޭނުންކުރުން',write:'ލިޔުން',read:'ކިޔުން',check:'ބެލުން',correct:'ރަނގަޅުކުރުން',translate:'ތަރުޖަމާކުރުން',learn:'ދަސްކުރުން',think:'ވިސްނުން',help:'އެހީ',improve:'ރަނގަޅުކުރުން',create:'އުފެއްދުން',give:'ދިނުން',take:'ނެގުން',go:'ދިއުން',come:'އައުން',see:'ފެނުން',know:'އެނގުން',understand:'ދޭހަވުން',
  text:'ލިޔުން',word:'ބަސް',words:'ބަސްތައް',sentence:'ޖުމްލަ',sentences:'ޖުމްލަތައް',language:'ބަސް',english:'އިނގިރޭސި',dhivehi:'ދިވެހި',information:'މަޢުލޫމާތު',document:'ލިޔުން',mistake:'ކުށް',mistakes:'ކުށްތައް',grammar:'ގަވާއިދު',spelling:'އިމްލާ',style:'އުސްލޫބު',tool:'ވަސީލަތް',technology:'ޓެކްނޮލޮޖީ',human:'އިންސާން',intelligence:'ބުއްދި',writing:'ލިޔުން',writer:'ލިޔާ މީހާ',system:'ސިސްޓަމް',memory:'މެމޮރީ',lesson:'ލެސަން',structure:'ސްޓްރަކްޗަރ',test:'ޓެސްޓް',
  good:'ރަނގަޅު',well:'ރަނގަޅު',bad:'ނުބައި',important:'މުހިންމު',easy:'ފަސޭހަ',difficult:'އުނދަގޫ',new:'އާ',old:'ކުރީގެ',big:'ބޮޑު',small:'ކުޑަ',black:'ކަޅު',cat:'ބުޅާ',apple:'އާފަލު',bird:'ދޫނި',birds:'ދޫނިތައް',maldivians:'ދިވެހިން',person:'މީހާ',place:'ތަން',hand:'އަތް',plate:'ތަށި',fast:'އަވަސް',slow:'ލަސް',today:'މިއަދު',tomorrow:'މާދަމާ',yesterday:'އިއްޔެ',day:'ދުވަސް',time:'ވަގުތު',work:'މަސައްކަތް',student:'ދަރިވަރު',teacher:'މުދައްރިސް',food:'ކާނާ',water:'ފެން',name:'ނަން',friend:'ރައްޓެހި',people:'މީހުން',world:'ދުނިޔެ'
};

export const VERIFIED_PHRASES = {
  'artificial intelligence':'މަޞްނޫޢީ ބުއްދި','language tool':'ލޭންގުއޭޖްޓޫލް','translation engine':'ތަރުޖަމާ އެންޖިން','translation memory':'ތަރުޖަމާ މެމޮރީ','personal dictionary':'އަމިއްލަ ޑިކްޝަނަރީ','style guide':'އުސްލޫބުގެ މަގުދެއްކުން','writing assistant':'ލިޔުމުގެ މުއާވަން','natural language':'ޤުދުރަތީ ބަސް','for example':'މިސާލަކަށް','in other words':'އެހެން ބަހަކުން','as a result':'އެގޮތުން','right now':'މިހާރު','every day':'ކޮންމެ ދުވަހަކު'
};

/**
 * These English expressions require sentence context. They must never be
 * promoted to unconditional word-to-word mappings.
 */
export const CONTEXT_SENSITIVE_TERMS = {
  function:{reject:'ވަޒީފާ',reason:'ވަޒީފާ normally means job or duty; function depends on technical/grammatical context.'},
  demonstrative:{reject:'މިސާލު ދެއްކުން',reason:'The grammatical category needs a contextual grammatical rendering.'},
  pronouns:{reject:'ވަކި ނަންތައް',reason:'Pronouns are a grammatical class, not simply separate names.'},
  them:{reject:'އެއިން',reason:'Object/reference form depends on antecedent, number, animacy and syntax.'},
  belongs:{reject:'ގެ',reason:'Possession normally requires a construction; ގެ alone is not a complete verb equivalent.'}
};

export const TRANSLATION_PIPELINE = [
  'identify-complete-sentence-meaning',
  'detect-dhivehi-english-placeholder-segments',
  'interpret-english-expressions-in-context',
  'reconstruct-natural-dhivehi-order',
  'apply-noun-number-definiteness-case-rules',
  'verify-meaning-grammar-spelling-fluency'
];

export const DHIVEHI_SUFFIXES = [
  ['ތަކަށް','to plural'],['ތަކުން','from plural'],['ތަކުގެ','of plural'],['ތައް','plural'],['އަށް','to'],['އިން','from'],['ގައި','in'],['ގެ','of'],['އާއި','and'],['އެއް','specific indefinite'],['އަކު','unspecified indefinite']
];

export const SCRIPT_RANGES = {
  thaana:/[\u0780-\u07BF]/u,
  // Unicode Script property excludes common punctuation such as ؟ and ،.
  arabic:/\p{Script=Arabic}/u,
  latin:/[A-Za-z]/u
};

export const CORE_THAANA = [...'ހށނރބޅކއވމފދތލގޏސޑޒޓޔޕޖޗ'];
export const FILI = [...'ަާިީުޫެޭޮޯ'];
export const SUKUN = 'ް';

/**
 * Lesson 4 — Repetition, quotation and word order.
 * Source supplied by the project owner; dated 2016-09-18.
 */
export const GRAMMAR_RULES = {
  defaultWordOrder:{id:'DV-SOV-001',pattern:'subject-object-verb',status:'verified'},
  repetition:{id:'DV-FOCUS-EY',suffix:'އޭ',meaning:'speaker emphasis or repetition of previously stated information',frontFocusedConstituent:true,status:'verified'},
  quotation:{id:'DV-FOCUS-OA',suffix:'އޯ',meaning:'reported or quoted information attributed to another source',frontFocusedConstituent:true,status:'verified'},
  specificIndefinite:{id:'DV-INDEF-EH',suffix:'އެއް',meaning:'a specific but unidentified thing or person',status:'verified-from-lesson-8-summary'},
  unspecifiedIndefinite:{id:'DV-INDEF-AKU',suffix:'އަކު',meaning:'an unspecified or vague thing or person; also used before additional suffixes',status:'verified-from-lesson-8-summary'},
  gerund:{id:'DV-VERB-GERUND',typicalEnding:'އުން',meaning:'verbal noun; the act of performing an action',declinesAsNoun:true,status:'verified-from-lesson-13'},
  infinitive:{id:'DV-VERB-INFINITIVE',typicalEnding:'އަން',meaning:'to perform an action',irregularFormsMustBeMemorized:true,status:'verified-from-lesson-13'}
};

export const INDEFINITE_FORM_MEMORY = {
  'މީހެއް':{base:'މީހާ',mode:'specific-indefinite',english:'a specific person'},
  'މީހަކު':{base:'މީހާ',mode:'unspecified-indefinite',english:'some person'},
  'ތަނަކު':{base:'ތަން',mode:'unspecified-indefinite',english:'some place',irregular:true},
  'ތާކު':{base:'ތަން',mode:'unspecified-indefinite',english:'some place',irregular:true}
};

export const VERB_FORM_MEMORY = {
  'ކުރުން':{infinitive:'ކުރަން',english:'do',regular:true},
  'ވުން':{infinitive:'ވާން',english:'be/become/happen',irregular:true},
  'ހެދުން':{infinitive:'ހަދަން',english:'make',regular:true},
  'ބެލުން':{infinitive:'ބަލަން',english:'look',regular:true},
  'ކެއުން':{infinitive:'ކާން',english:'eat',irregular:true},
  'ފެށުން':{infinitive:'ފަށަން',english:'start',regular:true},
  'ބުނުން':{infinitive:'ބުނަން',english:'say',regular:true},
  'ނެގުން':{infinitive:'ނަގަން',english:'take',regular:true},
  'ހޯދުން':{infinitive:'ހޯދަން',english:'look for',regular:true},
  'ކިޔުން':{infinitive:'ކިޔަން',english:'read',regular:true},
  'ލިޔުން':{infinitive:'ލިޔަން',english:'write',regular:true},
  'ދެއްކުން':{infinitive:'ދައްކަން',english:'show',regular:true},
  'ހިނގުން':{infinitive:'ހިނގަން',english:'walk',regular:true},
  'ދުވުން':{infinitive:'ދުވަން',english:'run',regular:true},
  'ހުއްޓުން':{infinitive:'ހުއްޓަން',english:'stop',regular:true},
  'މެރުން':{infinitive:'މަރަން',english:'kill',regular:true},
  'ފެތުން':{infinitive:'ފަތަން',english:'swim',regular:true},
  'ނެށުން':{infinitive:'ނަށަން',english:'dance',regular:true},
  'ބެލެހެއްޓުން':{infinitive:'ބަލަހައްޓަން',english:'look after',regular:true},
  'ހިފެހެއްޓުން':{infinitive:'ހިފަހައްޓަން',english:'hold on to',regular:true},
  'ކުރެހުން':{infinitive:'ކުރަހަން',english:'draw',regular:true},
  'އައުން':{infinitive:'އަންނަން',english:'come',irregular:true},
  'ދިއުން':{infinitive:'ދާން',english:'go',irregular:true},
  'ދިނުން':{infinitive:'ދޭން',english:'give',irregular:true},
  'ލުން':{infinitive:'ލާން',english:'put',irregular:true},
  'ބުއިން':{infinitive:'ބޯން',english:'drink',irregular:true}
};

export const GERUND_DECLENSION_MEMORY = {
  'ކުރުން':{
    nominativeAccusative:'ކުރުން',
    genitive:'ކުރުމުގެ',
    dative:'ކުރުމަށް',
    locative:'ކުރުމުގައި',
    instrumental:'ކުރުމުން',
    associative:'ކުރުމާއި'
  }
};

export const FOCUS_FORM_MEMORY = {
  'ބުޅަލޭ':{base:'ބުޅާ',mode:'repetition'},
  'ބުޅަލެކޭ':{base:'ބުޅަލެއް',mode:'repetition'},
  'ރަށޭ':{base:'ރަށް',mode:'repetition'},
  'މަންމަމެނޭ':{base:'މަންމަމެން',mode:'repetition'},
  'ދޫނިތަކެކޭ':{base:'ދޫނިތަކެއް',mode:'repetition'},
  'ދިވެހިންނޭ':{base:'ދިވެހިން',mode:'repetition'},
  'ބުޅަލެކޯ':{base:'ބުޅަލެއް',mode:'quotation'},
  'ދިވެހިންނޯ':{base:'ދިވެހިން',mode:'quotation'},
  'އަތޯ':{base:'އަތް',mode:'quotation'},
  'ތައްޓޯ':{base:'ތަށި',mode:'quotation'}
};
