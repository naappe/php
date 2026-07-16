/**
 * Browser ports of selected MIT-licensed mismaah/dhivehi_nlp 1.0.13 helpers.
 * Copyright (c) 2020 Mismaah Abdulla; adapted for this JavaScript project.
 */
import {wordTokenize} from './engine.js?v=4.0.0';

export const STEM_RULES=Object.freeze([
  ['ކަމަކީ',''],['ތަކުގެ',''],['ތަކަށް',''],['ހަކަށް',''],['ކަމުން',''],['ކަމަށް',''],['ކަމެއް','ކަން'],
  ['އްޗެއް','ތި'],['ގަކީ','ގު'],['ދުމާ','ދުން'],['ހުމެއް','ހުން'],['ނުމުން','ން'],
  ['ކަން',''],['ތައް',''],['ކޮށް',''],['ވައި',''],['އެވެ',''],['ހެއް','ސް'],['ސުން','ސް'],['ތުން','ތް'],
  ['ފި',''],['ގެ',''],['ނާ',''],['އަށް','']
]);

export function stemDhivehi(input){
  const stemOne=token=>{for(const [suffix,replacement] of STEM_RULES){if(token.endsWith(suffix)&&token.length>suffix.length)return token.slice(0,-suffix.length)+replacement}return token};
  if(Array.isArray(input))return input.map(stemOne).filter(Boolean);
  const tokens=wordTokenize(String(input),{removePunctuation:true}),stems=tokens.map(stemOne).filter(Boolean);
  return stems.length===1?stems[0]:stems;
}

export const STOPWORDS=Object.freeze([
  'ހަރާންފަދަ','ހަރާންފަދަވާނެ','ހަރާންފަދަތޯއްޗެއް','ހާއްޔޯ','ހައްތާ','ހައްޕު','ހަމަހިލާ','ހުށި','ހުރިހައި','ހެއްރަ','ހެއްޔޯ','ހެވޭ','ހޯއް','ނަ','ނު','ކިހައި','ކިހިނަކުން','ކިހިނެއް','ކިތައް','ކުރެން','އަޅެ','އަކު','އަދި','އާނޅެވަތަސް','އެބަ','މުޅިން','ފިޔަވައި',
  'ދަށުން','ވަނަ','ވަނީ','މިވަނީ','އެ','މި','އާއި','ވެސް','ކަމަށް','ނަމަ','ވާތީ','ވުރެ','ހުރި','ހުންނެވި','ކޮށް','އިރު','އެކު','މީގެ','ފަހު','ފަހުން','ފަހުގެ','ކުރި','ކުރިން','ކުރީގެ','އެގޮތުން','ބެހޭ','ވަރަށް','ކަމުން','ކަމުގައި'
]);
const STOPWORD_SET=new Set(STOPWORDS);
export function removeStopwords(text){return wordTokenize(text,{removePunctuation:true}).filter(token=>!STOPWORD_SET.has(token))}

export function generateTrigrams(text){
  const padded=`  ${String(text).trim().replace(/ /g,'  ')} `,result=new Set();
  for(let index=0;index<padded.length-2;index++)result.add(padded.slice(index,index+3));
  return result;
}
export function trigramSimilarity(query,candidate){
  const querySet=generateTrigrams(query),candidateSet=generateTrigrams(candidate);let matches=0;
  candidateSet.forEach(trigram=>{if(querySet.has(trigram))matches++});
  return candidateSet.size?matches/candidateSet.size:0;
}
export function findSimilarWords(query,words,{limit=5,minimum=0.2}={}){
  return words.map(word=>({word,similarity:trigramSimilarity(query,word)}))
    .filter(result=>result.similarity>=minimum).sort((a,b)=>b.similarity-a.similarity||a.word.localeCompare(b.word)).slice(0,limit);
}
