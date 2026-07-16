import assert from 'node:assert/strict';
import {TranslationBrain,validateDhivehi,hasArabicScript,analyzeScriptSegments} from '../assets/js/engine.js';
import {LESSON_REGISTRY,GRAMMAR_RULES,INDEFINITE_FORM_MEMORY,CONTEXT_SENSITIVE_TERMS,TRANSLATION_PIPELINE,VERIFIED_WORDS,VERB_FORM_MEMORY,GERUND_DECLENSION_MEMORY} from '../assets/js/knowledge-base.js';
import {readFileSync} from 'node:fs';

const brain=new TranslationBrain([]);

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

assert.equal(LESSON_REGISTRY.length,9);
assert.equal(LESSON_REGISTRY.find(x=>x.id===8).status,'encoded-from-current-summary');
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
