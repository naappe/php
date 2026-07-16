import assert from 'node:assert/strict';
import {TranslationBrain,validateDhivehi,hasArabicScript,analyzeScriptSegments,derivePresentProgressive,deriveQuestion,selectExistentialVerb,applySentenceFinalEve,selectHabitualForm,sentenceTokenize,wordTokenize} from '../assets/js/engine.js';
import {LESSON_REGISTRY,GRAMMAR_RULES,INDEFINITE_FORM_MEMORY,CONTEXT_SENSITIVE_TERMS,TRANSLATION_PIPELINE,VERIFIED_WORDS,VERB_FORM_MEMORY,GERUND_DECLENSION_MEMORY,PRESENT_PROGRESSIVE_MEMORY,PAST_TENSE_MEMORY,UNCONFIRMED_PAST_GENERALIZATIONS,QUESTION_WORD_MEMORY,QUESTION_SUFFIX_MEMORY,QUESTION_ANSWERS,UNCONFIRMED_LESSON_16,EXISTENTIAL_VERB_MEMORY,TRADITIONAL_EXISTENTIAL_CLASSES,LESSON_18_SOURCE,LESSON_19_SOURCE,HABITUAL_VERB_MEMORY,LESSON_17_SOURCE,LESSON_9_SOURCE,LESSON_10_SOURCE,NOUN_CASE_SYSTEM,NOUN_CASE_COMBINATIONS,NOUN_CASE_FORM_MEMORY,SPECIFIC_LOCATIVE_MEMORY,LESSON_11_SOURCE,DEMONSTRATIVE_PRONOUN_BASES,DEMONSTRATIVE_PRONOUN_CASE_MEMORY,LESSON_12_SOURCE,PERSONAL_PRONOUN_CASE_MEMORY,personalPronounAblative,LESSON_14_SOURCE,LESSON_14_MORE_VERBS,LESSON_15_SOURCE,LESSON_8_SOURCE,NOUN_PREDICATION_MEMORY,DICTIONARY_SOURCES,LESSON_SOURCES,LEXICAL_SOURCES,TOKENIZER_SOURCE,EXTERNAL_LEXICAL_CANDIDATES} from '../assets/js/knowledge-base.js';
import {readFileSync} from 'node:fs';

assert.equal(EXTERNAL_LEXICAL_CANDIDATES.length,1);
assert.equal(EXTERNAL_LEXICAL_CANDIDATES[0].word,'ހައްދަނީ');
assert.equal(EXTERNAL_LEXICAL_CANDIDATES[0].glosses[0],'to cultivate');
assert.equal(EXTERNAL_LEXICAL_CANDIDATES[0].status,'sourced-unconfirmed');
assert.match(EXTERNAL_LEXICAL_CANDIDATES[0].activationPolicy,/independently verified/i);

assert.equal(DICTIONARY_SOURCES.length,1);
assert.equal(DICTIONARY_SOURCES[0].pages,157);
assert.equal(DICTIONARY_SOURCES[0].dhivehiRepresentation,'Roman transliteration');
assert.match(DICTIONARY_SOURCES[0].importPolicy,/do not reproduce the complete copyrighted dictionary/i);
assert.equal(DICTIONARY_SOURCES[0].sha256,'1d40634db965885bc13bfe14b2ee4ce0bf04761bb1ee86f0f5f3e96e4d0c048b');

const brain=new TranslationBrain([]);

assert.deepEqual(sentenceTokenize('ބުނެފަ އެވެ. އިތުރަށް ހާމައެއް ނުކުރެ އެވެ'),['ބުނެފަ އެވެ','އިތުރަށް ހާމައެއް ނުކުރެ އެވެ']);
assert.deepEqual(wordTokenize('ބުނެފަ އެވެ. އިތުރަށް ހާމައެއް ނުކުރެ އެވެ'),['ބުނެފަ','އެވެ','އިތުރަށް','ހާމައެއް','ނުކުރެ','އެވެ']);
assert.deepEqual(wordTokenize('އިތުlރު ހާމައެއް test 112 ނުކުރެ? އެވެ',{removeNonDhivehiNumeric:true}),['އިތުރު','ހާމައެއް','112','ނުކުރެ','އެވެ']);
assert.deepEqual(wordTokenize('މާފަ ބުނެފަ އެވެ. އިތުރު 112 ހާމައެއް، ނުކުރެ؟? އެވެ.',{removePunctuation:true}),['މާފަ','ބުނެފަ','އެވެ','އިތުރު','112','ހާމައެއް','ނުކުރެ','އެވެ']);
assert.equal(TOKENIZER_SOURCE.thaanaRange,'U+0780–U+07B1');

assert.equal(brain.translate('What are you doing?','en-dv').output,'ތިޔަ ކުރަނީ ކޮބައިތޯ؟');
assert.equal(brain.translate('This is a test.','en-dv').output,'މިއީ ޓެސްޓެއް.');
const lesson12Memory="You now have the complete Lesson 12 token structure stored in the system's memory!";
assert.equal(
  brain.translate(lesson12Memory,'en-dv').output,
  'ލެސަން 12ގެ މުޅި ޓޯކަން ސްޓްރަކްޗަރ މިހާރު ސިސްޓަމްގެ މެމޮރީގައި ބަހައްޓައިފި!'
);
assert.doesNotMatch(brain.translate(lesson12Memory,'en-dv').output,/⟦|⟧/);

const articleLessonSentences=[
  'What Is an Article in English Grammar?',
  'Before learning how to apply article rules, it is helpful to understand the basic definition.',
  'An article in English grammar is a word placed before a noun to show whether the noun is specific or general.',
  'Articles guide the reader by indicating if the speaker is referring to something known, unknown, unique, or countable.'
];
for(const sentence of articleLessonSentences){
  const translated=brain.translate(sentence,'en-dv');
  assert.equal(translated.coverage,100);
  assert.doesNotMatch(translated.output,/⟦|⟧/);
  assert.equal(hasArabicScript(translated.output),false);
}

assert.equal(LESSON_REGISTRY.find(x=>x.id===15).status,'pdf-source-encoded-and-tested');
assert.equal(LESSON_REGISTRY.find(x=>x.id===15).topic,'Question Words');
assert.equal(LESSON_SOURCES[0].pages,74);
assert.equal(LESSON_SOURCES[0].sha256,'c39d97083b370803ac2d70606ad09728aec896000f7caf58c754f42ca61b7bf4');
assert.equal(LEXICAL_SOURCES[0].softwareLicense,'MIT');
assert.equal(LEXICAL_SOURCES[0].dictionaryRowsObserved,29824);
assert.match(LEXICAL_SOURCES[0].limitation,/not be promoted as English translation pairs/i);
assert.equal(LESSON_15_SOURCE.wordOrder.subjectQuestion,'QOV');
assert.equal(LESSON_15_SOURCE.wordOrder.objectQuestion,'SVQ');
assert.equal(Object.keys(QUESTION_WORD_MEMORY).length,11);
for(const [form,meaning] of [['ކާކު','who/whom'],['ކީއް','what'],['ކޮބާ','where'],['ކޮންއިރަކު','when'],['ކީއްވެ','why'],['ކޮން','which'],['ކިހިނެއް','how'],['ކިހާ','how much/how'],['ކިތައް','how many']]){
  const result=brain.translate(form,'dv-en');
  assert.equal(result.questionWords[0].english,meaning);
  assert.equal(result.questionWords[0].rule.id,'DV-Q-INHERENT-15');
  assert.doesNotMatch(result.output,/⟦|⟧/);
}
assert.equal(PAST_TENSE_MEMORY['ކުރަން'].past,'ކުރި');
assert.equal(PAST_TENSE_MEMORY['ނަގަން'].past,'ނެގި');
assert.equal(PAST_TENSE_MEMORY['ކިޔަން'].past,'ކިޔައި');
assert.equal(PAST_TENSE_MEMORY['ދާން'].past,'ދިޔަ');
assert.equal(PAST_TENSE_MEMORY['ދާން'].class,'irregular');
assert.equal(UNCONFIRMED_PAST_GENERALIZATIONS.length,3);

const verifiedPast=brain.translate('ނެގި','dv-en');
assert.equal(verifiedPast.verbs[0].form,'past');
assert.equal(verifiedPast.output,'Took');

const irregularPast=brain.translate('ދިޔަ','dv-en');
assert.equal(irregularPast.verbs[0].irregular,true);
assert.equal(irregularPast.output,'Went');

const negativePast=brain.translate('ނުދިޔަ','dv-en');
assert.equal(negativePast.verbs[0].form,'negative-past');
assert.equal(negativePast.output,'Did not go');

for(const [english,dhivehi] of [
  ['I went.','އަހަރެން ދިޔަ.'],
  ['They read a book.','އެމީހުން ފޮތް ކިޔައި.'],
  ['We went to the island.','އަހަރެމެން ރަށަށް ދިޔަ.'],
  ['I did not go.','އަހަރެން ނުދިޔަ.'],
  ['Did you go?','ތިޔަ ދިޔަހޭ؟']
]){
  assert.equal(brain.translate(english,'en-dv').output,dhivehi);
}
assert.equal(brain.translate('މިއީ ޓެސްޓެއް.','dv-en').output,'This is a test.');
assert.equal(validateDhivehi('ج و ميه هڪڙو مټ').ok,false);
assert.equal(validateDhivehi('މިއީ ދިވެހި').ok,true);
assert.equal(hasArabicScript(brain.translate('What are you doing?','en-dv').output),false);

const focus=brain.translate('ރަށޭ','dv-en');
assert.equal(focus.focus[0].mode,'repetition');
assert.match(focus.output,/previously stated/i);

const quote=brain.translate('އަތޯ','dv-en');
assert.equal(quote.focus[0].mode,'quotation');
assert.match(quote.output,/reportedly/i);

const unknown=brain.translate('Unlearnedword','en-dv');
assert.match(unknown.output,/⟦unlearnedword⟧/i);

assert.equal(LESSON_REGISTRY.length,19);
assert.equal(LESSON_REGISTRY.find(x=>x.id===8).status,'source-encoded-and-tested');
assert.equal(LESSON_8_SOURCE.date,'2016-10-18');
assert.equal(LESSON_8_SOURCE.author,'thatmaldivesblog');
assert.match(LESSON_8_SOURCE.contrast.nounAdjective,/no އަކީ/);
assert.equal(NOUN_PREDICATION_MEMORY.suffix,'އަކީ');
assert.equal(NOUN_PREDICATION_MEMORY.negative,'ނޫން');
assert.equal(NOUN_PREDICATION_MEMORY.demonstratives['މިއީ'].spoken,'މީ');
assert.equal(NOUN_PREDICATION_MEMORY.demonstratives['ތިޔައީ'].register,'formal/literary');
assert.ok(LESSON_8_SOURCE.adjectiveBoundaryExamples.incorrect.includes('އެދޫންޏަކީ ރަތް'));
assert.ok(LESSON_8_SOURCE.adjectiveBoundaryExamples.correct.includes('އެދޫނި ރަތް'));
for(const [english,dhivehi] of [
  ['I am a Maldivian.','އަހަންނަކީ ދިވެއްސެއް.'],
  ['Cats are animals.','ބުޅަލަކީ ޖަނަވާރެއް.'],
  ['Mangoes are not coconuts.','އަނބަކީ ކާއްޓެއް ނޫން.'],
  ['This is an apple.','މިއީ އާފަލެއް.'],
  ['That is not a table.','ތިއީ މޭޒެއް ނޫން.'],
  ['That bird is a red bird.','އެދޫންޏަކީ ރަތް ދޫންޏެއް.']
]){
  assert.equal(brain.translate(english,'en-dv').output,dhivehi);
}
const nounPredicate=brain.translate('ބުޅަލަކީ','dv-en');
assert.equal(nounPredicate.predicates[0].type,'noun-noun-predication');
const demonstrativeCopula=brain.translate('މިއީ','dv-en');
assert.equal(demonstrativeCopula.predicates[0].type,'demonstrative-copula');
assert.match(demonstrativeCopula.output,/this is/i);
assert.equal(brain.translate('This dress is small.','en-dv').output,'މިހެދުން ކުޑަ.');
assert.doesNotMatch(brain.translate('This dress is small.','en-dv').output,/އަކީ/);

assert.equal(LESSON_REGISTRY.find(x=>x.id===9).status,'source-encoded-and-tested');
assert.equal(LESSON_REGISTRY.find(x=>x.id===10).status,'source-encoded-and-tested');
assert.equal(LESSON_10_SOURCE.date,'2016-11-16');
assert.equal(LESSON_10_SOURCE.author,'thatmaldivesblog');
assert.match(LESSON_10_SOURCE.caveat,/not mandatory/i);
assert.equal(NOUN_CASE_SYSTEM.nominative.suffix,null);
assert.equal(NOUN_CASE_SYSTEM.accusative.suffix,null);
assert.equal(NOUN_CASE_SYSTEM.genitive.suffix,'ގެ');
assert.equal(NOUN_CASE_SYSTEM.dative.suffix,'އަށް');
assert.equal(NOUN_CASE_SYSTEM.locative.suffix,'ގައި');
assert.equal(NOUN_CASE_SYSTEM.ablative.suffix,NOUN_CASE_SYSTEM.instrumental.suffix);
assert.equal(NOUN_CASE_SYSTEM.ablative.contextSensitiveWith,'instrumental');
assert.deepEqual(NOUN_CASE_SYSTEM.associative.suffixes,['އާ','އާއި']);
assert.match(NOUN_CASE_COMBINATIONS.genitive.plural,/ތަކުގެ/);
assert.match(NOUN_CASE_COMBINATIONS.dative.somePlural,/ތަކަކު/);
assert.equal(NOUN_CASE_FORM_MEMORY['މަންމަގެ'].exception,'family word');
assert.equal(NOUN_CASE_FORM_MEMORY['ތާނގައި'].irregular,true);
assert.equal(SPECIFIC_LOCATIVE_MEMORY['މޭޒު ދަށުގައި'],'under the table');

for(const [form,caseName,english] of [
  ['ލޮލުގެ','genitive',"eye's"],
  ['މީހަކަށް','dative','to/for a person'],
  ['ފެނުގައި','locative','in the water'],
  ['ރަށަކުން','ablative','from an island'],
  ['ވަޅިން','instrumental','with the knife'],
  ['މަންމައާ','associative','with mum']
]){
  const result=brain.translate(form,'dv-en');
  assert.equal(result.output,english[0].toUpperCase()+english.slice(1));
  assert.equal(result.nounCases[0].case,caseName);
}

assert.equal(LESSON_REGISTRY.find(x=>x.id===11).status,'source-encoded-and-tested');
assert.equal(LESSON_11_SOURCE.date,'2017-02-15');
assert.equal(LESSON_11_SOURCE.author,'thatmaldivesblog');
assert.equal(DEMONSTRATIVE_PRONOUN_BASES.singular.proximal.form,'މިއީ');
assert.equal(DEMONSTRATIVE_PRONOUN_BASES.plural.distal.form,'އެއެއްޗެހި');
assert.equal(DEMONSTRATIVE_PRONOUN_CASE_MEMORY['މީގެ'].variant,'common');
assert.equal(DEMONSTRATIVE_PRONOUN_CASE_MEMORY['މީތީގެ'].emphatic,true);
assert.equal(DEMONSTRATIVE_PRONOUN_CASE_MEMORY['މިއިން'].common,true);
assert.equal(DEMONSTRATIVE_PRONOUN_CASE_MEMORY['މީތީން'].rare,true);
assert.equal(DEMONSTRATIVE_PRONOUN_CASE_MEMORY['މީގެން'].case,'instrumental');
assert.equal(DEMONSTRATIVE_PRONOUN_CASE_MEMORY['މިއެއްޗެހިން'].case,'ablative/instrumental');

for(const [form,caseName] of [
  ['މީގެ','genitive'],
  ['މިއަށް','dative'],
  ['މީގައި','locative'],
  ['މިއިން','ablative'],
  ['މީގެން','instrumental'],
  ['މިއާ','associative']
]){
  const result=brain.translate(form,'dv-en');
  assert.equal(result.nounCases[0].case,caseName);
  assert.doesNotMatch(result.output,/⟦|⟧/);
}

assert.equal(LESSON_REGISTRY.find(x=>x.id===12).status,'source-encoded-and-tested');
assert.equal(LESSON_12_SOURCE.date,'2017-04-04');
assert.equal(LESSON_12_SOURCE.author,'thatmaldivesblog');
assert.deepEqual(LESSON_12_SOURCE.unavailableCases,['locative','instrumental']);
assert.match(LESSON_12_SOURCE.ablativeConstruction,/ފަރާތުން/);
assert.equal(PERSONAL_PRONOUN_CASE_MEMORY['އަހަންނަށް'].variant,'common-spoken');
assert.equal(PERSONAL_PRONOUN_CASE_MEMORY['އޭނާޔަށް'].variant,'pronunciation-based');
assert.equal(PERSONAL_PRONOUN_CASE_MEMORY['ކަލެޔާ'].variant,'ya-spelling');
assert.equal(PERSONAL_PRONOUN_CASE_MEMORY['އެމީހުނަށް'].case,'dative');
assert.equal(personalPronounAblative('އޭނާގެ'),'އޭނާގެ ފަރާތުން');
assert.equal(personalPronounAblative('އޭނާ'),null);

for(const [form,caseName] of [
  ['އަހަރެންގެ','genitive'],
  ['އަހަންނަށް','dative'],
  ['އަހަންނާ','associative'],
  ['އޭނާޔަށް','dative'],
  ['ކަލެޔާ','associative']
]){
  const result=brain.translate(form,'dv-en');
  assert.equal(result.nounCases[0].case,caseName);
  assert.doesNotMatch(result.output,/⟦|⟧/);
}
assert.equal(Object.values(PERSONAL_PRONOUN_CASE_MEMORY).some(x=>x.case==='locative'),false);
assert.equal(Object.values(PERSONAL_PRONOUN_CASE_MEMORY).some(x=>x.case==='instrumental'),false);

assert.equal(LESSON_REGISTRY.find(x=>x.id===13).status,'encoded-from-owner-lesson');
assert.equal(VERB_FORM_MEMORY['ކުރުން'].infinitive,'ކުރަން');
assert.equal(VERB_FORM_MEMORY['ވުން'].infinitive,'ވާން');
assert.equal(VERB_FORM_MEMORY['ވުން'].irregular,true);
assert.equal(VERB_FORM_MEMORY['ކެއުން'].infinitive,'ކާން');
assert.equal(GERUND_DECLENSION_MEMORY['ކުރުން'].genitive,'ކުރުމުގެ');

const gerundResult=brain.translate('ކުރުން','dv-en');
assert.equal(gerundResult.verbs[0].form,'gerund');
assert.equal(gerundResult.verbs[0].pairedForm,'ކުރަން');
assert.match(gerundResult.output,/act of do/i);

const infinitiveResult=brain.translate('ކުރަން','dv-en');
assert.equal(infinitiveResult.verbs[0].form,'infinitive');
assert.equal(infinitiveResult.verbs[0].pairedForm,'ކުރުން');
assert.match(infinitiveResult.output,/to do/i);

const irregularInfinitive=brain.translate('ކާން','dv-en');
assert.equal(irregularInfinitive.verbs[0].irregular,true);
assert.match(irregularInfinitive.output,/to eat/i);

assert.equal(LESSON_REGISTRY.find(x=>x.id===14).status,'source-encoded-and-tested');
for(const [gerund,english] of [
  ['އެހުން','ask'],
  ['އަޑުއެހުން','listen'],
  ['ޖެހުން','hit'],
  ['ދުއްވުން','drive'],
  ['ކޮށުން','cut'],
  ['ކެއްކުން','cook'],
  ['ވެއްދުން','bring in'],
  ['ފިލުން','hide'],
  ['ފުރުން','leave/depart']
]){
  const result=brain.translate(gerund,'dv-en');
  assert.equal(result.verbs[0].form,'gerund');
  assert.equal(result.verbs[0].english,english);
  assert.equal(result.verbs[0].pairedForm,null);
  assert.equal(result.verbs[0].conjugationStatus,'not supplied by source');
  assert.doesNotMatch(result.output,/⟦|⟧/);
}
assert.equal(LESSON_14_SOURCE.date,'2017-08-24');
assert.equal(LESSON_14_SOURCE.author,'thatmaldivesblog');
assert.equal(LESSON_14_SOURCE.sourceUrl,'https://thatmaldivesblog.wordpress.com/2017/08/24/dhivehi-lesson-14-verbs-present-progressive/');
assert.equal(LESSON_14_SOURCE.syntax.defaultOrder,'subject-object-verb');
assert.equal(LESSON_14_SOURCE.syntax.nullSubject,true);
assert.equal(LESSON_14_SOURCE.verifiedWordOrderExamples.length,3);
assert.equal(LESSON_14_SOURCE.verifiedWordOrderExamples[2].locationFocused,true);
assert.equal(LESSON_14_SOURCE.verifiedNullSubjectExamples.length,3);
assert.match(LESSON_14_SOURCE.verifiedNullSubjectExamples[1].meaning,/contextual subject/i);
assert.match(LESSON_14_SOURCE.longVowelWarning,/different verb form/i);
assert.equal(Object.keys(LESSON_14_MORE_VERBS).length,9);
assert.equal(LESSON_14_MORE_VERBS['އެހުން'].english,'ask');
assert.equal(LESSON_14_MORE_VERBS['ފުރުން'].english,'leave/depart');
assert.equal(LESSON_14_MORE_VERBS['ކެއްކުން'].formsBeyondGerund,'exercise-not-supplied');
assert.equal(derivePresentProgressive('ކުރަން'),'ކުރަނީ');
assert.equal(derivePresentProgressive('ދާން'),'ދަނީ');
assert.equal(derivePresentProgressive('ދޭން'),'ދެނީ');
assert.equal(derivePresentProgressive('ބޯން'),'ބޮނީ');
assert.equal(derivePresentProgressive('not-a-dhivehi-infinitive'),null);
assert.equal(PRESENT_PROGRESSIVE_MEMORY['ކާން'].progressive,'ކަނީ');

const unseenProgressive=derivePresentProgressive(VERB_FORM_MEMORY['ހޯދުން'].infinitive);
assert.equal(unseenProgressive,'ހޯދަނީ');
const generalizedProgressive=brain.translate(unseenProgressive,'dv-en');
assert.equal(generalizedProgressive.verbs[0].form,'present-progressive');
assert.equal(generalizedProgressive.verbs[0].inferred,true);
assert.match(generalizedProgressive.output,/present progressive: look for/i);

for(const [english,dhivehi] of [
  ['I am going.','އަހަރެން ދަނީ.'],
  ['The small child is reading a book.','ކުޑަ ކުއްޖާ ފޮތެއް ކިޔަނީ.'],
  ['We are swimming in the sea.','އަހަރެމެން މޫދުގައި ފަތަނީ.'],
  ['Now she is starting to walk.','މިހާރު ހިނގަން ފަށަނީ.'],
  ['Today we are going to Mum’s house to have tea.','މިއަދު އަހަރެމެން ދަނީ މަންމަމެން ގެއަށް ސައި ބޯން.'],
  ['Their friends are coming to watch a scary movie.','އެމީހުންގެ ރައްޓެހިން އަންނަނީ ބިރުވެރި ފިލްމެއް ބަލަން.']
]){
  assert.equal(brain.translate(english,'en-dv').output,dhivehi);
}

assert.equal(LESSON_REGISTRY.find(x=>x.id===16).status,'encoded-and-tested');
assert.equal(QUESTION_SUFFIX_MEMORY['ތަ'].type,'open-question');
assert.equal(QUESTION_SUFFIX_MEMORY['ދޯ'].type,'confirmation');
assert.equal(QUESTION_SUFFIX_MEMORY['ނު'].type,'negative-confirmation');
assert.equal(QUESTION_ANSWERS.yes,'އާނ');
assert.equal(UNCONFIRMED_LESSON_16.length,3);

assert.equal(deriveQuestion('އޭނަ ކަނީ.'),'އޭނަ ކަނީތަ؟');
assert.equal(
  deriveQuestion('މަސްތައް މޫދުގައި ފަތަނީ','ތަ','މޫދުގައި'),
  'މަސްތައް މޫދުގައިތަ ފަތަނީ؟'
);
assert.equal(deriveQuestion('މިއީ ކިހާ','ތަ','ކިހާ'),null);
assert.equal(deriveQuestion('މިއީ ކޮން','ތަ','ކޮން'),null);
assert.equal(deriveQuestion('މިއީ ކިތައް','ތަ','ކިތައް'),null);

const unseenOpenQuestion=brain.translate('ކުރަނީތަ؟','dv-en');
assert.equal(unseenOpenQuestion.questions[0].type,'open-question');
assert.equal(unseenOpenQuestion.questions[0].base,'ކުރަނީ');
assert.match(unseenOpenQuestion.output,/open-question: present progressive: do/i);

for(const [english,dhivehi] of [
  ['Is she eating?','އޭނަ ކަނީތަ؟'],
  ['Are they studying in Sri Lanka?','އެ މީހުން ލަންކާގައި ކިޔަވަނީތަ؟'],
  ['Is this dress nice?','މި ހެދުން ރީތިތަ؟'],
  ['Are the fish swimming in the sea?','މަސްތައް މޫދުގައި ފަތަނީތަ؟']
]){
  assert.equal(brain.translate(english,'en-dv').output,dhivehi);
}

assert.equal(LESSON_REGISTRY.find(x=>x.id===17).status,'source-encoded-and-tested');
assert.equal(LESSON_17_SOURCE.date,'2018-12-15');
assert.equal(LESSON_17_SOURCE.edited,true);
assert.equal(HABITUAL_VERB_MEMORY['ކުރުން'].secondThird,'ކުރޭ');
assert.equal(selectHabitualForm('ކުރުން',{person:1}),'ކުރަން');
assert.equal(selectHabitualForm('ކުރުން',{person:2}),'ކުރޭ');
assert.equal(selectHabitualForm('ކުރުން',{person:3}),'ކުރޭ');
assert.equal(selectHabitualForm('ކުރުން',{person:2,question:true}),'ކުރަންތަ');
assert.equal(selectHabitualForm('ކުރުން',{person:3,question:true}),'ކުރޭތަ');
assert.equal(selectHabitualForm('ކުރުން',{person:2,literary:true}),'ކުރަމު');
assert.equal(selectHabitualForm('ކުރުން',{person:1,formalEve:true}),'ކުރަމެވެ');
assert.equal(selectHabitualForm('ކުރުން',{person:3,formalEve:true}),'ކުރެއެވެ');
assert.equal(selectHabitualForm('އައުން',{person:3}),'އާދޭ');
assert.equal(selectHabitualForm('ދިޔުން',{person:3}),'ދޭ');
assert.equal(selectHabitualForm('ދިނުން',{person:3}),'ދޭ');

const habitual=brain.translate('ކުރޭ','dv-en');
assert.equal(habitual.verbs[0].form,'habitual');
assert.match(habitual.output,/habitually/i);

for(const [english,dhivehi] of [
  ['I sleep at nine o’clock every night.','ކޮންމެ ރެއަކު ނުވަ ގަޑީގައި އަހަރެން ނިދަން.'],
  ['You write a book.','ތިޔަ ފޮތެއް ލިޔޭ.'],
  ['Do you write a book?','ތިޔަ ފޮތެއް ލިޔަންތަ؟'],
  ['The plane lands every week.','ކޮންމެ ހަފުތާއަކު ބޯޓު ފޭބޭ.']
]){
  assert.equal(brain.translate(english,'en-dv').output,dhivehi);
}

assert.equal(LESSON_REGISTRY.find(x=>x.id===18).status,'source-encoded-and-tested');
assert.equal(LESSON_18_SOURCE.date,'2020-01-20');
assert.equal(LESSON_18_SOURCE.author,'thatmaldivesblog');
assert.equal(EXISTENTIAL_VERB_MEMORY['ހުރުން'].locative,'ހުރީ');
assert.equal(EXISTENTIAL_VERB_MEMORY['އިނުން'].existential[0],'އެބައިން');
assert.equal(EXISTENTIAL_VERB_MEMORY['އޮތުން'].locative,'އޮތީ');
assert.ok(TRADITIONAL_EXISTENTIAL_CLASSES['ހުރުން'].includes('plural inanimate noun'));

assert.equal(selectExistentialVerb({maleHuman:true}),'ހުރުން');
assert.equal(selectExistentialVerb({femaleHuman:true}),'އިނުން');
assert.equal(selectExistentialVerb({fourLegged:true}),'އޮތުން');
assert.equal(selectExistentialVerb({attachedToTree:true}),'އިނުން');
assert.equal(selectExistentialVerb({detachedFromTree:true}),'އޮތުން');
assert.equal(selectExistentialVerb({pluralInanimate:true}),'ހުރުން');
assert.equal(selectExistentialVerb({}),null);

const thereToBe=brain.translate('އެބައޮތް','dv-en');
assert.equal(thereToBe.verbs[0].form,'there-to-be');
assert.equal(thereToBe.output,'There is/are');

const located=brain.translate('އޮތީ','dv-en');
assert.equal(located.verbs[0].form,'existential-locative');
assert.equal(located.output,'Lie/be/exist');

for(const [english,dhivehi] of [
  ['There is a spoon on the table.','މޭޒުމަތީގައި ސަމުސަލެއް އެބައޮތް.'],
  ['There are some spoons on the table.','މޭޒުމަތީގައި ސަމުސާތަކެއް އެބަހުއްޓެވެ.'],
  ['The spoon is on the table.','ސަމުސާ އޮތީ މޭޒުމަތީގައި.'],
  ['The spoons are on the table.','ސަމުސާތައް ހުރީ މޭޒުމަތީގައި.'],
  ['There is an apple on the plate.','ތަށީގައި އާފަލެއް އެބައޮތެވެ.'],
  ['The cat is at the top of the stairs.','ބުޅާ އިނީ ސިޑި މަތީގައެވެ.']
]){
  assert.equal(brain.translate(english,'en-dv').output,dhivehi);
}

assert.equal(LESSON_REGISTRY.find(x=>x.id===19).status,'source-encoded-and-tested');
assert.equal(LESSON_19_SOURCE.date,'2020-07-05');
assert.equal(LESSON_19_SOURCE.extensionOf,18);
assert.equal(EXISTENTIAL_VERB_MEMORY['ތިބުން'].locative,'ތިބީ');
assert.equal(EXISTENTIAL_VERB_MEMORY['އުޅުން'].progressive,'އުޅެނީ');

assert.equal(selectExistentialVerb({animateGroup:true}),'ތިބުން');
assert.equal(selectExistentialVerb({peopleInGeneralLocation:true}),'އުޅުން');
assert.equal(selectExistentialVerb({livingInLocation:true}),'އުޅުން');
assert.notEqual(selectExistentialVerb({animateGroup:true}),selectExistentialVerb({pluralInanimate:true}));

assert.equal(applySentenceFinalEve('ކުޅެން'),'ކުޅޭށެވެ');
assert.equal(applySentenceFinalEve('ބަލަން'),'ބަލާށެވެ');
assert.equal(applySentenceFinalEve('ދާން'),null);

const animateGroupForm=brain.translate('ތިބީ','dv-en');
assert.equal(animateGroupForm.verbs[0].form,'existential-locative');
assert.match(animateGroupForm.output,/animate group be\/exist/i);

const livingForm=brain.translate('އުޅެނީ','dv-en');
assert.equal(livingForm.verbs[0].form,'existential-progressive');
assert.match(livingForm.output,/live\/stay\/be/i);

for(const [english,dhivehi] of [
  ['There are some crows in that tree.','އެގަހުގައި ކާޅުތަކެއް އެބަ ތިއްބެވެ.'],
  ['The crows are in that tree.','ކާޅުތައް ތިބީ އެގަހުގައެވެ.'],
  ['There are lots of Maldivians in Sri Lanka.','ލަންކާގައި ވަރަށް ގިނަ ދިވެހިން އެބަ އުޅެއެވެ.'],
  ['They live on the fifth floor of this building.','އެމީހުން އުޅެނީ މިއިމާރާތުގެ ފަސްވަނަ ބުރީގައެވެ.'],
  ['There are children on the boat.','ދޯނީގައި ކުދިނަ އެބަ ތިއްބެވެ.'],
  ['They are eating in the cafe.','އެމީހުން ސައިހޮޓާގައި ކާން އެބަ ތިއްބެވެ.']
]){
  assert.equal(brain.translate(english,'en-dv').output,dhivehi);
}
assert.equal(LESSON_9_SOURCE.date,'2016-11-16');
assert.equal(LESSON_9_SOURCE.author,'thatmaldivesblog');
assert.equal(LESSON_9_SOURCE.verifiedContrast.definite,'މީހާ');
assert.equal(LESSON_9_SOURCE.verifiedContrast.specificIndefinite,'މީހެއް');
assert.equal(LESSON_9_SOURCE.verifiedContrast.unspecifiedIndefinite,'މީހަކު');
assert.deepEqual(LESSON_9_SOURCE.irregularPlace.forms,['ތަނަކު','ތާކު']);
assert.equal(LESSON_9_SOURCE.irregularPlace.preferred,'ތާކު');
assert.equal(GRAMMAR_RULES.specificIndefinite.status,'verified-from-lesson-9-source');
assert.equal(GRAMMAR_RULES.unspecifiedIndefinite.status,'verified-from-lesson-9-source');
assert.match(GRAMMAR_RULES.unspecifiedIndefinite.usageConstraint,/not used indiscriminately/i);

assert.notEqual(GRAMMAR_RULES.specificIndefinite.meaning,GRAMMAR_RULES.unspecifiedIndefinite.meaning);
assert.equal(INDEFINITE_FORM_MEMORY['މީހެއް'].mode,'specific-indefinite');
assert.equal(INDEFINITE_FORM_MEMORY['މީހަކު'].mode,'unspecified-indefinite');
assert.equal(INDEFINITE_FORM_MEMORY['ތާކު'].base,'ތަން');

const specific=brain.translate('މީހެއް','dv-en');
const unspecified=brain.translate('މީހަކު','dv-en');
assert.match(specific.output,/specific person/i);
assert.match(unspecified.output,/some person/i);
assert.equal(specific.indefinite[0].rule.id,'DV-INDEF-EH');
assert.equal(unspecified.indefinite[0].rule.id,'DV-INDEF-AKU');

const nounCaseEnglish='In the last lesson, we learned how nouns change when case suffixes are attached and learned the meanings and uses of those suffixes.';
const nounCaseDhivehi='ފަހުގެ ދަރުހުގައި، ނަންތަކަށް ކޭސް ސަފިކްސްތައް ގުޅާއިރު ނަންތައް ބަދަލުވާ ގޮތާއި، އެ ސަފިކްސްތަކުގެ މާނައާއި ބޭނުން ދަސްކުރީމެވެ.';
assert.equal(brain.translate(nounCaseEnglish,'en-dv').output,nounCaseDhivehi);
assert.equal(TRANSLATION_PIPELINE[0],'identify-complete-sentence-meaning');
assert.equal(TRANSLATION_PIPELINE.at(-1),'verify-meaning-grammar-spelling-fluency');
assert.equal(VERIFIED_WORDS.function,undefined);
assert.equal(CONTEXT_SENSITIVE_TERMS.function.reject,'ވަޒީފާ');
assert.equal(CONTEXT_SENSITIVE_TERMS.pronouns.reject,'ވަކި ނަންތައް');

const mixed=analyzeScriptSegments('ތިބާ ⟦last lesson⟧ ދަސްކުރީ');
assert.equal(mixed.mixed,true);
assert.deepEqual(mixed.types,['dhivehi','placeholder']);

const contextual=brain.translate('The function belongs to them.','en-dv');
assert.match(contextual.output,/⟦function⟧/i);
assert.match(contextual.output,/⟦belongs⟧/i);
assert.match(contextual.output,/⟦them⟧/i);

const overviewHtml=readFileSync(new URL('../index.html',import.meta.url),'utf8');
for(const section of ['Live translator','AI reasoning instructions','Permanent knowledge base','Translation engine','Regression tests'])assert.match(overviewHtml,new RegExp(section,'i'));
assert.match(overviewHtml,/id="pipelineList"/);
assert.match(overviewHtml,/id="lessonList"/);

console.log('All translation-engine tests passed.');
