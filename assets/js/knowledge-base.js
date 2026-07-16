/**
 * Permanent verified knowledge only.
 * Never add guessed translations here. See AI-BRAIN.md.
 */
export const KNOWLEDGE_VERSION = '3.1.0';

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
  {id:8,topic:'Lesson 8',focus:'Source lesson not yet received',status:'source-missing'},
  {id:9,topic:'Another Indefinite Marker',focus:'Specific އެއް versus unspecified އަކު; suffix stacking and irregular ތާކު',status:'source-encoded-and-tested'},
  {id:10,topic:'Noun Cases',focus:'Eight cases, suffix ordering, stem changes, specific locatives and context-sensitive ން',status:'source-encoded-and-tested'},
  {id:11,topic:'Demonstrative Pronoun Cases',focus:'Dative through associative forms, common variants and ablative/instrumental overlap',status:'partial-source-encoded-and-tested'},
  {id:13,topic:'Verbs – Gerunds and Infinitives',focus:'Verbal nouns, infinitives, declension and explicit irregular forms',status:'encoded-from-owner-lesson'},
  {id:14,topic:'Verbs – Present Progressive',focus:'Current actions, progressive formation, long-vowel shortening and null subjects',status:'encoded-from-owner-lesson'},
  {id:15,topic:'Verbs – Past Tense',focus:'Verified past forms, negative prefix and question particle; conflicting universal rules quarantined',status:'verified-pairs-encoded-rule-pending'},
  {id:16,topic:'Questions from Statements',focus:'Question, confirmation and negative-confirmation suffixes with constituent focus',status:'encoded-and-tested'},
  {id:17,topic:'Verbs – Habitual/Simple Present',focus:'Modern person split, literary forms, formal އެވެ endings and contextual އެބަ',status:'source-encoded-and-tested'},
  {id:18,topic:'Verbs – To Be and There To Be',focus:'Three existential/location verb paradigms and traditional noun-class selection',status:'source-encoded-and-tested'},
  {id:19,topic:'Verbs – To Be Continued',focus:'Animate groups with ތިބުން and people/living in general locations with އުޅުން',status:'source-encoded-and-tested'}
];

export const VERIFIED_PAIRS = [
  ['before going to sleep i read a book','ނިދުމުގެ ކުރިން، އަހަރެން ފޮތެއް ކިޔަމެވެ'],
  ['we study at school','އަހަރެމެން ސްކޫލުގައި ކިޔަވަމެމެ'],
  ['you write letters to your friends','ކަލޭ ރަހުމަތްތެރިންނަށް ސިޓީ ލިޔެއެވެ'],
  ['do you write letters to your friends','ކަލޭ ރަހުމަތްތެރިންނަށް ސިޓީ ލިޔަންތަ'],
  ['a plane lands here every week','ކޮންމެ ހަފުތާއަކު މިތަނަށް ބޯޓެއް ޖައްސައެވެ'],
  ['my friends come to my house each night','އަހަރެންގެ ރައްޓެހިން ކޮންމެ ރެއަކު އަހަރެންގެ ގެއަށް އާދެއެވެ'],
  ['i eat an apple every day','ކޮންމެ ދުވަހަކު އަހަރެން އާފަލެއް ކަމެވެ'],
  ['those kids write in their books','އެކުދިން ފޮތުގައި ލިޔެއެވެ'],
  ['the cat climbs the tree','ބުޅާ ގަހަށް އަރައެވެ'],
  ['a small rat is running around the house','ކުޑަ މީދަލެއް ގޭތެރޭގައި އެބަ ދުވައެވެ'],
  ['i swim with my older sister every night','ކޮންމެ ރެއަކު އަހަރެން ދައްތައާއި އެއްކޮށް ފަތަމެވެ'],
  ["they go to their grandfather's island each year",'އެމީހުން ކޮންމެ އަހަރަކު ކާފަގެ ރަށަށް ދެއެވެ'],
  ['there are some crows in that tree','އެގަހުގައި ކާޅުތަކެއް އެބަ ތިއްބެވެ'],
  ['there are kids playing outside','ކުދިން ބޭރުގައި ކުޅެން އެބަ ތިއްބެވެ'],
  ['there are people watching the match on the steps','ސިޑިބަރިމަތީ މެޗު ބަލަން މީހުން އެބަ ތިއްބެވެ'],
  ['the crows are in that tree','ކާޅުތައް ތިބީ އެގަހުގައެވެ'],
  ['the kids are playing outside','ކުދިން ތިބީ ބޭރުގައި ކުޅޭށެވެ'],
  ['there are lots of maldivians in sri lanka','ލަންކާގައި ވަރަށް ގިނަ ދިވެހިން އެބަ އުޅެއެވެ'],
  ['there are lots of old people on this island','މިރަށުގައި ވަރަށް ގިނަ މުސްކުޅި މީހުން އުޅެވެ'],
  ['my older sister is at the office','ދައްތަ އޮފީހުގައި އެބަ އުޅެއެވެ'],
  ['is there any person in this house','މިގޭގައި އެއްވެސް މީހެއް އުޅޭތަ'],
  ['they live on the fifth floor of this building','އެމީހުން އުޅެނީ މިއިމާރާތުގެ ފަސްވަނަ ބުރީގައެވެ'],
  ['now he lives in addu','މިހާރު އޭނަ އުޅެނީ އައްޑޫގައެވެ'],
  ['there are children on the boat','ދޯނީގައި ކުދިނަ އެބަ ތިއްބެވެ'],
  ['there are women working in the field','ދަނޑުގައި އަނހެނުން މަސެއްކަތް ކުރަން އެބަ ތިއްބެވެ'],
  ['there are lots of tourists on this island','މިރަށުގައި ވަރަށް ގިނަ ފަތުރުވެރިން އެބަ އުޅެއެވެ'],
  ['the people are in the car','މީހުން ތިބީ ކާރުތެރޭގައެވެ'],
  ['there are some birds in the nest','ހާލިތެރޭގައި ދޫނިތަކެއް އެބަ ތިއްބެވެ'],
  ['my friends are on the roof','އަހަރެންގެ ރައްޓެހިން ތިބީ ފުރާޅުމަތީގައެވެ'],
  ['is your mum at home','މަންމަ ގޭގައި އެބަ އުޅޭތަ'],
  ['they are eating in the cafe','އެމީހުން ސައިހޮޓާގައި ކާން އެބަ ތިއްބެވެ'],
  ['there is a bed in that room','އެކޮޓަރީގައި އެނދެއް އެބަހުރި'],
  ['there is a crow in the nest','ހާލިތެރޭގައި ކާޅެއް އެބައިން'],
  ['there is a spoon on the table','މޭޒުމަތީގައި ސަމުސަލެއް އެބައޮތް'],
  ['there are some spoons on the table','މޭޒުމަތީގައި ސަމުސާތަކެއް އެބަހުއްޓެވެ'],
  ['there is someone inside the house','ކޮންމެވެސް މީހެއް ގޭތެރޭގައި އެބަހުއްޓެވެ'],
  ['there is a butterfly amongst the flowers','މާތަކުގެތެރެގައި ކޮކާލެއް އެބައިނެވެ'],
  ['there is a blue book at the bottom of the box','ފޮށީގެ އަޑީގައި ނޫކުލައިގެ ފޮތެއް އެބައޮތެވެ'],
  ['the bed is in that room','އެނދު ހުރީ އެކޮޓަރީގައި'],
  ['the crow is in the nest','ކާޅު އިނީ ހާލިތެރޭގައި'],
  ['the spoon is on the table','ސަމުސާ އޮތީ މޭޒުމަތީގައި'],
  ['the spoons are on the table','ސަމުސާތައް ހުރީ މޭޒުމަތީގައި'],
  ['the person is inside the house','މީހާ ހުރީ ގޭތެރޭގައެވެ'],
  ['the butterfly is amongst the flowers','ކޮކާ އިނީ މާތަކުތެރޭގައެވެ'],
  ['the blue book is at the bottom of the box','ނޫކުލައިގެ ފޮތް އޮތީ ފޮށީގެ އަޑީގައެވެ'],
  ['there are some flowers under the chair','ގޮނޑި ދަށުގައި މާތަކެއް އެބަހުއްޓެވެ'],
  ['the key is on the table','ތަޅުދަނޑި އޮތީ މޭޒުމަތީގައެވެ'],
  ['there is an apple on the plate','ތަށީގައި އާފަލެއް އެބައޮތެވެ'],
  ['the cat is at the top of the stairs','ބުޅާ އިނީ ސިޑި މަތީގައެވެ'],
  ['there is a big mosque in the middle of the island','ރަށުމެދުގައި ބޮޑު މިސްކިތެއް އެބަހުއްޓެވެ'],
  ['is she eating','އޭނަ ކަނީތަ'],
  ['is he eating','އޭނަ ކަނީތަ'],
  ['are they studying in sri lanka','އެ މީހުން ލަންކާގައި ކިޔަވަނީތަ'],
  ['is this dress nice','މި ހެދުން ރީތިތަ'],
  ['are the fish swimming in the sea','މަސްތައް މޫދުގައި ފަތަނީތަ'],
  ["she's a relative of yours right",'އެއީ ތިމާގެ މީހެއް ދޯ'],
  ["he's cleaning his room right",'އޭނަ ކޮޓަރި ސާފުކުރަނީ ދޯ'],
  ["this is rice isn't it",'މިއީ ބަތެއްނު'],
  ['i went','އަހަރެން ދިޔަ'],
  ['he ate','އޭނާ ކެއި'],
  ['she ate','އޭނާ ކެއި'],
  ['they read a book','އެމީހުން ފޮތް ކިޔައި'],
  ['we went to the island','އަހަރެމެން ރަށަށް ދިޔަ'],
  ['i did not go','އަހަރެން ނުދިޔަ'],
  ['he did not eat','އޭނާ ނުކެއި'],
  ['she did not eat','އޭނާ ނުކެއި'],
  ['did you go','ތިޔަ ދިޔަހޭ'],
  ['did they come','އެމީހުން އައި ހޭ'],
  ['i am going','އަހަރެން ދަނީ'],
  ['the small child is reading a book','ކުޑަ ކުއްޖާ ފޮތެއް ކިޔަނީ'],
  ['we are swimming in the sea','އަހަރެމެން މޫދުގައި ފަތަނީ'],
  ['now she is starting to walk','މިހާރު ހިނގަން ފަށަނީ'],
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
  specificIndefinite:{id:'DV-INDEF-EH',suffix:'އެއް',meaning:'a specific but unidentified thing or person',status:'verified-from-lesson-9-source'},
  unspecifiedIndefinite:{id:'DV-INDEF-AKU',suffix:'އަކު',meaning:'an unspecified or vague thing or person; similar to singular “some”; normally used as the indefinite base before most additional suffixes',relativeFrequency:'less common than އެއް',usageConstraint:'grammatically attachable to nouns but not used indiscriminately in natural speech',status:'verified-from-lesson-9-source'},
  gerund:{id:'DV-VERB-GERUND',typicalEnding:'އުން',meaning:'verbal noun; the act of performing an action',declinesAsNoun:true,status:'verified-from-lesson-13'},
  infinitive:{id:'DV-VERB-INFINITIVE',typicalEnding:'އަން',meaning:'to perform an action',irregularFormsMustBeMemorized:true,status:'verified-from-lesson-13'},
  presentProgressive:{id:'DV-VERB-PROGRESSIVE',formation:'replace final ން of the infinitive with ނީ',longVowelShortening:{'ާ':'ަ','ޭ':'ެ','ޯ':'ޮ'},meaning:'action progressing at the present moment',nullSubjectAllowed:true,status:'verified-from-lesson-14'},
  pastTense:{id:'DV-VERB-PAST',meaning:'completed past action',formation:'use verified stem-class or lexical past mapping',universalFinalReplacement:false,status:'verified-pairs-only'},
  negativePast:{id:'DV-PAST-NEG',observedPattern:'prefix ނު to the verified past form',conflict:'Lesson prose mentions final ނޫން but supplied examples omit it',status:'examples-verified-general-rule-unconfirmed'},
  pastQuestion:{id:'DV-PAST-Q',particle:'ހޭ',position:'after the past verb or clause',status:'verified-from-examples'},
  habitualPresent:{id:'DV-VERB-HABITUAL-17',meaning:'regular or simple-present action',modernSplit:'1st person versus 2nd/3rd statement',secondPersonQuestionUsesFirstForm:true,literaryFormsSeparate:true,status:'verified-from-edited-lesson-17'},
  formalSentenceEve:{id:'DV-EVE-17',suffix:'އެވެ',spokenReading:'އޭ',quotedSentenceException:true,status:'verified-from-lesson-17'},
  ebaHabitual:{id:'DV-EBA-HAB-17',particle:'އެބަ',meanings:['present progressive','present perfect continuous implication','emphasis that an action occurs'],contextRequired:true,status:'verified-from-lesson-17'},
  derivedQuestion:{id:'DV-Q-THA',suffix:'ތަ',formalSuffix:'ތޯ',meaning:'open truth-value question',focusByAttachment:true,status:'verified-from-lesson-16'},
  confirmationQuestion:{id:'DV-Q-DHOA',suffix:'ދޯ',formalSuffix:'ދެއްތޯ',meaning:'confirmation sought; speaker suspects proposition is true',status:'verified-from-lesson-16'},
  negativeConfirmation:{id:'DV-Q-NU',suffix:'ނު',fullForm:'އެއްނު',formalForms:['ނޫންތަ','ނޫންތޯ'],meaning:'speaker previously believes proposition is true',status:'verified-from-lesson-16'},
  existentialPredication:{id:'DV-EXIST-18',existentialOrder:'location + indefinite entity + އެބަ verb',locationOrder:'definite entity + locative verb + location',traditionalNounClasses:true,modernUsageFlexible:true,status:'verified-from-2020-source-lesson'},
  animateGroupExistence:{id:'DV-EXIST-THIBUN-19',verb:'ތިބުން',meaning:'a group of animate beings exists or is located',actionPattern:'animate group + action infinitive + ތިބުން',status:'verified-from-lesson-19'},
  generalLocationLiving:{id:'DV-EXIST-ULHUN-19',verb:'އުޅުން',meaning:'people exist, stay or live within a general location',status:'verified-from-lesson-19'},
  sentenceFinalEve:{id:'DV-INF-EVE-19',observedChanges:{'ެން':'ޭށެވެ','ަން':'ާށެވެ'},status:'verified-for-demonstrated-vowel-classes'}
};

export const LESSON_9_SOURCE = {
  title:'Another Indefinite Marker',
  date:'2016-11-16',
  author:'thatmaldivesblog',
  verifiedContrast:{
    definite:'މީހާ',
    specificIndefinite:'މީހެއް',
    unspecifiedIndefinite:'މީހަކު'
  },
  suffixStacking:'When another suffix is attached to an indefinite noun, އަކު is the base in most cases.',
  morphophonology:'އަކު requires the same appropriate word-ending changes taught for އެއް.',
  usageWarning:'Do not generate އަކު mechanically for every noun; natural distribution is learned from usage.',
  irregularPlace:{
    base:'ތަން',
    forms:['ތަނަކު','ތާކު'],
    preferred:'ތާކު'
  }
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

export const PRESENT_PROGRESSIVE_MEMORY = {
  'ކުރަން':{progressive:'ކުރަނީ',english:'doing'},
  'ހަދަން':{progressive:'ހަދަނީ',english:'making'},
  'ބަލަން':{progressive:'ބަލަނީ',english:'looking'},
  'ފަށަން':{progressive:'ފަށަނީ',english:'starting'},
  'އަންނަން':{progressive:'އަންނަނީ',english:'coming'},
  'ބުނަން':{progressive:'ބުނަނީ',english:'saying'},
  'ނަގަން':{progressive:'ނަގަނީ',english:'taking'},
  'ކިޔަން':{progressive:'ކިޔަނީ',english:'reading'},
  'ދާން':{progressive:'ދަނީ',english:'going',shortenedLongVowel:true},
  'ވާން':{progressive:'ވަނީ',english:'being/becoming/happening',shortenedLongVowel:true},
  'ދޭން':{progressive:'ދެނީ',english:'giving',shortenedLongVowel:true},
  'ބޯން':{progressive:'ބޮނީ',english:'drinking',shortenedLongVowel:true},
  'ކާން':{progressive:'ކަނީ',english:'eating',shortenedLongVowel:true}
};

export const LESSON_14_SENTENCES = [
  ['i am going','އަހަރެން ދަނީ'],
  ['the small child is reading a book','ކުޑަ ކުއްޖާ ފޮތެއް ކިޔަނީ'],
  ['we are swimming in the sea','އަހަރެމެން މޫދުގައި ފަތަނީ'],
  ['now she is starting to walk','މިހާރު ހިނގަން ފަށަނީ']
];

export const PAST_TENSE_MEMORY = {
  'ކުރަން':{past:'ކުރި',english:'did',class:'verified-stem-change'},
  'ބަލަން':{past:'ބެލި',english:'looked',class:'verified-stem-change'},
  'ހަދަން':{past:'ހެއްދި',english:'made',class:'verified-stem-change'},
  'ފަށަން':{past:'ފެށި',english:'started',class:'verified-stem-change'},
  'ބުނަން':{past:'ބުނި',english:'said',class:'verified-stem-change'},
  'ނަގަން':{past:'ނެގި',english:'took',class:'verified-stem-change'},
  'ކިޔަން':{past:'ކިޔައި',english:'read',class:'verified-stem-change'},
  'ލިޔަން':{past:'ލިޔުން',english:'wrote',class:'verified-stem-change'},
  'ދާން':{past:'ދިޔަ',english:'went',class:'irregular'},
  'އަންނަން':{past:'އައި',english:'came',class:'irregular'},
  'ކާން':{past:'ކެއި',english:'ate',class:'irregular'},
  'ވާން':{past:'ވި',english:'was/were/happened',class:'irregular'},
  'ދޭން':{past:'ދިން',english:'gave',class:'irregular'},
  'ބޯން':{past:'ބިއި',english:'drank',class:'irregular'},
  'ލާން':{past:'ލި',english:'put',class:'irregular'}
};

export const UNCONFIRMED_PAST_GENERALIZATIONS = [
  {claim:'replace final ން with ނި',reason:'does not generate the supplied outputs such as ކުރި or ބެލި'},
  {claim:'negative past requires final ނޫން',reason:'supplied examples are ނުދިޔަ and ނުކެއި without ނޫން'},
  {claim:'a single vowel substitution predicts past stems',reason:'supplied forms belong to several stem patterns and include lexical irregulars'}
];

export const QUESTION_SUFFIX_MEMORY = {
  'ތަ':{type:'open-question',meaning:'speaker does not know the truth value',formal:'ތޯ',ruleId:'DV-Q-THA'},
  'ތޯ':{type:'open-question-formal',meaning:'formal open truth-value question',ruleId:'DV-Q-THA'},
  'ދޯ':{type:'confirmation',meaning:'speaker suspects the proposition is true',formal:'ދެއްތޯ',ruleId:'DV-Q-DHOA'},
  'ނު':{type:'negative-confirmation',meaning:'speaker believes the proposition is true',formal:'ނޫންތަ / ނޫންތޯ',ruleId:'DV-Q-NU'},
  'ހޭ':{type:'repeated-question',meaning:'repeated or emphasized question',ruleId:'DV-FOCUS-EY'},
  'ހޯ':{type:'quoted-question',meaning:'question attributed to another speaker',ruleId:'DV-FOCUS-OA'}
};

export const QUESTION_ANSWERS = {
  yes:'އާނ',no:'ނޫން',emphasizedYes:'އާނއެކޭ',emphasizedNo:['ނޫނެކޭ','ނޫނޭ'],casualYes:'ހޫނ',casualNo:'އުހުނ'
};

export const UNCONFIRMED_LESSON_16 = [
  {claim:'with/without labels in the question-word examples',reason:'the field named with contains the unsuffixed form, while without contains the suffixed ތަ form'},
  {claim:'ނު can always be appended mechanically',reason:'the supplied examples show phonological and morphological combinations such as އެއްނު and ނީނު'},
  {claim:'all question words accept ތަ',reason:'the lesson explicitly excludes ކިހާ, ކޮން and ކިތައް'}
];

export const EXISTENTIAL_VERB_MEMORY = {
  'ހުރުން':{infinitive:'ހުންނަން',progressive:'ހުންނަނީ',habitual:'ހުރި',habitualEve:'ހުއްޓެވެ',existential:['އެބަހުރި','އެބަހުއްޓެވެ'],locative:'ހުރީ',english:'stand/be/exist'},
  'އިނުން':{infinitive:'އިންނަން',progressive:'އިންނަނީ',habitual:'އިން',habitualEve:'އިނެވެ',existential:['އެބައިން','އެބައިނެވެ'],locative:'އިނީ',english:'sit/be/exist'},
  'އޮތުން':{infinitive:'އޮންނަން',progressive:'އޮންނަނީ',habitual:'އޮތް',habitualEve:'އޮތެވެ',existential:['އެބައޮތް','އެބައޮތެވެ'],locative:'އޮތީ',english:'lie/be/exist'},
  'ތިބުން':{infinitive:'ތިބެން',progressive:'ތިބެނީ',habitual:'ތިބި',habitualEve:'ތިއްބެވެ',existential:['ތިއްބެވެ','އެބަތިއްބެވެ'],locative:'ތިބީ',english:'animate group be/exist'},
  'އުޅުން':{infinitive:'އުޅެން',progressive:'އުޅެނީ',habitual:'އުޅޭ',habitualEve:'އުޅެއެވެ',existential:['އުޅެވެ','އުޅެއެވެ','އެބައުޅެއެވެ'],locative:'އުޅޭ',english:'live/stay/be'
};

export const TRADITIONAL_EXISTENTIAL_CLASSES = {
  'ހުރުން':['male human','self-standing object','abstract quality','collection of inanimate objects','plural inanimate noun'],
  'އިނުން':['female human','non-human two-legged animal','creature with more than four legs','fruit or thing still attached to a tree'],
  'އޮތުން':['object unable to stand by itself','four-legged animal','animal without legs','detached fruit or thing']
};

export const LESSON_19_SOURCE = {
  date:'2020-07-05',
  author:'thatmaldivesblog',
  extensionOf:18,
  usageNotes:[
    'ތިބުން is used for groups of animate beings.',
    'އުޅުން expresses living, staying or being within a general location.',
    'Fast speech may render އެބަ އުޅޭ approximately as އެބޯޅެ.'
  ]
};

export const LESSON_18_SOURCE = {
  date:'2020-01-20',
  author:'thatmaldivesblog',
  traditionalGrammarSource:'Muhammad Jameel, 1971',
  usageNote:'Many modern speakers, especially younger generations, do not strictly maintain the traditional noun-class distinctions.',
  pronunciation:[
    'އެބައިން is commonly pronounced އެ-ބައިން',
    'އެބައޮތް is commonly pronounced approximately އެބޮތް',
    'އެބައޮތެވެ is commonly pronounced approximately އެބޯތޭ'
  ]
};

export const HABITUAL_VERB_MEMORY = {
  'ކުރުން':{infinitive:'ކުރަން',first:'ކުރަން',secondThird:'ކުރޭ',firstEve:'ކުރަމެވެ',secondThirdEve:'ކުރެއެވެ',literarySecond:'ކުރަމު',english:'do'},
  'ބެލުން':{infinitive:'ބަލަން',first:'ބަލަން',secondThird:'ބަލާ',firstEve:'ބަލަމެވެ',secondThirdEve:'ބަލައެވެ',english:'watch/look'},
  'ނެށުން':{infinitive:'ނަށަން',first:'ނަށަން',secondThird:'ނަށާ',english:'dance'},
  'ހެދުން':{infinitive:'ހަދަން',first:'ހަދަން',secondThird:'ހަދާ',firstEve:'ހަދަމެވެ',secondThirdEve:'ހަދައެވެ',english:'make'},
  'ޖެހުން':{infinitive:'ޖަހަން',first:'ޖަހަން',secondThird:'ޖަހާ',english:'hit'},
  'ކިޔުން':{infinitive:'ކިޔަން',first:'ކިޔަން',secondThird:'ކިޔާ',english:'read'},
  'ލިޔުން':{infinitive:'ލިޔަން',first:'ލިޔަން',secondThird:'ލިޔޭ',english:'write'},
  'ވުން':{infinitive:'ވާން',first:'ވަން',secondThird:'ވޭ',firstEve:'ވަމެވެ',secondThirdEve:'ވެއެވެ',english:'be/become'},
  'ލުން':{infinitive:'ލާން',first:'ލަން',secondThird:'ލައި',english:'put'},
  'ކެއުން':{infinitive:'ކާން',first:'ކަން',secondThird:'ކައި',firstEve:'ކަމެވެ',secondThirdEve:'ކައެވެ',english:'eat'},
  'ބުއިން':{infinitive:'ބޯން',first:'ބޯން',secondThird:'ބޮއެ',english:'drink'},
  'ދިޔުން':{infinitive:'ދާން',first:'ދަން',secondThird:'ދޭ',firstEve:'ދަމެވެ',secondThirdEve:'ދެއެވެ',english:'go'},
  'ދިނުން':{infinitive:'ދޭން',first:'ދެން',secondThird:'ދޭ',english:'give'},
  'ހުނުން':{infinitive:'ހޭން',first:'ހެން',secondThird:'ހޭ',english:'laugh'},
  'އައުން':{infinitive:'އަންނަން',first:'އަންނަން',secondThird:'އާދޭ',firstEve:'އަންނަމެވެ',secondThirdEve:'އާދެއެވެ',english:'come'},
  'ފެތުން':{infinitive:'ފަތަން',first:'ފަތަން',secondThird:'ފަތާ',firstEve:'ފަތަމެވެ',secondThirdEve:'ފަތައެވެ',english:'swim'},
  'އެޅުން':{infinitive:'އަޅަން',first:'އަޅަން',secondThird:'އަޅާ',firstEve:'އަޅަމެވެ',secondThirdEve:'އަޅައެވެ',english:'pour'},
  'ދެމުން':{infinitive:'ދަމަން',first:'ދަމަން',secondThird:'ދަމާ',firstEve:'ދަމަމެވެ',secondThirdEve:'ދަމައެވެ',english:'pull'},
  'ވެއްދުން':{infinitive:'ވައްދަން',first:'ވައްދަން',secondThird:'ވައްދާ',firstEve:'ވައްދަމެވެ',secondThirdEve:'ވައްދައެވެ',english:'bring in/insert'},
  'ހިއްލުން':{infinitive:'ހިއްލަން',first:'ހިއްލަން',secondThird:'ހިއްލާ',firstEve:'ހިއްލަމެވެ',secondThirdEve:'ހިއްލައެވެ',english:'lift'}
};

export const LESSON_17_SOURCE = {
  date:'2018-12-15',
  author:'thatmaldivesblog',
  edited:true,
  correction:'Second-person statements use the modern 2nd/3rd form; second-person questions use the 1st-person-shaped form.',
  usageNotes:[
    'Habitual clauses usually include a time or place adverbial for natural context.',
    'Without an adverbial, the habitual can sound emphatic.',
    'އެބަ with the simple present is context-sensitive and may signal progressive, continuing habitual relevance or emphasis.'
  ]
};

export const LESSON_10_SOURCE = {
  title:'Noun Cases',
  date:'2016-11-16',
  author:'thatmaldivesblog',
  typology:'Case suffixes supply information often expressed by English prepositions.',
  interpretation:'Nominative and accusative are unmarked; flexible word order means context distinguishes subject from direct object.',
  ordering:'Plural and indefinite markers precede case suffixes.',
  modifierRule:'Adjectives and demonstratives do not decline when the noun receives a case suffix.',
  caveat:'The summary-table indefinite forms are the most common forms, not mandatory in every context.'
};

export const NOUN_CASE_SYSTEM = {
  nominative:{suffix:null,meaning:'subject',marked:false},
  accusative:{suffix:null,meaning:'direct object',marked:false},
  genitive:{suffix:'ގެ',meaning:"of / ’s",indefiniteCommon:'އެއްގެ'},
  dative:{suffix:'އަށް',meaning:'to / for; movement toward',indefiniteCommon:'އަކަށް'},
  locative:{suffix:'ގައި',spoken:'ގަ',meaning:'in / on / at; existence in a location',indefiniteCommon:'އެއްގައި'},
  ablative:{suffix:'ން',meaning:'from',indefiniteCommon:'އަކުން',contextSensitiveWith:'instrumental'},
  instrumental:{suffix:'ން',meaning:'with / using / by means of',indefiniteCommon:'އަކުން',contextSensitiveWith:'ablative'},
  associative:{suffixes:['އާ','އާއި'],spoken:'އާ',meaning:'with / together with; also and',indefiniteCommon:'އަކާ'}
};

export const NOUN_CASE_COMBINATIONS = {
  genitive:{plural:'ތައް + ގެ → ތަކުގެ',specificIndefinite:'އެއް + ގެ → އެއްގެ',humanPlural:'ން + ގެ → ންގެ',unspecifiedIndefinite:'އަކުގެ is possible but rare'},
  dative:{unspecifiedIndefinite:'އަކު + އަށް → އަކަށް',plural:'ތައް + އަށް → ތަކަށް',somePlural:'ތަކެއް → ތަކަކު before އަށް'},
  locative:{specificIndefinite:'އެއް + ގައި → އެއްގައި',plural:'ތައް + ގައި → ތަކުގައި',unspecifiedIndefinite:'އަކުގައި is rare but used in forms such as ތާކުގައި'},
  ablative:{plural:'ތައް → ތަކު before ން',indefinite:'Only އަކު is used before ން',humanDefinite:'noun, commonly genitive, + ފަރާތުން'},
  associative:{indefinite:'Indefinite nouns use އަކު before އާ'}
};

export const NOUN_CASE_FORM_MEMORY = {
  'ޑޮކްޓަރުގެ':{base:'ޑޮކްޓަރު',case:'genitive',english:"doctor's"},
  'ލޮލުގެ':{base:'ލޯ',case:'genitive',english:"eye's"},
  'ރަށުގެ':{base:'ރަށް',case:'genitive',english:"island's"},
  'ކާށީގެ':{base:'ކާށި',case:'genitive',english:"coconut's"},
  'ގޭގެ':{base:'ގެ',case:'genitive',english:"house's"},
  'ކުލައިގެ':{base:'ކުލަ',case:'genitive',english:"colour's"},
  'މަންމަގެ':{base:'މަންމަ',case:'genitive',english:"mother's",exception:'family word'},
  'މީހެއްގެ':{base:'މީހެއް',case:'genitive',english:"a person's"},
  'ދޫނިތަކުގެ':{base:'ދޫނިތައް',case:'genitive',english:"birds'"},
  'ގެއަށް':{base:'ގެ',case:'dative',english:'to the house'},
  'ރަށަށް':{base:'ރަށް',case:'dative',english:'to the island'},
  'މީހަކަށް':{base:'މީހަކު',case:'dative',english:'to/for a person'},
  'މީހުންނަށް':{base:'މީހުން',case:'dative',english:'to/for the people'},
  'ގޭގައި':{base:'ގެ',case:'locative',english:'at the house'},
  'ރަށުގައި':{base:'ރަށް',case:'locative',english:'on the island'},
  'ފެނުގައި':{base:'ފެން',case:'locative',english:'in the water'},
  'ތާނގައި':{base:'ތަން',case:'locative',english:'at the place',irregular:true},
  'ތާކުގައި':{base:'ތަން',case:'locative',english:'at some place',irregular:true},
  'މޭޒުން':{base:'މޭޒު',case:'ablative',english:'from the table'},
  'ގެއިން':{base:'ގެ',case:'ablative',english:'from the house',spoken:'ގޭން'},
  'ރަށަކުން':{base:'ރަށް',case:'ablative',english:'from an island'},
  'މީހަކުން':{base:'މީހަކު',case:'ablative',english:'from a person'},
  'ވަޅިން':{base:'ވަޅި',case:'instrumental',english:'with the knife'},
  'ގަލަމަކުން':{base:'ގަލަމު',case:'instrumental',english:'with a pen'},
  'މަންމައާ':{base:'މަންމަ',case:'associative',english:'with mum'},
  'މީހަކާ':{base:'މީހަކު',case:'associative',english:'with a person'}
};

export const SPECIFIC_LOCATIVE_MEMORY = {
  'އެނދު މަތީގައި':'on top of the bed',
  'އަލަމާރި ތެރޭގައި':'inside the cupboard',
  'ކަނޑު އަޑީގައި':'at the bottom of the sea',
  'މިސްކިތް ކައިރީގައި':'near the mosque',
  'މޭޒު ދަށުގައި':'under the table'
};

export const LESSON_11_PARTIAL_SOURCE = {
  inferredTitle:'Demonstrative Pronoun Cases',
  suppliedCoverage:['plural dative','locative','ablative','instrumental','associative','summary tables'],
  missingCoverage:['lesson title and date','introductory prose','nominative/accusative explanation','genitive explanation','singular dative opening'],
  status:'partial-source',
  pronunciationNote:'Plural dative forms such as މިއެއްޗެއްސަށް are pronounced approximately މީއްޗިއްސަށް.',
  usageNotes:[
    'The short singular ablative forms in އިން are more common than the longer ތީން forms.',
    'The singular instrumental forms in ގެން are more common than the ތީން forms.',
    'Ablative and instrumental demonstrative forms overlap and may substitute for one another contextually.',
    'Singular demonstrative forms may sometimes refer to plural nouns.'
  ]
};

export const DEMONSTRATIVE_PRONOUN_CASE_MEMORY = {
  'މިއެއްޗެއްސަށް':{distance:'proximal',number:'plural',case:'dative',english:'to these/them'},
  'ތިއެއްޗެއްސަށް':{distance:'medial',number:'plural',case:'dative',english:'to those/them'},
  'އެއެއްޗެއްސަށް':{distance:'distal',number:'plural',case:'dative',english:'to those/them'},
  'މީތީގައި':{distance:'proximal',number:'singular',case:'locative',english:'in/at/on this/it',variant:'long'},
  'ތީތީގައި':{distance:'medial',number:'singular',case:'locative',english:'in/at/on that/it',variant:'long'},
  'އޭތީގައި':{distance:'distal',number:'singular',case:'locative',english:'in/at/on that/it',variant:'long'},
  'މީގައި':{distance:'proximal',number:'singular',case:'locative',english:'in/at/on this/it',variant:'short'},
  'ތީގައި':{distance:'medial',number:'singular',case:'locative',english:'in/at/on that/it',variant:'short'},
  'އޭގައި':{distance:'distal',number:'singular',case:'locative',english:'in/at/on that/it',variant:'short'},
  'މިއެއްޗެހީގައި':{distance:'proximal',number:'plural',case:'locative',english:'in/at/on these/them'},
  'ތިއެއްޗެހީގައި':{distance:'medial',number:'plural',case:'locative',english:'in/at/on those/them'},
  'އެއެއްޗެހީގައި':{distance:'distal',number:'plural',case:'locative',english:'in/at/on those/them'},
  'މީތީން':{distance:'proximal',number:'singular',case:'ablative/instrumental',english:'from/with this/it',rare:true},
  'ތީތީން':{distance:'medial',number:'singular',case:'ablative/instrumental',english:'from/with that/it',rare:true},
  'އޭތީން':{distance:'distal',number:'singular',case:'ablative/instrumental',english:'from/with that/it',rare:true},
  'މިއިން':{distance:'proximal',number:'singular',case:'ablative',english:'from this/it',common:true},
  'ތިއިން':{distance:'medial',number:'singular',case:'ablative',english:'from that/it',common:true},
  'އެއިން':{distance:'distal',number:'singular',case:'ablative',english:'from that/it',common:true},
  'މީގެން':{distance:'proximal',number:'singular',case:'instrumental',english:'with this/it',common:true},
  'ތީގެން':{distance:'medial',number:'singular',case:'instrumental',english:'with that/it',common:true},
  'އޭގެން':{distance:'distal',number:'singular',case:'instrumental',english:'with that/it',common:true},
  'މިއެއްޗެހިން':{distance:'proximal',number:'plural',case:'ablative/instrumental',english:'from/with these/them'},
  'ތިއެއްޗެހިން':{distance:'medial',number:'plural',case:'ablative/instrumental',english:'from/with those/them'},
  'އެއެއްޗެހިން':{distance:'distal',number:'plural',case:'ablative/instrumental',english:'from/with those/them'},
  'މީއްޗާ':{distance:'proximal',number:'singular',case:'associative',english:'with this/it',variant:'full'},
  'ތީއްޗާ':{distance:'medial',number:'singular',case:'associative',english:'with that/it',variant:'full'},
  'އޭއްޗާ':{distance:'distal',number:'singular',case:'associative',english:'with that/it',variant:'full'},
  'މިއާ':{distance:'proximal',number:'singular',case:'associative',english:'with this/it',variant:'short'},
  'ތިއާ':{distance:'medial',number:'singular',case:'associative',english:'with that/it',variant:'short'},
  'އެއާ':{distance:'distal',number:'singular',case:'associative',english:'with that/it',variant:'short'},
  'މިއެއްޗެއްސާ':{distance:'proximal',number:'plural',case:'associative',english:'with these/them'},
  'ތިއެއްޗެއްސާ':{distance:'medial',number:'plural',case:'associative',english:'with those/them'},
  'އެއެއްޗެއްސާ':{distance:'distal',number:'plural',case:'associative',english:'with those/them'}
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
