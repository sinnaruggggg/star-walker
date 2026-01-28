// ===== 광고 보상 시스템 =====
const adBooster = {
    active: false,
    multiplier: 2.0,
    endTime: 0,
    duration: 300000  // 5분
};

const emergencyEscapeCharge = {
    charged: false,
    chargeEndTime: 0  // 10분 유효
};

const spaceExplorer = {
    active: false,
    remainingTime: 0,
    duration: 180000  // 3분
};

// 광고 시청 시뮬레이션 (실제로는 광고 SDK 연동)
function simulateAdWatch(callback) {
    const adModal = document.createElement('div');
    adModal.id = 'ad-modal';
    adModal.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;flex-direction:column;justify-content:center;align-items:center;z-index:100000;">
            <div style="color:#fff;font-size:2em;margin-bottom:20px;">📺 광고 시청 중...</div>
            <div id="ad-countdown" style="color:#0ff;font-size:3em;">3</div>
        </div>
    `;
    document.body.appendChild(adModal);
    
    let count = 3;
    const interval = setInterval(() => {
        count--;
        document.getElementById('ad-countdown').textContent = count;
        if (count <= 0) {
            clearInterval(interval);
            document.body.removeChild(adModal);
            callback();
        }
    }, 1000);
}

// 광고 보고 2배 부스터 얻기
function watchAdForBooster() {
    simulateAdWatch(() => {
        adBooster.active = true;
        adBooster.endTime = Date.now() + adBooster.duration;
        updateAdUI();
        if (typeof showMessage === 'function') {
            showMessage('🚀 2배 부스터 활성화! (5분)');
        }
    });
}

// 광고 보고 긴급탈출 충전
function watchAdForEscape() {
    simulateAdWatch(() => {
        emergencyEscapeCharge.charged = true;
        emergencyEscapeCharge.chargeEndTime = Date.now() + 600000; // 10분
        updateAdUI();
        if (typeof showMessage === 'function') {
            showMessage('⚡ 긴급탈출 충전 완료! (10분간 유효)');
        }
    });
}

// 광고 보고 둘러보기 (멀티 전용)
function watchAdForExplore() {
    if (window.gameMode !== 'multi') return;
    simulateAdWatch(() => {
        spaceExplorer.active = true;
        spaceExplorer.remainingTime += spaceExplorer.duration;
        updateAdUI();
        if (typeof showMessage === 'function') {
            showMessage('🔭 둘러보기 모드 +3분 추가!');
        }
    });
}

// 광고 UI 업데이트
function updateAdUI() {
    // 초기화 전에는 실행 안함
    if (typeof window.gameMode === 'undefined') return;
    
    const boosterBtn = document.getElementById('ad-booster-btn');
    const escapeBtn = document.getElementById('ad-escape-btn');
    const exploreBtn = document.getElementById('ad-explore-btn');
    const boosterStatus = document.getElementById('booster-status');
    const escapeStatus = document.getElementById('escape-status');
    const exploreStatus = document.getElementById('explore-status');
    const exploreItem = document.getElementById('ad-item-explore');
    
    if (boosterBtn && boosterStatus) {
        if (adBooster.active) {
            const remaining = Math.max(0, adBooster.endTime - Date.now());
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            boosterStatus.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
            boosterStatus.style.color = '#0f0';
            boosterBtn.textContent = t('activated');
            boosterBtn.disabled = true;
            boosterBtn.style.opacity = '0.6';
        } else {
            boosterStatus.textContent = '';
            boosterBtn.textContent = t('watchAdBtn');
            boosterBtn.disabled = false;
            boosterBtn.style.opacity = '1';
        }
    }
    
    if (escapeBtn && escapeStatus) {
        if (emergencyEscapeCharge.charged) {
            const remaining = Math.max(0, emergencyEscapeCharge.chargeEndTime - Date.now());
            const mins = Math.floor(remaining / 60000);
            escapeStatus.textContent = `${mins}${t('minutes')}`;
            escapeStatus.style.color = '#0f0';
            escapeBtn.textContent = t('chargeComplete');
            escapeBtn.disabled = true;
            escapeBtn.style.opacity = '0.6';
        } else {
            escapeStatus.textContent = '';
            escapeBtn.textContent = t('watchAdBtn');
            escapeBtn.disabled = false;
            escapeBtn.style.opacity = '1';
        }
    }
    
    if (exploreItem) {
        exploreItem.style.display = (window.gameMode === 'multi') ? 'block' : 'none';
    }
    
    if (exploreBtn && exploreStatus) {
        if (spaceExplorer.active && spaceExplorer.remainingTime > 0) {
            const mins = Math.floor(spaceExplorer.remainingTime / 60000);
            const secs = Math.floor((spaceExplorer.remainingTime % 60000) / 1000);
            exploreStatus.textContent = `${mins}:${secs.toString().padStart(2,'0')}`;
            exploreStatus.style.color = '#0f0';
        } else {
            exploreStatus.textContent = '';
        }
    }
}

// 타이머 체크 (매 프레임)
function checkAdTimers() {
    const now = Date.now();
    
    if (adBooster.active && now >= adBooster.endTime) {
        adBooster.active = false;
        if (typeof showMessage === 'function') {
            showMessage('⏰ 부스터 효과가 종료되었습니다');
        }
    }
    
    if (emergencyEscapeCharge.charged && now >= emergencyEscapeCharge.chargeEndTime) {
        emergencyEscapeCharge.charged = false;
        if (typeof showMessage === 'function') {
            showMessage('⏰ 긴급탈출 충전이 만료되었습니다');
        }
    }
    
    // 메뉴 버튼 상태 표시
    const menuToggle = document.getElementById('ad-menu-toggle');
    if (menuToggle) {
        if (adBooster.active || emergencyEscapeCharge.charged) {
            menuToggle.style.borderColor = '#0f0';
            menuToggle.style.boxShadow = '0 0 10px #0f0';
        } else {
            menuToggle.style.borderColor = '#0ff';
            menuToggle.style.boxShadow = 'none';
        }
    }
    
    // 긴급탈출 부스터 HUD 표시 (조종 중일 때만)
    const escapeHUD = document.getElementById('warn-escape-ready');
    if (escapeHUD && typeof isPilotMode !== 'undefined') {
        if (isPilotMode && emergencyEscapeCharge.charged) {
            escapeHUD.style.display = 'block';
            // 중력 위험 시 번쩍임
            if (typeof isGravityWarning !== 'undefined' && isGravityWarning) {
                escapeHUD.style.animation = 'escapeFlash 0.5s ease-in-out infinite alternate';
            } else {
                escapeHUD.style.animation = 'none';
            }
        } else {
            escapeHUD.style.display = 'none';
        }
    }
    
    updateAdUI();
}

// 1초마다 타이머 체크 (DOM 로드 후)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        setInterval(checkAdTimers, 1000);
    }, 2000);
});

// ===== 천체 정보 표시 (멀티모드용) =====
const BODY_RESOURCES = {
    'SUN': ['수소', '헬륨', '플라즈마 에너지'],
    'MERCURY': ['철', '니켈', '규소', '황'],
    'VENUS': ['황산', '이산화탄소', '질소', '황'],
    'EARTH': ['물', '산소', '철', '금', '석유', '희토류'],
    'MARS': ['철', '마그네슘', '물(얼음)', '이산화탄소', '규소'],
    'JUPITER': ['수소', '헬륨', '메탄', '암모니아'],
    'SATURN': ['수소', '헬륨', '암모니아', '메탄'],
    'URANUS': ['메탄', '수소', '헬륨', '얼음', '암모니아'],
    'NEPTUNE': ['메탄', '수소', '헬륨', '다이아몬드', '얼음'],
    'MOON': ['헬륨-3', '티타늄', '철', '물(얼음)', '알루미늄'],
    'TITAN': ['메탄', '에탄', '질소', '물(얼음)', '유기물'],
    'EUROPA': ['물(얼음)', '산소', '소금', '황산마그네슘'],
    'GANYMEDE': ['물(얼음)', '철', '규소', '마그네슘'],
    'CALLISTO': ['물(얼음)', '암석', '이산화탄소'],
    'IO': ['황', '이산화황', '규소', '나트륨'],
    'ENCELADUS': ['물(얼음)', '유기물', '소금', '수소'],
    'TRITON': ['질소(얼음)', '메탄', '물(얼음)', '이산화탄소'],
    'PLUTO': ['질소(얼음)', '메탄(얼음)', '물(얼음)'],
    'CERES': ['물(얼음)', '암모니아', '탄산염'],
    'PHOBOS': ['철', '탄소', '규소'],
    'DEIMOS': ['탄소', '규소', '철']
};

// 테라포밍 상태 데이터
const BODY_TERRAFORMING = {
    'EARTH': { percent: 100, status: '완전 생태계', phase: '유지' },
    'MOON': { percent: 8, status: '돔 기지 건설 중', phase: '1단계' },
    'MARS': { percent: 3, status: '대기 증가 중', phase: '1단계' },
    'VENUS': { percent: 0.1, status: '대기 냉각 연구 중', phase: '계획' },
    'TITAN': { percent: 0.5, status: '메탄 호수 연구 중', phase: '탐사' },
    'EUROPA': { percent: 1, status: '얼음 아래 해양 탐사', phase: '탐사' },
    'GANYMEDE': { percent: 0.2, status: '자기장 연구 중', phase: '계획' },
    'ENCELADUS': { percent: 0.3, status: '열수구 탐사', phase: '탐사' },
    'default': { percent: 0, status: '미탐사', phase: '-' }
};

// 인프라 데이터
const BODY_INFRASTRUCTURE = {
    'EARTH': { 
        spaceport: true, refuel: true, repair: true, shop: true, research: true, mining: true,
        description: '완전한 문명 인프라'
    },
    'MOON': { 
        spaceport: true, refuel: true, repair: true, shop: false, research: true, mining: true,
        description: '달 기지 (아르테미스)'
    },
    'MARS': { 
        spaceport: true, refuel: true, repair: false, shop: false, research: true, mining: false,
        description: '화성 전초기지'
    },
    'ISS': { 
        spaceport: true, refuel: true, repair: true, shop: true, research: true, mining: false,
        description: '국제우주정거장'
    },
    'EUROPA': { 
        spaceport: false, refuel: false, repair: false, shop: false, research: true, mining: false,
        description: '유로파 탐사선'
    },
    'TITAN': { 
        spaceport: false, refuel: false, repair: false, shop: false, research: true, mining: false,
        description: '타이탄 착륙선'
    },
    'default': { 
        spaceport: false, refuel: false, repair: false, shop: false, research: false, mining: false,
        description: '인프라 없음'
    }
};

// 식민지 상태
const BODY_COLONY_STATUS = {
    'EARTH': { status: '모행성', population: '80억', level: '5' },
    'MOON': { status: '기지 건설 중', population: '1,200명', level: '2' },
    'MARS': { status: '초기 정착', population: '150명', level: '1' },
    'ISS': { status: '운영 중', population: '7명', level: '3' },
    'default': { status: '미개척', population: '0명', level: '0' }
};

// 천체 물리 데이터
const BODY_PHYSICS = {
    'SUN': { gravity: '274 m/s²', temp: '5,500°C (표면)' },
    'MERCURY': { gravity: '3.7 m/s²', temp: '-180~430°C' },
    'VENUS': { gravity: '8.87 m/s²', temp: '465°C' },
    'EARTH': { gravity: '9.8 m/s²', temp: '-89~57°C' },
    'MARS': { gravity: '3.72 m/s²', temp: '-140~20°C' },
    'JUPITER': { gravity: '24.79 m/s²', temp: '-145°C' },
    'SATURN': { gravity: '10.44 m/s²', temp: '-178°C' },
    'URANUS': { gravity: '8.69 m/s²', temp: '-224°C' },
    'NEPTUNE': { gravity: '11.15 m/s²', temp: '-218°C' },
    'MOON': { gravity: '1.62 m/s²', temp: '-173~127°C' },
    'TITAN': { gravity: '1.35 m/s²', temp: '-179°C' },
    'EUROPA': { gravity: '1.31 m/s²', temp: '-160°C' },
    'GANYMEDE': { gravity: '1.43 m/s²', temp: '-163°C' },
    'IO': { gravity: '1.79 m/s²', temp: '-143°C' },
    'ENCELADUS': { gravity: '0.11 m/s²', temp: '-198°C' },
    'TRITON': { gravity: '0.78 m/s²', temp: '-235°C' },
    'PLUTO': { gravity: '0.62 m/s²', temp: '-229°C' },
    'default': { gravity: '알 수 없음', temp: '알 수 없음' }
};

function showBodyInfo(bodyName, bodyData) {
    const modal = document.getElementById('body-info-modal');
    
    // 대소문자 통일 (대문자로)
    const keyName = bodyName.toUpperCase();
    
    // 한글 이름 매핑
    const KOREAN_NAMES = {
        'SUN': '태양', 'MERCURY': '수성', 'VENUS': '금성', 'EARTH': '지구', 'MARS': '화성',
        'JUPITER': '목성', 'SATURN': '토성', 'URANUS': '천왕성', 'NEPTUNE': '해왕성',
        'MOON': '달', 'PHOBOS': '포보스', 'DEIMOS': '데이모스',
        'IO': '이오', 'EUROPA': '유로파', 'GANYMEDE': '가니메데', 'CALLISTO': '칼리스토',
        'TITAN': '타이탄', 'ENCELADUS': '엔셀라두스', 'MIMAS': '미마스', 
        'RHEA': '레아', 'DIONE': '디오네', 'IAPETUS': '이아페투스',
        'TITANIA': '티타니아', 'OBERON': '오베론', 'MIRANDA': '미란다', 
        'ARIEL': '아리엘', 'UMBRIEL': '움브리엘',
        'TRITON': '트리톤', 'PLUTO': '명왕성', 'CHARON': '카론', 
        'CERES': '세레스', 'ERIS': '에리스', 'ISS': '국제우주정거장'
    };
    
    // 유형 한글 매핑
    const TYPE_NAMES = {
        'star': '항성', 'planet': '행성', 'moon': '위성', 
        'dwarf': '왜소행성', 'asteroid': '소행성', 'station': '우주정거장'
    };
    
    // 번역된 이름 가져오기
    const translatedName = translateBodyName(bodyName);
    
    // 기본 정보
    document.getElementById('body-info-name').textContent = translatedName;
    document.getElementById('info-type').textContent = TYPE_NAMES[bodyData.type] || bodyData.type || t('unknownValue');
    document.getElementById('info-radius').textContent = bodyData.radius ? (bodyData.radius * 1000).toLocaleString() : '-';
    document.getElementById('info-mass').textContent = bodyData.mass ? bodyData.mass.toExponential(2) + ' kg' : '-';
    document.getElementById('info-orbit').textContent = bodyData.orbitPeriod ? bodyData.orbitPeriod.toFixed(1) + ' ' + t('days') : '-';
    
    // 물리 데이터
    const physics = BODY_PHYSICS[keyName] || BODY_PHYSICS['default'];
    document.getElementById('info-gravity').textContent = physics.gravity === '알 수 없음' ? t('unknownValue') : physics.gravity;
    document.getElementById('info-temp').textContent = physics.temp === '알 수 없음' ? t('unknownValue') : physics.temp;
    
    // 테라포밍 상태
    const terraform = BODY_TERRAFORMING[keyName] || BODY_TERRAFORMING['default'];
    document.getElementById('info-terraform-bar').style.width = terraform.percent + '%';
    document.getElementById('info-terraform-percent').textContent = terraform.percent + '%';
    document.getElementById('info-terraform-status').textContent = `${terraform.status} (${terraform.phase})`;
    
    // 인프라
    const infra = BODY_INFRASTRUCTURE[keyName] || BODY_INFRASTRUCTURE['default'];
    const infraHTML = `
        <div style="color: ${infra.spaceport ? '#0f0' : '#555'};">🚀 ${t('infraSpaceport')}: ${infra.spaceport ? 'O' : 'X'}</div>
        <div style="color: ${infra.refuel ? '#0f0' : '#555'};">⛽ ${t('infraFuel')}: ${infra.refuel ? 'O' : 'X'}</div>
        <div style="color: ${infra.repair ? '#0f0' : '#555'};">🔧 ${t('infraRepair')}: ${infra.repair ? 'O' : 'X'}</div>
        <div style="color: ${infra.shop ? '#0f0' : '#555'};">🛒 ${t('infraShop')}: ${infra.shop ? 'O' : 'X'}</div>
        <div style="color: ${infra.research ? '#0f0' : '#555'};">🔬 ${t('infraResearch')}: ${infra.research ? 'O' : 'X'}</div>
        <div style="color: ${infra.mining ? '#0f0' : '#555'};">⛏️ ${t('infraMining')}: ${infra.mining ? 'O' : 'X'}</div>
    `;
    document.getElementById('info-infrastructure').innerHTML = infraHTML;
    
    // 자원 (태그 스타일로)
    const resources = BODY_RESOURCES[keyName] || ['정보 없음'];
    const resourceColors = ['#f0f', '#0ff', '#ff0', '#0f0', '#f90', '#f55'];
    const resourceHTML = resources.map((r, i) => 
        `<span style="background: ${resourceColors[i % resourceColors.length]}33; color: ${resourceColors[i % resourceColors.length]}; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; border: 1px solid ${resourceColors[i % resourceColors.length]}55;">${r}</span>`
    ).join('');
    document.getElementById('info-resources').innerHTML = resourceHTML;
    
    // 식민지 정보
    const colony = BODY_COLONY_STATUS[keyName] || BODY_COLONY_STATUS['default'];
    document.getElementById('info-colony').textContent = colony.status;
    document.getElementById('info-population').textContent = colony.population;
    
    // 인공위성 수 계산
    let satelliteCount = 0;
    if (typeof bodies !== 'undefined') {
        bodies.forEach(b => {
            if (b.parent && (b.parent.name === bodyName || b.parent.name === koreanName)) satelliteCount++;
        });
    }
    document.getElementById('info-satellites').textContent = satelliteCount;
    
    // 이동 버튼 이벤트
    document.getElementById('body-info-goto').onclick = () => {
        modal.style.display = 'none';
        // 해당 천체로 포커스
        if (typeof bodies !== 'undefined') {
            const targetBody = bodies.find(b => 
                b.name === bodyName || 
                b.name === koreanName || 
                b.name.toUpperCase() === keyName
            );
            if (targetBody) {
                focusedBody = targetBody;
                if (typeof showMessage === 'function') showMessage(`🎯 ${koreanName}(으)로 이동합니다`);
            }
        }
    };
    
    modal.style.display = 'block';
}

// 멀티모드에서 도감 제목 변경
function updateCatalogTitle() {
    const title = document.getElementById('catalog-title');
    if (title) {
        if (window.gameMode === 'multi') {
            title.textContent = '🌌 태양계 천체 정보';
        } else {
            title.textContent = '🌌 천체 도감 (클릭하여 생성)';
        }
    }
}

// 광고 모달 이벤트 (DOM 로드 후)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // 광고 모달 토글
        const adMenuToggle = document.getElementById('ad-menu-toggle');
        const adModalMenu = document.getElementById('ad-modal-menu');
        const adModalClose = document.getElementById('ad-modal-close');
        const adBoosterBtn = document.getElementById('ad-booster-btn');
        const adEscapeBtn = document.getElementById('ad-escape-btn');
        const adExploreBtn = document.getElementById('ad-explore-btn');
        
        if (adMenuToggle) {
            adMenuToggle.addEventListener('click', function() {
                if (adModalMenu) {
                    adModalMenu.style.display = 'flex';
                    updateAdUI();
                }
            });
        }
        
        if (adModalClose) {
            adModalClose.addEventListener('click', function() {
                if (adModalMenu) adModalMenu.style.display = 'none';
            });
        }
        
        // 모달 배경 클릭 시 닫기
        if (adModalMenu) {
            adModalMenu.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.style.display = 'none';
                }
            });
        }
        
        // 광고 버튼 이벤트
        if (adBoosterBtn) {
            adBoosterBtn.addEventListener('click', function() {
                if (!adBooster.active) {
                    if (adModalMenu) adModalMenu.style.display = 'none';
                    watchAdForBooster();
                }
            });
        }
        
        if (adEscapeBtn) {
            adEscapeBtn.addEventListener('click', function() {
                if (!emergencyEscapeCharge.charged) {
                    if (adModalMenu) adModalMenu.style.display = 'none';
                    watchAdForEscape();
                }
            });
        }
        
        if (adExploreBtn) {
            adExploreBtn.addEventListener('click', function() {
                if (adModalMenu) adModalMenu.style.display = 'none';
                watchAdForExplore();
            });
        }
        
        console.log('광고 시스템 이벤트 초기화 완료');
    }, 500);
});

// ===== 중력 위험 분석 시스템 =====
const G_CONST = 6.674e-11;  // 중력 상수

function analyzeGravityDanger() {
    if (!playerShip || !playerShip.mesh) return null;
    
    const shipPos = playerShip.mesh.position;
    let mostDangerous = null;
    let maxDanger = 0;
    
    // 모든 천체에 대해 위험도 계산
    if (typeof celestialBodies !== 'undefined') {
        celestialBodies.forEach(body => {
            if (!body.mesh) return;
            
            const bodyPos = body.mesh.position;
            const dist = shipPos.distanceTo(bodyPos);
            const mass = body.mass || 1e24;
            const dangerRadius = (body.radius || 1) * 50;  // 위험 반경
            
            if (dist < dangerRadius) {
                // 위험도 = 질량 / 거리^2 * (위험반경/거리)
                const danger = (mass / (dist * dist)) * (dangerRadius / dist);
                
                if (danger > maxDanger) {
                    maxDanger = danger;
                    mostDangerous = {
                        body: body,
                        dist: dist,
                        mass: mass,
                        radius: body.radius || 1
                    };
                }
            }
        });
    }
    
    return mostDangerous;
}

function calculateEscapeRecommendation(dangerInfo) {
    if (!dangerInfo || !playerShip || !playerShip.mesh) return null;
    
    const { body, dist, mass } = dangerInfo;
    const bodyPos = body.mesh.position;
    const shipPos = playerShip.mesh.position;
    
    // 탈출 속도 계산 (간소화된 버전)
    const escapeVelocity = Math.sqrt(2 * mass * G_CONST / (dist * 1000)) / 1000;  // km/s
    const scaledEscapeVel = Math.min(escapeVelocity * 0.001, 100);  // 스케일 조정
    
    const currentSpeed = Math.abs(playerShip.speed);
    const speedDeficit = Math.max(0, scaledEscapeVel - currentSpeed);
    
    // 탈출 방향 계산 (천체 반대 방향)
    const escapeDir = new window.THREE.Vector3().subVectors(shipPos, bodyPos).normalize();
    
    // 현재 우주선 방향
    const shipDir = new window.THREE.Vector3(0, 0, -1);
    shipDir.applyQuaternion(playerShip.mesh.quaternion);
    
    // 필요 회전 각도
    const angleToEscape = Math.acos(Math.max(-1, Math.min(1, shipDir.dot(escapeDir)))) * 180 / Math.PI;
    
    // 회전 방향 (좌/우)
    const cross = new window.THREE.Vector3().crossVectors(shipDir, escapeDir);
    const turnDirection = cross.y > 0 ? '좌측' : '우측';
    
    return {
        escapeVelocity: scaledEscapeVel,
        currentSpeed: currentSpeed,
        speedDeficit: speedDeficit,
        angleToEscape: angleToEscape,
        turnDirection: turnDirection,
        bodyName: body.name || '알 수 없는 천체'
    };
}

function updateGravityWarningHUD() {
    if (!window.isPilotMode) {
        const hud = document.getElementById('gravity-hud-warning');
        if (hud) hud.style.display = 'none';
        return;
    }
    
    const dangerInfo = analyzeGravityDanger();
    const hud = document.getElementById('gravity-hud-warning');
    
    if (!dangerInfo) {
        if (hud) hud.style.display = 'none';
        return;
    }
    
    const recommendation = calculateEscapeRecommendation(dangerInfo);
    if (!recommendation || recommendation.speedDeficit <= 0) {
        if (hud) hud.style.display = 'none';
        return;
    }
    
    // HUD 표시
    if (hud) {
        hud.style.display = 'block';
        document.getElementById('gravity-body-name').textContent = recommendation.bodyName;
        document.getElementById('gravity-escape-vel').textContent = recommendation.escapeVelocity.toFixed(1);
        document.getElementById('gravity-current-vel').textContent = recommendation.currentSpeed.toFixed(1);
        document.getElementById('gravity-deficit').textContent = recommendation.speedDeficit.toFixed(1);
        document.getElementById('gravity-turn-dir').textContent = recommendation.turnDirection;
        document.getElementById('gravity-turn-angle').textContent = Math.round(recommendation.angleToEscape);
    }
}

// 1초마다 중력 경고 업데이트
document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateGravityWarningHUD, 1000);
});

// ★★★ 좌표 복사 기능 (멀티모드) ★★★
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const coordsPanel = document.getElementById('pilot-coords-panel');
        if (coordsPanel) {
            coordsPanel.addEventListener('click', async () => {
                if (!playerShip || !playerShip.mesh) return;
                
                const pos = playerShip.mesh.position;
                const coordsText = `X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}`;
                
                try {
                    await navigator.clipboard.writeText(coordsText);
                    coordsPanel.classList.add('copied');
                    const label = coordsPanel.querySelector('.coords-label');
                    const originalText = label.textContent;
                    label.textContent = '✅ 복사됨!';
                    
                    setTimeout(() => {
                        coordsPanel.classList.remove('copied');
                        label.textContent = originalText;
                    }, 1500);
                    
                    showMsg('📋 좌표가 클립보드에 복사되었습니다!');
                } catch (err) {
                    showMsg('❌ 좌표 복사 실패');
                }
            });
        }
    }, 1000);
});

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ AudioManager - 게임 오디오 시스템 ★★★
// BGM 및 효과음 재생 관리
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
const AudioManager = {
    // 오디오 설정 (Supabase에서 로드)
    config: {
        bgm_menu: null,
        bgm_explore: null,
        bgm_battle: null,
        bgm_station: null,
        sfx_engine: null,
        sfx_boost: null,
        sfx_fire: null,
        sfx_explosion: null,
        sfx_hit: null,
        sfx_dock: null,
        sfx_warning: null,
        sfx_fuel_low: null,
        sfx_mission_complete: null,
        sfx_click: null,
        sfx_autopilot: null,
        sfx_warp: null,
        sfx_shield: null,
        sfx_scan: null,
        sfx_cockpit: null
    },

    // 오디오 객체 캐시
    audioCache: {},

    // 현재 재생 중인 BGM
    currentBGM: null,
    currentBGMType: null,

    // 볼륨 설정
    bgmVolume: 0.5,
    sfxVolume: 0.7,

    // 음소거 상태
    muted: false,

    // 초기화 여부
    initialized: false,

    // 설정 로드
    loadConfig: async function() {
        try {
            const { data, error } = await supabase
                .from('config')
                .select('value')
                .eq('key', 'game_audio')
                .single();

            if (data && data.value) {
                this.config = { ...this.config, ...data.value };
                console.log('🔊 오디오 설정 로드 완료');
            }
            this.initialized = true;
        } catch (err) {
            console.log('🔇 오디오 설정 없음 (기본값 사용)');
            this.initialized = true;
        }
    },

    // 오디오 객체 가져오기 (캐시 사용)
    getAudio: function(type) {
        if (!this.config[type]) return null;

        if (!this.audioCache[type]) {
            this.audioCache[type] = new Audio(this.config[type]);
        }
        return this.audioCache[type];
    },

    // BGM 재생
    playBGM: function(type) {
        if (this.muted) return;
        if (!this.config[type]) return;

        // 이미 같은 BGM 재생 중이면 무시
        if (this.currentBGMType === type && this.currentBGM && !this.currentBGM.paused) {
            return;
        }

        // 현재 BGM 정지
        this.stopBGM();

        // 새 BGM 재생
        const audio = this.getAudio(type);
        if (audio) {
            audio.volume = this.bgmVolume;
            audio.loop = true;
            audio.play().catch(e => console.log('BGM 재생 대기:', e.message));
            this.currentBGM = audio;
            this.currentBGMType = type;
        }
    },

    // BGM 정지
    stopBGM: function() {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
            this.currentBGM = null;
            this.currentBGMType = null;
        }
    },

    // 효과음 재생
    playSFX: function(type) {
        if (this.muted) return;
        if (!this.config[type]) return;

        // 효과음은 새 인스턴스 생성 (동시 재생 가능)
        const audio = new Audio(this.config[type]);
        audio.volume = this.sfxVolume;
        audio.play().catch(e => console.log('SFX 재생 실패:', e.message));
    },

    // BGM 볼륨 설정
    setBGMVolume: function(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.currentBGM) {
            this.currentBGM.volume = this.bgmVolume;
        }
    },

    // 효과음 볼륨 설정
    setSFXVolume: function(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    },

    // 음소거 토글
    toggleMute: function() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopBGM();
        }
        return this.muted;
    },

    // 사용자 상호작용 후 오디오 활성화 (브라우저 정책 대응)
    enableAudio: function() {
        // 무음 오디오 재생으로 오디오 컨텍스트 활성화
        const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
        silentAudio.play().catch(() => {});
    }
};

// 페이지 로드 시 오디오 설정 로드
document.addEventListener('DOMContentLoaded', () => {
    AudioManager.loadConfig();
});

// 사용자 상호작용 시 오디오 활성화
document.addEventListener('click', () => {
    AudioManager.enableAudio();
}, { once: true });

// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
// ★★★ GameDataManager - 멀티플레이어 서버 저장 시스템 ★★★
// 싱글모드: localStorage 사용 (기존 호환)
// 멀티모드: Supabase 서버 사용 (치팅 방지)
// ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
const GameDataManager = {
    // API 엔드포인트
    API_URL: '/api/gamedata',

    // 현재 사용자 ID 가져오기
    getUserId: function() {
        if (window.currentUser) {
            return window.currentUser.id || window.currentUser.email;
        }
        if (window.mpUserId) return window.mpUserId;
        if (window.mpUser) return window.mpUser.id;
        return null;
    },

    // 멀티모드 여부 확인
    isMultiMode: function() {
        return window.gameMode === 'multi';
    },

    // ★ 데이터 저장 (멀티: 서버, 싱글: localStorage)
    save: async function(dataType, data, localStorageKey) {
        // 멀티모드 + 로그인 상태일 때만 서버 사용
        if (this.isMultiMode() && this.getUserId()) {
            try {
                const response = await fetch(`${this.API_URL}?userId=${encodeURIComponent(this.getUserId())}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataType, data })
                });

                if (!response.ok) {
                    const err = await response.json();
                    console.warn('GameDataManager 서버 저장 실패:', err);
                    // 서버 실패 시 로컬에도 저장 (백업)
                    if (localStorageKey) {
                        localStorage.setItem(localStorageKey, JSON.stringify(data));
                    }
                    return false;
                }

                console.log(`✅ GameData 서버 저장 성공: ${dataType}`);
                return true;
            } catch (e) {
                console.error('GameDataManager 네트워크 오류:', e);
                // 네트워크 오류 시 로컬에도 저장 (백업)
                if (localStorageKey) {
                    localStorage.setItem(localStorageKey, JSON.stringify(data));
                }
                return false;
            }
        } else {
            // 싱글모드 또는 비로그인: localStorage 사용
            if (localStorageKey) {
                localStorage.setItem(localStorageKey, JSON.stringify(data));
            }
            return true;
        }
    },

    // ★ 데이터 로드 (멀티: 서버, 싱글: localStorage)
    load: async function(dataType, localStorageKey) {
        // 멀티모드 + 로그인 상태일 때만 서버 사용
        if (this.isMultiMode() && this.getUserId()) {
            try {
                const response = await fetch(
                    `${this.API_URL}?userId=${encodeURIComponent(this.getUserId())}&dataType=${dataType}`
                );

                if (!response.ok) {
                    console.warn('GameDataManager 서버 로드 실패, 로컬 폴백');
                    // 서버 실패 시 로컬에서 로드
                    if (localStorageKey) {
                        const local = localStorage.getItem(localStorageKey);
                        return local ? JSON.parse(local) : null;
                    }
                    return null;
                }

                const result = await response.json();
                console.log(`✅ GameData 서버 로드 성공: ${dataType}`);
                return result[dataType] || null;
            } catch (e) {
                console.error('GameDataManager 네트워크 오류:', e);
                // 네트워크 오류 시 로컬에서 로드
                if (localStorageKey) {
                    const local = localStorage.getItem(localStorageKey);
                    return local ? JSON.parse(local) : null;
                }
                return null;
            }
        } else {
            // 싱글모드 또는 비로그인: localStorage 사용
            if (localStorageKey) {
                const local = localStorage.getItem(localStorageKey);
                return local ? JSON.parse(local) : null;
            }
            return null;
        }
    },

    // ★ 데이터 삭제
    delete: async function(dataType, localStorageKey) {
        if (this.isMultiMode() && this.getUserId()) {
            try {
                await fetch(`${this.API_URL}?userId=${encodeURIComponent(this.getUserId())}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dataType })
                });
            } catch (e) {
                console.error('GameDataManager 삭제 오류:', e);
            }
        }
        // 로컬도 항상 삭제
        if (localStorageKey) {
            localStorage.removeItem(localStorageKey);
        }
    }
};

window.GameDataManager = GameDataManager;

// ★★★ 우주선 마지막 위치 저장/로드 시스템 ★★★
// ★ 멀티모드: GameDataManager 사용 (서버 저장)
// ★ 싱글모드: localStorage 사용 (기존 호환)
const ShipPositionManager = {
    // ★ 게임 모드별 저장 키 반환
    getStorageKey: function() {
        const mode = window.gameMode || 'single';
        return `milkyway-ship-position-${mode}`;
    },

    // ★ 위치 데이터 생성 (공통)
    createPositionData: function() {
        if (!playerShip || !playerShip.mesh || !window.currentUser) return null;

        // 현재 진행 방향 계산
        const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(playerShip.mesh.quaternion);

        return {
            userId: window.currentUser.id || window.currentUser.email,
            gameMode: window.gameMode || 'single',
            position: {
                x: playerShip.mesh.position.x,
                y: playerShip.mesh.position.y,
                z: playerShip.mesh.position.z
            },
            rotation: {
                x: playerShip.mesh.rotation.x,
                y: playerShip.mesh.rotation.y,
                z: playerShip.mesh.rotation.z
            },
            direction: { x: fwd.x, y: fwd.y, z: fwd.z },
            shipType: window.currentShipType ? window.currentShipType.id : 'shuttle',
            shipName: window.currentShipType ? window.currentShipType.name : '셔틀',
            fuel: playerShip.fuel,
            speed: playerShip.speed,
            autopilot: {
                engaged: window.autopilot?.engaged || false,
                targetName: window.shipTargetBody?.name || null
            },
            timestamp: Date.now()
        };
    },

    // 현재 우주선 위치 저장 (방향, 자동항법 포함)
    // ★ 멀티모드: 서버에 저장, 싱글모드: localStorage
    save: function() {
        const data = this.createPositionData();
        if (!data) return;

        // ★ GameDataManager를 통해 저장 (멀티모드는 서버, 싱글은 로컬)
        GameDataManager.save('ship_position', data, this.getStorageKey());
        console.log(`우주선 위치 저장됨 (${data.gameMode}):`, data.position);
    },

    // 저장된 우주선 위치 로드 (동기 버전 - 싱글모드 호환)
    load: function() {
        // 싱글모드는 기존 방식 유지
        if (window.gameMode !== 'multi') {
            const saved = localStorage.getItem(this.getStorageKey());
            if (!saved) return null;
            return this.validateAndParse(saved);
        }
        // 멀티모드는 비동기 loadAsync 사용 권장
        // 호환성을 위해 로컬 캐시 반환
        const saved = localStorage.getItem(this.getStorageKey());
        if (!saved) return null;
        return this.validateAndParse(saved);
    },

    // ★ 비동기 로드 (멀티모드용)
    loadAsync: async function() {
        const localKey = this.getStorageKey();
        const data = await GameDataManager.load('ship_position', localKey);
        if (!data) return null;
        return this.validateData(data);
    },

    // ★ 데이터 파싱 및 검증 (문자열용)
    validateAndParse: function(saved) {
        try {
            const data = JSON.parse(saved);
            return this.validateData(data);
        } catch (e) {
            return null;
        }
    },

    // ★ 데이터 검증 (객체용)
    validateData: function(data) {
        // 24시간 이내 데이터만 유효
        if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
            this.clear();
            return null;
        }
        // 게임 모드 확인
        const currentMode = window.gameMode || 'single';
        if (data.gameMode && data.gameMode !== currentMode) {
            return null;
        }
        return data;
    },

    // 저장된 우주선 위치 로드 (기존 호환용 - deprecated)
    loadLegacy: function() {
        const saved = localStorage.getItem(this.getStorageKey());
        if (!saved) return null;
        
        try {
            const data = JSON.parse(saved);
            // 24시간 이내 데이터만 유효
            if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(this.getStorageKey());
                return null;
            }
            // ★ 게임 모드 확인 (혹시 잘못된 데이터 방지)
            const currentMode = window.gameMode || 'single';
            if (data.gameMode && data.gameMode !== currentMode) {
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    },
    
    // 저장된 위치 삭제
    clear: function() {
        // ★ GameDataManager를 통해 삭제 (서버 + 로컬 모두)
        GameDataManager.delete('ship_position', this.getStorageKey());
    },
    
    // 저장된 위치에서 탑승 (시간 기반 위치 보정 포함)
    restoreShip: function(data) {
        if (!data || !playerShip || !playerShip.mesh) return false;

        let finalPosition = { ...data.position };
        let travelMessage = '';

        // ★ 시간 기반 위치 보정 (최대 5분)
        if (data.timestamp && data.speed > 0.1 && data.direction) {
            const elapsedTime = (Date.now() - data.timestamp) / 1000;  // 초 단위
            const maxCompensationTime = 5 * 60;  // 최대 5분
            const compensationTime = Math.min(elapsedTime, maxCompensationTime);

            if (compensationTime > 1) {  // 1초 이상 경과 시에만 보정
                const travelDistance = data.speed * compensationTime;

                // 자동항법 중이었으면 목표 방향으로, 아니면 마지막 방향으로
                let dir = data.direction;
                if (data.autopilot?.engaged && data.autopilot?.targetName) {
                    // 목표 천체 찾기
                    const targetBody = allBodies.find(b => b.name === data.autopilot.targetName);
                    if (targetBody && targetBody.mesh) {
                        const targetPos = targetBody.mesh.position;
                        const dx = targetPos.x - data.position.x;
                        const dy = targetPos.y - data.position.y;
                        const dz = targetPos.z - data.position.z;
                        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                        if (dist > 0) {
                            dir = { x: dx/dist, y: dy/dist, z: dz/dist };
                        }
                    }
                }

                // 위치 보정 적용
                finalPosition.x += dir.x * travelDistance;
                finalPosition.y += dir.y * travelDistance;
                finalPosition.z += dir.z * travelDistance;

                const minutes = Math.floor(compensationTime / 60);
                const seconds = Math.floor(compensationTime % 60);
                if (minutes > 0) {
                    travelMessage = ` (${minutes}분 ${seconds}초 동안 ${travelDistance.toFixed(0)} 이동)`;
                } else {
                    travelMessage = ` (${seconds}초 동안 ${travelDistance.toFixed(0)} 이동)`;
                }

                console.log(`⏱️ 시간 보정: ${compensationTime.toFixed(1)}초 경과, ${travelDistance.toFixed(0)} 이동`);
            }
        }

        playerShip.mesh.position.set(finalPosition.x, finalPosition.y, finalPosition.z);
        playerShip.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        playerShip.fuel = data.fuel || SHIP_CONFIG.maxFuel;
        playerShip.speed = 0;  // 속도는 0으로 시작

        showMsg(`🚀 ${data.shipName}에 탑승했습니다!${travelMessage}`);
        console.log('우주선 위치 복원됨:', finalPosition);
        return true;
    }
};

// 우주선 위치 자동 저장 (10초마다)
setInterval(() => {
    if (window.isPilotMode && playerShip && playerShip.mesh && window.currentUser && !playerShip.isDocked) {
        ShipPositionManager.save();
    }
}, 10000);

// 페이지 종료 시 저장
window.addEventListener('beforeunload', () => {
    if (window.isPilotMode && playerShip && playerShip.mesh && window.currentUser) {
        ShipPositionManager.save();
    }
});

// ★★★ 저장된 우주선 위치 안내 모달 ★★★
function showSavedShipPrompt() {
    const savedData = ShipPositionManager.load();
    if (!savedData) return false;
    
    // 현재 로그인 사용자와 일치하는지 확인
    if (window.currentUser && (window.currentUser.id === savedData.userId || window.currentUser.email === savedData.userId)) {
        const pos = savedData.position;
        const coordsStr = `X: ${pos.x.toFixed(0)}, Y: ${pos.y.toFixed(0)}, Z: ${pos.z.toFixed(0)}`;
        
        // 안내 모달 표시
        const modal = document.createElement('div');
        modal.id = 'saved-ship-modal';
        modal.innerHTML = `
            <div class="saved-ship-content">
                <div class="saved-ship-icon">🚀</div>
                <div class="saved-ship-title">${t('savedShipFound')}</div>
                <div class="saved-ship-info">
                    <div class="ship-name">${savedData.shipName}</div>
                    <div class="ship-coords">📍 ${coordsStr}</div>
                    <div class="ship-fuel">${t('fuelPercent')}: ${Math.round(savedData.fuel)}%</div>
                </div>
                <div class="saved-ship-buttons">
                    <button id="btn-restore-ship" class="restore-btn">🚀 ${t('restoreShip')}</button>
                    <button id="btn-new-ship" class="new-btn">🛸 ${t('newShipStart')}</button>
                </div>
            </div>
        `;
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 100000;
        `;
        document.body.appendChild(modal);
        
        // 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .saved-ship-content {
                background: linear-gradient(135deg, rgba(0,40,80,0.95) 0%, rgba(0,20,50,0.98) 100%);
                border: 2px solid #00aaff; border-radius: 15px; padding: 30px;
                text-align: center; max-width: 350px;
                box-shadow: 0 0 30px rgba(0,170,255,0.4);
                animation: fadeIn 0.3s;
            }
            .saved-ship-icon { font-size: 50px; margin-bottom: 10px; }
            .saved-ship-title { font-size: 20px; color: #00aaff; font-family: 'Orbitron', sans-serif; margin-bottom: 15px; }
            .saved-ship-info { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px; }
            .ship-name { font-size: 16px; color: #fff; font-weight: bold; margin-bottom: 8px; }
            .ship-coords { font-size: 12px; color: #00ff88; font-family: monospace; margin-bottom: 5px; }
            .ship-fuel { font-size: 12px; color: #ffaa00; }
            .saved-ship-buttons { display: flex; flex-direction: column; gap: 10px; }
            .restore-btn { background: linear-gradient(135deg, #0088ff, #00aaff); color: #fff; border: none;
                padding: 12px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; font-family: 'Orbitron', sans-serif; }
            .restore-btn:hover { background: linear-gradient(135deg, #00aaff, #00ccff); }
            .new-btn { background: transparent; color: #888; border: 1px solid #555;
                padding: 10px 20px; border-radius: 8px; font-size: 12px; cursor: pointer; }
            .new-btn:hover { border-color: #888; color: #aaa; }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        `;
        document.head.appendChild(style);
        
        // 버튼 이벤트
        document.getElementById('btn-restore-ship').onclick = () => {
            modal.remove();
            // 우주선 생성 후 위치 복원
            setTimeout(() => {
                if (ShipPositionManager.restoreShip(savedData)) {
                    isPilotMode = true;
                    enterCockpitView();
                }
            }, 500);
        };
        
        document.getElementById('btn-new-ship').onclick = () => {
            ShipPositionManager.clear();
            modal.remove();
            // 정상적인 로그인 흐름
        };
        
        return true;
    }
    return false;
}

// 로그인 시 저장된 우주선 확인
window.checkSavedShipOnLogin = function() {
    if (window.currentUser) {
        setTimeout(() => {
            showSavedShipPrompt();
        }, 1000);
    }
};

// ===== 사운드 슬라이드 컨트롤 (DOM 로드 후) =====
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // ★★★ BGM 자동 재생 (첫 사용자 상호작용 후) ★★★
        const startBgmOnce = () => {
            if (typeof SpaceAudio !== 'undefined' && !SpaceAudio.isPlaying) {
                SpaceAudio.playSpace();
                const soundOnoff = document.getElementById('sound-onoff');
                if (soundOnoff) {
                    soundOnoff.textContent = '🔊';
                    soundOnoff.classList.add('on');
                }
                console.log('🎵 BGM 자동 재생 시작');
            }
            // 이벤트 제거 (한 번만 실행)
            document.removeEventListener('click', startBgmOnce);
            document.removeEventListener('touchstart', startBgmOnce);
            document.removeEventListener('keydown', startBgmOnce);
        };
        
        // 첫 상호작용 시 BGM 시작 (브라우저 자동재생 정책 우회)
        document.addEventListener('click', startBgmOnce);
        document.addEventListener('touchstart', startBgmOnce);
        document.addEventListener('keydown', startBgmOnce);
        
        // 천체 정보 모달 닫기
        const bodyInfoClose = document.getElementById('body-info-close');
        if (bodyInfoClose) {
            bodyInfoClose.addEventListener('click', () => {
                const modal = document.getElementById('body-info-modal');
                if (modal) modal.style.display = 'none';
            });
        }
        
        // 화살표 클릭: 슬라이드 열기/닫기
        const soundArrow = document.getElementById('sound-arrow');
        if (soundArrow) {
            soundArrow.addEventListener('click', function() {
                const slide = document.getElementById('sound-slide');
                if (!slide) return;
                const isCollapsed = slide.classList.contains('collapsed');
                
                if (isCollapsed) {
                    slide.classList.remove('collapsed');
                    slide.classList.add('expanded');
                    this.textContent = '▶';
                } else {
                    slide.classList.remove('expanded');
                    slide.classList.add('collapsed');
                    this.textContent = '◀';
                }
            });
        }
        
        // ON/OFF 버튼
        const soundOnoff = document.getElementById('sound-onoff');
        if (soundOnoff) {
            soundOnoff.addEventListener('click', function() {
                if (typeof SpaceAudio !== 'undefined') {
                    if (SpaceAudio.isPlaying) {
                        SpaceAudio.stop();
                        this.textContent = '🔇';
                        this.classList.remove('on');
                    } else {
                        SpaceAudio.playSpace();
                        this.textContent = '🔊';
                        this.classList.add('on');
                    }
                }
            });
        }
        
        // 볼륨 슬라이더
        const soundSlider = document.getElementById('sound-slider');
        if (soundSlider) {
            soundSlider.addEventListener('input', function() {
                const vol = this.value / 100;
                const valDisplay = document.getElementById('sound-val');
                if (valDisplay) valDisplay.textContent = this.value + '%';
                if (typeof SpaceAudio !== 'undefined') {
                    SpaceAudio.setVolume(vol);
                }
            });
        }
        
        console.log('사운드 컨트롤 초기화 완료');
    }, 500);
});

// ===== 망원경 모드 (완전 개선) =====
const telescopeMode = {
    active: false,
    zoom: 1,
    baseMaxZoom: 20,      // 기본 최대 줌
    maxZoom: 20,          // 현재 최대 줌 (업그레이드에 따라 변경)
    originalFOV: 75,
    equippedTelescope: 'basic',  // basic, advanced, professional
    fineControl: { x: 0, y: 0 },
    originalCameraParent: null,
    originalControlsEnabled: true
};

// 망원경 업그레이드 정보
const telescopeUpgrades = {
    basic: { name: '기본 망원경', maxZoom: 20, price: 0, owned: true, description: '기본 장착. 20배 줌.' },
    standard: { name: '표준 망원경', maxZoom: 30, price: 2000, owned: false, description: '30배 줌. 향상된 성능.' },
    advanced: { name: '고급 망원경', maxZoom: 50, price: 5000, owned: false, description: '50배 줌. 선명한 화질.' },
    professional: { name: '전문가 망원경', maxZoom: 100, price: 15000, owned: false, description: '100배 줌. 최고 성능.' }
};

function enterTelescopeMode() {
    // ★ 우주 모드(외부 뷰)에서만 망원경 사용 가능
    if (window.isPilotMode) {
        if (typeof showMsg === 'function') showMsg('🔭 우주 모드에서만 망원경을 사용할 수 있습니다. (V키로 전환)');
        return;
    }
    
    if (!playerShip) {
        if (typeof showMsg === 'function') showMsg('우주선에 탑승해야 망원경을 사용할 수 있습니다.');
        return;
    }
    
    // ★ camera 확인
    if (!window.camera) {
        if (typeof showMsg === 'function') showMsg('카메라 초기화 대기 중...');
        return;
    }
    
    telescopeMode.active = true;
    telescopeMode.originalFOV = window.camera.fov;
    telescopeMode.zoom = 1;
    
    // 현재 장착된 망원경에 따른 최대 줌 설정
    const equipped = telescopeUpgrades[telescopeMode.equippedTelescope];
    telescopeMode.maxZoom = equipped ? equipped.maxZoom : 20;
    
    // UI 업데이트
    updateTelescopeUI();
    
    // 오버레이 표시
    document.getElementById('telescope-overlay').style.display = 'flex';
    
    // 슬라이더 최대값 업데이트
    const slider = document.getElementById('telescope-zoom-slider');
    if (slider) {
        slider.max = telescopeMode.maxZoom;
        slider.value = 1;
    }
    
    // OrbitControls 비활성화 (망원경 전용 컨트롤 사용)
    if (window.controls) {
        telescopeMode.originalControlsEnabled = window.controls.enabled;
        window.controls.enabled = false;
    }
    
    if (typeof showMsg === 'function') showMsg('🔭 망원경 모드 - 드래그로 시점 이동, 휠로 줌');
}

function exitTelescopeMode() {
    telescopeMode.active = false;
    telescopeMode.zoom = 1;
    if (window.camera) {
        window.camera.fov = telescopeMode.originalFOV || 60;
        window.camera.updateProjectionMatrix();
    }
    document.getElementById('telescope-overlay').style.display = 'none';
    
    // OrbitControls 복원
    if (window.controls) {
        window.controls.enabled = telescopeMode.originalControlsEnabled !== false;
    }
    
    if (typeof showMsg === 'function') showMsg('망원경 모드 종료');
}

function updateTelescopeZoom(zoom) {
    if (!window.camera) return;
    telescopeMode.zoom = Math.max(1, Math.min(telescopeMode.maxZoom, zoom));
    window.camera.fov = telescopeMode.originalFOV / telescopeMode.zoom;
    window.camera.updateProjectionMatrix();
    
    // UI 업데이트
    const zoomValue = document.getElementById('telescope-zoom-value');
    const zoomDisplay = document.getElementById('telescope-zoom-display');
    const slider = document.getElementById('telescope-zoom-slider');
    
    if (zoomValue) zoomValue.textContent = telescopeMode.zoom.toFixed(1) + 'x';
    if (zoomDisplay) zoomDisplay.textContent = telescopeMode.zoom.toFixed(1);
    if (slider) slider.value = telescopeMode.zoom;
    
    // 줌에 따른 렌즈 효과 변경
    updateTelescopeLensEffect();
}

function updateTelescopeLensEffect() {
    const lens = document.getElementById('telescope-lens');
    if (!lens) return;
    
    // 줌이 높을수록 비네팅 범위 확대
    const vignetteSize = 25 + (telescopeMode.zoom / telescopeMode.maxZoom) * 15;
    lens.style.background = `radial-gradient(circle at center, 
        transparent 0%, 
        transparent ${vignetteSize}%, 
        rgba(0,0,0,0.3) ${vignetteSize + 10}%, 
        rgba(0,0,0,0.7) ${vignetteSize + 20}%, 
        rgba(0,0,0,0.95) ${vignetteSize + 30}%)`;
}

function updateTelescopeUI() {
    // 최대 줌 표시
    const maxZoomDisplay = document.getElementById('telescope-max-zoom-display');
    if (maxZoomDisplay) maxZoomDisplay.textContent = telescopeMode.maxZoom;
    
    // 장착된 망원경 정보
    const equipped = telescopeUpgrades[telescopeMode.equippedTelescope];
    const equippedName = document.getElementById('telescope-equipped-name');
    if (equippedName && equipped) {
        equippedName.textContent = `${equipped.name} (${equipped.maxZoom}x)`;
    }
    
    // 프리셋 버튼 업데이트
    document.querySelectorAll('.telescope-preset-btn').forEach(btn => {
        const zoom = parseInt(btn.dataset.zoom);
        if (zoom <= telescopeMode.maxZoom) {
            btn.classList.remove('locked');
            btn.style.background = '#1a3a5c';
            btn.style.color = '#fff';
            btn.style.border = '1px solid #00aaff';
            btn.style.cursor = 'pointer';
            btn.textContent = btn.textContent.replace('🔒 ', '');
        } else {
            btn.classList.add('locked');
            btn.style.background = '#333';
            btn.style.color = '#888';
            btn.style.border = '1px solid #555';
            btn.style.cursor = 'not-allowed';
            if (!btn.textContent.startsWith('🔒')) {
                btn.textContent = '🔒 ' + btn.textContent;
            }
        }
    });
}

// 망원경 구매 함수
function buyTelescopeUpgrade(type) {
    const upgrade = telescopeUpgrades[type];
    if (!upgrade) return false;
    
    if (upgrade.owned) {
        showMsg('이미 보유한 망원경입니다.');
        return false;
    }
    
    const userCoins = getUserCoins();
    if (userCoins < upgrade.price) {
        showMsg(`코인이 부족합니다. (필요: ${upgrade.price}, 보유: ${userCoins})`);
        return false;
    }
    
    // 코인 차감
    if (typeof addCoins === 'function') {
        addCoins(-upgrade.price);
    }
    
    // 구매 완료
    upgrade.owned = true;
    telescopeMode.equippedTelescope = type;
    telescopeMode.maxZoom = upgrade.maxZoom;
    
    // 서버에 저장 (프로필 업데이트)
    if (window.supabaseClient && window.mpUserId) {
        window.supabaseClient
            .from('profiles')
            .update({ 
                telescope_level: type,
                telescope_owned: Object.keys(telescopeUpgrades).filter(k => telescopeUpgrades[k].owned)
            })
            .eq('id', window.mpUserId)
            .then(() => console.log('망원경 업그레이드 저장됨'))
            .catch(e => console.warn('망원경 저장 실패:', e));
    }
    
    showMsg(`🔭 ${upgrade.name} 구매 완료! (최대 ${upgrade.maxZoom}배 줌)`);
    return true;
}

// 망원경 장착 함수
function equipTelescope(type) {
    const upgrade = telescopeUpgrades[type];
    if (!upgrade || !upgrade.owned) {
        showMsg('먼저 구매해야 합니다.');
        return false;
    }
    
    telescopeMode.equippedTelescope = type;
    telescopeMode.maxZoom = upgrade.maxZoom;
    
    if (telescopeMode.active) {
        updateTelescopeUI();
        const slider = document.getElementById('telescope-zoom-slider');
        if (slider) slider.max = telescopeMode.maxZoom;
    }
    
    showMsg(`🔭 ${upgrade.name} 장착 완료!`);
    return true;
}

// 타겟 정보 업데이트 (레이캐스트로 바라보는 천체 확인)
function updateTelescopeTarget() {
    if (!telescopeMode.active) return;
    if (!window.THREE || !window.camera) return;  // ★ 방어 코드
    
    const targetInfo = document.getElementById('telescope-target-info');
    if (!targetInfo) return;
    
    // 화면 중앙에서 레이캐스트
    const raycaster = new window.THREE.Raycaster();
    raycaster.setFromCamera(new window.THREE.Vector2(0, 0), window.camera);
    
    // 모든 천체 메시 수집
    const meshes = [];
    if (window.bodies) {
        window.bodies.forEach(b => {
            if (b.mesh) meshes.push({ mesh: b.mesh, name: b.name, body: b });
        });
    }
    if (window.satellites) {
        window.satellites.forEach(s => {
            if (s.mesh) meshes.push({ mesh: s.mesh, name: s.name, body: s });
        });
    }
    
    if (meshes.length === 0) return;  // ★ 메시 없으면 리턴
    
    const intersects = raycaster.intersectObjects(meshes.map(m => m.mesh), true);
    
    if (intersects.length > 0) {
        // 가장 가까운 교차점의 부모 찾기
        let targetMesh = intersects[0].object;
        while (targetMesh.parent && !meshes.find(m => m.mesh === targetMesh)) {
            targetMesh = targetMesh.parent;
        }
        
        const found = meshes.find(m => m.mesh === targetMesh || m.mesh.children.includes(targetMesh));
        if (found) {
            const dist = intersects[0].distance.toFixed(0);
            targetInfo.innerHTML = `타겟: <strong style="color:#ffff00;">${found.name}</strong> (${dist} km)`;
            return;
        }
    }
    
    targetInfo.textContent = t('targetNone');
}

// 망원경 이벤트 리스너 (DOM 로드 후)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const zoomSlider = document.getElementById('telescope-zoom-slider');
        const closeBtn = document.getElementById('btn-telescope-close');
        
        // 슬라이더 이벤트
        if (zoomSlider) {
            zoomSlider.addEventListener('input', function() {
                updateTelescopeZoom(parseFloat(this.value));
            });
        }
        
        // 닫기 버튼
        if (closeBtn) {
            closeBtn.addEventListener('click', exitTelescopeMode);
        }
        
        // 프리셋 버튼 이벤트
        document.querySelectorAll('.telescope-preset-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (this.classList.contains('locked')) {
                    showMsg('이 줌 레벨은 고급 망원경이 필요합니다. 우주정거장에서 구매하세요.');
                    return;
                }
                const zoom = parseFloat(this.dataset.zoom);
                updateTelescopeZoom(zoom);
            });
        });
        
        // 휠 줌 이벤트
        document.getElementById('telescope-overlay')?.addEventListener('wheel', function(e) {
            if (!telescopeMode.active) return;
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? -1 : 1;
            const step = telescopeMode.maxZoom > 50 ? 2 : 1;
            updateTelescopeZoom(telescopeMode.zoom + delta * step);
        }, { passive: false });
        
        // ★★★ 망원경 마우스 드래그 카메라 회전 ★★★
        let telescopeDragging = false;
        let telescopeLastMouse = { x: 0, y: 0 };
        
        document.getElementById('telescope-overlay')?.addEventListener('mousedown', function(e) {
            if (!telescopeMode.active) return;
            telescopeDragging = true;
            telescopeLastMouse = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', function() {
            telescopeDragging = false;
        });
        
        document.addEventListener('mousemove', function(e) {
            if (!telescopeMode.active || !telescopeDragging) return;
            if (!window.THREE || !window.camera || !window.controls) return;
            
            const deltaX = e.clientX - telescopeLastMouse.x;
            const deltaY = e.clientY - telescopeLastMouse.y;
            
            // ★ 줌 레벨에 따라 감도 크게 조절 (줌이 높을수록 훨씬 느리게)
            // 기본 감도 0.003, 줌 배율의 제곱에 반비례
            const baseSensitivity = 0.003;
            const sensitivity = baseSensitivity / (telescopeMode.zoom * telescopeMode.zoom * 0.1 + 1);
            
            // 카메라 회전 (OrbitControls와 유사하게)
            if (window.controls.target) {
                // spherical 좌표로 회전
                const offset = new window.THREE.Vector3().copy(window.camera.position).sub(window.controls.target);
                const spherical = new window.THREE.Spherical().setFromVector3(offset);
                
                spherical.theta -= deltaX * sensitivity;
                spherical.phi -= deltaY * sensitivity;
                
                // phi 제한 (0.1 ~ PI - 0.1)
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                
                offset.setFromSpherical(spherical);
                window.camera.position.copy(window.controls.target).add(offset);
                window.camera.lookAt(window.controls.target);
            }
            
            telescopeLastMouse = { x: e.clientX, y: e.clientY };
        });
        
        // ★★★ 모바일 터치 드래그 ★★★
        let telescopeTouchStart = { x: 0, y: 0 };
        
        document.getElementById('telescope-overlay')?.addEventListener('touchstart', function(e) {
            if (!telescopeMode.active) return;
            if (e.touches.length === 1) {
                telescopeTouchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        }, { passive: true });
        
        document.getElementById('telescope-overlay')?.addEventListener('touchmove', function(e) {
            if (!telescopeMode.active || e.touches.length !== 1) return;
            if (!window.THREE || !window.camera || !window.controls) return;
            
            const deltaX = e.touches[0].clientX - telescopeTouchStart.x;
            const deltaY = e.touches[0].clientY - telescopeTouchStart.y;
            
            // ★ 줌 레벨에 따라 감도 크게 조절 (줌이 높을수록 훨씬 느리게)
            const baseSensitivity = 0.004;
            const sensitivity = baseSensitivity / (telescopeMode.zoom * telescopeMode.zoom * 0.1 + 1);
            
            if (window.controls.target) {
                const offset = new window.THREE.Vector3().copy(window.camera.position).sub(window.controls.target);
                const spherical = new window.THREE.Spherical().setFromVector3(offset);
                
                spherical.theta -= deltaX * sensitivity;
                spherical.phi -= deltaY * sensitivity;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                
                offset.setFromSpherical(spherical);
                window.camera.position.copy(window.controls.target).add(offset);
                window.camera.lookAt(window.controls.target);
            }
            
            telescopeTouchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }, { passive: true });
        
        // 핀치 줌
        let telescopeLastPinchDist = 0;
        
        document.getElementById('telescope-overlay')?.addEventListener('touchstart', function(e) {
            if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                telescopeLastPinchDist = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: true });
        
        document.getElementById('telescope-overlay')?.addEventListener('touchmove', function(e) {
            if (!telescopeMode.active || e.touches.length !== 2) return;
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (telescopeLastPinchDist > 0) {
                const delta = (dist - telescopeLastPinchDist) * 0.05;
                updateTelescopeZoom(telescopeMode.zoom + delta);
            }
            
            telescopeLastPinchDist = dist;
        }, { passive: true });
        
        // ESC 키로 종료
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && telescopeMode.active) {
                exitTelescopeMode();
            }
        });
        
        // 주기적으로 타겟 정보 업데이트
        setInterval(updateTelescopeTarget, 500);
    }, 500);
});

// ★★★ 멀티모드 튜토리얼 시스템 ★★★
const MultiTutorial = {
    STORAGE_KEY: 'starwalker_tutorial',
    currentStep: 0,
    overlay: null,
    highlightedElement: null,
    savedPosition: '',
    savedZIndex: '',
    
    // 안전하게 현재 언어 가져오기
    getLang() {
        return window.currentLang || (typeof currentLang !== 'undefined' ? currentLang : 'en');
    },
    
    // 다국어 튜토리얼 단계 정의
    getSteps() {
        const lang = this.getLang();
        const isKo = lang === 'ko';
        const isJa = lang === 'ja';
        
        if (isKo) {
            return [
                {
                    id: 'welcome',
                    title: '🌌 STAR·WALKER에 오신 것을 환영합니다!',
                    content: `
                        <p>우주 탐험의 세계에 오신 것을 환영합니다!</p>
                        <p>이 가이드가 기본적인 조작법과 기능을 안내해 드릴게요.</p>
                        <div style="margin-top:15px;padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                            <p style="margin:0;color:#00ffff;">💡 팁: 언제든지 <b>ESC</b> 키를 눌러 가이드를 건너뛸 수 있습니다.</p>
                        </div>
                    `,
                    target: null,
                    position: 'center'
                },
                {
                    id: 'nav-panel',
                    title: '🪐 천체 목록',
                    content: `
                        <p>좌측에서 태양계의 모든 천체를 확인할 수 있습니다.</p>
                        <ul style="margin:10px 0;padding-left:20px;">
                            <li><b>태양</b> - 우리 태양계의 중심</li>
                            <li><b>행성들</b> - 수성, 금성, 지구, 화성 등</li>
                            <li><b>정거장</b> - 연료 보급 및 탐험 거점</li>
                        </ul>
                        <p style="color:#00ff88;">클릭하면 해당 천체로 카메라가 이동합니다.</p>
                    `,
                    target: '#nav-panel',
                    position: 'right'
                },
                {
                    id: 'top-bar',
                    title: '🎛️ 상단 메뉴',
                    content: `
                        <div style="display:grid;gap:10px;">
                            <div><b style="color:#00ff88;">⛽ 정거장</b> - 우주 정거장 목록 보기</div>
                            <div><b style="color:#a855f7;">📚 도감</b> - 발견한 천체 도감 확인</div>
                            <div><b style="color:#00ffff;">🖥️ 전체화면</b> - 몰입감 있는 플레이</div>
                            <div><b style="color:#ff9500;">⏱️ 0.1x</b> - 시간 배속 표시</div>
                        </div>
                    `,
                    target: '#top-bar',
                    position: 'bottom'
                },
                {
                    id: 'login',
                    title: '👤 로그인',
                    content: `
                        <p>우측 상단의 <b style="color:#00ff88;">로그인</b> 버튼을 눌러 계정을 만들거나 로그인하세요.</p>
                        <p style="margin-top:10px;">로그인하면:</p>
                        <ul style="margin:10px 0;padding-left:20px;">
                            <li>다른 플레이어와 함께 탐험</li>
                            <li>진행 상황 저장</li>
                            <li>우주선 소유 및 업그레이드</li>
                        </ul>
                        <p style="margin-top:10px;color:#00ffff;font-size:13px;">💡 이미 로그인되어 있다면 이 단계는 건너뛰세요!</p>
                    `,
                    target: '#btn-login',
                    position: 'left'
                },
                {
                    id: 'boarding',
                    title: '🚀 우주선 탑승',
                    content: `
                        <p>우주선은 <b style="color:#00ffff;">우주 정거장</b>에서 탑승할 수 있습니다.</p>
                        <div style="margin:15px 0;padding:12px;background:rgba(0,255,136,0.15);border:1px solid #00ff88;border-radius:8px;">
                            <p style="margin:0;color:#00ff88;"><b>🌍 첫 우주선 받기</b></p>
                            <p style="margin:8px 0 0 0;">지구 근처의 <b>ISS 우주정거장</b>으로 이동하면<br>첫 우주선을 지급받을 수 있습니다!</p>
                        </div>
                        <div style="margin-top:15px;padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                            <p style="margin:0;"><b>조종 방법:</b></p>
                            <p style="margin:5px 0 0 0;">• <b>W/S</b> 또는 <b>↑/↓</b> - 가속/감속</p>
                            <p style="margin:5px 0 0 0;">• 마우스 드래그 - 방향 전환</p>
                            <p style="margin:5px 0 0 0;">• <b>자동항법</b> - 목적지 자동 비행</p>
                        </div>
                    `,
                    target: null,
                    position: 'center'
                },
                {
                    id: 'complete',
                    title: '🎉 준비 완료!',
                    content: `
                        <p>이제 우주 탐험을 시작할 준비가 되었습니다!</p>
                        <div style="margin-top:15px;display:grid;gap:8px;">
                            <div style="padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                                🎯 <b>미션</b>: 천체를 방문하면 ✓ 표시가 됩니다
                            </div>
                            <div style="padding:10px;background:rgba(255,149,0,0.1);border-radius:8px;">
                                ⛽ <b>연료</b>: 정거장에서 연료를 보급하세요
                            </div>
                            <div style="padding:10px;background:rgba(168,85,247,0.1);border-radius:8px;">
                                👥 <b>멀티플레이</b>: 다른 플레이어와 실시간 탐험!
                            </div>
                        </div>
                        <p style="margin-top:15px;color:#00ff88;text-align:center;">즐거운 우주 탐험 되세요! 🚀</p>
                    `,
                    target: null,
                    position: 'center'
                }
            ];
        } else if (isJa) {
            return [
                {
                    id: 'welcome',
                    title: '🌌 STAR·WALKERへようこそ！',
                    content: `
                        <p>宇宙探検の世界へようこそ！</p>
                        <p>このガイドが基本的な操作方法と機能をご案内します。</p>
                        <div style="margin-top:15px;padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                            <p style="margin:0;color:#00ffff;">💡 ヒント: いつでも<b>ESC</b>キーでガイドをスキップできます。</p>
                        </div>
                    `,
                    target: null,
                    position: 'center'
                },
                {
                    id: 'nav-panel',
                    title: '🪐 天体リスト',
                    content: `
                        <p>左側で太陽系のすべての天体を確認できます。</p>
                        <ul style="margin:10px 0;padding-left:20px;">
                            <li><b>太陽</b> - 太陽系の中心</li>
                            <li><b>惑星</b> - 水星、金星、地球、火星など</li>
                            <li><b>ステーション</b> - 燃料補給と探検拠点</li>
                        </ul>
                        <p style="color:#00ff88;">クリックするとカメラがその天体に移動します。</p>
                    `,
                    target: '#nav-panel',
                    position: 'right'
                },
                {
                    id: 'top-bar',
                    title: '🎛️ 上部メニュー',
                    content: `
                        <div style="display:grid;gap:10px;">
                            <div><b style="color:#00ff88;">⛽ ステーション</b> - 宇宙ステーションリスト</div>
                            <div><b style="color:#a855f7;">📚 図鑑</b> - 発見した天体の情報</div>
                            <div><b style="color:#00ffff;">🖥️ 全画面</b> - 没入感のあるプレイ</div>
                            <div><b style="color:#ff9500;">⏱️ 0.1x</b> - 時間倍速表示</div>
                        </div>
                    `,
                    target: '#top-bar',
                    position: 'bottom'
                },
                {
                    id: 'login',
                    title: '👤 ログイン',
                    content: `
                        <p>右上の<b style="color:#00ff88;">ログイン</b>ボタンでアカウントを作成またはログインしてください。</p>
                        <p style="margin-top:10px;">ログインすると:</p>
                        <ul style="margin:10px 0;padding-left:20px;">
                            <li>他のプレイヤーと一緒に探検</li>
                            <li>進行状況の保存</li>
                            <li>宇宙船の所有とアップグレード</li>
                        </ul>
                    `,
                    target: '#btn-login',
                    position: 'left'
                },
                {
                    id: 'boarding',
                    title: '🚀 宇宙船に乗る',
                    content: `
                        <p>宇宙船は<b style="color:#00ffff;">宇宙ステーション</b>で搭乗できます。</p>
                        <div style="margin:15px 0;padding:12px;background:rgba(0,255,136,0.15);border:1px solid #00ff88;border-radius:8px;">
                            <p style="margin:0;color:#00ff88;"><b>🌍 最初の宇宙船を入手</b></p>
                            <p style="margin:8px 0 0 0;">地球近くの<b>ISS宇宙ステーション</b>に移動すると<br>最初の宇宙船がもらえます！</p>
                        </div>
                        <div style="margin-top:15px;padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                            <p style="margin:0;"><b>操縦方法:</b></p>
                            <p style="margin:5px 0 0 0;">• <b>W/S</b>または<b>↑/↓</b> - 加速/減速</p>
                            <p style="margin:5px 0 0 0;">• マウスドラッグ - 方向転換</p>
                            <p style="margin:5px 0 0 0;">• <b>自動航法</b> - 目的地まで自動飛行</p>
                        </div>
                    `,
                    target: null,
                    position: 'center'
                },
                {
                    id: 'complete',
                    title: '🎉 準備完了！',
                    content: `
                        <p>宇宙探検を始める準備ができました！</p>
                        <div style="margin-top:15px;display:grid;gap:8px;">
                            <div style="padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                                🎯 <b>ミッション</b>: 天体を訪問すると✓がつきます
                            </div>
                            <div style="padding:10px;background:rgba(255,149,0,0.1);border-radius:8px;">
                                ⛽ <b>燃料</b>: ステーションで燃料を補給
                            </div>
                            <div style="padding:10px;background:rgba(168,85,247,0.1);border-radius:8px;">
                                👥 <b>マルチプレイ</b>: 他のプレイヤーとリアルタイム探検！
                            </div>
                        </div>
                        <p style="margin-top:15px;color:#00ff88;text-align:center;">楽しい宇宙探検を！ 🚀</p>
                    `,
                    target: null,
                    position: 'center'
                }
            ];
        } else {
            // English (default)
            return [
                {
                    id: 'welcome',
                    title: '🌌 Welcome to STAR·WALKER!',
                    content: `
                        <p>Welcome to the world of space exploration!</p>
                        <p>This guide will walk you through the basic controls and features.</p>
                        <div style="margin-top:15px;padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                            <p style="margin:0;color:#00ffff;">💡 Tip: Press <b>ESC</b> anytime to skip this guide.</p>
                        </div>
                    `,
                    target: null,
                    position: 'center'
                },
                {
                    id: 'nav-panel',
                    title: '🪐 Celestial Bodies',
                    content: `
                        <p>View all celestial bodies in our solar system on the left panel.</p>
                        <ul style="margin:10px 0;padding-left:20px;">
                            <li><b>Sun</b> - Center of our solar system</li>
                            <li><b>Planets</b> - Mercury, Venus, Earth, Mars, etc.</li>
                            <li><b>Stations</b> - Refuel and exploration hubs</li>
                        </ul>
                        <p style="color:#00ff88;">Click to move the camera to that body.</p>
                    `,
                    target: '#nav-panel',
                    position: 'right'
                },
                {
                    id: 'top-bar',
                    title: '🎛️ Top Menu',
                    content: `
                        <div style="display:grid;gap:10px;">
                            <div><b style="color:#00ff88;">⛽ Station</b> - View space station list</div>
                            <div><b style="color:#a855f7;">📚 Catalog</b> - Check discovered bodies</div>
                            <div><b style="color:#00ffff;">🖥️ Fullscreen</b> - Immersive gameplay</div>
                            <div><b style="color:#ff9500;">⏱️ 0.1x</b> - Time speed display</div>
                        </div>
                    `,
                    target: '#top-bar',
                    position: 'bottom'
                },
                {
                    id: 'login',
                    title: '👤 Login',
                    content: `
                        <p>Click the <b style="color:#00ff88;">Login</b> button in the top right to create an account or sign in.</p>
                        <p style="margin-top:10px;">With login you can:</p>
                        <ul style="margin:10px 0;padding-left:20px;">
                            <li>Explore with other players</li>
                            <li>Save your progress</li>
                            <li>Own and upgrade ships</li>
                        </ul>
                        <p style="margin-top:10px;color:#00ffff;font-size:13px;">💡 Skip this step if already logged in!</p>
                    `,
                    target: '#btn-login',
                    position: 'left'
                },
                {
                    id: 'boarding',
                    title: '🚀 Board a Ship',
                    content: `
                        <p>Ships can be boarded at <b style="color:#00ffff;">Space Stations</b>.</p>
                        <div style="margin:15px 0;padding:12px;background:rgba(0,255,136,0.15);border:1px solid #00ff88;border-radius:8px;">
                            <p style="margin:0;color:#00ff88;"><b>🌍 Get Your First Ship</b></p>
                            <p style="margin:8px 0 0 0;">Travel to <b>ISS Space Station</b> near Earth<br>to receive your first ship!</p>
                        </div>
                        <div style="margin-top:15px;padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                            <p style="margin:0;"><b>Controls:</b></p>
                            <p style="margin:5px 0 0 0;">• <b>W/S</b> or <b>↑/↓</b> - Accelerate/Decelerate</p>
                            <p style="margin:5px 0 0 0;">• Mouse drag - Turn direction</p>
                            <p style="margin:5px 0 0 0;">• <b>Autopilot</b> - Auto-fly to destination</p>
                        </div>
                    `,
                    target: null,
                    position: 'center'
                },
                {
                    id: 'complete',
                    title: '🎉 Ready to Go!',
                    content: `
                        <p>You're all set to begin your space adventure!</p>
                        <div style="margin-top:15px;display:grid;gap:8px;">
                            <div style="padding:10px;background:rgba(0,255,255,0.1);border-radius:8px;">
                                🎯 <b>Missions</b>: Visit bodies to mark them ✓
                            </div>
                            <div style="padding:10px;background:rgba(255,149,0,0.1);border-radius:8px;">
                                ⛽ <b>Fuel</b>: Refuel at stations
                            </div>
                            <div style="padding:10px;background:rgba(168,85,247,0.1);border-radius:8px;">
                                👥 <b>Multiplayer</b>: Real-time exploration with others!
                            </div>
                        </div>
                        <p style="margin-top:15px;color:#00ff88;text-align:center;">Enjoy your space journey! 🚀</p>
                    `,
                    target: null,
                    position: 'center'
                }
            ];
        }
    },
    
    // 다국어 버튼 텍스트
    getButtonText() {
        const lang = this.getLang();
        const isKo = lang === 'ko';
        const isJa = lang === 'ja';
        return {
            skip: isKo ? '건너뛰기' : isJa ? 'スキップ' : 'Skip',
            next: isKo ? '다음' : isJa ? '次へ' : 'Next',
            start: isKo ? '시작하기' : isJa ? '始める' : 'Start'
        };
    },
    
    // 기능별 가이드 (첫 사용 시)
    getFeatureGuides() {
        const lang = this.getLang();
        const isKo = lang === 'ko';
        const isJa = lang === 'ja';
        
        if (isKo) {
            return {
                'station-modal': { title: '⛽ 우주 정거장', content: '여기서 연료 정거장 목록을 확인하고 빠르게 이동할 수 있습니다.', shown: false },
                'catalog-modal': { title: '📚 천체 도감', content: '발견한 천체들의 정보를 확인할 수 있습니다. 모든 천체를 방문해보세요!', shown: false },
                'ship-select': { title: '🚀 우주선 선택', content: '다양한 우주선 중 원하는 것을 선택하세요. 각 우주선마다 특성이 다릅니다.', shown: false },
                'pilot-mode': { title: '🎮 조종 모드', content: 'W/S로 가속/감속, 마우스로 방향 전환! 자동항법으로 편하게 이동할 수도 있습니다.', shown: false },
                'autopilot': { title: '🤖 자동항법', content: '목적지를 선택하면 자동으로 비행합니다. 도착하면 자동 정지!', shown: false }
            };
        } else if (isJa) {
            return {
                'station-modal': { title: '⛽ 宇宙ステーション', content: 'ここで燃料ステーションリストを確認し、素早く移動できます。', shown: false },
                'catalog-modal': { title: '📚 天体図鑑', content: '発見した天体の情報を確認できます。すべての天体を訪問してみてください！', shown: false },
                'ship-select': { title: '🚀 宇宙船選択', content: '様々な宇宙船から選んでください。それぞれ特性が異なります。', shown: false },
                'pilot-mode': { title: '🎮 操縦モード', content: 'W/Sで加速/減速、マウスで方向転換！自動航法で楽に移動もできます。', shown: false },
                'autopilot': { title: '🤖 自動航法', content: '目的地を選ぶと自動で飛行します。到着すると自動停止！', shown: false }
            };
        } else {
            return {
                'station-modal': { title: '⛽ Space Station', content: 'View fuel station list and quickly travel here.', shown: false },
                'catalog-modal': { title: '📚 Celestial Catalog', content: 'Check info on discovered bodies. Visit them all!', shown: false },
                'ship-select': { title: '🚀 Ship Selection', content: 'Choose from various ships. Each has unique characteristics.', shown: false },
                'pilot-mode': { title: '🎮 Pilot Mode', content: 'W/S to accelerate/decelerate, mouse to turn! Autopilot available too.', shown: false },
                'autopilot': { title: '🤖 Autopilot', content: 'Select a destination and fly automatically. Auto-stop on arrival!', shown: false }
            };
        }
    },
    
    featureGuidesShown: {},

    // 사용자별 스토리지 키 생성
    getStorageKey() {
        const userId = window.mpUserId || window.currentUser?.id || 'guest';
        return `${this.STORAGE_KEY}_${userId}`;
    },

    // 저장된 상태 불러오기 (사용자별 + 서버)
    async loadState() {
        try {
            // 1. 로컬스토리지에서 먼저 확인
            const saved = localStorage.getItem(this.getStorageKey());
            if (saved) {
                const state = JSON.parse(saved);
                this.featureGuidesShown = state.featureGuidesShown || {};
                if (state.completed) return true;
            }

            // 2. 로그인한 사용자면 서버에서도 확인
            if (window.mpUser && typeof supabase !== 'undefined') {
                const { data } = await supabase
                    .from('profiles')
                    .select('tutorial_completed')
                    .eq('id', window.mpUser.id)
                    .single();

                if (data?.tutorial_completed) {
                    // 서버에 완료 기록 있으면 로컬에도 저장
                    this.saveState(true);
                    return true;
                }
            }
        } catch (e) {
            console.warn('튜토리얼 상태 로드 오류:', e);
        }
        return false;
    },

    // 상태 저장 (사용자별 + 서버)
    async saveState(completed = false) {
        try {
            // 1. 로컬스토리지에 저장
            localStorage.setItem(this.getStorageKey(), JSON.stringify({
                completed,
                featureGuidesShown: this.featureGuidesShown,
                timestamp: Date.now()
            }));

            // 2. 로그인한 사용자면 서버에도 저장
            if (completed && window.mpUser && typeof supabase !== 'undefined') {
                await supabase
                    .from('profiles')
                    .update({ tutorial_completed: true })
                    .eq('id', window.mpUser.id);
                console.log('튜토리얼 완료 서버 저장됨');
            }
        } catch (e) {
            console.warn('튜토리얼 상태 저장 오류:', e);
        }
    },

    // 튜토리얼 시작 체크
    async checkAndStart() {
        const completed = await this.loadState();
        if (!completed) {
            this.start();
        }
    },
    
    // 튜토리얼 시작
    start() {
        this.currentStep = 0;
        document.body.classList.add('tutorial-active');
        this.createOverlay();
        this.showStep(0);
        
        // ESC 키로 건너뛰기
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    },
    
    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.complete();
        }
    },
    
    // 오버레이 생성
    createOverlay() {
        if (this.overlay) return;
        
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <style>
                #tutorial-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.4);
                    z-index: 99990;
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-end;
                    padding: 20px;
                    box-sizing: border-box;
                    pointer-events: none;
                }
                /* 튜토리얼 중 UI 요소들 클릭 가능하게 */
                body.tutorial-active #top-bar,
                body.tutorial-active #nav-container,
                body.tutorial-active #btn-login,
                body.tutorial-active .login-status {
                    position: relative;
                    z-index: 99995 !important;
                    pointer-events: auto;
                }
                #tutorial-box {
                    background: linear-gradient(135deg, rgba(10, 15, 25, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%);
                    border: 2px solid #00ffff;
                    border-radius: 8px;
                    padding: 20px;
                    max-width: 380px;
                    width: 100%;
                    color: #fff;
                    font-family: 'Rajdhani', sans-serif;
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.05);
                    position: relative;
                    z-index: 100001;
                    pointer-events: auto;
                    max-height: calc(100vh - 100px);
                    overflow-y: auto;
                }
                #tutorial-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #00ffff, transparent);
                }
                #tutorial-step {
                    position: absolute;
                    top: 10px;
                    right: 15px;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 11px;
                    color: #00ffff;
                    opacity: 0.7;
                }
                #tutorial-title {
                    font-family: 'Orbitron', sans-serif;
                    font-size: 20px;
                    font-weight: 700;
                    color: #00ffff;
                    margin-bottom: 20px;
                    text-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
                }
                #tutorial-content {
                    font-size: 15px;
                    line-height: 1.7;
                    color: #c8d6e5;
                }
                #tutorial-content p { margin: 10px 0; }
                #tutorial-content ul { margin: 10px 0; }
                #tutorial-content li { margin: 5px 0; }
                #tutorial-content b { color: #fff; }
                #tutorial-buttons {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 25px;
                    gap: 15px;
                }
                .tutorial-btn {
                    flex: 1;
                    padding: 12px 20px;
                    border: 1px solid;
                    background: transparent;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
                }
                .tutorial-btn.skip {
                    border-color: #6b7c93;
                    color: #6b7c93;
                }
                .tutorial-btn.skip:hover {
                    background: rgba(107, 124, 147, 0.2);
                    color: #fff;
                }
                .tutorial-btn.next {
                    border-color: #00ffff;
                    color: #00ffff;
                    background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 255, 255, 0.02) 100%);
                }
                .tutorial-btn.next:hover {
                    background: linear-gradient(135deg, rgba(0, 255, 255, 0.3) 0%, rgba(0, 255, 255, 0.1) 100%);
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
                }
                .tutorial-btn.complete {
                    border-color: #00ff88;
                    color: #00ff88;
                    background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.02) 100%);
                }
                .tutorial-btn.complete:hover {
                    background: linear-gradient(135deg, rgba(0, 255, 136, 0.3) 0%, rgba(0, 255, 136, 0.1) 100%);
                    box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
                }
                #tutorial-highlight {
                    position: fixed;
                    border: 3px solid #00ffff;
                    border-radius: 8px;
                    box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
                    pointer-events: none;
                    z-index: 99999;
                    animation: tutorialPulse 2s infinite;
                    display: none;
                }
                @keyframes tutorialPulse {
                    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
                    50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.8); }
                }
                #tutorial-progress {
                    display: flex;
                    justify-content: center;
                    gap: 8px;
                    margin-top: 20px;
                }
                .progress-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: rgba(0, 255, 255, 0.2);
                    border: 1px solid rgba(0, 255, 255, 0.5);
                    transition: all 0.3s ease;
                }
                .progress-dot.active {
                    background: #00ffff;
                    box-shadow: 0 0 10px #00ffff;
                }
                .progress-dot.completed {
                    background: #00ff88;
                    border-color: #00ff88;
                }
            </style>
            <div id="tutorial-highlight"></div>
            <div id="tutorial-box">
                <div id="tutorial-step"></div>
                <div id="tutorial-title"></div>
                <div id="tutorial-content"></div>
                <div id="tutorial-buttons">
                    <button class="tutorial-btn skip" id="tutorial-skip-btn">${this.getButtonText().skip}</button>
                    <button class="tutorial-btn next" id="tutorial-next-btn">${this.getButtonText().next}</button>
                </div>
                <div id="tutorial-progress"></div>
            </div>
        `;
        document.body.appendChild(this.overlay);
        
        // 이벤트 리스너 추가
        document.getElementById('tutorial-skip-btn').onclick = () => this.complete();
        document.getElementById('tutorial-next-btn').onclick = () => this.nextStep();
    },
    
    // 단계 표시
    showStep(index) {
        const steps = this.getSteps();
        if (index >= steps.length) {
            this.complete();
            return;
        }
        
        const step = steps[index];
        this.currentStep = index;
        
        // ★ 이전 하이라이트 대상 스타일 복원
        if (this.highlightedElement) {
            this.highlightedElement.style.position = this.savedPosition || '';
            this.highlightedElement.style.zIndex = this.savedZIndex || '';
            this.highlightedElement = null;
        }
        
        document.getElementById('tutorial-step').textContent = `${index + 1} / ${steps.length}`;
        document.getElementById('tutorial-title').textContent = step.title;
        document.getElementById('tutorial-content').innerHTML = step.content;
        
        // 버튼 업데이트
        const nextBtn = document.getElementById('tutorial-next-btn');
        const btnText = this.getButtonText();
        if (index === steps.length - 1) {
            nextBtn.textContent = btnText.start;
            nextBtn.className = 'tutorial-btn complete';
            nextBtn.onclick = () => this.complete();
        } else {
            nextBtn.textContent = btnText.next;
            nextBtn.className = 'tutorial-btn next';
            nextBtn.onclick = () => this.nextStep();
        }
        
        // 진행 표시 업데이트
        let progressHtml = '';
        for (let i = 0; i < steps.length; i++) {
            const cls = i < index ? 'completed' : (i === index ? 'active' : '');
            progressHtml += `<div class="progress-dot ${cls}"></div>`;
        }
        document.getElementById('tutorial-progress').innerHTML = progressHtml;
        
        // 하이라이트
        const highlight = document.getElementById('tutorial-highlight');
        if (step.target) {
            const target = document.querySelector(step.target);
            if (target) {
                const rect = target.getBoundingClientRect();
                highlight.style.display = 'block';
                highlight.style.left = (rect.left - 5) + 'px';
                highlight.style.top = (rect.top - 5) + 'px';
                highlight.style.width = (rect.width + 10) + 'px';
                highlight.style.height = (rect.height + 10) + 'px';
                
                // ★ 하이라이트 대상을 오버레이 위로 올리기
                this.savedPosition = target.style.position;
                this.savedZIndex = target.style.zIndex;
                target.style.position = 'relative';
                target.style.zIndex = '100001';
                this.highlightedElement = target;
            }
        } else {
            highlight.style.display = 'none';
        }
    },
    
    // 다음 단계
    nextStep() {
        this.showStep(this.currentStep + 1);
    },
    
    // 완료
    complete() {
        this.saveState(true);
        document.removeEventListener('keydown', this.handleKeydown);
        document.body.classList.remove('tutorial-active');  // ★ UI 스타일 복원
        
        // ★ 하이라이트 대상 스타일 복원
        if (this.highlightedElement) {
            this.highlightedElement.style.position = this.savedPosition || '';
            this.highlightedElement.style.zIndex = this.savedZIndex || '';
            this.highlightedElement = null;
        }
        
        if (this.overlay) {
            this.overlay.style.opacity = '0';
            this.overlay.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                this.overlay.remove();
                this.overlay = null;
            }, 300);
        }
    },
    
    // 기능 가이드 표시 (첫 사용 시)
    showFeatureGuide(featureId) {
        // 이미 표시한 가이드인지 확인
        if (this.featureGuidesShown[featureId]) return;
        
        const guides = this.getFeatureGuides();
        const guide = guides[featureId];
        if (!guide) return;
        
        this.featureGuidesShown[featureId] = true;
        this.saveState();
        
        const lang = this.getLang();
        const isKo = lang === 'ko';
        const isJa = lang === 'ja';
        const okText = isKo ? '확인' : isJa ? 'OK' : 'OK';
        
        // 작은 팝업 표시
        const popup = document.createElement('div');
        popup.className = 'feature-guide-popup';
        popup.innerHTML = `
            <style>
                .feature-guide-popup {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, rgba(10, 15, 25, 0.98) 0%, rgba(15, 20, 35, 0.95) 100%);
                    border: 2px solid #00ffff;
                    padding: 25px 30px;
                    z-index: 100001;
                    font-family: 'Rajdhani', sans-serif;
                    max-width: 350px;
                    clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
                    box-shadow: 0 0 40px rgba(0, 255, 255, 0.4);
                    animation: featurePopIn 0.3s ease;
                }
                @keyframes featurePopIn {
                    from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
                .feature-guide-popup h3 {
                    font-family: 'Orbitron', sans-serif;
                    color: #00ffff;
                    margin: 0 0 15px 0;
                    font-size: 16px;
                }
                .feature-guide-popup p {
                    color: #c8d6e5;
                    margin: 0;
                    line-height: 1.6;
                }
                .feature-guide-popup button {
                    margin-top: 15px;
                    width: 100%;
                    padding: 10px;
                    background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 255, 255, 0.05) 100%);
                    border: 1px solid #00ffff;
                    color: #00ffff;
                    font-family: 'Orbitron', sans-serif;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .feature-guide-popup button:hover {
                    background: rgba(0, 255, 255, 0.3);
                }
            </style>
            <h3>${guide.title}</h3>
            <p>${guide.content}</p>
            <button onclick="this.parentElement.remove()">${okText}</button>
        `;
        document.body.appendChild(popup);
        
        // 5초 후 자동 닫기
        setTimeout(() => {
            if (popup.parentElement) {
                popup.style.opacity = '0';
                popup.style.transition = 'opacity 0.3s';
                setTimeout(() => popup.remove(), 300);
            }
        }, 5000);
    },
    
    // 튜토리얼 리셋 (디버그용)
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Tutorial reset');
    }
};

// 전역 노출
window.MultiTutorial = MultiTutorial;
