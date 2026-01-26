// ★★★ 미션 시스템 ★★★
const MissionSystem = {
    // 다국어 미션 데이터
    getMissionData() {
        const lang = window.currentLang || (typeof currentLang !== 'undefined' ? currentLang : 'en');
        
        if (lang === 'ko') {
            return {
                tutorials: [
                    { id: 'tut_board', name: '우주선 탑승', desc: 'ISS 우주정거장에서 우주선 탑승', icon: '🚀', reward: 50, type: 'tutorial' },
                    { id: 'tut_move', name: '첫 비행', desc: '우주선으로 100 유닛 이상 비행', icon: '✈️', reward: 50, type: 'tutorial', target: 100 },
                    { id: 'tut_target', name: '항법 목표 설정', desc: '항법 목표 설정하기', icon: '🎯', reward: 30, type: 'tutorial' },
                    { id: 'tut_autopilot', name: '자동항법 사용', desc: '자동항법 활성화', icon: '🤖', reward: 50, type: 'tutorial' },
                    { id: 'tut_dock', name: '도킹 성공', desc: '우주 정거장에 도킹', icon: '🔗', reward: 100, type: 'tutorial' },
                    { id: 'tut_refuel', name: '연료 보급', desc: '정거장에서 연료 보급', icon: '⛽', reward: 30, type: 'tutorial' }
                ],
                exploration: [
                    { id: 'exp_earth', name: '지구 궤도', desc: '지구 주위 궤도 진입', icon: '🌍', reward: 100, type: 'exploration', target: '지구' },
                    { id: 'exp_moon', name: '달 탐사', desc: '달에 접근', icon: '🌙', reward: 150, type: 'exploration', target: '달' },
                    { id: 'exp_mars', name: '화성 탐사', desc: '화성에 접근', icon: '🔴', reward: 250, type: 'exploration', target: '화성' },
                    { id: 'exp_jupiter', name: '목성 근접 통과', desc: '목성에 접근', icon: '🪐', reward: 500, type: 'exploration', target: '목성', minLevel: 3 },
                    { id: 'exp_saturn', name: '토성 고리 탐험', desc: '토성에 접근', icon: '💫', reward: 600, type: 'exploration', target: '토성', minLevel: 4 }
                ]
            };
        } else if (lang === 'ja') {
            return {
                tutorials: [
                    { id: 'tut_board', name: '宇宙船搭乗', desc: 'ISS宇宙ステーションで宇宙船に搭乗', icon: '🚀', reward: 50, type: 'tutorial' },
                    { id: 'tut_move', name: '初飛行', desc: '宇宙船で100ユニット以上飛行', icon: '✈️', reward: 50, type: 'tutorial', target: 100 },
                    { id: 'tut_target', name: '航法目標設定', desc: '航法目標を設定', icon: '🎯', reward: 30, type: 'tutorial' },
                    { id: 'tut_autopilot', name: '自動航法使用', desc: '自動航法を有効化', icon: '🤖', reward: 50, type: 'tutorial' },
                    { id: 'tut_dock', name: 'ドッキング成功', desc: '宇宙ステーションにドッキング', icon: '🔗', reward: 100, type: 'tutorial' },
                    { id: 'tut_refuel', name: '燃料補給', desc: 'ステーションで燃料補給', icon: '⛽', reward: 30, type: 'tutorial' }
                ],
                exploration: [
                    { id: 'exp_earth', name: '地球軌道', desc: '地球周回軌道に入る', icon: '🌍', reward: 100, type: 'exploration', target: '지구' },
                    { id: 'exp_moon', name: '月探査', desc: '月に接近', icon: '🌙', reward: 150, type: 'exploration', target: '달' },
                    { id: 'exp_mars', name: '火星探査', desc: '火星に接近', icon: '🔴', reward: 250, type: 'exploration', target: '화성' },
                    { id: 'exp_jupiter', name: '木星近接通過', desc: '木星に接近', icon: '🪐', reward: 500, type: 'exploration', target: '목성', minLevel: 3 },
                    { id: 'exp_saturn', name: '土星リング探検', desc: '土星に接近', icon: '💫', reward: 600, type: 'exploration', target: '토성', minLevel: 4 }
                ]
            };
        } else {
            // English (default) - also used for zh, fr, la
            return {
                tutorials: [
                    { id: 'tut_board', name: 'Board Spaceship', desc: 'Board a spaceship at ISS Space Station', icon: '🚀', reward: 50, type: 'tutorial' },
                    { id: 'tut_move', name: 'First Flight', desc: 'Fly more than 100 units with spaceship', icon: '✈️', reward: 50, type: 'tutorial', target: 100 },
                    { id: 'tut_target', name: 'Set Navigation Target', desc: 'Set a navigation target', icon: '🎯', reward: 30, type: 'tutorial' },
                    { id: 'tut_autopilot', name: 'Use Autopilot', desc: 'Activate autopilot', icon: '🤖', reward: 50, type: 'tutorial' },
                    { id: 'tut_dock', name: 'Docking Success', desc: 'Dock at a space station', icon: '🔗', reward: 100, type: 'tutorial' },
                    { id: 'tut_refuel', name: 'Refuel', desc: 'Refuel at a station', icon: '⛽', reward: 30, type: 'tutorial' }
                ],
                exploration: [
                    { id: 'exp_earth', name: 'Earth Orbit', desc: 'Enter orbit around Earth', icon: '🌍', reward: 100, type: 'exploration', target: '지구' },
                    { id: 'exp_moon', name: 'Moon Exploration', desc: 'Approach the Moon', icon: '🌙', reward: 150, type: 'exploration', target: '달' },
                    { id: 'exp_mars', name: 'Mars Exploration', desc: 'Approach Mars', icon: '🔴', reward: 250, type: 'exploration', target: '화성' },
                    { id: 'exp_jupiter', name: 'Jupiter Flyby', desc: 'Approach Jupiter', icon: '🪐', reward: 500, type: 'exploration', target: '목성', minLevel: 3 },
                    { id: 'exp_saturn', name: 'Saturn Ring Exploration', desc: 'Approach Saturn', icon: '💫', reward: 600, type: 'exploration', target: '토성', minLevel: 4 }
                ]
            };
        }
    },
    
    // 현재 언어의 미션 목록 가져오기
    get tutorials() {
        return this.getMissionData().tutorials;
    },
    
    get exploration() {
        return this.getMissionData().exploration;
    },
    
    // 사용자 미션 진행 상황 (localStorage에서 로드)
    progress: {},
    
    init: function() {
        this.loadProgress();
        this.render();
    },
    
    loadProgress: function() {
        // ★ 싱글모드: localStorage, 멀티모드는 loadProgressAsync 사용
        const saved = localStorage.getItem('starwalker-missions');
        if (saved) {
            try {
                this.progress = JSON.parse(saved);
            } catch (e) {
                this.progress = {};
            }
        }

        // 기본 진행 상황 초기화
        this.initDefaultProgress();
    },

    // ★ 비동기 로드 (멀티모드용)
    loadProgressAsync: async function() {
        if (window.gameMode !== 'multi') {
            this.loadProgress();
            return;
        }
        try {
            const serverData = await GameDataManager.load('missions', 'starwalker-missions');
            if (serverData) {
                this.progress = serverData;
                console.log('✅ 미션 진행 서버에서 로드됨');
            }
        } catch (e) {
            console.warn('미션 진행 서버 로드 실패:', e);
        }
        this.initDefaultProgress();
    },

    // ★ 기본 진행 상황 초기화
    initDefaultProgress: function() {
        [...this.tutorials, ...this.exploration].forEach(m => {
            if (!this.progress[m.id]) {
                this.progress[m.id] = { current: 0, completed: false, accepted: m.type === 'tutorial' };
            }
        });
    },

    saveProgress: function() {
        // ★ GameDataManager를 통해 저장 (멀티: 서버, 싱글: 로컬)
        GameDataManager.save('missions', this.progress, 'starwalker-missions');
    },
    
    // 미션 진행 업데이트
    updateProgress: function(missionId, value = 1) {
        if (!this.progress[missionId]) return;
        if (this.progress[missionId].completed) return;
        
        this.progress[missionId].current += value;
        
        const mission = this.getMission(missionId);
        if (mission) {
            const target = mission.target ? 1 : (mission.targetValue || 1);
            if (typeof target === 'number' && this.progress[missionId].current >= target) {
                this.completeMission(missionId);
            }
        }
        
        this.saveProgress();
        this.render();
    },
    
    // 미션 완료
    completeMission: function(missionId) {
        if (!this.progress[missionId] || this.progress[missionId].completed) return;
        
        const mission = this.getMission(missionId);
        if (!mission) return;
        
        this.progress[missionId].completed = true;
        this.progress[missionId].current = 1;
        
        // 보상 지급
        if (typeof addCoins === 'function') {
            addCoins(mission.reward);
        }
        
        // 경험치 지급
        if (typeof addExp === 'function') {
            addExp(mission.reward);
        }
        
        this.saveProgress();
        AudioManager.playSFX('sfx_mission_complete');  // ★ 미션 완료 효과음
        showMsg(`🎉 Mission Complete! "${mission.name}" - ${mission.reward} coins earned!`);
    },
    
    getMission: function(id) {
        return [...this.tutorials, ...this.exploration].find(m => m.id === id);
    },
    
    // 미션 보드 렌더링
    render: function(tab = 'active') {
        const list = document.getElementById('mission-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        const allMissions = [...this.tutorials, ...this.exploration];
        const userLevel = window.userLevel || 1;
        
        allMissions.forEach(mission => {
            const prog = this.progress[mission.id] || { current: 0, completed: false, accepted: false };
            
            // 탭 필터링
            if (tab === 'active' && (!prog.accepted || prog.completed)) return;
            if (tab === 'available' && (prog.accepted || prog.completed)) return;
            if (tab === 'completed' && !prog.completed) return;
            
            // 레벨 잠금
            const isLocked = mission.minLevel && userLevel < mission.minLevel;
            
            const card = document.createElement('div');
            card.className = 'mission-card' + (isLocked ? ' locked' : '') + (prog.completed ? ' completed' : '');
            
            const targetValue = typeof mission.target === 'number' ? mission.target : 1;
            const progressPercent = prog.completed ? 100 : Math.min(100, Math.round((prog.current / targetValue) * 100));
            
            card.innerHTML = `
                <div class="mission-icon">${mission.icon}</div>
                <div class="mission-info">
                    <div class="mission-name">${mission.name}</div>
                    <div class="mission-desc">${mission.desc}</div>
                    ${isLocked ? 
                        `<div class="mission-status">🔒 ${currentLang === 'ko' ? '레벨' : currentLang === 'ja' ? 'レベル' : 'Level'} ${mission.minLevel} ${currentLang === 'ko' ? '필요' : currentLang === 'ja' ? '必要' : 'Required'}</div>` :
                        prog.completed ?
                        `<div class="mission-status completed">✅ ${currentLang === 'ko' ? '완료!' : currentLang === 'ja' ? '完了!' : 'Complete!'}</div>` :
                        `<div class="mission-progress">
                            <div class="progress-bar"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
                            <span>${progressPercent}%</span>
                        </div>`
                    }
                </div>
                <div class="mission-reward">🪙 ${mission.reward}</div>
            `;
            
            // 수락 가능 미션 클릭 시 수락
            if (tab === 'available' && !isLocked && !prog.accepted) {
                card.style.cursor = 'pointer';
                card.onclick = () => {
                    this.progress[mission.id].accepted = true;
                    this.saveProgress();
                    const acceptMsg = currentLang === 'ko' ? `📋 미션 수락: "${mission.name}"` :
                                     currentLang === 'ja' ? `📋 ミッション受諾: "${mission.name}"` :
                                     `📋 Mission Accepted: "${mission.name}"`;
                    showMsg(acceptMsg);
                    this.render('active');
                    // 활성 탭으로 전환
                    document.querySelectorAll('.mission-tab').forEach(t => t.classList.remove('active'));
                    document.querySelector('.mission-tab[data-tab="active"]').classList.add('active');
                };
            }
            
            list.appendChild(card);
        });
        
        // 빈 목록 메시지
        if (list.children.length === 0) {
            const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';
            let emptyMsg;
            if (lang === 'ko') {
                emptyMsg = tab === 'active' ? '진행 중인 미션이 없습니다' : 
                          tab === 'available' ? '수락 가능한 미션이 없습니다' : 
                          '완료한 미션이 없습니다';
            } else if (lang === 'ja') {
                emptyMsg = tab === 'active' ? '進行中のミッションがありません' : 
                          tab === 'available' ? '受諾可能なミッションがありません' : 
                          '完了したミッションがありません';
            } else {
                emptyMsg = tab === 'active' ? 'No active missions' : 
                          tab === 'available' ? 'No available missions' : 
                          'No completed missions';
            }
            list.innerHTML = `<div style="text-align: center; color: #666; padding: 20px;">${emptyMsg}</div>`;
        }
    }
};

// 미션 완료 스타일 추가
const missionStyle = document.createElement('style');
missionStyle.textContent = `
    .mission-card.completed { opacity: 0.7; border-color: #00ff88; }
    .mission-card.completed .mission-icon { filter: grayscale(0.5); }
    .mission-status.completed { color: #00ff88; font-weight: bold; }
`;
document.head.appendChild(missionStyle);

// 게임 이벤트에서 미션 업데이트 호출
window.MissionSystem = MissionSystem;
