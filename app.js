/**
 * IT部项目看板 - 核心逻辑 (v3)
 *
 * 架构：首页(板块+统计) → 板块看板(项目列表) → 项目详情(子任务/动态)
 * 数据持久化：localStorage
 */

// ============================
// 常量
// ============================
const STATUS_MAP = { backlog:'待办','in-progress':'进行中',testing:'测试中',done:'已完成' };
const PRIORITY_MAP = { high:'紧急', medium:'重要', low:'普通' };
const COLUMNS = ['backlog','in-progress','testing','done'];

// ============================
// 状态
// ============================
let state = { boards:[], theme:'light', nextBoardId:1, nextProjectId:1, users:[], currentUser:null, nextUserId:1 };
let currentBoardId = null;   // 当前查看的板块ID
let activeProjId = null;     // 当前详情面板的项目ID
let editingBoardId = null;   // 正在编辑的板块ID
let editingProjId = null;    // 正在编辑的项目ID
let editingSubtaskId = null; // 正在编辑的子任务
let confirmCallback = null;  // 删除确认回调

// ============================
// 初始化
// ============================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTheme();
  bindEvents();
  checkAuthAndRender();
});

function loadState() {
  try {
    const s = localStorage.getItem('it-kanban-v3');
    if (s) {
      const p = JSON.parse(s);
      state = { ...state, ...p };
      if (!state.users || state.users.length === 0) {
        initDefaultUsers();
      }
    } else {
      loadSample();
      initDefaultUsers();
    }
  } catch(e) {
    loadSample();
    initDefaultUsers();
  }
}

function initDefaultUsers() {
  state.users = [
    { id: 1, username: 'admin', name: '管理员', role: 'admin', password: 'admin', allowedAssignees: [] },
    { id: 2, username: 'zhangming', name: '张明', role: 'user', password: '123', allowedAssignees: [] },
    { id: 3, username: 'lihua', name: '李华', role: 'user', password: '123', allowedAssignees: [] },
    { id: 4, username: 'zhouxuan', name: '周璇', role: 'user', password: '123', allowedAssignees: [] },
    { id: 5, username: 'liuwei', name: '刘伟', role: 'user', password: '123', allowedAssignees: [] },
    { id: 6, username: 'wutao', name: '吴涛', role: 'user', password: '123', allowedAssignees: [] },
    { id: 7, username: 'chenjing', name: '陈静', role: 'user', password: '123', allowedAssignees: [] },
    { id: 8, username: 'mali', name: '马丽', role: 'user', password: '123', allowedAssignees: [] },
    { id: 9, username: 'zhaomin', name: '赵敏', role: 'user', password: '123', allowedAssignees: [] }
  ];
  state.nextUserId = 10;
  saveState();
}

function saveState() {
  localStorage.setItem('it-kanban-v3', JSON.stringify(state));
}

// ============================
// 示例数据
// ============================
function loadSample() {
  const d = new Date(), ad = (n) => { const r=new Date(d); r.setDate(r.getDate()+n); return r.toISOString().split('T')[0]; };
  const ago = (n) => { const r=new Date(d); r.setDate(r.getDate()-n); return r.toISOString(); };

  state.boards = [
    {
      id: 1, name: '实施组', emoji: '🔧', color: '#6366f1',
      projects: [
        {
          id:1, title:'企业邮箱迁移至 Exchange Online', desc:'将现有邮箱系统迁移到 Microsoft 365 Exchange Online，包含数据迁移、DNS 配置和用户培训。', priority:'high', assignee:'张明', deadline:ad(3), status:'in-progress', createdAt:ad(-5),
          subtasks:[{id:1,text:'现有邮箱数据备份',done:true},{id:2,text:'Exchange Online 租户配置',done:true},{id:3,text:'DNS MX 记录切换',done:false},{id:4,text:'用户邮箱批量迁移',done:false},{id:5,text:'客户端配置与测试',done:false}],
          activities:[{type:'create',text:'张明 创建了项目',time:ago(5)},{type:'status',text:'状态变更: 待办 → 进行中',time:ago(4)},{type:'subtask',text:'完成: 现有邮箱数据备份',time:ago(3)}]
        },
        {
          id:2, title:'ERP 系统实施部署', desc:'为生产部门部署 SAP ERP 系统，包含需求调研、蓝图设计、系统配置、数据迁移和培训上线。', priority:'high', assignee:'李华', deadline:ad(20), status:'in-progress', createdAt:ad(-12),
          subtasks:[{id:1,text:'需求调研与蓝图设计',done:true},{id:2,text:'系统配置与开发',done:true},{id:3,text:'数据迁移与清洗',done:false},{id:4,text:'UAT 用户验收测试',done:false},{id:5,text:'培训与正式上线',done:false}],
          activities:[{type:'create',text:'李华 创建了项目',time:ago(12)},{type:'status',text:'状态变更: 待办 → 进行中',time:ago(10)}]
        },
        {
          id:3, title:'视频会议系统升级', desc:'将 Zoom 替换为 Teams，统一内部视频会议平台。', priority:'medium', assignee:'周璇', deadline:ad(8), status:'backlog', createdAt:ad(-2),
          subtasks:[{id:1,text:'Teams 许可证采购',done:false},{id:2,text:'会议室设备适配',done:false},{id:3,text:'用户培训',done:false}],
          activities:[{type:'create',text:'周璇 创建了项目',time:ago(2)}]
        },
        {
          id:4, title:'OA 系统实施交付', desc:'完成 OA 系统定制开发并交付客户使用。', priority:'low', assignee:'杨帆', deadline:ad(-3), status:'done', createdAt:ad(-30),
          subtasks:[{id:1,text:'流程配置',done:true},{id:2,text:'权限设置',done:true},{id:3,text:'验收交付',done:true}],
          activities:[{type:'create',text:'杨帆 创建了项目',time:ago(30)},{type:'status',text:'状态变更: 测试中 → 已完成',time:ago(3)}]
        }
      ]
    },
    {
      id: 2, name: '运维组', emoji: '🖥️', color: '#06b6d4',
      projects: [
        {
          id:5, title:'Kubernetes 集群升级 v1.30', desc:'将生产环境 K8s 集群从 v1.28 升级至 v1.30，包含 Control Plane 和 Worker Node。', priority:'medium', assignee:'刘伟', deadline:ad(10), status:'backlog', createdAt:ad(-3),
          subtasks:[{id:1,text:'阅读 Release Notes',done:true},{id:2,text:'测试环境升级验证',done:false},{id:3,text:'生产环境灰度升级',done:false},{id:4,text:'Addon 兼容性验证',done:false}],
          activities:[{type:'create',text:'刘伟 创建了项目',time:ago(3)}]
        },
        {
          id:6, title:'监控告警体系完善', desc:'基于 Prometheus + Grafana 完善监控告警，覆盖核心 SLA 指标。', priority:'low', assignee:'吴涛', deadline:ad(15), status:'testing', createdAt:ad(-6),
          subtasks:[{id:1,text:'Prometheus 采集配置',done:true},{id:2,text:'Grafana Dashboard',done:true},{id:3,text:'Alertmanager 策略',done:true},{id:4,text:'告警通知对接',done:false}],
          activities:[{type:'create',text:'吴涛 创建了项目',time:ago(6)},{type:'status',text:'状态变更: 进行中 → 测试中',time:ago(1)}]
        },
        {
          id:7, title:'网络设备固件升级', desc:'升级核心交换机和防火墙固件到最新安全版本。', priority:'high', assignee:'张明', deadline:ad(2), status:'in-progress', createdAt:ad(-7),
          subtasks:[{id:1,text:'固件兼容性验证',done:true},{id:2,text:'配置备份',done:true},{id:3,text:'测试环境升级',done:true},{id:4,text:'生产环境分批升级',done:false}],
          activities:[{type:'create',text:'张明 创建了项目',time:ago(7)},{type:'status',text:'状态变更: 待办 → 进行中',time:ago(5)}]
        },
        {
          id:8, title:'数据库巡检与优化', desc:'对 MySQL/PostgreSQL 进行定期巡检，优化慢查询和索引。', priority:'low', assignee:'刘伟', deadline:ad(-1), status:'done', createdAt:ad(-15),
          subtasks:[{id:1,text:'慢查询分析',done:true},{id:2,text:'索引优化',done:true},{id:3,text:'巡检报告',done:true}],
          activities:[{type:'create',text:'刘伟 创建了项目',time:ago(15)},{type:'status',text:'状态变更: 进行中 → 已完成',time:ago(1)}]
        }
      ]
    },
    {
      id: 3, name: 'RPA开发组', emoji: '🤖', color: '#8b5cf6',
      projects: [
        {
          id:9, title:'财务对账自动化', desc:'开发 RPA 机器人自动完成银行流水与 ERP 系统的对账工作，减少人工对账时间 90%。', priority:'high', assignee:'陈静', deadline:ad(7), status:'in-progress', createdAt:ad(-8),
          subtasks:[{id:1,text:'对账规则梳理',done:true},{id:2,text:'银行接口对接',done:true},{id:3,text:'ERP 数据抓取',done:false},{id:4,text:'差异报告生成',done:false},{id:5,text:'异常处理逻辑',done:false}],
          activities:[{type:'create',text:'陈静 创建了项目',time:ago(8)},{type:'status',text:'状态变更: 待办 → 进行中',time:ago(6)}]
        },
        {
          id:10, title:'HR 入职流程自动化', desc:'自动完成新员工入职的系统账号创建、权限分配、邮件通知等操作。', priority:'medium', assignee:'马丽', deadline:ad(14), status:'backlog', createdAt:ad(-2),
          subtasks:[{id:1,text:'流程梳理与设计',done:false},{id:2,text:'AD 账号自动创建',done:false},{id:3,text:'邮箱自动开通',done:false},{id:4,text:'权限自动分配',done:false}],
          activities:[{type:'create',text:'马丽 创建了项目',time:ago(2)}]
        },
        {
          id:11, title:'发票识别与录入', desc:'基于 OCR + RPA 自动识别发票信息并录入财务系统。', priority:'medium', assignee:'陈静', deadline:ad(21), status:'backlog', createdAt:ad(-1),
          subtasks:[{id:1,text:'OCR 引擎选型',done:false},{id:2,text:'发票模板配置',done:false},{id:3,text:'财务系统录入脚本',done:false}],
          activities:[{type:'create',text:'陈静 创建了项目',time:ago(1)}]
        },
        {
          id:12, title:'月报自动生成', desc:'自动汇总各系统数据生成月度运营报告 PDF。', priority:'low', assignee:'赵敏', deadline:ad(-5), status:'done', createdAt:ad(-25),
          subtasks:[{id:1,text:'数据源对接',done:true},{id:2,text:'报表模板',done:true},{id:3,text:'PDF 生成',done:true},{id:4,text:'定时调度',done:true}],
          activities:[{type:'create',text:'赵敏 创建了项目',time:ago(25)},{type:'status',text:'状态变更: 测试中 → 已完成',time:ago(5)}]
        }
      ]
    }
  ];
  state.nextBoardId = 4;
  state.nextProjectId = 13;
  saveState();
}

// ============================
// 主题
// ============================
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
}
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  updateThemeIcon();
  saveState();
}
function updateThemeIcon() {
  const b = document.getElementById('btn-theme');
  b.innerHTML = state.theme === 'dark'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

// ============================
// 事件绑定
// ============================
function bindEvents() {
  // 主题
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);

  // Logo 回首页
  document.getElementById('logo').addEventListener('click', () => showHome());

  // ---- 板块模态框 ----
  document.getElementById('btn-add-board').addEventListener('click', () => openBoardModal());
  document.getElementById('board-modal-close').addEventListener('click', closeBoardModal);
  document.getElementById('board-modal-cancel').addEventListener('click', closeBoardModal);
  document.getElementById('board-modal-overlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeBoardModal(); });
  document.getElementById('board-modal-save').addEventListener('click', saveBoardModal);

  // Emoji / Color 选择
  document.querySelectorAll('.emoji-opt').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.emoji-opt').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
    });
  });
  document.querySelectorAll('.color-opt').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.color-opt').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
    });
  });

  // ---- 项目模态框 ----
  document.getElementById('btn-add-project').addEventListener('click', () => openProjModal());
  
  const boardBackBtn = document.getElementById('btn-board-back');
  if (boardBackBtn) {
    boardBackBtn.addEventListener('click', showHome);
  }

  document.getElementById('proj-modal-close').addEventListener('click', closeProjModal);
  document.getElementById('proj-modal-cancel').addEventListener('click', closeProjModal);
  document.getElementById('proj-modal-overlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeProjModal(); });
  document.getElementById('proj-form').addEventListener('submit', saveProjModal);

  // ---- 详情面板 ----
  document.getElementById('pn-btn-close').addEventListener('click', closePanel);
  document.getElementById('panel-backdrop').addEventListener('click', closePanel);
  document.getElementById('pn-btn-edit').addEventListener('click', () => { if(activeProjId){ closePanel(); setTimeout(()=>openProjModal(activeProjId),250); } });
  document.getElementById('pn-btn-del').addEventListener('click', () => { if(activeProjId) showConfirm('确认删除','此操作不可撤销，确定要删除该项目吗？',()=>{ deleteProject(activeProjId); closePanel(); }); });
  document.getElementById('pn-status-sel').addEventListener('change', e => {
    if(!activeProjId) return;
    const proj = findProject(activeProjId);
    if(proj){
      const old = proj.status;
      proj.status = e.target.value;
      addActivity(proj, 'status', `状态变更: ${STATUS_MAP[old]} → ${STATUS_MAP[proj.status]}`);
      saveState();
      if(currentBoardId) renderKanban();
      refreshPanel();
      toast(`项目已移至「${STATUS_MAP[proj.status]}」`);
    }
  });

  // 面板标签页
  document.querySelectorAll('.pn-tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.pn-tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.pn-pane').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById(`pane-${t.dataset.tab}`).classList.add('active');
    });
  });

  // 子任务输入
  document.getElementById('pn-st-input').addEventListener('keydown', e => {
    if(e.key==='Enter' && activeProjId){
      e.preventDefault();
      const text = e.target.value.trim();
      if(!text) return;
      const proj = findProject(activeProjId);
      if(proj){
        const nid = proj.subtasks.length>0 ? Math.max(...proj.subtasks.map(s=>s.id))+1 : 1;
        proj.subtasks.push({id:nid,text,done:false});
        addActivity(proj,'subtask',`添加子任务: ${text}`);
        saveState();
        renderSubtasks(proj);
        renderProgressBlock(proj);
        if(currentBoardId) renderKanban();
        renderHomeStats();
        e.target.value='';
      }
    }
  });

  // ---- 子任务编辑模态框 ----
  document.getElementById('st-edit-close').addEventListener('click', closeStEditModal);
  document.getElementById('st-edit-cancel').addEventListener('click', closeStEditModal);
  document.getElementById('st-edit-overlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeStEditModal(); });
  document.getElementById('st-edit-save').addEventListener('click', saveStEdit);

  // ---- 确认框 ----
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
  document.getElementById('confirm-overlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeConfirm(); });
  document.getElementById('confirm-ok').addEventListener('click', () => { if(confirmCallback) confirmCallback(); closeConfirm(); });

  // ---- 首页筛选 ----
  document.getElementById('home-search').addEventListener('input', renderProjectTable);
  document.getElementById('hf-board').addEventListener('change', renderProjectTable);
  document.getElementById('hf-priority').addEventListener('change', renderProjectTable);
  document.getElementById('hf-assignee').addEventListener('change', renderProjectTable);

  // 状态快捷按钮
  document.querySelectorAll('.home-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.home-status-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderProjectTable();
    });
  });

  // 清除筛选
  document.getElementById('hf-clear').addEventListener('click', () => {
    document.getElementById('home-search').value = '';
    document.getElementById('hf-board').value = 'all';
    document.getElementById('hf-priority').value = 'all';
    document.getElementById('hf-assignee').value = 'all';
    document.querySelectorAll('.home-status-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.home-status-btn[data-status="all"]').classList.add('active');
    renderProjectTable();
  });

  // ---- 板块视图筛选 ----
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      applyKanbanFilter();
    });
  });

  // ---- 附件上传事件 ----
  const uploadZone = document.getElementById('file-upload-zone');
  const fileInput = document.getElementById('file-input');

  if (uploadZone && fileInput) {
    // 点击触发选择文件
    uploadZone.addEventListener('click', () => fileInput.click());

    // 文件选择框变化
    fileInput.addEventListener('change', e => {
      if (activeProjId) {
        const proj = findProject(activeProjId);
        if (proj) {
          handleFileUpload(proj, e.target.files);
          fileInput.value = ''; // 重置以允许再次上传同名文件
        }
      }
    });

    // 拖拽相关事件
    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      if (activeProjId) {
        const proj = findProject(activeProjId);
        if (proj) {
          handleFileUpload(proj, e.dataTransfer.files);
        }
      }
    });
  }

  // ---- 登录鉴权与账号管理事件 ----
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // 账号管理控制面板
  document.getElementById('btn-user-mgmt').addEventListener('click', openUserMgmtModal);
  document.getElementById('user-mgmt-close').addEventListener('click', closeUserMgmtModal);
  document.getElementById('user-mgmt-overlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeUserMgmtModal(); });

  // 新增/编辑账号
  document.getElementById('btn-add-user').addEventListener('click', () => openUserEditModal());
  document.getElementById('user-edit-close').addEventListener('click', closeUserEditModal);
  document.getElementById('user-edit-cancel').addEventListener('click', closeUserEditModal);
  document.getElementById('user-edit-overlay').addEventListener('click', e => { if(e.target===e.currentTarget) closeUserEditModal(); });
  document.getElementById('user-edit-form').addEventListener('submit', saveUserEdit);

  // 监听角色切换动态显示隐藏查看授权列表
  document.getElementById('user-role').addEventListener('change', e => {
    const isUser = e.target.value === 'user';
    document.getElementById('user-edit-permissions-group').style.display = isUser ? 'block' : 'none';
  });

  // 键盘
  document.addEventListener('keydown', e => {
    if(e.key==='Escape'){ 
      if (state.currentUser) {
        closeBoardModal(); 
        closeProjModal(); 
        closePanel(); 
        closeConfirm(); 
        closeStEditModal(); 
        closeUserMgmtModal(); 
        closeUserEditModal(); 
      }
    }
  });
}

// ============================
// 导航
// ============================
function showHome() {
  currentBoardId = null;
  document.getElementById('view-home').style.display = '';
  document.getElementById('view-board').style.display = 'none';
  document.getElementById('breadcrumb').innerHTML = '';
  renderHome();
}

function showBoard(boardId) {
  const board = state.boards.find(b => b.id === boardId);
  if(!board) return;
  currentBoardId = boardId;
  document.getElementById('view-home').style.display = 'none';
  document.getElementById('view-board').style.display = '';
  document.getElementById('breadcrumb').innerHTML = `
    <span class="bc-sep">/</span>
    <a href="#" id="bc-home">首页</a>
    <span class="bc-sep">/</span>
    <span class="bc-current">${board.emoji} ${esc(board.name)}</span>
  `;
  document.getElementById('bc-home').addEventListener('click', e => { e.preventDefault(); showHome(); });
  renderKanban();
}

// ============================
// 首页渲染
// ============================
function renderHome() {
  renderHomeStats();
  renderHomeCharts();
  renderBoardGrid();
  renderProjectTable();
}

// 渲染首页图表看板
function renderHomeCharts() {
  const projects = getAllProjects(); // 获得该账号视角下的所有项目
  const statusBody = document.getElementById('chart-status-body');
  const priorityBody = document.getElementById('chart-priority-body');

  if (!statusBody || !priorityBody) return;

  const total = projects.length;

  if (total === 0) {
    const emptyHtml = `
      <div class="chart-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6M12 9v6"/></svg>
        <span>暂无可见项目数据</span>
      </div>`;
    statusBody.innerHTML = emptyHtml;
    priorityBody.innerHTML = emptyHtml;
    return;
  }

  // 1. 状态分布环形图绘制
  const statusCounts = { backlog: 0, 'in-progress': 0, testing: 0, done: 0 };
  projects.forEach(p => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status]++;
    }
  });

  const bPct = (statusCounts.backlog / total) * 100;
  const ipPct = (statusCounts['in-progress'] / total) * 100;
  const tPct = (statusCounts.testing / total) * 100;
  const dPct = (statusCounts.done / total) * 100;

  // 转换成渐变角度
  const deg1 = bPct * 3.6;
  const deg2 = deg1 + ipPct * 3.6;
  const deg3 = deg2 + tPct * 3.6;

  // conic gradient 环形背景样式
  const conicStyle = `background: conic-gradient(var(--gray-400) 0deg ${deg1}deg, var(--blue) ${deg1}deg ${deg2}deg, var(--orange) ${deg2}deg ${deg3}deg, var(--green) ${deg3}deg 360deg)`;

  statusBody.innerHTML = `
    <div class="donut-wrapper">
      <div class="donut-circle" style="${conicStyle}">
        <div class="donut-center-text">
          <span class="donut-center-num">${total}</span>
          <span class="donut-center-label">总项目数</span>
        </div>
      </div>
      <div class="chart-legend">
        <div class="legend-item">
          <div class="legend-left"><span class="legend-dot backlog"></span>待办</div>
          <div><span class="legend-count">${statusCounts.backlog}</span><span class="legend-pct">${bPct.toFixed(0)}%</span></div>
        </div>
        <div class="legend-item">
          <div class="legend-left"><span class="legend-dot in-progress"></span>进行中</div>
          <div><span class="legend-count">${statusCounts['in-progress']}</span><span class="legend-pct">${ipPct.toFixed(0)}%</span></div>
        </div>
        <div class="legend-item">
          <div class="legend-left"><span class="legend-dot testing"></span>测试中</div>
          <div><span class="legend-count">${statusCounts.testing}</span><span class="legend-pct">${tPct.toFixed(0)}%</span></div>
        </div>
        <div class="legend-item">
          <div class="legend-left"><span class="legend-dot done"></span>已完成</div>
          <div><span class="legend-count">${statusCounts.done}</span><span class="legend-pct">${dPct.toFixed(0)}%</span></div>
        </div>
      </div>
    </div>`;

  // 2. 优先级条形图绘制
  const priCounts = { high: 0, medium: 0, low: 0 };
  projects.forEach(p => {
    if (priCounts[p.priority] !== undefined) {
      priCounts[p.priority]++;
    }
  });

  const hPct = (priCounts.high / total) * 100;
  const mPct = (priCounts.medium / total) * 100;
  const lPct = (priCounts.low / total) * 100;

  priorityBody.innerHTML = `
    <div class="priority-chart-wrapper">
      <div class="priority-bar-row">
        <div class="priority-bar-label">
          <div class="priority-bar-left"><span class="priority-dot high" style="width:6px; height:6px; border-radius:50%; background:var(--red)"></span>🔴 紧急</div>
          <div><strong>${priCounts.high}</strong> 个项目 <span style="font-size:.7rem; color:var(--text-muted); font-weight:500;">(${hPct.toFixed(0)}%)</span></div>
        </div>
        <div class="priority-bar-track">
          <div class="priority-bar-fill high" style="width: ${hPct}%"></div>
        </div>
      </div>
      <div class="priority-bar-row">
        <div class="priority-bar-label">
          <div class="priority-bar-left"><span class="priority-dot medium" style="width:6px; height:6px; border-radius:50%; background:var(--orange)"></span>🟡 重要</div>
          <div><strong>${priCounts.medium}</strong> 个项目 <span style="font-size:.7rem; color:var(--text-muted); font-weight:500;">(${mPct.toFixed(0)}%)</span></div>
        </div>
        <div class="priority-bar-track">
          <div class="priority-bar-fill medium" style="width: ${mPct}%"></div>
        </div>
      </div>
      <div class="priority-bar-row">
        <div class="priority-bar-label">
          <div class="priority-bar-left"><span class="priority-dot low" style="width:6px; height:6px; border-radius:50%; background:var(--green)"></span>🟢 普通</div>
          <div><strong>${priCounts.low}</strong> 个项目 <span style="font-size:.7rem; color:var(--text-muted); font-weight:500;">(${lPct.toFixed(0)}%)</span></div>
        </div>
        <div class="priority-bar-track">
          <div class="priority-bar-fill low" style="width: ${lPct}%"></div>
        </div>
      </div>
    </div>`;
}


function renderHomeStats() {
  const allProj = getAllProjects();
  const total = allProj.length;
  const progress = allProj.filter(p => p.status==='in-progress').length;
  const done = allProj.filter(p => p.status==='done').length;
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = allProj.filter(p => {
    if(!p.deadline || p.status==='done') return false;
    const dl = new Date(p.deadline); dl.setHours(0,0,0,0);
    return dl < today;
  }).length;

  document.getElementById('sv-total').textContent = total;
  document.getElementById('sv-progress').textContent = progress;
  document.getElementById('sv-done').textContent = done;
  document.getElementById('sv-overdue').textContent = overdue;
}

function renderBoardGrid() {
  const grid = document.getElementById('board-grid');
  const user = state.currentUser;
  grid.innerHTML = state.boards.map(b => {
    const userProjects = b.projects.filter(p => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      const allowed = user.allowedAssignees || [];
      return p.assignee === user.name || allowed.includes(p.assignee);
    });
    const total = userProjects.length;
    const done = userProjects.filter(p => p.status==='done').length;
    const progress = userProjects.filter(p => p.status==='in-progress').length;
    const pct = total > 0 ? Math.round((done/total)*100) : 0;
    return `
      <div class="board-card" data-bid="${b.id}" style="--bc:${b.color}">
        <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${b.color};border-radius:var(--radius-lg) var(--radius-lg) 0 0"></div>
        <div class="board-card-top">
          <div class="board-card-icon" style="background:${b.color}20">${b.emoji}</div>
          <div class="board-card-actions">
            <button class="edit-board-btn" data-bid="${b.id}" title="编辑">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="del-btn del-board-btn" data-bid="${b.id}" title="删除">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
        <h3>${esc(b.name)}</h3>
        <div class="board-card-stats">
          <div class="board-card-stat"><strong>${total}</strong>全部项目</div>
          <div class="board-card-stat"><strong>${progress}</strong>进行中</div>
          <div class="board-card-stat"><strong>${done}</strong>已完成</div>
        </div>
        <div class="board-card-progress">
          <div class="board-card-progress-bar">
            <div class="board-card-progress-fill" style="width:${pct}%;background:${b.color}"></div>
          </div>
        </div>
      </div>`;
  }).join('');

  // 绑定事件
  grid.querySelectorAll('.board-card').forEach(card => {
    card.addEventListener('click', e => {
      if(e.target.closest('.board-card-actions')) return;
      showBoard(parseInt(card.dataset.bid));
    });
  });
  grid.querySelectorAll('.edit-board-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openBoardModal(parseInt(btn.dataset.bid)); });
  });
  grid.querySelectorAll('.del-board-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      showConfirm('确认删除板块', '删除板块将同时删除该板块下的所有项目，此操作不可撤销。', () => {
        state.boards = state.boards.filter(b => b.id !== parseInt(btn.dataset.bid));
        saveState();
        renderHome();
        toast('板块已删除');
      });
    });
  });
}

function renderProjectTable() {
  // 先动态填充下拉选项
  populateFilterDropdowns();

  const query = (document.getElementById('home-search').value || '').toLowerCase();
  const boardFilter = document.getElementById('hf-board').value;
  const priorityFilter = document.getElementById('hf-priority').value;
  const assigneeFilter = document.getElementById('hf-assignee').value;
  const statusFilter = document.querySelector('.home-status-btn.active')?.dataset.status || 'all';

  // 收集所有项目
  const allProj = [];
  const user = state.currentUser;
  state.boards.forEach(b => {
    b.projects.forEach(p => {
      if (!user) return;
      const allowed = user.allowedAssignees || [];
      if (user.role === 'admin' || p.assignee === user.name || allowed.includes(p.assignee)) {
        allProj.push({ ...p, boardName: b.name, boardColor: b.color, boardEmoji: b.emoji, boardId: b.id });
      }
    });
  });

  // 多维筛选
  const filtered = allProj.filter(p => {
    // 搜索
    if (query) {
      const t = `${p.title} ${p.desc||''} ${p.assignee||''} ${p.boardName}`.toLowerCase();
      if (!t.includes(query)) return false;
    }
    // 板块
    if (boardFilter !== 'all' && p.boardId !== parseInt(boardFilter)) return false;
    // 优先级
    if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
    // 负责人
    if (assigneeFilter !== 'all' && (p.assignee || '未分配') !== assigneeFilter) return false;
    // 状态
    if (statusFilter === 'in-progress' && p.status !== 'in-progress') return false;
    if (statusFilter === 'done' && p.status !== 'done') return false;
    if (statusFilter === 'overdue' && !isProjectOverdue(p)) return false;
    return true;
  });

  // 更新筛选状态UI
  const hasFilter = query || boardFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || statusFilter !== 'all';
  document.getElementById('hf-clear').classList.toggle('visible', hasFilter);
  document.getElementById('hf-board').classList.toggle('filtered', boardFilter !== 'all');
  document.getElementById('hf-priority').classList.toggle('filtered', priorityFilter !== 'all');
  document.getElementById('hf-assignee').classList.toggle('filtered', assigneeFilter !== 'all');

  // 筛选结果提示
  const resultEl = document.getElementById('home-filter-result');
  if (hasFilter) {
    resultEl.style.display = 'flex';
    document.getElementById('hf-result-text').textContent = `筛选结果：${filtered.length} 个项目（共 ${allProj.length} 个）`;
  } else {
    resultEl.style.display = 'none';
  }

  const tbody = document.getElementById('project-table-body');
  const empty = document.getElementById('table-empty');

  if(filtered.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(p => {
    const pct = getProjectProgress(p);
    const dlInfo = getDeadlineInfo(p);
    return `
      <tr data-pid="${p.id}" data-bid="${p.boardId}">
        <td><span class="tbl-title">${esc(p.title)}</span></td>
        <td><span class="tbl-board" style="background:${p.boardColor}">${p.boardEmoji} ${esc(p.boardName)}</span></td>
        <td><span class="tbl-status ${p.status}">${STATUS_MAP[p.status]}</span></td>
        <td><span class="tbl-priority"><span class="priority-dot ${p.priority}"></span>${PRIORITY_MAP[p.priority]}</span></td>
        <td>${esc(p.assignee||'未分配')}</td>
        <td><div class="tbl-progress"><div class="tbl-progress-bar"><div class="tbl-progress-fill ${pct===100?'complete':''}" style="width:${pct}%"></div></div><span class="tbl-progress-pct">${pct}%</span></div></td>
        <td><span class="tbl-deadline ${dlInfo.cls}">${dlInfo.text}</span></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('tr').forEach(tr => {
    tr.addEventListener('click', () => {
      const bid = parseInt(tr.dataset.bid);
      const pid = parseInt(tr.dataset.pid);
      showBoard(bid);
      setTimeout(() => openPanel(pid), 300);
    });
  });
}

// 动态填充板块和负责人下拉选项
function populateFilterDropdowns() {
  // 板块下拉
  const boardSel = document.getElementById('hf-board');
  const curBoard = boardSel.value;
  const boardOpts = '<option value="all">全部板块</option>' + state.boards.map(b =>
    `<option value="${b.id}">${b.emoji} ${esc(b.name)}</option>`
  ).join('');
  boardSel.innerHTML = boardOpts;
  boardSel.value = curBoard;

  // 负责人下拉（去重）
  const assigneeSel = document.getElementById('hf-assignee');
  const curAssignee = assigneeSel.value;
  const assignees = new Set();
  state.boards.forEach(b => b.projects.forEach(p => {
    if(p.assignee) assignees.add(p.assignee);
  }));
  const assigneeOpts = '<option value="all">全部负责人</option>' + [...assignees].sort().map(a =>
    `<option value="${esc(a)}">${esc(a)}</option>`
  ).join('');
  assigneeSel.innerHTML = assigneeOpts;
  assigneeSel.value = curAssignee;
}

// 判断项目是否逾期
function isProjectOverdue(p) {
  if (!p.deadline || p.status === 'done') return false;
  const today = new Date(); today.setHours(0,0,0,0);
  const dl = new Date(p.deadline); dl.setHours(0,0,0,0);
  return dl < today;
}

// ============================
// 看板渲染
// ============================
function renderKanban() {
  const board = state.boards.find(b => b.id === currentBoardId);
  if(!board) return;

  const user = state.currentUser;
  COLUMNS.forEach(status => {
    const list = document.getElementById(`kl-${status}`);
    const projects = board.projects.filter(p => {
      if (p.status !== status) return false;
      if (!user) return false;
      if (user.role === 'admin') return true;
      const allowed = user.allowedAssignees || [];
      return p.assignee === user.name || allowed.includes(p.assignee);
    });
    list.innerHTML = '';
    if(projects.length === 0) {
      list.innerHTML = '<div class="kb-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6M12 9v6"/></svg><span>拖拽项目到这里</span></div>';
    } else {
      projects.forEach(p => list.appendChild(createKanbanCard(p)));
    }
    document.getElementById(`kc-${status}`).textContent = projects.length;
    setupDrop(list, status);
  });
  applyKanbanFilter();
}

function createKanbanCard(p) {
  const card = document.createElement('div');
  card.className = 'kb-card';
  card.draggable = true;
  card.dataset.id = p.id;
  card.dataset.priority = p.priority;

  const st = p.subtasks || [];
  const done = st.filter(s=>s.done).length;
  const total = st.length;
  const pct = getProjectProgress(p);
  const dlInfo = getDeadlineInfo(p);
  const av = p.assignee ? p.assignee.charAt(0) : '?';

  let progressHtml = '';
  if(total > 0) {
    progressHtml = `<div class="kb-card-progress"><div class="kb-card-progress-top"><span class="kb-card-progress-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/></svg>${done}/${total}</span><span class="kb-card-progress-pct">${pct}%</span></div><div class="kb-card-progress-bar"><div class="kb-card-progress-fill ${pct===100?'complete':''}" style="width:${pct}%"></div></div></div>`;
  } else if(pct > 0) {
    // 无子任务但有手动进度
    progressHtml = `<div class="kb-card-progress"><div class="kb-card-progress-top"><span class="kb-card-progress-label">手动进度</span><span class="kb-card-progress-pct">${pct}%</span></div><div class="kb-card-progress-bar"><div class="kb-card-progress-fill ${pct===100?'complete':''}" style="width:${pct}%"></div></div></div>`;
  }

  card.innerHTML = `
    <div class="kb-card-bar ${p.priority}"></div>
    <div class="kb-card-header"><span class="kb-card-title">${esc(p.title)}</span><span class="kb-card-id">#${p.id}</span></div>
    ${p.desc ? `<div class="kb-card-desc">${esc(p.desc)}</div>` : ''}
    ${progressHtml}
    <div class="kb-card-footer">
      <div class="kb-card-assignee"><div class="avatar">${av}</div><span>${esc(p.assignee||'未分配')}</span></div>
      ${p.deadline ? `<span class="kb-card-deadline ${dlInfo.cls}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${dlInfo.text}</span>` : ''}
    </div>`;

  card.addEventListener('click', e => { if(!card.classList.contains('dragging')) openPanel(p.id); });
  card.addEventListener('dragstart', e => {
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', p.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => card.style.opacity='.5');
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
    card.style.opacity='1';
    document.querySelectorAll('.kb-column').forEach(c => c.classList.remove('drag-over'));
  });
  return card;
}

function setupDrop(list, status) {
  const col = list.closest('.kb-column');
  col.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect='move'; col.classList.add('drag-over'); });
  col.addEventListener('dragleave', e => { if(!col.contains(e.relatedTarget)) col.classList.remove('drag-over'); });
  col.addEventListener('drop', e => {
    e.preventDefault(); col.classList.remove('drag-over');
    const pid = parseInt(e.dataTransfer.getData('text/plain'));
    const proj = findProject(pid);
    if(proj && proj.status !== status) {
      const old = proj.status;
      proj.status = status;
      addActivity(proj,'status',`状态变更: ${STATUS_MAP[old]} → ${STATUS_MAP[status]}`);
      saveState();
      renderKanban();
      if(activeProjId===pid) refreshPanel();
      toast(`项目已移至「${STATUS_MAP[status]}」`);
    }
  });
}

function applyKanbanFilter() {
  const active = document.querySelector('.filter-btn.active');
  const filter = active ? active.dataset.filter : 'all';
  document.querySelectorAll('.kb-card').forEach(card => {
    card.classList.toggle('hidden', filter!=='all' && card.dataset.priority!==filter);
  });
  COLUMNS.forEach(s => {
    const list = document.getElementById(`kl-${s}`);
    document.getElementById(`kc-${s}`).textContent = list.querySelectorAll('.kb-card:not(.hidden)').length;
  });
}

// ============================
// 详情面板
// ============================
function openPanel(projId) {
  activeProjId = projId;
  refreshPanel();
  document.getElementById('panel').classList.add('open');
  document.getElementById('panel-backdrop').classList.add('active');
  // 重置到详情tab
  document.querySelectorAll('.pn-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.pn-pane').forEach(p => p.classList.remove('active'));
  document.querySelector('.pn-tab[data-tab="info"]').classList.add('active');
  document.getElementById('pane-info').classList.add('active');
}
function closePanel() {
  document.getElementById('panel').classList.remove('open');
  document.getElementById('panel-backdrop').classList.remove('active');
  activeProjId = null;
}
function refreshPanel() {
  const proj = findProject(activeProjId);
  if(!proj) return;
  if(!proj.attachments) proj.attachments = [];
  document.getElementById('pn-id').textContent = `#${proj.id}`;
  const badge = document.getElementById('pn-badge');
  badge.textContent = PRIORITY_MAP[proj.priority];
  badge.className = `pn-priority-badge ${proj.priority}`;
  document.getElementById('pn-title').textContent = proj.title;
  document.getElementById('pn-status-sel').value = proj.status;
  document.getElementById('pn-desc').textContent = proj.desc || '暂无描述';
  renderProgressBlock(proj);
  renderMetaGrid(proj);
  renderSubtasks(proj);
  renderAttachments(proj);
  renderTimeline(proj);
}

function renderProgressBlock(proj) {
  const st = proj.subtasks||[];
  const total = st.length, done = st.filter(s=>s.done).length;
  const pct = getProjectProgress(proj);
  const r=28, C=2*Math.PI*r, off=C-(pct/100)*C;
  const container = document.getElementById('pn-progress-block');

  if(total > 0) {
    // 有子任务：自动计算进度
    container.innerHTML = `
      <div class="pn-circle"><svg width="72" height="72" viewBox="0 0 72 72"><circle class="pn-circle-bg" cx="36" cy="36" r="${r}"/><circle class="pn-circle-fill ${pct===100?'complete':''}" cx="36" cy="36" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${off}"/></svg><span class="pn-circle-text">${pct}%</span></div>
      <div class="pn-progress-stats">
        <div><span class="pn-progress-stat-label">子任务完成</span><span class="pn-progress-stat-value hl">${done} / ${total}</span></div>
        <div><span class="pn-progress-stat-label">状态</span><span class="pn-progress-stat-value">${STATUS_MAP[proj.status]}</span></div>
        <div><span class="pn-progress-stat-label">优先级</span><span class="pn-progress-stat-value">${PRIORITY_MAP[proj.priority]}</span></div>
        <div><span class="pn-progress-stat-label">截止日期</span><span class="pn-progress-stat-value">${proj.deadline?fmtDate(proj.deadline):'未设置'}</span></div>
      </div>`;
  } else {
    // 无子任务：显示手动进度滑块
    const mp = proj.manualProgress || 0;
    const mpOff = C - (mp/100)*C;
    container.innerHTML = `
      <div class="pn-circle"><svg width="72" height="72" viewBox="0 0 72 72"><circle class="pn-circle-bg" cx="36" cy="36" r="${r}"/><circle class="pn-circle-fill ${mp===100?'complete':''}" cx="36" cy="36" r="${r}" stroke-dasharray="${C}" stroke-dashoffset="${mpOff}"/></svg><span class="pn-circle-text">${mp}%</span></div>
      <div class="pn-progress-manual">
        <div class="pn-manual-label">
          <span>手动进度</span>
          <span class="pn-manual-tip">（无子任务时可手动设置）</span>
        </div>
        <div class="pn-manual-slider-row">
          <input type="range" id="pn-manual-range" min="0" max="100" step="5" value="${mp}" class="pn-manual-range" />
          <div class="pn-manual-num-wrap">
            <input type="number" id="pn-manual-num" min="0" max="100" value="${mp}" class="pn-manual-num" />
            <span class="pn-manual-pct">%</span>
          </div>
        </div>
        <div class="pn-progress-stats" style="margin-top:10px">
          <div><span class="pn-progress-stat-label">状态</span><span class="pn-progress-stat-value">${STATUS_MAP[proj.status]}</span></div>
          <div><span class="pn-progress-stat-label">优先级</span><span class="pn-progress-stat-value">${PRIORITY_MAP[proj.priority]}</span></div>
        </div>
      </div>`;

    // 绑定手动进度事件
    const rangeEl = container.querySelector('#pn-manual-range');
    const numEl = container.querySelector('#pn-manual-num');
    const circleText = container.querySelector('.pn-circle-text');
    const circleFill = container.querySelector('.pn-circle-fill');

    const updateManualProgress = (val) => {
      val = Math.max(0, Math.min(100, parseInt(val) || 0));
      proj.manualProgress = val;
      rangeEl.value = val;
      numEl.value = val;
      circleText.textContent = val + '%';
      const newOff = C - (val/100)*C;
      circleFill.setAttribute('stroke-dashoffset', newOff);
      circleFill.classList.toggle('complete', val === 100);
      saveState();
      if(currentBoardId) renderKanban();
    };

    rangeEl.addEventListener('input', (e) => updateManualProgress(e.target.value));
    numEl.addEventListener('change', (e) => updateManualProgress(e.target.value));
    numEl.addEventListener('keydown', (e) => { if(e.key === 'Enter') { e.preventDefault(); updateManualProgress(e.target.value); } });
  }
}

function renderMetaGrid(proj) {
  const dlInfo = getDeadlineInfo(proj);
  document.getElementById('pn-meta-grid').innerHTML = `
    <div class="pn-meta-item"><div class="pn-meta-label">负责人</div><div class="pn-meta-value">${esc(proj.assignee||'未分配')}</div></div>
    <div class="pn-meta-item"><div class="pn-meta-label">所属板块</div><div class="pn-meta-value">${getBoardName(proj.id)}</div></div>
    <div class="pn-meta-item"><div class="pn-meta-label">截止日期</div><div class="pn-meta-value">${proj.deadline?fmtDate(proj.deadline):'未设置'} ${dlInfo.extra||''}</div></div>
    <div class="pn-meta-item"><div class="pn-meta-label">创建时间</div><div class="pn-meta-value">${proj.createdAt?fmtDate(proj.createdAt):'未知'}</div></div>`;
}

// ============================
// 子任务（含排序 + 插入）
// ============================

// 子任务拖拽排序状态
let stDragSrcIdx = null;

function renderSubtasks(proj) {
  const st = proj.subtasks||[];
  const total = st.length, done = st.filter(s=>s.done).length;
  const pct = total>0 ? Math.round((done/total)*100) : 0;
  document.getElementById('pn-st-count').textContent = total;

  document.getElementById('pn-st-progress').innerHTML = `
    <div class="pn-st-progress-top"><span class="pn-st-progress-text">${done} / ${total} 已完成</span><span class="pn-st-progress-pct">${pct}%</span></div>
    <div class="pn-st-bar"><div class="pn-st-bar-fill ${pct===100?'complete':''}" style="width:${pct}%"></div></div>`;

  const list = document.getElementById('pn-st-list');
  if(st.length===0) {
    list.innerHTML = '<div class="pn-empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><span>还没有子任务</span><span style="font-size:.78rem">在下方输入后按回车添加</span></div>';
    return;
  }

  // 构建子任务列表HTML，每项包含：拖拽手柄、勾选框、文字、排序按钮、编辑/删除按钮，以及项间的"插入"按钮
  let html = '';
  st.forEach((s, idx) => {
    // 在每个子任务之间插入"添加"分隔线（第一个前面也加一个）
    html += `<div class="pn-st-insert-line" data-insert-idx="${idx}">
      <button class="pn-st-insert-btn" data-insert-idx="${idx}" title="在此处插入子任务">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </div>`;

    html += `<div class="pn-st-item" draggable="true" data-sid="${s.id}" data-idx="${idx}">
      <div class="pn-st-grip" title="拖拽排序">
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="3" cy="2" r="1.2"/><circle cx="7" cy="2" r="1.2"/><circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/><circle cx="3" cy="12" r="1.2"/><circle cx="7" cy="12" r="1.2"/></svg>
      </div>
      <div class="pn-st-cb ${s.done?'checked':''}" data-sid="${s.id}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></div>
      <span class="pn-st-text ${s.done?'done':''}">${esc(s.text)}</span>
      <div class="pn-st-actions">
        <button class="pn-st-action-btn st-up-btn" data-idx="${idx}" title="上移" ${idx===0?'disabled':''}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg></button>
        <button class="pn-st-action-btn st-down-btn" data-idx="${idx}" title="下移" ${idx===st.length-1?'disabled':''}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></button>
        <button class="pn-st-action-btn st-edit-btn" data-sid="${s.id}" title="编辑"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="pn-st-action-btn del st-del-btn" data-sid="${s.id}" title="删除"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
    </div>`;
  });
  // 最后一项之后也加插入线
  html += `<div class="pn-st-insert-line" data-insert-idx="${st.length}">
    <button class="pn-st-insert-btn" data-insert-idx="${st.length}" title="在此处插入子任务">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
    </button>
  </div>`;

  list.innerHTML = html;

  // ---- 绑定事件 ----

  // 勾选
  list.querySelectorAll('.pn-st-cb').forEach(cb => {
    cb.addEventListener('click', () => {
      const sid = parseInt(cb.dataset.sid);
      const s = proj.subtasks.find(x=>x.id===sid);
      if(s){ s.done=!s.done; if(s.done) addActivity(proj,'subtask',`完成: ${s.text}`); refreshAfterSubtaskChange(proj); }
    });
  });

  // 编辑
  list.querySelectorAll('.st-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openStEditModal(proj, parseInt(btn.dataset.sid)); });
  });

  // 删除
  list.querySelectorAll('.st-del-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      proj.subtasks = proj.subtasks.filter(s=>s.id!==parseInt(btn.dataset.sid));
      refreshAfterSubtaskChange(proj);
    });
  });

  // 上移
  list.querySelectorAll('.st-up-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); moveSubtask(proj, parseInt(btn.dataset.idx), -1); });
  });

  // 下移
  list.querySelectorAll('.st-down-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); moveSubtask(proj, parseInt(btn.dataset.idx), 1); });
  });

  // 插入按钮 - 点击后在该位置出现一个输入框
  list.querySelectorAll('.pn-st-insert-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const insertIdx = parseInt(btn.dataset.insertIdx);
      const line = btn.closest('.pn-st-insert-line');
      // 如果已经有输入框，直接聚焦
      if(line.querySelector('.pn-st-inline-input')) {
        line.querySelector('.pn-st-inline-input input').focus();
        return;
      }
      // 隐藏按钮，显示内联输入框
      btn.style.display = 'none';
      const inputWrap = document.createElement('div');
      inputWrap.className = 'pn-st-inline-input';
      inputWrap.innerHTML = `<input type="text" placeholder="输入子任务内容，回车添加..." autofocus /><button class="pn-st-inline-cancel" title="取消"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`;
      line.appendChild(inputWrap);
      const input = inputWrap.querySelector('input');
      input.focus();

      const doInsert = () => {
        const text = input.value.trim();
        if(text) {
          insertSubtaskAt(proj, insertIdx, text);
        } else {
          // 取消，恢复按钮
          renderSubtasks(proj);
        }
      };
      input.addEventListener('keydown', ev => {
        if(ev.key === 'Enter') { ev.preventDefault(); doInsert(); }
        if(ev.key === 'Escape') { renderSubtasks(proj); }
      });
      input.addEventListener('blur', () => { setTimeout(() => { if(document.activeElement !== input) renderSubtasks(proj); }, 150); });
      inputWrap.querySelector('.pn-st-inline-cancel').addEventListener('click', ev => { ev.stopPropagation(); renderSubtasks(proj); });
    });
  });

  // ---- 拖拽排序 ----
  list.querySelectorAll('.pn-st-item').forEach(item => {
    // 只允许从拖拽手柄开始拖拽
    const grip = item.querySelector('.pn-st-grip');
    item.addEventListener('dragstart', e => {
      // 检查是否从 grip 开始
      if(!grip.contains(document.elementFromPoint(e.clientX, e.clientY))) {
        e.preventDefault();
        return;
      }
      stDragSrcIdx = parseInt(item.dataset.idx);
      item.classList.add('st-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', item.dataset.idx);
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('st-dragging');
      list.querySelectorAll('.pn-st-item').forEach(i => i.classList.remove('st-drag-over-top','st-drag-over-bottom'));
      stDragSrcIdx = null;
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      item.classList.remove('st-drag-over-top','st-drag-over-bottom');
      if(e.clientY < midY) {
        item.classList.add('st-drag-over-top');
      } else {
        item.classList.add('st-drag-over-bottom');
      }
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('st-drag-over-top','st-drag-over-bottom');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('st-drag-over-top','st-drag-over-bottom');
      const fromIdx = stDragSrcIdx;
      let toIdx = parseInt(item.dataset.idx);
      if(fromIdx === null || fromIdx === toIdx) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const dropAfter = e.clientY >= midY;

      // 执行排序
      const moved = proj.subtasks.splice(fromIdx, 1)[0];
      // 重新计算目标索引（因为 splice 改变了数组）
      if(fromIdx < toIdx) toIdx--;
      if(dropAfter) toIdx++;
      proj.subtasks.splice(toIdx, 0, moved);
      refreshAfterSubtaskChange(proj);
    });
  });
}

// 上下移动子任务
function moveSubtask(proj, idx, direction) {
  const newIdx = idx + direction;
  if(newIdx < 0 || newIdx >= proj.subtasks.length) return;
  const arr = proj.subtasks;
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  refreshAfterSubtaskChange(proj);
}

// 在指定位置插入子任务
function insertSubtaskAt(proj, idx, text) {
  const nid = proj.subtasks.length > 0 ? Math.max(...proj.subtasks.map(s=>s.id)) + 1 : 1;
  proj.subtasks.splice(idx, 0, { id: nid, text, done: false });
  addActivity(proj, 'subtask', `添加子任务: ${text}`);
  refreshAfterSubtaskChange(proj);
}

// 子任务变更后统一刷新
function refreshAfterSubtaskChange(proj) {
  saveState();
  renderSubtasks(proj);
  renderProgressBlock(proj);
  if(currentBoardId) renderKanban();
  renderHomeStats();
}

// 子任务编辑模态框
function openStEditModal(proj, sid) {
  const s = proj.subtasks.find(x=>x.id===sid);
  if(!s) return;
  editingSubtaskId = { projId: proj.id, sid };
  document.getElementById('st-edit-text').value = s.text;
  document.getElementById('st-edit-overlay').classList.add('active');
  setTimeout(() => document.getElementById('st-edit-text').focus(), 200);
}
function closeStEditModal() {
  document.getElementById('st-edit-overlay').classList.remove('active');
  editingSubtaskId = null;
}
function saveStEdit() {
  if(!editingSubtaskId) return;
  const proj = findProject(editingSubtaskId.projId);
  if(!proj) return;
  const s = proj.subtasks.find(x=>x.id===editingSubtaskId.sid);
  if(!s) return;
  const newText = document.getElementById('st-edit-text').value.trim();
  if(!newText) return;
  s.text = newText;
  saveState();
  renderSubtasks(proj);
  if(currentBoardId) renderKanban();
  closeStEditModal();
  toast('子任务已更新');
}

// ============================
// 时间线
// ============================
function renderTimeline(proj) {
  const container = document.getElementById('pn-timeline');
  const acts = (proj.activities||[]).slice().reverse();
  if(acts.length===0) {
    container.innerHTML = '<div class="pn-empty"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>暂无动态记录</span></div>';
    return;
  }
  container.innerHTML = acts.map(a => `
    <div class="pn-tl-item"><div class="pn-tl-dot ${a.type}"></div><span class="pn-tl-text">${a.text}</span><span class="pn-tl-time">${fmtTimeAgo(a.time)}</span></div>
  `).join('');
}

// ============================
// 项目资料 (附件管理)
// ============================
function renderAttachments(proj) {
  const files = proj.attachments || [];
  const countEl = document.getElementById('pn-files-count');
  if (countEl) countEl.textContent = files.length;

  const listEl = document.getElementById('pn-file-list');
  if (!listEl) return;

  if (files.length === 0) {
    listEl.innerHTML = `
      <div class="pn-empty">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
        <span>暂无项目资料</span>
        <span style="font-size:.78rem">拖拽或点击上方区域上传</span>
      </div>`;
    return;
  }

  listEl.innerHTML = files.map(file => {
    const isImage = file.type && file.type.startsWith('image/');
    const iconHtml = isImage 
      ? `<img src="${file.data}" alt="${esc(file.name)}" />`
      : getFileIconSymbol(file.name, file.type);
    
    return `
      <div class="pn-file-item" data-fid="${file.id}">
        <div class="pn-file-icon">${iconHtml}</div>
        <div class="pn-file-info">
          <span class="pn-file-name" title="${esc(file.name)}">${esc(file.name)}</span>
          <div class="pn-file-meta">
            <span>${formatFileSize(file.size)}</span>
            <span>•</span>
            <span>${fmtDate(file.uploadedAt)}</span>
          </div>
        </div>
        <div class="pn-file-actions">
          <button class="pn-file-btn dl-file-btn" data-fid="${file.id}" title="下载"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg></button>
          <button class="pn-file-btn del del-file-btn" data-fid="${file.id}" title="删除"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        </div>
      </div>`;
  }).join('');

  // 绑定下载和删除事件
  listEl.querySelectorAll('.dl-file-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      downloadAttachment(proj, btn.dataset.fid);
    });
  });

  listEl.querySelectorAll('.del-file-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const file = getFile(proj, btn.dataset.fid);
      if(file) {
        showConfirm('确认删除资料', `确定要删除「${esc(file.name)}」吗？此操作不可撤销。`, () => {
          deleteAttachment(proj, btn.dataset.fid);
        });
      }
    });
  });
}

function getFileIconSymbol(name, type) {
  const ext = (name.split('.').pop() || '').toLowerCase();
  if (['pdf'].includes(ext) || (type && type.includes('pdf'))) return '📕';
  if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return '📝';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx'].includes(ext)) return '🚀';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return '📦';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFile(proj, fid) {
  return (proj.attachments || []).find(f => f.id === fid);
}

function handleFileUpload(proj, files) {
  if (!files || files.length === 0) return;
  if (!proj.attachments) proj.attachments = [];

  const MAX_SINGLE_SIZE = 1 * 1024 * 1024; // 1MB
  const MAX_TOTAL_SIZE = 3 * 1024 * 1024;  // 3MB

  let currentTotalSize = proj.attachments.reduce((sum, f) => sum + (f.size || 0), 0);
  let uploadedCount = 0;
  const filesArray = Array.from(files);

  const processNextFile = (index) => {
    if (index >= filesArray.length) {
      if (uploadedCount > 0) {
        try {
          saveState();
          refreshPanel();
          toast(`成功上传了 ${uploadedCount} 个文件`);
        } catch (err) {
          proj.attachments.splice(proj.attachments.length - uploadedCount, uploadedCount);
          toast('存储额度超出限制，上传失败。请清理一些文件！');
          console.error('LocalStorage write failed:', err);
        }
      }
      return;
    }

    const file = filesArray[index];

    if (file.size > MAX_SINGLE_SIZE) {
      toast(`「${file.name}」超出 1MB 限制，上传失败`);
      processNextFile(index + 1);
      return;
    }

    if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
      toast(`上传「${file.name}」将超出项目 3MB 总限额，已终止`);
      processNextFile(index + 1);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      
      const newAttachment = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64Data,
        uploadedAt: new Date().toISOString()
      };

      proj.attachments.push(newAttachment);
      currentTotalSize += file.size;
      uploadedCount++;

      addActivity(proj, 'file', `上传了资料: ${file.name}`);
      processNextFile(index + 1);
    };

    reader.onerror = () => {
      toast(`「${file.name}」读取失败`);
      processNextFile(index + 1);
    };

    reader.readAsDataURL(file);
  };

  processNextFile(0);
}

function downloadAttachment(proj, fid) {
  const file = getFile(proj, fid);
  if (!file) return;

  const a = document.createElement('a');
  a.href = file.data;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  toast(`正在下载: ${file.name}`);
}

function deleteAttachment(proj, fid) {
  const file = getFile(proj, fid);
  if (!file) return;

  proj.attachments = proj.attachments.filter(f => f.id !== fid);
  addActivity(proj, 'file', `删除了资料: ${file.name}`);
  
  saveState();
  refreshPanel();
  toast(`已删除资料: ${file.name}`);
}

// ============================
// 板块模态框
// ============================
function openBoardModal(boardId) {
  editingBoardId = boardId || null;
  const overlay = document.getElementById('board-modal-overlay');
  document.getElementById('board-name').value = '';

  // 重置选择
  document.querySelectorAll('.emoji-opt').forEach((e,i) => e.classList.toggle('selected',i===0));
  document.querySelectorAll('.color-opt').forEach((e,i) => e.classList.toggle('selected',i===0));

  if(boardId) {
    const b = state.boards.find(x=>x.id===boardId);
    if(b) {
      document.getElementById('board-modal-title').textContent = '编辑板块';
      document.getElementById('board-name').value = b.name;
      document.querySelectorAll('.emoji-opt').forEach(e => e.classList.toggle('selected', e.dataset.emoji===b.emoji));
      document.querySelectorAll('.color-opt').forEach(e => e.classList.toggle('selected', e.dataset.color===b.color));
    }
  } else {
    document.getElementById('board-modal-title').textContent = '新建板块';
  }
  overlay.classList.add('active');
  setTimeout(() => document.getElementById('board-name').focus(), 200);
}
function closeBoardModal() { document.getElementById('board-modal-overlay').classList.remove('active'); editingBoardId=null; }

function saveBoardModal() {
  const name = document.getElementById('board-name').value.trim();
  if(!name) return;
  const emoji = document.querySelector('.emoji-opt.selected')?.dataset.emoji || '🔧';
  const color = document.querySelector('.color-opt.selected')?.dataset.color || '#6366f1';

  if(editingBoardId) {
    const b = state.boards.find(x=>x.id===editingBoardId);
    if(b){ b.name=name; b.emoji=emoji; b.color=color; }
    toast('板块已更新');
  } else {
    state.boards.push({ id:state.nextBoardId++, name, emoji, color, projects:[] });
    toast('板块已创建');
  }
  saveState();
  closeBoardModal();
  renderHome();
}

// ============================
// 项目模态框
// ============================
function openProjModal(projId) {
  editingProjId = projId || null;
  const overlay = document.getElementById('proj-modal-overlay');
  document.getElementById('proj-form').reset();

  const assigneeInput = document.getElementById('proj-assignee');
  const user = state.currentUser;

  if (user && user.role !== 'admin') {
    assigneeInput.value = user.name;
    assigneeInput.disabled = true;
  } else {
    assigneeInput.disabled = false;
  }

  if(projId) {
    const p = findProject(projId);
    if(!p) return;
    document.getElementById('proj-modal-title').textContent = '编辑项目';
    document.getElementById('proj-modal-save').textContent = '保存修改';
    document.getElementById('proj-title').value = p.title;
    document.getElementById('proj-desc').value = p.desc||'';
    document.getElementById('proj-priority').value = p.priority;
    document.getElementById('proj-status').value = p.status;
    document.getElementById('proj-assignee').value = p.assignee||'';
    document.getElementById('proj-deadline').value = p.deadline||'';
  } else {
    document.getElementById('proj-modal-title').textContent = '新建项目';
    document.getElementById('proj-modal-save').textContent = '创建项目';
  }
  overlay.classList.add('active');
  setTimeout(() => document.getElementById('proj-title').focus(), 200);
}
function closeProjModal() { document.getElementById('proj-modal-overlay').classList.remove('active'); editingProjId=null; }

function saveProjModal(e) {
  e.preventDefault();
  const title = document.getElementById('proj-title').value.trim();
  if(!title) return;
  const data = {
    title,
    desc: document.getElementById('proj-desc').value.trim(),
    priority: document.getElementById('proj-priority').value,
    status: document.getElementById('proj-status').value,
    assignee: document.getElementById('proj-assignee').value.trim(),
    deadline: document.getElementById('proj-deadline').value
  };

  if(editingProjId) {
    const p = findProject(editingProjId);
    if(p) Object.assign(p, data);
    toast('项目已更新');
  } else {
    const board = state.boards.find(b=>b.id===currentBoardId);
    if(!board) return;
    const proj = {
      id: state.nextProjectId++,
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
      subtasks: [],
      attachments: [],
      activities: [{ type:'create', text:`${data.assignee||'我'} 创建了项目`, time:new Date().toISOString() }]
    };
    board.projects.push(proj);
    toast('项目已创建');
  }
  saveState();
  closeProjModal();
  if(currentBoardId) renderKanban();
  renderHomeStats();
}

function deleteProject(projId) {
  state.boards.forEach(b => { b.projects = b.projects.filter(p=>p.id!==projId); });
  saveState();
  if(currentBoardId) renderKanban();
  renderHomeStats();
  toast('项目已删除');
}

// ============================
// 确认框
// ============================
function showConfirm(title, msg, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  confirmCallback = cb;
  document.getElementById('confirm-overlay').classList.add('active');
}
function closeConfirm() { document.getElementById('confirm-overlay').classList.remove('active'); confirmCallback=null; }

// ============================
// 工具函数
// ============================

// 统一获取项目进度（有子任务时自动计算，无子任务时用手动进度）
function getProjectProgress(proj) {
  const st = proj.subtasks || [];
  if (st.length > 0) {
    const done = st.filter(s => s.done).length;
    return Math.round((done / st.length) * 100);
  }
  return proj.manualProgress || 0;
}

function getAllProjects() {
  const all = [];
  const user = state.currentUser;
  state.boards.forEach(b => {
    b.projects.forEach(p => {
      if (!user) return;
      if (user.role === 'admin') {
        all.push(p);
        return;
      }
      const allowed = user.allowedAssignees || [];
      if (p.assignee === user.name || allowed.includes(p.assignee)) {
        all.push(p);
      }
    });
  });
  return all;
}

function findProject(pid) {
  for(const b of state.boards) {
    const p = b.projects.find(x=>x.id===pid);
    if(p) return p;
  }
  return null;
}

function getBoardName(pid) {
  for(const b of state.boards) {
    if(b.projects.find(x=>x.id===pid)) return `${b.emoji} ${b.name}`;
  }
  return '未知';
}

function addActivity(proj, type, text) {
  if(!proj.activities) proj.activities=[];
  proj.activities.push({ type, text, time:new Date().toISOString() });
}

function getDeadlineInfo(p) {
  if(!p.deadline) return { text:'未设置', cls:'', extra:'' };
  if(p.status==='done') return { text:fmtDate(p.deadline), cls:'', extra:'' };
  const today=new Date(); today.setHours(0,0,0,0);
  const dl=new Date(p.deadline); dl.setHours(0,0,0,0);
  const diff=Math.floor((dl-today)/(864e5));
  if(diff<0) return { text:`逾期 ${Math.abs(diff)} 天`, cls:'overdue', extra:`<span style="color:var(--priority-high)">逾期 ${Math.abs(diff)} 天</span>` };
  if(diff===0) return { text:'今天截止', cls:'soon', extra:'<span style="color:var(--priority-medium)">今天截止</span>' };
  if(diff<=3) return { text:`${diff} 天后`, cls:'soon', extra:`还剩 ${diff} 天` };
  return { text:fmtDate(p.deadline), cls:'', extra:`还剩 ${diff} 天` };
}

function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function fmtDate(s) { if(!s)return''; const d=new Date(s); return `${d.getMonth()+1}月${d.getDate()}日`; }
function fmtTimeAgo(s) {
  if(!s)return'';
  const now=new Date(),d=new Date(s),ms=now-d;
  const m=Math.floor(ms/6e4),h=Math.floor(ms/36e5),dy=Math.floor(ms/864e5);
  if(m<1)return'刚刚'; if(m<60)return`${m} 分钟前`; if(h<24)return`${h} 小时前`; if(dy<7)return`${dy} 天前`; return fmtDate(s);
}

function toast(msg) {
  const c=document.getElementById('toast-container'),t=document.createElement('div');
  t.className='toast toast-success';
  t.innerHTML=`<span class="toast-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg></span><span>${esc(msg)}</span>`;
  c.appendChild(t);
  setTimeout(()=>{if(t.parentNode)t.remove();},3000);
}

// ============================
// 登录鉴权与用户管理业务逻辑
// ============================
function checkAuthAndRender() {
  const loginOverlay = document.getElementById('login-overlay');
  const userProfile = document.getElementById('user-profile');
  const btnUserMgmt = document.getElementById('btn-user-mgmt');

  if (!state.currentUser) {
    loginOverlay.style.display = 'flex';
    userProfile.style.display = 'none';
    btnUserMgmt.style.display = 'none';
    document.getElementById('view-home').style.display = 'none';
    document.getElementById('view-board').style.display = 'none';
  } else {
    loginOverlay.style.display = 'none';
    userProfile.style.display = 'flex';
    
    const name = state.currentUser.name || '';
    document.getElementById('user-avatar').textContent = name.charAt(0) || 'U';
    document.getElementById('user-display-name').textContent = name;

    if (state.currentUser.role === 'admin') {
      btnUserMgmt.style.display = 'inline-flex';
    } else {
      btnUserMgmt.style.display = 'none';
    }

    showHome();
  }
}

function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (!username || !password) return;

  const matchedUser = state.users.find(u => u.username === username && u.password === password);
  
  if (matchedUser) {
    state.currentUser = {
      id: matchedUser.id,
      username: matchedUser.username,
      name: matchedUser.name,
      role: matchedUser.role
    };
    saveState();
    usernameInput.value = '';
    passwordInput.value = '';
    
    checkAuthAndRender();
    toast(`登录成功，欢迎您，${state.currentUser.name}！`);
  } else {
    toast('用户名或密码错误，请重新输入');
  }
}

function handleLogout() {
  state.currentUser = null;
  saveState();
  closePanel();
  checkAuthAndRender();
  toast('已退出登录');
}

let editingUserId = null;

function renderUserTable() {
  const tbody = document.getElementById('user-table-body');
  if (!tbody) return;

  tbody.innerHTML = state.users.map(u => {
    const isSelf = state.currentUser && state.currentUser.username === u.username;
    const roleText = u.role === 'admin' ? '<span class="tbl-status in-progress">管理员</span>' : '<span class="tbl-status backlog">普通成员</span>';
    
    return `
      <tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding: 10px 14px;"><strong>${esc(u.username)}</strong></td>
        <td style="padding: 10px 14px;">${esc(u.name)}</td>
        <td style="padding: 10px 14px;">${roleText}</td>
        <td style="padding: 10px 14px; text-align: right;">
          <button class="btn btn-ghost edit-user-btn" data-uid="${u.id}" style="padding: 3px 8px; font-size: .75rem; border-radius: var(--r-sm);" title="编辑账号">编辑</button>
          <button class="btn btn-ghost del-user-btn" data-uid="${u.id}" ${isSelf ? 'disabled' : ''} style="padding: 3px 8px; font-size: .75rem; border-radius: var(--r-sm); color: ${isSelf ? 'var(--text-muted)' : 'var(--red)'}; border-color: ${isSelf ? 'var(--border)' : 'rgba(229,72,77,.2)'};" title="删除">删除</button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openUserEditModal(parseInt(btn.dataset.uid));
    });
  });

  tbody.querySelectorAll('.del-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = parseInt(btn.dataset.uid);
      const user = state.users.find(u => u.id === uid);
      if (user) {
        showConfirm('确认删除账号', `确定要删除账号「${esc(user.username)} / ${esc(user.name)}」吗？相关项目将失去匹配关联。`, () => {
          deleteUser(uid);
        });
      }
    });
  });
}

function openUserMgmtModal() {
  if (state.currentUser && state.currentUser.role === 'admin') {
    renderUserTable();
    document.getElementById('user-mgmt-overlay').classList.add('active');
  }
}

function closeUserMgmtModal() {
  document.getElementById('user-mgmt-overlay').classList.remove('active');
}

function openUserEditModal(userId) {
  editingUserId = userId || null;
  const overlay = document.getElementById('user-edit-overlay');
  const form = document.getElementById('user-edit-form');
  form.reset();

  const userRoleSel = document.getElementById('user-role');
  const permissionsGroup = document.getElementById('user-edit-permissions-group');

  if (userId) {
    const u = state.users.find(x => x.id === userId);
    if (u) {
      document.getElementById('user-edit-title').textContent = '编辑账号';
      document.getElementById('user-edit-id').value = u.id;
      document.getElementById('user-username').value = u.username;
      document.getElementById('user-username').disabled = true;
      document.getElementById('user-realname').value = u.name;
      document.getElementById('user-password').value = u.password;
      userRoleSel.value = u.role;

      // 渲染其它的普通用户以供选择权限
      renderPermissionsList(u);
      permissionsGroup.style.display = u.role === 'user' ? 'block' : 'none';
    }
  } else {
    document.getElementById('user-edit-title').textContent = '新增账号';
    document.getElementById('user-username').disabled = false;
    document.getElementById('user-edit-id').value = '';
    
    // 新增时默认是 user，渲染对应的空白权限列表并展示
    renderPermissionsList(null);
    permissionsGroup.style.display = 'block';
  }
  
  overlay.classList.add('active');
  setTimeout(() => {
    if (userId) {
      document.getElementById('user-realname').focus();
    } else {
      document.getElementById('user-username').focus();
    }
  }, 200);
}

function renderPermissionsList(targetUser) {
  const container = document.getElementById('user-permissions-list');
  if (!container) return;

  // 筛选出系统中其它的普通用户（排除当前正在编辑的用户以及管理员账号）
  const others = state.users.filter(u => u.role !== 'admin' && (!targetUser || u.id !== targetUser.id));

  if (others.length === 0) {
    container.innerHTML = '<span style="font-size: .75rem; color: var(--text-muted);">暂无其它普通成员可供授权</span>';
    return;
  }

  const allowed = targetUser ? (targetUser.allowedAssignees || []) : [];

  container.innerHTML = others.map(u => `
    <label class="pn-permissions-checkbox" style="display: flex; align-items: center; gap: 6px; font-size: .8rem; margin: 4px 0; cursor: pointer;">
      <input type="checkbox" name="allowed-assignee" value="${esc(u.name)}" ${allowed.includes(u.name) ? 'checked' : ''} style="width: auto;" />
      <span>${esc(u.name)} (${esc(u.username)})</span>
    </label>
  `).join('');
}

function closeUserEditModal() {
  document.getElementById('user-edit-overlay').classList.remove('active');
  editingUserId = null;
}

function saveUserEdit(e) {
  e.preventDefault();
  const idVal = document.getElementById('user-edit-id').value;
  const username = document.getElementById('user-username').value.trim().toLowerCase();
  const name = document.getElementById('user-realname').value.trim();
  const password = document.getElementById('user-password').value;
  const role = document.getElementById('user-role').value;

  if (!username || !name || !password) return;

  // 收集勾选的跨人员查看维度姓名
  const allowedAssignees = [];
  if (role === 'user') {
    const checkboxes = document.querySelectorAll('input[name="allowed-assignee"]:checked');
    checkboxes.forEach(cb => allowedAssignees.push(cb.value));
  }

  if (idVal) {
    const uid = parseInt(idVal);
    const u = state.users.find(x => x.id === uid);
    if (u) {
      u.name = name;
      u.password = password;
      u.role = role;
      u.allowedAssignees = allowedAssignees;
      
      if (state.currentUser && state.currentUser.id === uid) {
        state.currentUser.name = name;
        state.currentUser.role = role;
        state.currentUser.allowedAssignees = allowedAssignees;
      }
      toast('账号已更新');
    }
  } else {
    if (state.users.some(u => u.username === username)) {
      toast('该用户名已存在，请更换');
      return;
    }
    state.users.push({
      id: state.nextUserId++,
      username,
      name,
      password,
      role,
      allowedAssignees
    });
    toast('账号已创建');
  }

  saveState();
  closeUserEditModal();
  renderUserTable();
  checkAuthAndRender();
}

function deleteUser(uid) {
  state.users = state.users.filter(u => u.id !== uid);
  saveState();
  renderUserTable();
  toast('账号已删除');
}
