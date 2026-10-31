// Presentation-only enhancement; product data and existing interactions stay in script.js.
document.addEventListener('DOMContentLoaded',()=>{
  const descriptions=[
    '嚴選台灣在地小農土鳳梨，慢火熬煮酸甜鳳梨餡，搭配法國奶油酥皮，入口散發濃郁奶香與自然果酸層次。',
    '選用紅心鹹蛋黃搭配細緻烏豆沙餡，外層酥皮層層酥脆，鹹甜交織是經典中式節慶點心的代表。'
  ];
  document.querySelectorAll('.product-fullscreen-section').forEach((section,i)=>{
    section.classList.remove('dark-section');
    const content=section.querySelector('.product-fullscreen-content');
    const p=document.createElement('p');p.className='preview-product-desc';p.textContent=descriptions[i]||'';
    content.querySelector('.product-fullscreen-name').after(p);
    const link=document.createElement('span');link.className='preview-product-link';link.textContent='探索這款甜點　↗';content.appendChild(link);
    const note=document.createElement('span');note.className='preview-product-note';note.textContent=i===0?'素材示意，非正式商品攝影':'商品攝影準備中';content.appendChild(note);
  });
});
