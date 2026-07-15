import assert from 'node:assert/strict';
import {TranslationBrain,validateDhivehi,hasArabicScript} from '../assets/js/engine.js';
import {LESSON_REGISTRY,GRAMMAR_RULES,INDEFINITE_FORM_MEMORY} from '../assets/js/knowledge-base.js';

const brain=new TranslationBrain([]);

assert.equal(brain.translate('What are you doing?','en-dv').output,'ތިޔަ ކުރަނީ ކޮބައިތޯ؟');
assert.equal(brain.translate('This is a test.','en-dv').output,'މިއީ ޓެސްޓެއް.');
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

assert.equal(LESSON_REGISTRY.length,8);
assert.equal(LESSON_REGISTRY.find(x=>x.id===8).status,'encoded-from-current-summary');
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

console.log('All translation-engine tests passed.');
