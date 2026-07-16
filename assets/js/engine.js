import {VERIFIED_PAIRS,VERIFIED_WORDS,VERIFIED_PHRASES,DHIVEHI_SUFFIXES,SCRIPT_RANGES,GRAMMAR_RULES,FOCUS_FORM_MEMORY,INDEFINITE_FORM_MEMORY,VERB_FORM_MEMORY,PRESENT_PROGRESSIVE_MEMORY,PAST_TENSE_MEMORY,QUESTION_SUFFIX_MEMORY,CONTEXT_SENSITIVE_TERMS,TRANSLATION_PIPELINE} from './knowledge-base.js';

const ARTICLES=new Set(['a','an','the']);
const SUBJECTS=new Set(['i','you','he','she','we','they']);
const VERBS=new Set(['do','doing','make','use','write','read','check','correct','translate','learn','think','help','improve','create','give','take','go','come','see','know','understand']);

export const cleanEnglish=s=>s.toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim();
export const cleanDhivehi=s=>s.replace(/[؟،.!?]/g,'').replace(/\s+/g,' ').trim();
export const hasThaana=s=>SCRIPT_RANGES.thaana.test(s);
export const hasArabicScript=s=>SCRIPT_RANGES.arabic.test(s);

export function analyzeScriptSegments(text){
  const segments=[];const re=/⟦[^⟧]*⟧|[\u0780-\u07BF]+|\p{Script=Arabic}+|[A-Za-z]+|\d+|[^\s]/gu;let match;
  while((match=re.exec(text))){const value=match[0];let type='punctuation';if(value.startsWith('⟦'))type='placeholder';else if(hasThaana(value))type='dhivehi';else if(hasArabicScript(value))type='arabic';else if(/[A-Za-z]/.test(value))type='english';else if(/^\d+$/.test(value))type='number';segments.push({value,type,index:match.index})}
  const languageTypes=[...new Set(segments.filter(s=>['dhivehi','english','arabic','placeholder'].includes(s.type)).map(s=>s.type))];
  return {segments,types:languageTypes,mixed:languageTypes.length>1};
}

export function validateDhivehi(text){
  if(!text.trim())return {ok:false,message:'Dhivehi lesson is empty.'};
  if(hasArabicScript(text))return {ok:false,message:'Rejected: Arabic/Sindhi/Urdu characters were found. Dhivehi must use Thaana.'};
  if(!hasThaana(text))return {ok:false,message:'Rejected: no Thaana characters were found.'};
  return {ok:true,message:'Valid Thaana lesson.'};
}

function punctuation(s){const m=s.match(/[.!?؟]+\s*$/);return m?m[0].trim():''}
function addPunctuation(out,p,toDhivehi){if(!p)return out;return out+(toDhivehi&&p.includes('?')?'؟':!toDhivehi&&p.includes('؟')?'?':p)}
function splitSentences(s){return s.match(/[^.!?؟\n]+[.!?؟]?/g)||[]}
function capitalize(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s}

export function derivePresentProgressive(infinitive){
  if(typeof infinitive!=='string'||!infinitive.endsWith('ން'))return null;
  let stem=infinitive.slice(0,-2);
  const shortening=GRAMMAR_RULES.presentProgressive.longVowelShortening;
  const final=stem.slice(-1);
  if(shortening[final])stem=stem.slice(0,-1)+shortening[final];
  return stem+'ނީ';
}

export function deriveQuestion(statement,suffix='ތަ',focusText=null){
  if(typeof statement!=='string'||!statement.trim())return null;
  if(!QUESTION_SUFFIX_MEMORY[suffix])return null;
  const bare=statement.trim().replace(/[.!?؟]+$/,'').trim();
  if(!bare)return null;
  if(focusText){
    if(suffix==='ތަ'&&new Set(['ކިހާ','ކޮން','ކިތައް']).has(focusText))return null;
    const index=bare.lastIndexOf(focusText);
    if(index<0)return null;
    return bare.slice(0,index)+focusText+suffix+bare.slice(index+focusText.length)+'؟';
  }
  return bare+suffix+'؟';
}

export class TranslationBrain{
  constructor(userPairs=[]){
    this.userPairs=userPairs;
    this.words={...VERIFIED_WORDS};
    this.rebuild();
  }

  rebuild(){
    this.memory=new Map(VERIFIED_PAIRS);
    this.userPairs.forEach(p=>this.memory.set(cleanEnglish(p.en),p.dv));
    this.reverseMemory=new Map([...this.memory].map(([en,dv])=>[cleanDhivehi(dv),en]));
    this.reverseWords={};
    Object.entries(this.words).forEach(([en,dv])=>{if(!this.reverseWords[dv])this.reverseWords[dv]=en});
    this.userPairs.forEach(p=>{
      const en=cleanEnglish(p.en).split(' '),dv=cleanDhivehi(p.dv).split(' ');
      if(en.length===1&&dv.length===1){this.words[en[0]]=dv[0];this.reverseWords[dv[0]]=en[0]}
    });
  }

  get permanentCount(){return VERIFIED_PAIRS.length}

  teach(en,dv){
    const validation=validateDhivehi(dv);if(!validation.ok)throw new Error(validation.message);
    en=cleanEnglish(en);dv=dv.trim();if(!en)throw new Error('English lesson is empty.');
    const existing=this.userPairs.find(p=>p.en===en);
    if(existing){existing.dv=dv;existing.updatedAt=new Date().toISOString()}
    else this.userPairs.push({en,dv,confidence:100,source:'browser-verified',learnedAt:new Date().toISOString()});
    this.rebuild();return {en,dv};
  }

  translate(text,direction='en-dv'){
    const stats={matched:0,total:0,tokens:[],reasoning:[],warnings:[],focus:[],indefinite:[],verbs:[],questions:[],script:analyzeScriptSegments(text),pipeline:TRANSLATION_PIPELINE};
    if(stats.script.mixed)stats.warnings.push(`Mixed input detected: ${stats.script.types.join(', ')}. Complete verified sentence meaning has priority over isolated token lookup.`);
    const fn=direction==='en-dv'?this.toDhivehi.bind(this):this.toEnglish.bind(this);
    const output=splitSentences(text).map(s=>fn(s.trim(),stats)).join(' ');
    if(direction==='en-dv'&&hasArabicScript(output))throw new Error('Safety block: non-Thaana Arabic-script output was detected.');
    return {output,coverage:stats.total?Math.round(stats.matched/stats.total*100):0,...stats};
  }

  toDhivehi(sentence,stats){
    const p=punctuation(sentence),key=cleanEnglish(sentence);
    if(this.memory.has(key)){const value=this.memory.get(key).replace(/[.!?؟]+\s*$/,'');stats.total+=key.split(' ').length;stats.matched+=key.split(' ').length;stats.reasoning.push('Exact verified sentence memory');return addPunctuation(value,p,true)}
    let working=key,placeholders=[];
    Object.entries(VERIFIED_PHRASES).sort((a,b)=>b[0].length-a[0].length).forEach(([en,dv])=>{const re=new RegExp('(^|\\s)'+en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=\\s|$)','g');working=working.replace(re,(m,lead)=>{const id=`__phrase${placeholders.length}__`;placeholders.push(dv);return lead+id})});
    const subject=[],object=[],verb=[],unknown=[];
    working.split(/\s+/).filter(Boolean).forEach(token=>{
      if(token.startsWith('__phrase')){const value=placeholders[Number(token.match(/\d+/)[0])];object.push(value);stats.matched+=2;stats.total+=2;stats.tokens.push({from:token,to:value,known:true,type:'phrase'});return}
      stats.total++;
      if(ARTICLES.has(token)){stats.matched++;stats.tokens.push({from:token,to:'removed English article',known:true,type:'grammar'});return}
      if(CONTEXT_SENSITIVE_TERMS[token]){unknown.push(`⟦${token}⟧`);stats.tokens.push({from:token,to:`context required — ${CONTEXT_SENSITIVE_TERMS[token].reason}`,known:false,type:'context-sensitive'});return}
      const base=token.replace(/(ing|ed|s)$/,'');const value=this.words[token]||this.words[base];
      if(!value){unknown.push(`⟦${token}⟧`);stats.tokens.push({from:token,to:'meaning not learned',known:false,type:'unknown'});return}
      stats.matched++;stats.tokens.push({from:token,to:value,known:true,type:'word'});
      if(SUBJECTS.has(token))subject.push(value);else if(VERBS.has(token)||VERBS.has(base))verb.push(value);else object.push(value);
    });
    stats.reasoning.push('No exact sentence memory','Longest verified phrases applied','Known vocabulary tokens applied',`Default ${GRAMMAR_RULES.defaultWordOrder.pattern.toUpperCase()} order applied`,'Unknown meanings marked, not invented');
    return addPunctuation([...subject,...object,...unknown,...verb].join(' '),p,true);
  }

  analyzeFocus(token,stats){
    const known=FOCUS_FORM_MEMORY[token];
    if(known){stats.focus.push({token,...known,rule:known.mode==='repetition'?GRAMMAR_RULES.repetition:GRAMMAR_RULES.quotation});return known}
    if(token.endsWith('އޭ')){const value={base:token.slice(0,-2),mode:'repetition',inferred:true};stats.focus.push({token,...value,rule:GRAMMAR_RULES.repetition});return value}
    if(token.endsWith('އޯ')){const value={base:token.slice(0,-2),mode:'quotation',inferred:true};stats.focus.push({token,...value,rule:GRAMMAR_RULES.quotation});return value}
    return null;
  }

  analyzeQuestionForm(token){
    for(const suffix of ['ދެއްތޯ','ނޫންތަ','ނޫންތޯ','ތޯ','ދޯ','ހޭ','ހޯ','ތަ','ނު']){
      if(!token.endsWith(suffix)||token.length<=suffix.length)continue;
      const data=QUESTION_SUFFIX_MEMORY[suffix]||(
        suffix==='ދެއްތޯ'?QUESTION_SUFFIX_MEMORY['ދޯ']:
        suffix==='ނޫންތަ'||suffix==='ނޫންތޯ'?QUESTION_SUFFIX_MEMORY['ނު']:null
      );
      if(data)return {token,base:token.slice(0,-suffix.length),suffix,...data};
    }
    return null;
  }

  analyzeVerbForm(token){
    for(const [infinitive,data] of Object.entries(PAST_TENSE_MEMORY)){
      if(data.past===token)return {token,form:'past',english:data.english,pairedForm:infinitive,irregular:data.class==='irregular',rule:GRAMMAR_RULES.pastTense,verified:true};
      if(token==='ނު'+data.past){const base=Object.values(VERB_FORM_MEMORY).find(v=>v.infinitive===infinitive)?.english||data.english;return {token,form:'negative-past',english:'did not '+base,pairedForm:data.past,infinitive,irregular:data.class==='irregular',rule:GRAMMAR_RULES.negativePast,verifiedFromPattern:true};}
    }
    for(const [infinitive,data] of Object.entries(PRESENT_PROGRESSIVE_MEMORY)){
      if(data.progressive===token)return {token,form:'present-progressive',english:data.english,pairedForm:infinitive,irregular:Boolean(data.shortenedLongVowel),rule:GRAMMAR_RULES.presentProgressive,verified:true};
    }
    for(const [gerundToken,data] of Object.entries(VERB_FORM_MEMORY)){
      if(derivePresentProgressive(data.infinitive)===token)return {token,form:'present-progressive',english:data.english,pairedForm:data.infinitive,gerund:gerundToken,irregular:false,rule:GRAMMAR_RULES.presentProgressive,inferred:true};
    }
    const gerund=VERB_FORM_MEMORY[token];
    if(gerund)return {token,form:'gerund',english:gerund.english,pairedForm:gerund.infinitive,irregular:Boolean(gerund.irregular),rule:GRAMMAR_RULES.gerund};
    for(const [gerundToken,data] of Object.entries(VERB_FORM_MEMORY)){
      if(data.infinitive===token)return {token,form:'infinitive',english:data.english,pairedForm:gerundToken,irregular:Boolean(data.irregular),rule:GRAMMAR_RULES.infinitive};
    }
    return null;
  }

  lookupDhivehi(token){
    const verb=this.analyzeVerbForm(token);
    if(verb){if(verb.form==='gerund')return 'the act of '+verb.english;if(verb.form==='present-progressive')return 'present progressive: '+verb.english;if(verb.form==='past'||verb.form==='negative-past')return verb.english;return 'to '+verb.english;}
    if(INDEFINITE_FORM_MEMORY[token])return INDEFINITE_FORM_MEMORY[token].english;
    if(this.reverseWords[token])return this.reverseWords[token];
    for(const [suffix,meaning] of DHIVEHI_SUFFIXES){if(token.endsWith(suffix)&&token.length>suffix.length){const stem=token.slice(0,-suffix.length);if(this.reverseWords[stem])return `${meaning} ${this.reverseWords[stem]}`}}
    return null;
  }

  toEnglish(sentence,stats){
    const p=punctuation(sentence),key=cleanDhivehi(sentence);
    if(this.reverseMemory.has(key)){const value=this.reverseMemory.get(key);stats.total+=key.split(' ').length;stats.matched+=key.split(' ').length;stats.reasoning.push('Exact verified reverse-sentence memory');return capitalize(addPunctuation(value,p,false))}
    const subject=[],verb=[],rest=[];
    key.split(/\s+/).filter(Boolean).forEach(token=>{
      stats.total++;const question=this.analyzeQuestionForm(token);if(question)stats.questions.push(question);const questionBase=question?question.base:token,focus=this.analyzeFocus(questionBase,stats),base=focus?focus.base:questionBase,indefinite=INDEFINITE_FORM_MEMORY[base];if(indefinite)stats.indefinite.push({token:base,...indefinite,rule:indefinite.mode==='specific-indefinite'?GRAMMAR_RULES.specificIndefinite:GRAMMAR_RULES.unspecifiedIndefinite});const verbForm=this.analyzeVerbForm(base);if(verbForm)stats.verbs.push(verbForm);const value=this.lookupDhivehi(base);
      if(!value){rest.push(`⟦${token}⟧`);stats.tokens.push({from:token,to:'meaning not learned',known:false,type:'unknown'});return}
      stats.matched++;let translated=value;
      if(focus?.mode==='repetition')translated=`indeed/as previously stated: ${value}`;
      if(focus?.mode==='quotation')translated=`reportedly: ${value}`;
      if(question)translated=`${question.type}: ${translated}`;
      stats.tokens.push({from:token,to:translated,known:true,type:question?'question':focus?'focus':'word'});
      if(['i','you','he','we','they'].includes(value))subject.push(translated);else if(VERBS.has(value))verb.push(translated);else rest.push(translated);
    });
    stats.reasoning.push('No exact reverse-sentence memory','Focus, quotation and question suffixes checked','Dhivehi suffixes checked','Gerund, infinitive, progressive and verified past-form rules checked','SOV reordered toward English SVO','Unknown meanings marked, not guessed');
    if(stats.focus.length)stats.reasoning.push('Focused އޭ/އޯ constituent interpreted at the sentence front');
    if(stats.questions.length)stats.reasoning.push('Question suffix scope and speaker certainty interpreted from its attachment position');
    if(stats.indefinite.length)stats.reasoning.push('އެއް specific-indefinite and އަކު unspecified-indefinite meanings kept distinct');
    return capitalize(addPunctuation([...subject,...verb,...rest].join(' '),p,false));
  }
}
