const STORAGE_KEY = 'see_oms_state';

const seed = {
  users: [
    { id: 'ADMIN001', name: 'SEE Admin', email: 'admin@see-org.com', role: 'ADMIN', password: 'SEEorg@2026', active: true },
    { id: 'OFF001', name: 'Operations Officer', email: 'operations@see-org.com', role: 'OFFICER', password: 'officer123', active: true },
    { id: 'MEM001', name: 'Sample Member', email: 'member@see-org.com', role: 'MEMBER', password: 'member123', active: true }
  ],
  requests: [
    { id: 'REQ-001', memberId: 'MEM001', memberName: 'Sample Member', purpose: 'Quarterly Clearance', status: 'PENDING', createdAt: new Date().toISOString() }
  ],
  logs: [{ at: new Date().toISOString(), action: 'INIT', details: 'SEE-OMS initialized' }],
  session: null
};

const app = document.getElementById('app');
const load = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || structuredClone(seed);
const save = (s) => localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
let state = load();

const log = (action, details) => state.logs.unshift({ at: new Date().toISOString(), action, details });

const badge = (s) => `<span class="badge ${s.toLowerCase()}">${s}</span>`;

function renderLogin(error='') {
  app.innerHTML = `<div class="container"><div class="card" style="max-width:460px;margin:48px auto;">
    <h1 style="margin:0">SEE-OMS</h1><p class="muted">SEE Organization Management System</p>
    <div class="grid" style="gap:10px">
      <input id="email" placeholder="Email" />
      <input id="password" type="password" placeholder="Password" />
      ${error ? `<div style="color:#b91c1c;font-size:13px">${error}</div>` : ''}
      <button id="login">Sign in</button>
      <div class="muted">Default admin: admin@see-org.com / SEEorg@2026</div>
    </div>
  </div></div>`;
  document.getElementById('login').onclick = () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const user = state.users.find(u => u.email === email && u.password === password && u.active);
    if (!user) return renderLogin('Invalid credentials.');
    state.session = { id: user.id };
    log('LOGIN', `${user.email} logged in`);
    save(state);
    render();
  };
}

function renderDashboard(user){
  const myRequests = state.requests.filter(r => user.role === 'MEMBER' ? r.memberId === user.id : true);
  app.innerHTML = `<div class="container">
    <header>
      <div><h2 style="margin:0">SEE Organization Management System</h2><div class="muted">Welcome, ${user.name} (${user.role})</div></div>
      <button class="secondary" id="logout" style="width:auto">Logout</button>
    </header>

    <section class="grid cols-3" style="margin-bottom:16px">
      <div class="card"><div class="muted">Total Users</div><h3>${state.users.length}</h3></div>
      <div class="card"><div class="muted">Total Requests</div><h3>${state.requests.length}</h3></div>
      <div class="card"><div class="muted">Pending Requests</div><h3>${state.requests.filter(r=>r.status==='PENDING').length}</h3></div>
    </section>

    ${user.role === 'MEMBER' ? `<section class="card" style="margin-bottom:16px">
      <h3>Submit Request</h3>
      <div class="row"><input id="purpose" placeholder="Request purpose" /><button id="submitReq">Submit</button></div>
    </section>` : ''}

    ${user.role === 'ADMIN' ? `<section class="card" style="margin-bottom:16px">
      <h3>User Management</h3>
      <div class="row">
        <input id="newEmail" placeholder="Email" />
        <select id="newRole"><option>OFFICER</option><option>MEMBER</option></select>
      </div>
      <div class="row" style="margin-top:10px">
        <input id="newName" placeholder="Name" />
        <button id="addUser">Add User</button>
      </div>
    </section>` : ''}

    <section class="card" style="margin-bottom:16px">
      <h3>Requests</h3>
      <table><thead><tr><th>ID</th><th>Member</th><th>Purpose</th><th>Status</th>${user.role!=='MEMBER'?'<th>Action</th>':''}</tr></thead>
      <tbody>
      ${myRequests.map(r=>`<tr><td>${r.id}</td><td>${r.memberName}</td><td>${r.purpose}</td><td>${badge(r.status)}</td>${user.role!=='MEMBER'?`<td>
        <select data-id="${r.id}" class="statusSelect">
          <option ${r.status==='PENDING'?'selected':''}>PENDING</option>
          <option ${r.status==='APPROVED'?'selected':''}>APPROVED</option>
          <option ${r.status==='REJECTED'?'selected':''}>REJECTED</option>
        </select></td>`:''}</tr>`).join('')}
      </tbody></table>
    </section>

    <section class="card">
      <h3>Audit Logs</h3>
      <div class="muted">${state.logs.slice(0,8).map(l=>`${new Date(l.at).toLocaleString()} — ${l.action}: ${l.details}`).join('<br/>')}</div>
    </section>
  </div>`;

  document.getElementById('logout').onclick = () => {
    log('LOGOUT', `${user.email} logged out`);
    state.session = null;
    save(state);
    render();
  };

  if (user.role === 'MEMBER') {
    document.getElementById('submitReq').onclick = () => {
      const purpose = document.getElementById('purpose').value.trim();
      if (!purpose) return;
      const req = { id:`REQ-${Date.now()}`, memberId:user.id, memberName:user.name, purpose, status:'PENDING', createdAt:new Date().toISOString() };
      state.requests.unshift(req);
      log('REQUEST_CREATED', `${user.email} created ${req.id}`);
      save(state);
      render();
    };
  }

  if (user.role === 'ADMIN') {
    document.getElementById('addUser').onclick = () => {
      const email = document.getElementById('newEmail').value.trim();
      const name = document.getElementById('newName').value.trim();
      const role = document.getElementById('newRole').value;
      if (!email || !name) return;
      state.users.push({ id:`USR-${Date.now()}`, email, name, role, password:'welcome123', active:true });
      log('USER_CREATED', `${email} created as ${role}`);
      save(state);
      render();
    };
  }

  document.querySelectorAll('.statusSelect').forEach(el => {
    el.onchange = (e) => {
      const id = e.target.dataset.id;
      const req = state.requests.find(r => r.id === id);
      if (!req) return;
      req.status = e.target.value;
      log('REQUEST_UPDATED', `${id} set to ${req.status}`);
      save(state);
      render();
    };
  });
}

function render(){
  const user = state.users.find(u => u.id === state.session?.id);
  if (!user) return renderLogin();
  renderDashboard(user);
}

render();
