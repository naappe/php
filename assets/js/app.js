import {TranslationBrain,validateDhivehi,hasArabicScript,hasThaana} from './engine.js?v=4.0.0';
import {KNOWLEDGE_VERSION,LESSON_REGISTRY,TRANSLATION_PIPELINE,VERIFIED_PAIRS,VERIFIED_WORDS,GRAMMAR_RULES} from './knowledge-base.js?v=4.0.0';
import {stemDhivehi,findSimilarWords} from './dhivehi-nlp.js?v=4.0.0';

const $=id=>document.getElementById(id);
let direction='en-dv';
let userPairs=[];
try{userPairs=JSON.parse(localStorage.getItem('bas_user_pairs')||'[]')}catch{userPairs=[]}
let brain=new TranslationBrain(userPairs);
const dictionaryChunks=new Map();

function save(){localStorage.setItem('bas_user_pairs',JSON.stringify(userPairs))}
function showWarning(message=''){$('warning').hidden=!message;$('warning').textContent=message}
function refreshStats(){$('systemCount').textContent=brain.permanentCount;$('learnedCount').textContent=userPairs.length}
function humanize(value){return value.split('-').map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ')}
function renderOverview(){
  const testedLessons=LESSON_REGISTRY.filter(lesson=>lesson.status.includes('tested')).length;
  $('overviewKnowledge').textContent=`v${KNOWLEDGE_VERSION} · ${VERIFIED_PAIRS.length} sentences · ${Object.keys(VERIFIED_WORDS).length} words`;
  $('overviewStages').textContent=`${TRANSLATION_PIPELINE.length} reasoning stages · ${Object.keys(GRAMMAR_RULES).length} grammar rules`;
  $('overviewTests').textContent=`Automated suite · ${testedLessons} lesson${testedLessons===1?'':'s'} fully tested`;
  TRANSLATION_PIPELINE.forEach(stage=>{const li=document.createElement('li');li.textContent=humanize(stage);$('pipelineList').append(li)});
  LESSON_REGISTRY.forEach(lesson=>{const row=document.createElement('div');row.className='lesson-row';const tested=lesson.status.includes('tested');row.innerHTML=`<span class="lesson-id">${lesson.id}</span><span class="lesson-topic"><strong>${lesson.topic}</strong><span>${lesson.focus}</span></span><span class="lesson-status ${tested?'tested':''}">${humanize(lesson.status)}</span>`;$('lessonList').append(row)});
}
function setDirection(next){
  direction=next;const reverse=next==='dv-en';
  $('fromLabel').textContent=reverse?'ދިވެހި':'English';$('toLabel').textContent=reverse?'English':'ދިވެހި';$('direction').textContent=reverse?'Dhivehi → English':'English → Dhivehi';
  $('source').classList.toggle('dv',reverse);$('result').classList.toggle('dv',!reverse);$('source').dir=reverse?'rtl':'ltr';$('result').dir=reverse?'ltr':'rtl';
  $('source').placeholder=reverse?'ދިވެހިން ލިޔާ...':'Type or paste English text...';$('result').placeholder=reverse?'English translation appears here...':'ތަރުޖަމާ މިތާ ފެންނާނެ...';showWarning();
}

function renderReasoning(result){
  $('reasoning').textContent=[...new Set(result.reasoning)].join(' → ')+'.';$('tokens').innerHTML='';
  result.tokens.slice(0,120).forEach(t=>{const span=document.createElement('span');span.className='token '+(t.known?'ok':'no');span.textContent=`${t.from} → ${t.to}`;$('tokens').append(span)});
  if(result.focus.length){result.focus.forEach(f=>{const span=document.createElement('span');span.className='token ok';span.textContent=`${f.token}: ${f.mode} focus (${f.rule.id})`;$('tokens').append(span)})}
  if(result.indefinite.length){result.indefinite.forEach(f=>{const span=document.createElement('span');span.className='token ok';span.textContent=`${f.token}: ${f.mode} (${f.rule.id})`;$('tokens').append(span)})}
  if(result.verbs.length){result.verbs.forEach(v=>{const span=document.createElement('span');span.className='token ok';span.textContent=`${v.token}: ${v.form} → ${v.english} (${v.rule.id}${v.irregular?', irregular':''})`;$('tokens').append(span)})}
  if(result.questions.length){result.questions.forEach(q=>{const span=document.createElement('span');span.className='token ok';span.textContent=`${q.token}: ${q.type} (${q.suffix}) — ${q.meaning}`;$('tokens').append(span)})}
}

function translate(){
  const text=$('source').value.trim();if(!text){$('result').value='';$('coverage').textContent='—';$('engineNote').textContent='Enter text first';showWarning('The input box is empty. Type or paste text above, then press Translate.');$('source').focus();return}showWarning();
  if(direction==='dv-en'){const check=validateDhivehi(text);if(!check.ok){showWarning(check.message);return}}
  try{const result=brain.translate(text,direction);$('result').value=result.output;$('coverage').textContent=result.coverage+'%';$('coverage').className=result.coverage>=75?'good':result.coverage>=40?'medium':'low';$('engineNote').textContent=result.incompleteSentences.length?'Incomplete — teach unknown meanings':result.coverage>=75?'High memory coverage':result.coverage>=40?'Review recommended':'Not enough learned meaning';if(result.warnings.length)showWarning(result.warnings.join(' '));renderReasoning(result)}catch(error){showWarning(error.message);$('result').value=''}
}

function learn(){
  const en=$('teachEn').value.split(/\n/).map(x=>x.trim()).filter(Boolean),dv=$('teachDv').value.split(/\n/).map(x=>x.trim()).filter(Boolean);
  if(!en.length||en.length!==dv.length){$('learnMsg').textContent='Each English line needs one matching Dhivehi line.';$('learnMsg').className='learnmsg low';return}
  try{dv.forEach((line,i)=>{const check=validateDhivehi(line);if(!check.ok)throw new Error(`Line ${i+1}: ${check.message}`);brain.teach(en[i],line)});save();refreshStats();$('learnMsg').textContent=`Learned ${en.length} verified pair${en.length===1?'':'s'}. Complete sentences are remembered before tokens.`;$('learnMsg').className='learnmsg good'}catch(error){$('learnMsg').textContent=error.message;$('learnMsg').className='learnmsg low'}
}

function exportBrain(){
  const data={name:'Dhivehi Translation Engine',knowledgeVersion:KNOWLEDGE_VERSION,exportedAt:new Date().toISOString(),structure:['tokens','rules','patterns','vocabulary','translations'],verifiedPairs:userPairs};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='dhivehi-translation-brain.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);
}

async function loadDictionaryChunk(initial){
  if(dictionaryChunks.has(initial))return dictionaryChunks.get(initial);
  const filename=`u${initial.codePointAt(0).toString(16).padStart(4,'0')}.json`,response=await fetch(`assets/dictionary/${filename}`);
  if(!response.ok){if(response.status===404)return null;throw new Error(`dictionary chunk failed (${response.status})`)}
  const chunk=await response.json();dictionaryChunks.set(initial,chunk);return chunk;
}
async function searchDictionary(){
  const word=$('dictionaryWord').value.trim(),status=$('dictionaryStatus'),result=$('dictionaryResult');result.hidden=true;
  if(!word||/[^\u0780-\u07B1]/u.test(word)){status.textContent='Enter one exact Thaana headword.';status.className='learnmsg low';return}
  status.textContent='Searching Radheef…';status.className='learnmsg';
  try{
    const chunk=await loadDictionaryChunk(word[0]);let matchedWord=word,data=chunk?.[word],matchMode='Exact Radheef headword found.';
    if(!data){const stem=stemDhivehi(word);if(typeof stem==='string'&&stem!==word&&chunk?.[stem]){matchedWord=stem;data=chunk[stem];matchMode=`Stem fallback: ${word} → ${stem}. Verify the intended form.`}}
    if(!data){result.innerHTML='';const suggestions=findSimilarWords(word,Object.keys(chunk||{}),{limit:5,minimum:.2});if(suggestions.length){const label=document.createElement('strong');label.textContent='Did you mean?';result.append(label);const choices=document.createElement('div');choices.className='dictionary-suggestions';suggestions.forEach(item=>{const button=document.createElement('button');button.type='button';button.textContent=item.word;button.onclick=()=>{$('dictionaryWord').value=item.word;searchDictionary()};choices.append(button)});result.append(choices);result.hidden=false}throw new Error('Exact headword not found')}
    result.innerHTML='';const heading=document.createElement('strong');heading.textContent=matchedWord;result.append(heading);
    const list=document.createElement('ol');data.definitions.forEach(definition=>{const item=document.createElement('li');item.textContent=definition.replace(/^\d+\.\s*/,'');list.append(item)});result.append(list);
    const meta=document.createElement('small');meta.textContent=`${data.partOfSpeech||'ބަހުގެ ބާވަތް ނޭނގޭ'} · Radheef via dhivehi_nlp`;result.append(meta);result.hidden=false;
    status.textContent=matchMode;status.className=matchMode.startsWith('Exact')?'learnmsg good':'learnmsg medium';
  }catch(error){status.textContent=`Dictionary result: ${error.message}.`;status.className='learnmsg low'}
}

async function importBrain(file){
  try{const data=JSON.parse(await file.text()),pairs=data.verifiedPairs;if(!Array.isArray(pairs))throw new Error('No verifiedPairs array found.');pairs.forEach((p,i)=>{if(!p.en||!p.dv)throw new Error(`Invalid pair ${i+1}.`);const check=validateDhivehi(p.dv);if(!check.ok)throw new Error(`Pair ${i+1}: ${check.message}`)});pairs.forEach(p=>brain.teach(p.en,p.dv));save();refreshStats();$('learnMsg').textContent=`Imported ${pairs.length} verified pairs.`;$('learnMsg').className='learnmsg good'}catch(error){$('learnMsg').textContent='Import failed: '+error.message;$('learnMsg').className='learnmsg low'}
}

$('translateBtn').onclick=translate;$('learnBtn').onclick=learn;$('exportBtn').onclick=exportBrain;$('importInput').onchange=e=>e.target.files[0]&&importBrain(e.target.files[0]);
$('dictionarySearchBtn').onclick=searchDictionary;$('dictionaryWord').onkeydown=e=>{if(e.key==='Enter')searchDictionary()};
$('source').oninput=()=>{$('count').textContent=$('source').value.length+' / 5000'};$('source').onkeydown=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')translate()};
$('swapBtn').onclick=()=>{const old=$('source').value;$('source').value=$('result').value;$('result').value=old;setDirection(direction==='en-dv'?'dv-en':'en-dv');$('count').textContent=$('source').value.length+' / 5000'};
$('clearBtn').onclick=()=>{$('source').value='';$('count').textContent='0 / 5000'};$('resetBtn').onclick=()=>{$('source').value='';$('result').value='';$('coverage').textContent='—';$('engineNote').textContent='Ready';$('count').textContent='0 / 5000';$('tokens').innerHTML='';$('reasoning').textContent='Enter text and press Translate.';showWarning()};
$('pasteBtn').onclick=async()=>{try{$('source').value=await navigator.clipboard.readText();$('count').textContent=$('source').value.length+' / 5000'}catch{$('source').focus()}};
$('copyBtn').onclick=async()=>{if(!$('result').value)return;await navigator.clipboard.writeText($('result').value);$('copyBtn').textContent='Copied';setTimeout(()=>$('copyBtn').textContent='Copy',1000)};
$('clearBrainBtn').onclick=()=>{if(!confirm('Delete all lessons saved on this browser?'))return;userPairs=[];localStorage.removeItem('bas_user_pairs');brain=new TranslationBrain(userPairs);refreshStats();$('learnMsg').textContent='Browser lessons cleared.'};
document.querySelectorAll('[data-example]').forEach(button=>button.onclick=()=>{setDirection('en-dv');$('source').value=button.dataset.example;$('count').textContent=$('source').value.length+' / 5000';translate()});

refreshStats();renderOverview();setDirection('en-dv');
