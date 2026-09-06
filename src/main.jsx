import React, {useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import './styles.css';

const starterLetters=[{id:1,name:'Mom',title:'To Mom',date:'May 11, 2025',status:'Released',tags:['gratitude','Birthday','candle','shared'],body:`Dear Mom,

I finally planted the hydrangeas you always wanted in the front yard. They’re blue, just like the ones in your old gardening book. I talk to them sometimes. It feels silly, and also right.

I miss your laugh in the kitchen. The house is quieter without it, but I’m learning how to keep the warmth you left behind.

Love you, always.`,shared:true,candle:true}];

function App(){
 const [letters,setLetters]=useState(()=>JSON.parse(localStorage.getItem('lth-letters')||'null')||starterLetters);
 const [selected,setSelected]=useState(1); const [filter,setFilter]=useState('All'); const [search,setSearch]=useState(''); const [compose,setCompose]=useState(false); const [aiBusy,setAiBusy]=useState(false); const [draft,setDraft]=useState({name:'',title:'',body:''});
 const active=letters.find(l=>l.id===selected)||letters[0];
 const visible=useMemo(()=>letters.filter(l=>(filter==='All'||(filter==='Kept close'&&l.status==='Kept')||(filter==='Released'&&l.status==='Released')||(filter==='Shared'&&l.shared))&&(`${l.name} ${l.title} ${l.body}`.toLowerCase().includes(search.toLowerCase()))),[letters,filter,search]);
 const persist=(next)=>{setLetters(next);localStorage.setItem('lth-letters',JSON.stringify(next));};
 const saveDraft=()=>{if(!draft.name||!draft.body.trim())return; const n={id:Date.now(),name:draft.name,title:draft.title||`To ${draft.name}`,date:new Date().toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}),status:'Kept',tags:['new'],body:draft.body,shared:false,candle:false}; const next=[n,...letters];persist(next);setSelected(n.id);setCompose(false);setDraft({name:'',title:'',body:''});};
 const lightCandle=()=>{if(!active)return;persist(letters.map(l=>l.id===active.id?{...l,candle:true,tags:Array.from(new Set([...l.tags,'candle']))}:l));};
 const askAI=async()=>{if(!draft.body.trim())return;setAiBusy(true);try{const r=await fetch('/api/reflect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:draft.body,name:draft.name})});const j=await r.json();if(j.text)setDraft(d=>({...d,body:j.text}));}catch(e){console.error(e)}finally{setAiBusy(false)}};
 return <div className="app">
  <aside className="sidebar">
   <div className="brand"><span className="star">✦</span><div><div className="brandTitle">Letters to Heaven</div><div className="brandSub">A QUIET PLACE FOR WHAT REMAINS</div></div></div>
   <div className="vault"><span>VAULT</span><span>{letters.length} letters</span></div>
   <input className="search" placeholder="Search names, feelings…" value={search} onChange={e=>setSearch(e.target.value)}/>
   <div className="filters">{['All','Kept close','Released','Shared'].map(x=><button className={filter===x?'pill active':'pill'} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div>
   <div className="sideCard"><div className="eyebrow">UPCOMING</div><b>Dad’s anniversary</b><span>in 26 days</span><button>Open →</button></div>
   <div className="eyebrow remembering">REMEMBERING</div><div className="names">{[...new Set(letters.map(l=>l.name))].map(n=><button key={n} onClick={()=>{const x=letters.find(l=>l.name===n);if(x)setSelected(x.id)}}>{n}</button>)}</div>
   <div className="sideCard empty"><b>{visible.length?'Your vault is ready.':'No letters in this view.'}</b><span>{visible.length?'Choose a letter or write something new.':'Try another filter or write something new.'}</span><button onClick={()=>setCompose(true)}>Write a letter</button></div>
   <div className="trust">Share this space with someone you trust.<br/><small>Private by default. Shared letters only appear if you choose. No tracking, no counts.</small></div>
  </aside>
  <main className="main">
   <header className="top"><div><h1>Letters to Heaven</h1><p>Words for the people and memories we carry.</p></div><div className="actions"><button onClick={lightCandle}>🕯 {letters.filter(l=>l.candle).length}</button><button>Share</button><button className="primary" onClick={()=>setCompose(true)}>Write</button></div></header>
   <section className="content">
    {active?<>
    <article className="letter">
      <div className="letterMeta"><span>{active.date.toUpperCase()} • {active.status.toUpperCase()}</span><div className="badges">{active.shared&&<i>Shared</i>}{active.candle&&<i>Candle lit</i>}</div></div>
      <div className="letterHead"><div><h2>{active.title}</h2><div className="tags">{active.tags.map(t=><span key={t}>{t}</span>)}</div></div><div className="keepsake">hydrangeas<br/><small>a memory kept close</small></div></div>
      <div className="letterBody">{active.body.split('\n').map((p,i)=>p?<p key={i}>{p}</p>:<div className="gap" key={i}/>)}</div>
      <div className="footerMeta">M &nbsp; {active.date} &nbsp; • &nbsp; {active.candle?'candle lit':'vault'} &nbsp; • &nbsp; keepsake</div>
    </article>
    <div className="candleStrip"><div><span className="flame">✦</span><div><b>CANDLES LIT • {letters.filter(l=>l.candle).length}</b><span>{active.name}</span></div></div><button onClick={lightCandle}>{active.candle?'Candle lit':'Light a candle'}</button></div>
    <div className="privacy">Your letters are private and stay on this device. Nothing is sent, stored, or shared without you choosing.<br/><span>If grief feels overwhelming, consider reaching out to a trusted person or local support resources — you don’t have to hold this alone.</span></div>
    </>:<div className="noLetters">No letters in this view.</div>}
   </section>
  </main>
  {compose&&<div className="modal"><div className="composer"><button className="close" onClick={()=>setCompose(false)}>×</button><div className="eyebrow">WRITE A LETTER</div><h2>A few words are enough.</h2><input placeholder="Who are you writing to?" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/><input placeholder="Title (optional)" value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/><textarea rows="10" placeholder="Write whatever needs to be said…" value={draft.body} onChange={e=>setDraft({...draft,body:e.target.value})}/><div className="composeActions"><button onClick={askAI} disabled={aiBusy||!draft.body}>{aiBusy?'Reflecting…':'Help me find the words'}</button><button className="primary" onClick={saveDraft}>Keep this letter</button></div><small>AI reflection is optional. Your draft stays on this device unless you choose to send it to the AI helper.</small></div></div>}
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
