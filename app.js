/* file:// で開けるよう、通信・モジュール読込を使用しません。 */
const folderSeparator=' / ';
const folders=[...new Set(documents.flatMap(doc=>{
 const parts=doc.group.split(folderSeparator);
 return parts.map((_,index)=>parts.slice(0,index+1).join(folderSeparator));
}))].sort((a,b)=>a.localeCompare(b,'ja'));
const inFolder=(doc,folder)=>!folder||doc.group===folder||doc.group.startsWith(folder+' / ');
let selected=null,query='';
const el=id=>document.getElementById(id);
const normalize=value=>value.normalize('NFKC').toLocaleLowerCase('ja');
function renderFolders(restoreFocus){
 const navigation=el('categories');
 navigation.replaceChildren();
 const selectedParts=selected?selected.split(folderSeparator):[];
 const levels=['',...selectedParts.map((_,index)=>selectedParts.slice(0,index+1).join(folderSeparator))];
 for(const parent of levels){
  const folderDepth=parent?parent.split(folderSeparator).length+1:1;
  const children=folders.filter(folder=>folder.split(folderSeparator).length===folderDepth&&(!parent||folder.startsWith(parent+folderSeparator)));
  if(!children.length)continue;
  const row=document.createElement('div');
  row.className=parent?'folder-row folder-row-nested':'folder-row';
  row.setAttribute('role','group');
  row.setAttribute('aria-label',parent?parent+'のフォルダー':'資料の分類');
  navigation.append(row);
  for(const folder of parent?children:['',...children]){
   const button=document.createElement('button');
   button.type='button';
   button.textContent=folder.split(folderSeparator).at(-1)||'すべて';
   button.setAttribute('aria-pressed',String(folder?selected===folder||selected?.startsWith(folder+folderSeparator):selected===folder));
   const count=document.createElement('small');
   count.textContent=documents.filter(doc=>inFolder(doc,folder)).length;
   button.append(count);
   button.onclick=()=>{selected=selected===folder?null:folder;render(folder)};
   row.append(button);
   if(restoreFocus===folder)button.focus();
  }
 }
}
function render(restoreFocus=null){
 renderFolders(restoreFocus);
 const words=normalize(query).split(/\s+/).filter(Boolean);
 const showResults=selected!==null||words.length>0;
 el('total').textContent=`収録資料 ${documents.length}件`;
 el('result-head').hidden=!showResults;
 el('results').hidden=!showResults;
 el('results').replaceChildren();
 if(!showResults)return;
 const filtered=documents.filter(d=>inFolder(d,selected)&&words.every(word=>normalize(d.title+' '+d.sections.map(s=>s.lines.join(' ')).join(' ')).includes(word)));
 el('current-category').textContent=selected||'すべての資料';el('count').textContent=`${filtered.length}件${query?'（検索結果）':''}`;
 if(!filtered.length){const box=document.createElement('div');box.className='empty';const heading=document.createElement('p');heading.textContent=query?'該当する資料がありません':'資料はまだ登録されていません';const note=document.createElement('p');note.textContent=query?'別のキーワードや分類でお探しください。':'資料を追加すると、ここに表示されます。';box.append(heading,note);el('results').append(box)}
 let previousGroup;
 filtered.sort((a,b)=>a.group.localeCompare(b.group,'ja')||a.title.localeCompare(b.title,'ja')).forEach(d=>{if(d.group!==previousGroup){const heading=document.createElement('h4');heading.className='folder-heading';heading.textContent=d.group;el('results').append(heading);previousGroup=d.group}const article=document.createElement('article');article.className='document';const content=document.createElement('div');const label=document.createElement('p');label.textContent=d.group;const title=document.createElement('h4');title.textContent=d.title;const note=document.createElement('p');note.textContent=d.description;content.append(label,title,note);const link=document.createElement('a');link.href='#document/'+d.id;link.textContent='資料を開く →';link.setAttribute('aria-label',d.title+'を開く');article.append(content,link);el('results').append(article)});
}
function setDocumentPreview(doc) {
 const source = doc.html ?? doc.pdf;
 const link = el('pdf-link');
 const preview = el('pdf-view');
 link.href = source;
 link.textContent = doc.html ? '資料を別画面で開く' : 'PDFを別画面で開く';
 preview.title = doc.html ? doc.title : '資料のPDFプレビュー';
 preview.src = source;
}
function route(){const id=location.hash.startsWith('#document/')?location.hash.slice(10):'';const doc=documents.find(d=>d.id===id);el('detail').hidden=!doc;document.querySelector('.intro').hidden=!!doc;document.querySelector('.library').hidden=!!doc;if(!doc){el('pdf-view').removeAttribute('src');render();return}el('document-title').textContent=doc.title;el('document-category').textContent=doc.group;el('document-note').textContent=doc.description;setDocumentPreview(doc);el('transcript').hidden=!doc.sections.length;el('transcript').open=false;el('document-body').replaceChildren();doc.sections.forEach(s=>{const section=document.createElement('section');const h=document.createElement('h3');h.textContent=s.title;section.append(h);s.lines.forEach(line=>{const p=document.createElement('p');p.textContent=line;section.append(p)});el('document-body').append(section)});el('document-title').focus();window.scrollTo(0,0)}
el('search-form').onsubmit=event=>{event.preventDefault();query=el('search').value.trim();render()};el('search').oninput=()=>{query=el('search').value.trim();render()};el('back').onclick=()=>{location.hash='';};window.addEventListener('hashchange',route);route();
