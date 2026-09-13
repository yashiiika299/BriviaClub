import './app.css';
import './inbox.css';
import './profile-photo.css';
import { supabase, rowToProfile, saveProfile, loadLoginCredentials } from './supabase.js';
 

// Never render cached profile data as the current user. The authenticated
// Supabase session is the source of truth; cached data is used only for the
// current user's one-time password display after session verification.
let memberProfile = {};
/*
  name: 'New Member', email: 'member@brivia.club', city: 'Your city', state: 'Your state', skills: '', lookingFor: '', experience: '', loginPassword: '—',
};
*/

let people = [];
let remoteMatchIds = [];

let currentIndex = 0;
let currentPerson = people[0];
let activeFilter = 'all';
let activeChatFilter = 'all';
let chatSearchQuery = '';
let selectedChat = null;
let pitchPerson = null;
const chatMessages = {};
const readChatIds = new Set();
let messageSyncTimer = null;
const overlayIds = ['info-modal', 'pitch-modal'];

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const initials = (name = 'New Member') => name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const showToast = (message) => {
  const toast = document.querySelector('#app-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
};

const setView = (view) => {
  document.querySelectorAll('[data-view]').forEach((section) => {
    const isActive = section.dataset.view === view;
    section.hidden = !isActive;
    section.classList.toggle('is-active', isActive);
  });
  document.querySelectorAll('[data-nav]').forEach((button) => button.classList.toggle('is-active', button.dataset.nav === view));
  if (view === 'explore') renderExplore();
  if (view === 'chat') renderChats();
  if (view === 'profile') renderProfile();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const validViews = ['home', 'explore', 'chat', 'profile'];
const routeFromUrl = () => {
  const view = new URLSearchParams(window.location.search).get('view') || window.location.hash.slice(1);
  if (validViews.includes(view)) setView(view);
};

const renderAvatar = (person, className = 'mini-avatar') => person?.image ? `<div class="${className}"><img src="${person.image}" alt="${escapeHtml(person.name)}" /></div>` : `<div class="${className}">${escapeHtml(initials(person?.name))}</div>`;

const renderHome = () => {
  const card = document.querySelector('#swipe-card');
  const actions = document.querySelector('.swipe-actions');
  const hint = document.querySelector('.swipe-hint');
  let emptyState = document.querySelector('#home-empty-state');
  if (!emptyState && card?.parentElement) {
    emptyState = document.createElement('p');
    emptyState.id = 'home-empty-state';
    emptyState.className = 'empty-state';
    emptyState.textContent = 'No members in the community yet.';
    card.parentElement.append(emptyState);
  }
  if (!currentPerson) {
    card?.setAttribute('hidden', '');
    actions?.setAttribute('hidden', '');
    hint?.setAttribute('hidden', '');
    emptyState?.removeAttribute('hidden');
    const count = document.querySelector('#queue-count'); if (count) count.textContent = '00 / 00';
    return;
  }
  card?.removeAttribute('hidden');
  actions?.removeAttribute('hidden');
  hint?.removeAttribute('hidden');
  emptyState?.setAttribute('hidden', '');
  const image = document.querySelector('#swipe-image');
  if (image) { image.src = currentPerson.image || ''; image.alt = `${currentPerson.name} profile`; }
  const name = document.querySelector('#swipe-name'); if (name) name.textContent = currentPerson.name;
  const age = document.querySelector('#swipe-age'); if (age) age.textContent = currentPerson.age;
  const role = document.querySelector('#swipe-role'); if (role) role.textContent = currentPerson.role;
  const location = document.querySelector('#swipe-location'); if (location) location.textContent = `${currentPerson.city} · ${currentPerson.distance}`;
  const tags = document.querySelector('#swipe-tags'); if (tags) tags.innerHTML = currentPerson.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const count = document.querySelector('#queue-count'); if (count) count.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(people.length).padStart(2, '0')}`;
  card?.classList.remove('is-passing', 'is-liking');
};

const saveMatches = async (person) => {
  if (!supabase || !memberProfile.id || !person?.id) return false;
  const { error } = await supabase.from('matches').upsert({ user1_id: memberProfile.id, user2_id: person.id }, { onConflict: 'user1_id,user2_id' });
  if (error) {
    console.warn('Match could not be saved:', error.message);
    return false;
  }
  if (!remoteMatchIds.includes(person.id)) remoteMatchIds.push(person.id);
  renderChats();
  return true;
};

const openOverlay = (id) => document.querySelector(`#${id}`)?.removeAttribute('hidden');
const closeOverlays = () => overlayIds.forEach((id) => document.querySelector(`#${id}`)?.setAttribute('hidden', ''));

const fillInfo = (person) => {
  const avatar = document.querySelector('#info-avatar');
  if (avatar) avatar.innerHTML = person.image ? `<img src="${person.image}" alt="${escapeHtml(person.name)}" />` : escapeHtml(initials(person.name));
  const infoName = document.querySelector('#info-name'); if (infoName) infoName.textContent = `${person.name}, ${person.age}`;
  const infoRole = document.querySelector('#info-role'); if (infoRole) infoRole.textContent = `${person.role} · ${person.city}`;
  const infoBio = document.querySelector('#info-bio'); if (infoBio) infoBio.textContent = person.bio;
  const facts = document.querySelector('#info-facts'); if (facts) facts.innerHTML = `<div><span>BASED IN</span><strong>${escapeHtml(person.city)}</strong></div><div><span>INTERESTED IN</span><strong>${escapeHtml(person.tags[0])}</strong></div>`;
  const tags = document.querySelector('#info-tags'); if (tags) tags.innerHTML = person.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
};

const openPitch = (person) => {
  pitchPerson = person;
  const pitchName = document.querySelector('#pitch-name'); if (pitchName) pitchName.textContent = person.name;
  const pitchMessage = document.querySelector('#pitch-message'); if (pitchMessage) pitchMessage.value = `Hey ${person.name}, I noticed we both care about ${person.tags[0].toLowerCase()}. Would love to connect and exchange ideas.`;
  openOverlay('pitch-modal');
  window.setTimeout(() => pitchMessage?.focus(), 80);
};

const swipe = (type) => {
  if (!currentPerson) return;
  const card = document.querySelector('#swipe-card');
  card?.classList.add(type === 'like' ? 'is-liking' : 'is-passing');
  if (type === 'like') { saveMatches(currentPerson); openPitch(currentPerson); }
  window.setTimeout(() => { currentIndex += 1; currentPerson = people[currentIndex] || people[0]; if (currentIndex >= people.length) currentIndex = 0; renderHome(); }, 280);
};

const renderExplore = () => {
  const query = (document.querySelector('#explore-search-input')?.value || '').trim().toLowerCase();
  const list = document.querySelector('#explore-list');
  const filtered = people.filter((person) => {
    const matchesFilter = activeFilter === 'all' || person.filters.some((filter) => filter.includes(activeFilter));
    const haystack = `${person.name} ${person.role} ${person.city} ${person.state || ''} ${person.experience || ''} ${person.email || ''} ${person.phone || ''} ${person.skills || ''} ${person.lookingFor || ''} ${person.tags.join(' ')}`.toLowerCase();
    return matchesFilter && haystack.includes(query);
  });
  if (list) list.innerHTML = filtered.length ? filtered.map((person) => `<article class="explore-row"><div class="explore-row-avatar">${renderAvatar(person)}</div><div class="explore-row-copy"><strong>${escapeHtml(person.name)}, ${person.age}</strong><span>${escapeHtml(person.role)} · ${escapeHtml(person.city)}</span><div class="explore-row-tags">${person.tags.slice(0, 2).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div></div><button class="row-action" data-profile-id="${person.id}">VIEW ↗</button></article>`).join('') : '<p class="empty-state">No people match that search yet. Try another filter.</p>';
  document.querySelector('#explore-count').textContent = `${String(filtered.length).padStart(2, '0')} PEOPLE`;
  list?.querySelectorAll('[data-profile-id]').forEach((button) => button.addEventListener('click', () => { const person = people.find((item) => item.id === button.dataset.profileId); if (person) { fillInfo(person); openOverlay('info-modal'); } }));
};

const ensureInboxControls = () => {
  const chatView = document.querySelector('[data-view="chat"]');
  const layout = chatView?.querySelector('.chat-layout');
  if (!chatView || !layout || chatView.querySelector('#inbox-toolbar')) return;
  const heading = chatView.querySelector('.view-heading h1');
  const headingCopy = chatView.querySelector('.view-heading>p:last-child');
  if (heading) heading.textContent = 'Inbox';
  if (headingCopy) headingCopy.textContent = 'Keep every introduction in one place.';
  const toolbar = document.createElement('div');
  toolbar.className = 'inbox-toolbar';
  toolbar.id = 'inbox-toolbar';
  toolbar.innerHTML = '<label class="inbox-search"><span>⌕</span><input id="chat-search" type="search" placeholder="Search conversations..." autocomplete="off" /></label><div class="inbox-tabs" role="tablist" aria-label="Inbox filters"><button class="inbox-tab is-active" type="button" data-chat-filter="all">ALL</button><button class="inbox-tab" type="button" data-chat-filter="unread">UNREAD</button></div>';
  layout.before(toolbar);
  toolbar.querySelector('#chat-search')?.addEventListener('input', (event) => { chatSearchQuery = event.target.value; renderChats(); });
  toolbar.querySelectorAll('[data-chat-filter]').forEach((button) => button.addEventListener('click', () => { activeChatFilter = button.dataset.chatFilter; toolbar.querySelectorAll('[data-chat-filter]').forEach((item) => item.classList.toggle('is-active', item === button)); renderChats(); }));
};

const formatChatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const renderChats = () => {
  ensureInboxControls();
  const conversations = people.filter((person) => remoteMatchIds.includes(person.id));
  const query = chatSearchQuery.trim().toLowerCase();
  const matches = conversations.filter((person) => {
    const last = chatMessages[person.id]?.at(-1);
    const unread = last?.from === 'them' && !readChatIds.has(person.id);
    const haystack = `${person.name} ${person.email || ''} ${person.phone || ''} ${person.city} ${person.state || ''} ${person.role} ${person.experience || ''} ${person.skills || ''} ${person.lookingFor || ''} ${last?.text || ''}`.toLowerCase();
    return (!query || haystack.includes(query)) && (activeChatFilter !== 'unread' || unread);
  });
  const list = document.querySelector('#chat-list');
  if (list) list.innerHTML = `<div class="inbox-panel-head"><strong>Messages</strong><span>${conversations.length}</span></div>${matches.length ? matches.map((person) => {
    const last = chatMessages[person.id]?.at(-1);
    const unread = last?.from === 'them' && !readChatIds.has(person.id);
    return `<button class="chat-row${unread ? ' is-unread' : ''}${selectedChat?.id === person.id ? ' is-selected' : ''}" type="button" data-chat-id="${escapeHtml(person.id)}">${renderAvatar(person)}<span class="chat-row-copy"><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(last?.text || 'Start a conversation')}</span></span><span class="chat-row-meta"><time>${escapeHtml(formatChatTime(last?.createdAt))}</time>${unread ? '<b>1</b>' : ''}</span></button>`;
  }).join('') : '<div class="inbox-empty"><strong>No conversations found</strong><span>Send a pitch or wait for a reply to start an inbox thread.</span></div>'}`;
  document.querySelector('#chat-count').textContent = `${String(conversations.length).padStart(2, '0')} CONVERSATIONS`;
  document.querySelector('#chat-badge').textContent = conversations.length;
  list?.querySelectorAll('[data-chat-id]').forEach((button) => button.addEventListener('click', () => openChat(matches.find((person) => person.id === button.dataset.chatId))));
};

const loadChatMessages = async (person) => {
  if (!supabase || !memberProfile.id || !person?.id) return;
  let { data, error } = await supabase.from('brivia_messages').select('id,sender_id,recipient_id,body,created_at').or(`and(sender_id.eq.${memberProfile.id},recipient_id.eq.${person.id}),and(sender_id.eq.${person.id},recipient_id.eq.${memberProfile.id})`);
  if (error && error.message?.toLowerCase().includes('created_at')) {
    ({ data, error } = await supabase.from('brivia_messages').select('id,sender_id,recipient_id,body').or(`and(sender_id.eq.${memberProfile.id},recipient_id.eq.${person.id}),and(sender_id.eq.${person.id},recipient_id.eq.${memberProfile.id})`));
  }
  if (!error) {
    chatMessages[person.id] = (data || []).sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()).map((message) => ({ id: message.id, createdAt: message.created_at, from: message.sender_id === memberProfile.id ? 'me' : 'them', text: message.body }));
    renderMessages();
  } else console.warn('Messages could not load:', error.message);
};

const appendRemoteMessage = (message) => {
  if (!message?.id || !memberProfile.id) return;
  if (message.sender_id !== memberProfile.id && message.recipient_id !== memberProfile.id) return;
  const otherId = message.sender_id === memberProfile.id ? message.recipient_id : message.sender_id;
  const messages = (chatMessages[otherId] ||= []);
  if (messages.some((item) => item.id === message.id)) return;
  messages.push({ id: message.id, createdAt: message.created_at, from: message.sender_id === memberProfile.id ? 'me' : 'them', text: message.body });
  if (message.sender_id !== memberProfile.id) readChatIds.delete(otherId);
  renderChats();
  if (selectedChat?.id === otherId) renderMessages();
};

const subscribeToMessages = () => {
  if (!supabase || !memberProfile.id) return;
  supabase
    .channel(`brivia-messages-${memberProfile.id}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'brivia_messages' }, ({ new: message }) => appendRemoteMessage(message))
    .subscribe((status) => { if (status === 'CHANNEL_ERROR') console.warn('Realtime messages channel could not connect.'); });
};

const startMessageSync = () => {
  if (messageSyncTimer) window.clearInterval(messageSyncTimer);
  messageSyncTimer = window.setInterval(() => {
    if (selectedChat) loadChatMessages(selectedChat);
  }, 2500);
};

const openChat = (person) => {
  if (!person) return;
  selectedChat = person;
  readChatIds.add(person.id);
  const list = document.querySelector('#chat-list'); const windowPanel = document.querySelector('#chat-window');
  if (list) list.hidden = true; windowPanel?.removeAttribute('hidden');
  const avatar = document.querySelector('#chat-avatar'); if (avatar) avatar.innerHTML = person.image ? `<img src="${person.image}" alt="${escapeHtml(person.name)}" />` : escapeHtml(initials(person.name));
  document.querySelector('#chat-name').textContent = person.name;
  renderChats();
  if (!chatMessages[person.id]) chatMessages[person.id] = [];
  renderMessages();
  loadChatMessages(person);
};

const renderMessages = () => {
  const messages = document.querySelector('#chat-messages'); if (!messages || !selectedChat) return;
  messages.innerHTML = (chatMessages[selectedChat.id] || []).map((message) => `<div class="message ${message.from === 'me' ? 'me' : 'them'}">${escapeHtml(message.text)}</div>`).join('');
  messages.scrollTop = messages.scrollHeight;
};

const ensureProfilePhotoEditor = () => {
  const hero = document.querySelector('.profile-hero');
  if (!hero || document.querySelector('#profile-photo-editor')) return;
  const editor = document.createElement('label');
  editor.id = 'profile-photo-editor';
  editor.className = 'profile-photo-editor';
  editor.innerHTML = '<span>CHANGE PHOTO</span><input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.heic,.heif,.bmp,.tif,.tiff" />';
  hero.append(editor);
  editor.querySelector('input')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file || !supabase || !memberProfile.id) return;
    editor.classList.add('is-saving');
    editor.querySelector('span').textContent = 'SAVING...';
    const { data, error } = await saveProfile(memberProfile.id, memberProfile, file);
    editor.classList.remove('is-saving');
    editor.querySelector('span').textContent = 'CHANGE PHOTO';
    if (error) { showToast(`Photo could not be saved: ${error.message}`); return; }
    memberProfile = { ...memberProfile, ...rowToProfile(data || {}), id: memberProfile.id };
    window.localStorage.setItem('brivia-member-profile', JSON.stringify(memberProfile));
    renderProfile();
    showToast('Profile photo updated.');
  });
};

const renderProfile = () => {
  const profile = memberProfile;
  ensureProfilePhotoEditor();
  document.querySelector('#profile-name').textContent = profile.name || 'New Member';
  document.querySelector('#profile-location').textContent = `${profile.city || 'Your city'}, ${profile.state || 'Your state'}`;
  const avatar = document.querySelector('#profile-avatar');
  if (avatar) avatar.innerHTML = profile.photoUrl ? `<img src="${profile.photoUrl}" alt="${escapeHtml(profile.name)}" />` : escapeHtml(initials(profile.name));
  if (avatar && profile.photoName) avatar.title = profile.photoName;
  document.querySelector('#profile-email').textContent = profile.email || '—';
  document.querySelector('#profile-login').textContent = profile.email || '—';
  document.querySelector('#profile-login-email').textContent = profile.email || '—';
  document.querySelector('#profile-password').textContent = profile.loginPassword || '—';
  document.querySelector('#profile-phone').textContent = profile.phone || '—';
  document.querySelector('#profile-experience').textContent = profile.experience || '—';
  const skills = (profile.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);
  document.querySelector('#profile-skills').innerHTML = skills.length ? skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join('') : '<span>No skills added yet</span>';
  document.querySelector('#profile-looking').textContent = profile.lookingFor || 'Add your intentions to find better connections.';
};

document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', (event) => {
  if (!validViews.includes(button.dataset.nav)) return;
  if (button.tagName === 'A') return;
  setView(button.dataset.nav);
}));
window.addEventListener('popstate', routeFromUrl);
window.addEventListener('hashchange', routeFromUrl);
document.querySelector('[data-action="pass"]')?.addEventListener('click', () => swipe('pass'));
document.querySelector('[data-action="like"]')?.addEventListener('click', () => swipe('like'));
document.querySelector('[data-action="full-info"]')?.addEventListener('click', () => { fillInfo(currentPerson); openOverlay('info-modal'); });
document.querySelectorAll('[data-close-overlay]').forEach((button) => button.addEventListener('click', closeOverlays));
document.querySelectorAll('.filter-button').forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('is-active', item === button)); renderExplore(); }));
document.querySelector('#explore-search-input')?.addEventListener('input', renderExplore);
document.querySelector('#chat-back')?.addEventListener('click', () => { document.querySelector('#chat-window').setAttribute('hidden', ''); document.querySelector('#chat-list').removeAttribute('hidden'); renderChats(); });
document.querySelector('#chat-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = document.querySelector('#chat-input');
  if (!selectedChat || !input.value.trim() || !supabase || !memberProfile.id) return;
  const body = input.value.trim();
  const { error } = await supabase.from('brivia_messages').insert({ sender_id: memberProfile.id, recipient_id: selectedChat.id, body });
  if (error) { showToast('Message could not be saved.'); return; }
  input.value = '';
  await loadChatMessages(selectedChat);
});
document.querySelector('#pitch-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const target = pitchPerson || currentPerson;
  const input = document.querySelector('#pitch-message');
  const body = input?.value.trim();
  if (!target || !body || !supabase || !memberProfile.id) return;
  const matchSaved = await saveMatches(target);
  if (!matchSaved) console.warn('Match row was not saved; continuing with the chat message.');
  const { error } = await supabase.from('brivia_messages').insert({ sender_id: memberProfile.id, recipient_id: target.id, body });
  if (error) { showToast(`Pitch could not be saved: ${error.message}`); return; }
  if (!remoteMatchIds.includes(target.id)) remoteMatchIds.push(target.id);
  renderChats();
  await loadChatMessages(target);
  closeOverlays();
  showToast(`Pitch sent to ${target.name}.`);
  pitchPerson = null;
});
document.querySelector('[data-copy-profile="password"]')?.addEventListener('click', async (event) => { try { await navigator.clipboard.writeText(memberProfile.loginPassword || ''); event.currentTarget.textContent = 'COPIED'; window.setTimeout(() => { event.currentTarget.textContent = 'COPY PASSWORD'; }, 1600); } catch { showToast('Select the password to copy it.'); } });
document.querySelector('#logout-button')?.addEventListener('click', async () => { if (supabase) await supabase.auth.signOut(); window.localStorage.removeItem('brivia-member-profile'); window.location.href = '/auth.html'; });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeOverlays(); if (event.key === 'ArrowRight') swipe('like'); if (event.key === 'ArrowLeft') swipe('pass'); });

const loadSupabaseCommunity = async () => {
  if (!supabase) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) {
    window.location.href = '/auth.html';
    return;
  }
  const { data: ownRow, error: ownError } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  const cachedProfile = JSON.parse(window.localStorage.getItem('brivia-member-profile') || 'null') || {};
  const isSameUser = cachedProfile.id === session.user.id;
  memberProfile = isSameUser ? { id: session.user.id, loginPassword: cachedProfile.loginPassword || '' } : { id: session.user.id, loginPassword: '' };
  if (!ownError && ownRow) memberProfile = { ...memberProfile, ...rowToProfile(ownRow), id: session.user.id };
  else if (ownError) console.warn('Your profile could not load:', ownError.message);
  memberProfile.email = session.user.email || memberProfile.email || '';
  if (!memberProfile.name || memberProfile.name === 'New Member') memberProfile.name = session.user.user_metadata?.name || 'New Member';
  const { data: credentialRow, error: credentialError } = await loadLoginCredentials(session.user.id);
  if (!credentialError && credentialRow?.login_password) memberProfile.loginPassword = credentialRow.login_password;
  window.localStorage.setItem('brivia-member-profile', JSON.stringify(memberProfile));
  const { data: matchRows, error: matchError } = await supabase.from('matches').select('user1_id,user2_id').or(`user1_id.eq.${session.user.id},user2_id.eq.${session.user.id}`);
  if (!matchError) remoteMatchIds = (matchRows || []).map((match) => match.user1_id === session.user.id ? match.user2_id : match.user1_id);
  // Sort in the browser so an older Supabase schema cache cannot block inbox loading.
  let { data: inboxRows, error: inboxError } = await supabase.from('brivia_messages').select('id,sender_id,recipient_id,body,created_at').or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`);
  if (inboxError && inboxError.message?.toLowerCase().includes('created_at')) {
    ({ data: inboxRows, error: inboxError } = await supabase.from('brivia_messages').select('id,sender_id,recipient_id,body').or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`));
  }
  if (!inboxError) {
    const inboxIds = new Set(remoteMatchIds);
    (inboxRows || []).sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()).forEach((message) => {
      const otherId = message.sender_id === session.user.id ? message.recipient_id : message.sender_id;
      inboxIds.add(otherId);
      (chatMessages[otherId] ||= []).push({ id: message.id, createdAt: message.created_at, from: message.sender_id === session.user.id ? 'me' : 'them', text: message.body });
    });
    remoteMatchIds = [...inboxIds];
  } else console.warn('Inbox could not load:', inboxError.message);
  // Sort locally so Explore still loads if created_at is missing from an older schema cache.
  const { data: rows, error } = await supabase.from('profiles').select('*').neq('id', session.user.id);
  if (!error && rows?.length) {
    rows.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    people = rows.map((row) => {
      const profile = rowToProfile(row);
      const skills = profile.skills.split(',').map((item) => item.trim()).filter(Boolean);
      const looking = profile.lookingFor.split(',').map((item) => item.trim()).filter(Boolean);
      const tags = [...skills, ...looking];
      const filters = ['all', ...tags.map((item) => item.toLowerCase()), profile.experience?.toLowerCase() || ''];
      return { ...profile, age: '', role: profile.experience || 'Brivia member', distance: '', bio: `${profile.name} is open to meaningful connections.`, tags: tags.length ? tags : ['Open to connect'], image: profile.photoUrl || '', filters: filters.filter(Boolean) };
    });
    currentPerson = people[0];
  } else if (error) showToast(`Community could not load: ${error.message}`);
  renderHome();
  renderExplore();
  renderChats();
  renderProfile();
  subscribeToMessages();
  startMessageSync();
};

renderHome();
renderExplore();
renderProfile();
routeFromUrl();
loadSupabaseCommunity().catch((error) => console.warn('Supabase data could not load:', error.message));
