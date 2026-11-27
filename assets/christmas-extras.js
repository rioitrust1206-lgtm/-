function christmasCountdown(now = Date.now()) {
  const day = new Date(now + 8 * 3600000);
  const year = day.getUTCFullYear();
  const start = Date.UTC(year, 11, 24, 16);
  if (now >= start && now < start + 86400000) return { christmas: true, year };
  const target = now < start ? start : Date.UTC(year + 1, 11, 24, 16);
  let seconds = Math.max(0, Math.ceil((target - now) / 1000));
  const days = Math.floor(seconds / 86400); seconds %= 86400;
  const hours = Math.floor(seconds / 3600); seconds %= 3600;
  const minutes = Math.floor(seconds / 60); seconds %= 60;
  return { christmas: false, year: now < start ? year : year + 1, days, hours, minutes, seconds };
}
if (typeof module !== 'undefined') module.exports = { christmasCountdown };
if (typeof document !== 'undefined') (() => {
  const repo = 'rioitrust1206-lgtm/-';
  const prefix = '[圣诞留言]';
  const style = document.createElement('style');
  style.textContent = `
  .christmas-clock{position:fixed;right:24px;top:24px;z-index:21;text-align:center;padding:14px 20px;border:1px solid #ffd98a55;border-radius:18px;background:#0c1122cc;color:#ffe4ad;backdrop-filter:blur(12px);pointer-events:none}.christmas-clock p{margin:0 0 5px;font-size:14px;letter-spacing:.08em}.christmas-clock strong{font-size:22px;font-variant-numeric:tabular-nums;letter-spacing:.04em}.wish-dialog{position:fixed;inset:0;z-index:70;margin:auto;width:min(560px,calc(100% - 28px));height:min(700px,calc(100dvh - 32px));border:1px solid #ffd98a66;border-radius:22px;background:#0c1122;color:#ffe4ad;padding:22px;box-sizing:border-box;box-shadow:0 0 0 100vmax #000a;overflow:auto;font-size:16px}.wish-dialog[hidden]{display:none}.wish-top{display:flex;align-items:center;justify-content:space-between;gap:12px}.wish-top h2{font-size:24px;margin:0}.wish-note{color:#d0c4ae;line-height:1.6;font-size:14px}.wish-form label{display:block;margin:12px 0 8px}.wish-form textarea{display:block;box-sizing:border-box;width:100%;min-height:110px;resize:vertical;border:1px solid #ffd98a66;border-radius:12px;padding:12px;background:#172038;color:white;font:inherit}.wish-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}.wish-status{font-size:14px;line-height:1.6;color:#ddd1bb}.wish-entry{padding:14px 0;border-top:1px solid #ffd98a33}.wish-entry p{white-space:pre-wrap;overflow-wrap:anywhere;color:#f5ead7;line-height:1.65;margin:8px 0}.wish-entry a{color:#ffe4ad;text-decoration:underline}.wish-entry time{font-size:13px;color:#c0b69f;margin-left:8px}.wish-title{font-size:17px;margin:22px 0 12px}@media(max-width:640px){.christmas-clock{top:144px;left:20px;right:auto;padding:10px 14px}.christmas-clock strong{font-size:18px}.christmas-clock p{font-size:13px}.wish-dialog{padding:18px}.view-controls{gap:6px}.view-controls .view-button{padding:8px 11px}}
  `;
  document.head.append(style);
  const clock = document.createElement('aside'); clock.className = 'christmas-clock';
  clock.setAttribute('aria-label', '圣诞节倒计时（中国时间）');
  const label = document.createElement('p'), digits = document.createElement('strong'); clock.append(label, digits); document.body.append(clock);
  function tick() { const c = christmasCountdown(); label.textContent = c.christmas ? `${c.year} · 圣诞快乐` : `距离 ${c.year} 圣诞节 · 中国时间`; digits.textContent = c.christmas ? '愿你的心愿都实现' : `${c.days}天 ${String(c.hours).padStart(2,'0')}时 ${String(c.minutes).padStart(2,'0')}分 ${String(c.seconds).padStart(2,'0')}秒`; }
  tick(); setInterval(tick,1000);
  const panel = document.createElement('section'); panel.className = 'wish-dialog'; panel.hidden = true; panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true'); panel.setAttribute('aria-labelledby','wish-heading');
  panel.innerHTML = `<div class="wish-top"><h2 id="wish-heading">留下圣诞祝福</h2><button type="button" class="view-button" data-close>关闭</button></div><p class="wish-note">留言公开展示给所有访客。发布时会打开 GitHub，请登录并确认提交；提交后回来刷新留言即可看到。</p><form class="wish-form"><label for="christmas-wish">想说的话</label><textarea id="christmas-wish" maxlength="1000" required placeholder="愿这个圣诞节，温暖与你同在…"></textarea><div class="wish-actions"><button class="view-button" type="submit">前往 GitHub 发布</button><button class="view-button" type="button" data-refresh>刷新留言</button></div></form><p class="wish-status" role="status"></p><h3 class="wish-title">大家的祝福</h3><div data-messages></div>`;
  document.body.append(panel);
  const input = panel.querySelector('textarea'), status = panel.querySelector('[role=status]'), list = panel.querySelector('[data-messages]'), refresh = panel.querySelector('[data-refresh]');
  let opener, busy=false;
  function close(){panel.hidden=true;opener?.focus()}
  panel.querySelector('[data-close]').addEventListener('click',close);
  panel.addEventListener('keydown',ev=>{if(ev.key==='Escape')close();if(ev.key==='Tab'){const items=[...panel.querySelectorAll('button:not(:disabled),textarea,a[href]')];if(ev.shiftKey&&document.activeElement===items[0]){ev.preventDefault();items.at(-1).focus()}else if(!ev.shiftKey&&document.activeElement===items.at(-1)){ev.preventDefault();items[0].focus()}}});
  async function loadMessages(){
    if(busy)return;busy=true;refresh.disabled=true;status.textContent='正在读取公开留言…';
    try {
      const response=await fetch(`https://api.github.com/repos/${repo}/issues?state=all&sort=created&direction=desc&per_page=100`,{headers:{Accept:'application/vnd.github+json'}});
      if(!response.ok)throw new Error(response.status===403||response.status===429?'读取次数暂时达到上限，请稍后再试。':'暂时无法连接 GitHub。');
      const data=await response.json();const messages=data.filter(x=>!x.pull_request&&x.title.startsWith(prefix)).slice(0,30);
      list.replaceChildren();for(const message of messages){
        const entry=document.createElement('article');entry.className='wish-entry';const author=document.createElement('strong');author.textContent=message.user.login;const date=document.createElement('time');date.dateTime=message.created_at;date.textContent=new Date(message.created_at).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'});
        const body=document.createElement('p');body.textContent=message.body||message.title.slice(prefix.length);const link=document.createElement('a');link.href=`https://github.com/${repo}/issues/${message.number}`;link.target='_blank';link.rel='noopener noreferrer';link.textContent='查看原留言';entry.append(author,date,body,link);list.append(entry);
      }
      status.textContent=messages.length?'已显示最近的公开留言。':'还没有留言，写下第一份圣诞祝福吧。';
    } catch(error){status.textContent=error.message+' 你也可以稍后重试。'}
    finally{busy=false;refresh.disabled=false}
  }
  refresh.addEventListener('click',loadMessages);
  panel.querySelector('form').addEventListener('submit',ev=>{ev.preventDefault();const body=input.value.trim();if(!body){input.focus();return}const url=new URL(`https://github.com/${repo}/issues/new`);url.searchParams.set('title',prefix+' '+body.replace(/\s+/g,' ').slice(0,60));url.searchParams.set('body',body);window.open(url.href,'_blank','noopener,noreferrer');status.textContent='请在新页面确认提交留言，然后回来点击“刷新留言”。'});
  function mount(){const nav=document.querySelector('.view-controls');if(!nav)return false;const button=document.createElement('button');button.className='view-button';button.type='button';button.textContent='留言';button.addEventListener('click',()=>{opener=button;panel.hidden=false;input.focus();loadMessages()});nav.append(button);return true}
  if(!mount()){const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});observer.observe(document.getElementById('root'),{childList:true,subtree:true})}
})();

