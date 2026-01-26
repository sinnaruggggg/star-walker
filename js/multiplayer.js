// ============================================================
// Solar Explorer 멀티플레이어 코드
// ============================================================

// ============ 우주 사운드 시스템 (자동 전환) ============
const SpaceAudio = {
    ctx: null,
    masterGain: null,
    isInitialized: false,
    isPlaying: false,
    currentMode: null,
    volume: 0.4,
    nodes: [],
    timers: [],
    
    // ★★★ 외부 BGM 설정 ★★★
    bgmConfig: null,
    bgmAudio: null,  // HTML Audio 요소
    bgmLoaded: false,
    
    init() {
        if (this.isInitialized) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);
        this.isInitialized = true;
        
        // ★ BGM 설정 로드
        this.loadBgmConfig();
    },
    
    // ★★★ BGM 설정 파일 로드 ★★★
    async loadBgmConfig() {
        try {
            const res = await fetch('bgm_config.json');
            if (res.ok) {
                this.bgmConfig = await res.json();
                this.bgmLoaded = true;
                console.log('🎵 BGM 설정 로드됨:', this.bgmConfig);
            }
        } catch(e) {
            console.log('🎵 bgm_config.json 없음 - 기본 사운드 사용');
        }
    },
    
    // ★★★ 외부 BGM 재생 ★★★
    playBgm(category) {
        if (!this.bgmConfig || !this.bgmConfig.tracks) return false;
        
        // 해당 카테고리의 기본 BGM 찾기
        const defaultId = this.bgmConfig.defaults?.[category];
        let track = null;
        
        if (defaultId) {
            track = this.bgmConfig.tracks.find(t => t.id === defaultId);
        }
        
        // 기본 설정 없으면 해당 카테고리의 첫번째 트랙
        if (!track) {
            track = this.bgmConfig.tracks.find(t => t.category === category);
        }
        
        if (!track) return false;
        
        // 기존 BGM 정지
        this.stopBgm();
        
        // 새 BGM 재생
        console.log('🎵 BGM 재생:', track.name, track.url);
        this.bgmAudio = new Audio(track.url);
        this.bgmAudio.volume = (track.volume || 80) / 100 * this.volume;
        this.bgmAudio.loop = track.loop !== false;  // 기본값 true
        this.bgmAudio.play().catch(e => console.log('BGM 자동재생 차단됨'));
        
        return true;
    },
    
    // ★★★ 외부 BGM 정지 ★★★
    stopBgm() {
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.currentTime = 0;
            this.bgmAudio = null;
        }
    },
    
    stop() {
        this.stopBgm();  // ★ 외부 BGM도 정지
        this.timers.forEach(t => clearInterval(t));
        this.timers = [];
        this.nodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(e) {} });
        this.nodes = [];
        this.isPlaying = false;
        this.currentMode = null;
    },
    
    // ===== 우주 공간 BGM =====
    playSpace() {
        if (this.currentMode === 'space') return;
        this.stop();
        this.init();
        this.currentMode = 'space';
        this.isPlaying = true;
        
        // ★ 외부 BGM 있으면 우선 재생
        if (this.playBgm('explore')) {
            return;  // 외부 BGM 재생 성공
        }
        
        // 외부 BGM 없으면 기본 사운드
        const ctx = this.ctx;
        
        // 1. 딥 드론 (40Hz)
        const drone = ctx.createOscillator();
        const droneGain = ctx.createGain();
        drone.type = 'sine';
        drone.frequency.value = 40;
        droneGain.gain.value = 0.25;
        drone.connect(droneGain);
        droneGain.connect(this.masterGain);
        drone.start();
        this.nodes.push(drone);
        
        // 2. 5도 위 드론 (60Hz)
        const drone2 = ctx.createOscillator();
        const drone2Gain = ctx.createGain();
        drone2.type = 'sine';
        drone2.frequency.value = 60;
        drone2Gain.gain.value = 0.12;
        drone2.connect(drone2Gain);
        drone2Gain.connect(this.masterGain);
        drone2.start();
        this.nodes.push(drone2);
        
        // 3. 우주 바람 노이즈
        const noiseLen = ctx.sampleRate * 3;
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        noise.loop = true;
        const noiseFilt = ctx.createBiquadFilter();
        noiseFilt.type = 'lowpass';
        noiseFilt.frequency.value = 150;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.06;
        noise.connect(noiseFilt);
        noiseFilt.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start();
        this.nodes.push(noise);
        
        // 4. 신비로운 패드 (가끔)
        const padTimer = setInterval(() => {
            if (this.currentMode !== 'space') return;
            const pad = ctx.createOscillator();
            const padGain = ctx.createGain();
            pad.type = 'sine';
            pad.frequency.value = [220, 330, 440, 550][Math.floor(Math.random() * 4)];
            padGain.gain.setValueAtTime(0, ctx.currentTime);
            padGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
            padGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5);
            pad.connect(padGain);
            padGain.connect(this.masterGain);
            pad.start();
            pad.stop(ctx.currentTime + 5);
        }, 7000);
        this.timers.push(padTimer);
    },
    
    // ===== 정거장 BGM (우주 배경 + 보이저 스타일 신호음) =====
    playStation() {
        if (this.currentMode === 'station') return;
        this.stop();
        this.init();
        this.currentMode = 'station';
        this.isPlaying = true;
        
        // ★ 외부 BGM 있으면 우선 재생
        if (this.playBgm('station')) {
            return;  // 외부 BGM 재생 성공
        }
        
        const ctx = this.ctx;
        
        // 우주 배경음 (동일)
        const drone = ctx.createOscillator();
        const droneGain = ctx.createGain();
        drone.type = 'sine';
        drone.frequency.value = 40;
        droneGain.gain.value = 0.2;
        drone.connect(droneGain);
        droneGain.connect(this.masterGain);
        drone.start();
        this.nodes.push(drone);
        
        const drone2 = ctx.createOscillator();
        const drone2Gain = ctx.createGain();
        drone2.type = 'sine';
        drone2.frequency.value = 60;
        drone2Gain.gain.value = 0.1;
        drone2.connect(drone2Gain);
        drone2Gain.connect(this.masterGain);
        drone2.start();
        this.nodes.push(drone2);
        
        // 우주 바람
        const noiseLen = ctx.sampleRate * 3;
        const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < noiseLen; i++) noiseData[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        noise.loop = true;
        const noiseFilt = ctx.createBiquadFilter();
        noiseFilt.type = 'lowpass';
        noiseFilt.frequency.value = 150;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = 0.05;
        noise.connect(noiseFilt);
        noiseFilt.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start();
        this.nodes.push(noise);
        
        // 보이저 스타일 신호음 (3.7초마다 연속 펄스)
        const voyagerTimer = setInterval(() => {
            if (this.currentMode !== 'station') return;
            
            // 8개의 연속 펄스 (데이터 버스트)
            for (let i = 0; i < 8; i++) {
                const delay = i * 0.12;
                const pulse = ctx.createOscillator();
                const pulseGain = ctx.createGain();
                
                pulse.type = 'sine';
                pulse.frequency.value = 1500;  // 보이저 주파수 대역
                
                // 살짝 떨리는 효과
                const vibrato = ctx.createOscillator();
                vibrato.type = 'sine';
                vibrato.frequency.value = 30;
                const vibGain = ctx.createGain();
                vibGain.gain.value = 20;
                vibrato.connect(vibGain);
                vibGain.connect(pulse.frequency);
                vibrato.start(ctx.currentTime + delay);
                vibrato.stop(ctx.currentTime + delay + 0.08);
                
                pulseGain.gain.setValueAtTime(0, ctx.currentTime + delay);
                pulseGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.01);
                pulseGain.gain.setValueAtTime(0.12, ctx.currentTime + delay + 0.05);
                pulseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.08);
                
                pulse.connect(pulseGain);
                pulseGain.connect(this.masterGain);
                pulse.start(ctx.currentTime + delay);
                pulse.stop(ctx.currentTime + delay + 0.1);
            }
        }, 3700);
        this.timers.push(voyagerTimer);
        
        // 긴 캐리어 톤 (10초마다)
        const carrierTimer = setInterval(() => {
            if (this.currentMode !== 'station') return;
            
            const carrier = ctx.createOscillator();
            const carrierGain = ctx.createGain();
            carrier.type = 'sine';
            carrier.frequency.value = 2295;  // 보이저 실제 캐리어 주파수 대역
            
            carrierGain.gain.setValueAtTime(0, ctx.currentTime);
            carrierGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.1);
            carrierGain.gain.setValueAtTime(0.06, ctx.currentTime + 0.8);
            carrierGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
            
            carrier.connect(carrierGain);
            carrierGain.connect(this.masterGain);
            carrier.start();
            carrier.stop(ctx.currentTime + 1.0);
        }, 10000);
        this.timers.push(carrierTimer);
    },
    
    // ===== 조종실 BGM (운항 중인 우주선) =====
    playCockpit() {
        if (this.currentMode === 'cockpit') return;
        this.stop();
        this.init();
        this.currentMode = 'cockpit';
        this.isPlaying = true;
        
        // ★ 외부 BGM 있으면 우선 재생 (battle 카테고리 사용)
        if (this.playBgm('battle')) {
            return;  // 외부 BGM 재생 성공
        }
        
        const ctx = this.ctx;
        
        // 1. 엔진 저음 웅웅 (35Hz 메인)
        const engine = ctx.createOscillator();
        const engineGain = ctx.createGain();
        engine.type = 'sine';
        engine.frequency.value = 35;
        engineGain.gain.value = 0.3;
        engine.connect(engineGain);
        engineGain.connect(this.masterGain);
        engine.start();
        this.nodes.push(engine);
        
        // 2. 엔진 하모닉 (70Hz)
        const engine2 = ctx.createOscillator();
        const engine2Gain = ctx.createGain();
        engine2.type = 'sine';
        engine2.frequency.value = 70;
        engine2Gain.gain.value = 0.15;
        engine2.connect(engine2Gain);
        engine2Gain.connect(this.masterGain);
        engine2.start();
        this.nodes.push(engine2);
        
        // 3. 엔진 진동 변화 (미세한 떨림)
        const vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 3;
        const vibGain = ctx.createGain();
        vibGain.gain.value = 2;
        vibrato.connect(vibGain);
        vibGain.connect(engine.frequency);
        vibrato.start();
        this.nodes.push(vibrato);
        
        // 4. 공기 순환 소리 (부드러운 쉬쉬)
        const airLen = ctx.sampleRate * 2;
        const airBuf = ctx.createBuffer(1, airLen, ctx.sampleRate);
        const airData = airBuf.getChannelData(0);
        for (let i = 0; i < airLen; i++) airData[i] = Math.random() * 2 - 1;
        const air = ctx.createBufferSource();
        air.buffer = airBuf;
        air.loop = true;
        const airFilt = ctx.createBiquadFilter();
        airFilt.type = 'bandpass';
        airFilt.frequency.value = 500;
        airFilt.Q.value = 1;
        const airGain = ctx.createGain();
        airGain.gain.value = 0.03;
        air.connect(airFilt);
        airFilt.connect(airGain);
        airGain.connect(this.masterGain);
        air.start();
        this.nodes.push(air);
        
        // 5. 가끔 계기판 삑 (랜덤)
        const beepTimer = setInterval(() => {
            if (this.currentMode !== 'cockpit') return;
            if (Math.random() > 0.5) return;
            const b = ctx.createOscillator();
            const g = ctx.createGain();
            b.type = 'sine';
            b.frequency.value = [600, 800, 1000, 1200][Math.floor(Math.random() * 4)];
            g.gain.setValueAtTime(0.06, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            b.connect(g);
            g.connect(this.masterGain);
            b.start();
            b.stop(ctx.currentTime + 0.05);
        }, 1500);
        this.timers.push(beepTimer);
        
        // 6. 시스템 상태음 (5초마다)
        const sysTimer = setInterval(() => {
            if (this.currentMode !== 'cockpit') return;
            if (Math.random() > 0.4) return;
            const s = ctx.createOscillator();
            const g = ctx.createGain();
            s.type = 'triangle';
            s.frequency.setValueAtTime(500, ctx.currentTime);
            s.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            g.gain.setValueAtTime(0.05, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            s.connect(g);
            g.connect(this.masterGain);
            s.start();
            s.stop(ctx.currentTime + 0.2);
        }, 5000);
        this.timers.push(sysTimer);
    },
    
    // 볼륨 설정
    setVolume(v) {
        this.volume = v;
        if (this.masterGain) this.masterGain.gain.value = v;
        // ★ 외부 BGM 볼륨도 조절
        if (this.bgmAudio) {
            this.bgmAudio.volume = v;
        }
    },
    
    // 효과음: 클릭
    playClick() {
        this.init();
        const ctx = this.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(700, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.06);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);
        o.connect(g);
        g.connect(this.masterGain);
        o.start();
        o.stop(ctx.currentTime + 0.06);
    },
    
    // 효과음: 선택
    playSelect() {
        this.init();
        const ctx = this.ctx;
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(400, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.12, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        o.connect(g);
        g.connect(this.masterGain);
        o.start();
        o.stop(ctx.currentTime + 0.15);
    },
    
    // 효과음: 워프
    playWarp() {
        this.init();
        const ctx = this.ctx;
        // 차징
        const c = ctx.createOscillator();
        const cg = ctx.createGain();
        c.type = 'sawtooth';
        c.frequency.setValueAtTime(50, ctx.currentTime);
        c.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
        cg.gain.setValueAtTime(0.2, ctx.currentTime);
        cg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        c.connect(cg);
        cg.connect(this.masterGain);
        c.start();
        c.stop(ctx.currentTime + 0.5);
        // 스윕
        setTimeout(() => {
            const s = ctx.createOscillator();
            const sg = ctx.createGain();
            s.type = 'sine';
            s.frequency.setValueAtTime(500, ctx.currentTime);
            s.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.3);
            sg.gain.setValueAtTime(0.12, ctx.currentTime);
            sg.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
            s.connect(sg);
            sg.connect(this.masterGain);
            s.start();
            s.stop(ctx.currentTime + 0.35);
        }, 350);
    },
    
    // 효과음: 에러
    playError() {
        this.init();
        const ctx = this.ctx;
        [0, 0.1].forEach(d => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'square';
            o.frequency.value = 180;
            g.gain.setValueAtTime(0.12, ctx.currentTime + d);
            g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + d + 0.08);
            o.connect(g);
            g.connect(this.masterGain);
            o.start(ctx.currentTime + d);
            o.stop(ctx.currentTime + d + 0.08);
        });
    }
};

// 위치 기반 자동 사운드 전환
let lastSoundMode = null;
function updateSoundByLocation() {
    if (!SpaceAudio.isPlaying) return;
    
    let mode = 'space';
    
    // 조종실 모드 (우주선 탑승 중)
    if (typeof isPilotMode !== 'undefined' && isPilotMode) {
        mode = 'cockpit';
    }
    // 정거장 근처 (ISS 등)
    else if (typeof focusedBody !== 'undefined' && focusedBody && 
             focusedBody.name && focusedBody.name.includes('ISS')) {
        mode = 'station';
    }
    // 선내 모드
    else if (typeof isInsideShip !== 'undefined' && isInsideShip) {
        mode = 'cockpit';
    }
    
    if (mode !== lastSoundMode) {
        lastSoundMode = mode;
        switch(mode) {
            case 'space': SpaceAudio.playSpace(); break;
            case 'station': SpaceAudio.playStation(); break;
            case 'cockpit': SpaceAudio.playCockpit(); break;
        }
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // 1초마다 위치 체크하여 사운드 자동 전환
        setInterval(updateSoundByLocation, 1000);
    }, 2000);
    
    // 버튼 클릭 효과음
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.id !== 'sound-btn') {
            SpaceAudio.playClick();
        }
    });
});

// ============ 멀티플레이어 설정 (Supabase) ============
const SUPABASE_URL = 'https://sfirzuqngdbpwvdoyero.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmaXJ6dXFuZ2RicHd2ZG95ZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MjU2MzYsImV4cCI6MjA4MTUwMTYzNn0.Si0i23yCuihJ4LOM-LXxZ8atl2YOytd1Cm2Ur6yj3fk';

// Supabase 클라이언트
let supabase = null;

// ★★★ 최적화된 멀티플레이어 설정 ★★★
const MP_UPDATE_INTERVAL = 100;      // 100ms (10fps) - 위치 변경 시에만 전송
const MP_SYNC_INTERVAL = 500;        // 500ms - Realtime 백업용 폴링
const MP_CHAT_INTERVAL = 1500;       // 1.5초 - 채팅 폴링
const MP_POSITION_THRESHOLD = 0.5;   // 이동 임계값 (이 이상 움직여야 전송)
const MP_ROTATION_THRESHOLD = 0.01;  // 회전 임계값
const MP_INACTIVE_TIMEOUT = 60000;   // 60초 후 비활성 판정

// 유저 정보
let mpUser = null;
let mpUserId = null;
let mpNickname = '익명';
let mpOtherPlayers = {};
let mpChatLastId = 0;
let mpIntervals = [];
let mpRealtimeChannel = null;

// ★★★ 중복 접속 감지용 세션 토큰 ★★★
let mpSessionToken = null;

function generateSessionToken() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ★★★ 델타 압축용 마지막 전송 상태 ★★★
let mpLastSentPosition = { x: 0, y: 0, z: 0 };
let mpLastSentRotation = { x: 0, y: 0, z: 0 };
let mpLastSentTime = 0;
let mpForceUpdateCounter = 0;

// ★★★ 서버 시간 동기화 ★★★
let serverTimeOffset = 0;  // 서버시간 - 클라이언트시간 (밀리초)
let serverTimeSynced = false;

// 서버 시간 가져오기 (HTTP Date 헤더 사용)
async function syncServerTime() {
    if (!supabase) return;

    try {
        const clientTimeBefore = Date.now();

        // Supabase REST API 호출하여 Date 헤더에서 서버 시간 추출
        const response = await fetch(SUPABASE_URL + '/rest/v1/', {
            method: 'HEAD',
            headers: {
                'apikey': SUPABASE_ANON_KEY
            }
        });

        const clientTimeAfter = Date.now();
        const serverDateHeader = response.headers.get('date');

        if (serverDateHeader) {
            const serverTime = new Date(serverDateHeader).getTime();
            const roundTrip = clientTimeAfter - clientTimeBefore;
            serverTimeOffset = serverTime - clientTimeBefore - (roundTrip / 2);
            serverTimeSynced = true;
            console.log('⏱️ 서버 시간 동기화 완료:', serverTimeOffset, 'ms 오프셋');
        } else {
            // Date 헤더 없으면 오프셋 0으로 (로컬 시간 사용)
            serverTimeOffset = 0;
            serverTimeSynced = true;
            console.log('⏱️ 서버 시간 헤더 없음, 로컬 시간 사용');
        }
    } catch (e) {
        console.warn('서버 시간 동기화 실패:', e);
        serverTimeOffset = 0;
        serverTimeSynced = true;
    }
}

// 동기화된 현재 시간 반환
function getSyncedTime() {
    return Date.now() + serverTimeOffset;
}

// Supabase SDK 로드 및 초기화
function initSupabase() {
    return new Promise(function(resolve, reject) {
        console.log('🔄 Supabase 초기화 시작...');
        
        // head에서 이미 로드된 경우
        if (window.supabase && window.supabase.createClient) {
            console.log('✅ Supabase SDK 로드됨');
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            window.supabaseClient = supabase;
            console.log('✅ Supabase 연결됨:', SUPABASE_URL);
            resolve(supabase);
            return;
        }
        
        // 아직 로드 안됐으면 잠시 대기 후 재시도
        console.log('⏳ Supabase SDK 로딩 대기...');
        var attempts = 0;
        var maxAttempts = 20;
        
        var checkInterval = setInterval(function() {
            attempts++;
            if (window.supabase && window.supabase.createClient) {
                clearInterval(checkInterval);
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                window.supabaseClient = supabase;
                console.log('✅ Supabase 연결됨 (대기 후)');
                resolve(supabase);
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.error('❌ Supabase SDK 로드 실패 - 타임아웃');
                reject(new Error('Supabase SDK load timeout'));
            }
        }, 200);
    });
}

// 페이지 로드 시 Supabase 초기화
document.addEventListener('DOMContentLoaded', function() {
    initSupabase().then(function() {
        loadSavedLogin();
    }).catch(function(e) {
        console.warn('Supabase 없이 진행:', e);
    });
});

// ★★★ Google 로그인 사용자 프로필 확인/생성 ★★★
async function ensureProfileExists(user) {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (!profile) {
        // 프로필이 없으면 생성
        const nickname = user.user_metadata?.full_name ||
                        user.email?.split('@')[0] ||
                        'Pilot_' + user.id.substring(0,6);

        const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            username: user.email,
            nickname: nickname,
            email: user.email,
            coins: 1000,
            exp: 0,
            avatar_url: user.user_metadata?.avatar_url || null
        }).select().single();

        if (insertError) {
            console.error('프로필 생성 실패:', insertError);
            return null;
        }
        console.log('✅ 새 프로필 생성:', nickname);
        return newProfile;
    }
    return profile;
}

// 로컬스토리지에서 로그인 정보 복원
function loadSavedLogin() {
    if (!supabase) return Promise.resolve(false);

    // ★★★ OAuth 콜백 처리 (URL hash 정리) ★★★
    if (window.location.hash && window.location.hash.includes('access_token')) {
        // Supabase가 자동으로 세션 처리, URL 정리
        window.history.replaceState({}, '', window.location.pathname);
    }

    return supabase.auth.getSession().then(async function(result) {
        var session = result.data.session;
        if (session && session.user) {
            // ★★★ 프로필이 없으면 생성 (Google 로그인 등) ★★★
            var profile = await ensureProfileExists(session.user);
            if (profile) {
                mpUser = {
                    id: session.user.id,
                    username: profile.username,
                    nickname: profile.nickname,
                    email: profile.email,
                    coins: profile.coins,
                    exp: profile.exp || 0,
                    currentShip: profile.current_ship,
                    unlockedShips: profile.unlocked_ships,
                    avatar_url: profile.avatar_url
                };
                mpUserId = session.user.id;
                mpSessionToken = generateSessionToken();  // ★★★ 중복 접속 감지용 ★★★
                mpNickname = profile.nickname;

                // window 객체에도 설정
                window.mpUser = mpUser;
                window.mpUserId = mpUserId;
                window.mpNickname = mpNickname;
                window.currentUser = profile.username;

                // UI 업데이트
                if (typeof updateUserUI === 'function') {
                    updateUserUI();
                }

                // ★★★ 메인 메뉴 로그인 버튼 숨기기 ★★★
                const loginMainBtn = document.getElementById('btn-login-main');
                if (loginMainBtn) {
                    loginMainBtn.style.display = 'none';
                }

                console.log('✅ 자동 로그인:', profile.nickname);
                return true;
            }
            return false;
        }
        return false;
    }).catch(function(e) {
        console.log('자동 로그인 실패:', e);
        return false;
    });
}

// ============ 로그인 창 열기 ============
function openAuthUI() {
    // ★ 이미 정식 로그인되어 있으면 열지 않음 (게스트는 재로그인 허용)
    const isGuest = window.mpUserId && window.mpUserId.indexOf('guest_') === 0;
    if (window.mpUser && !isGuest) {
        if (typeof showMsg === 'function') {
            showMsg('✅ Already logged in.');
        }
        return;
    }
    
    // auth-overlay가 없으면 생성
    if (!document.getElementById('auth-overlay')) {
        if (typeof createAuthUI === 'function') {
            createAuthUI();
        }
    }
    // 창 표시
    var ao = document.getElementById('auth-overlay');
    if (ao) {
        ao.style.display = 'flex';
    }
}

function closeAuthUI() {
    var ao = document.getElementById('auth-overlay');
    if (ao) {
        ao.style.display = 'none';
    }
}

// ============ 로그인/회원가입 UI ============
function createAuthUI() {
    // t() 함수가 없으면 기본 영어 반환
    const _t = (key) => {
        if (typeof t === 'function') return t(key);
        const defaults = {
            login: 'Login', register: 'Register', emailAddress: 'Email Address',
            password: 'Password', passwordConfirm: 'Confirm Password',
            nickname: 'Nickname', nicknameDesc: '(Displayed in game)',
            email: 'Email', emailRequired: '(Required)',
            emailVerifyNote: '※ Please enter a valid email. Verification email will be sent.',
            privacyPolicy: 'Privacy Policy', termsOfService: 'Terms of Service',
            agreeToTerms: ' - I agree', guestStart: 'Start as Guest (Not saved)'
        };
        return defaults[key] || key;
    };
    
    const authUI = document.createElement('div');
    authUI.id = 'auth-ui';
    authUI.innerHTML = `
        <style>
            #auth-overlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 10, 30, 0.95);
                z-index: 99999;
                display: none;
                justify-content: center;
                align-items: center;
                overflow-y: auto;
                padding: 20px 0;
            }
            #auth-box {
                background: linear-gradient(180deg, #0a1628 0%, #162a4a 100%);
                border: 2px solid #0ff;
                border-radius: 20px;
                padding: 40px;
                width: 350px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                margin: auto;
                box-shadow: 0 0 50px rgba(0, 255, 255, 0.3);
            }
            #auth-box h2 {
                color: #0ff;
                text-align: center;
                margin-bottom: 30px;
                font-family: 'Orbitron', sans-serif;
                font-size: 24px;
            }
            #auth-box h2::before {
                content: "🚀 ";
            }
            .auth-input {
                width: 100%;
                padding: 12px 15px;
                margin-bottom: 15px;
                background: rgba(0, 50, 80, 0.6);
                border: 1px solid #0ff;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                box-sizing: border-box;
            }
            .auth-input:focus {
                outline: none;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }
            .auth-input::placeholder {
                color: #68a;
            }
            .auth-btn {
                width: 100%;
                padding: 12px;
                margin-top: 10px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                font-family: 'Orbitron', sans-serif;
                transition: all 0.3s;
            }
            .auth-btn-primary {
                background: linear-gradient(90deg, #0ff, #00f);
                color: #000;
            }
            .auth-btn-primary:hover {
                transform: scale(1.02);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
            }
            .auth-btn-secondary {
                background: transparent;
                color: #0ff;
                border: 1px solid #0ff;
            }
            .auth-btn-secondary:hover {
                background: rgba(0, 255, 255, 0.1);
            }
            .auth-btn-guest {
                background: transparent;
                color: #888;
                border: 1px solid #444;
                margin-top: 20px;
            }
            .auth-switch {
                text-align: center;
                margin-top: 20px;
                color: #68a;
                font-size: 13px;
            }
            .auth-switch a {
                color: #0ff;
                cursor: pointer;
                text-decoration: underline;
            }
            .auth-error {
                color: #f55;
                text-align: center;
                margin-bottom: 15px;
                font-size: 13px;
            }
            .auth-tabs {
                display: flex;
                margin-bottom: 25px;
            }
            .auth-tab {
                flex: 1;
                padding: 10px;
                text-align: center;
                color: #68a;
                cursor: pointer;
                border-bottom: 2px solid #234;
                transition: all 0.3s;
            }
            .auth-tab.active {
                color: #0ff;
                border-bottom-color: #0ff;
            }
            #register-fields { display: none; }
            .auth-agree {
                margin: 10px 0;
                font-size: 12px;
                color: #8ab;
            }
            .auth-agree label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }
            .auth-agree input[type="checkbox"] {
                width: 18px;
                height: 18px;
                accent-color: #0ff;
                cursor: pointer;
            }
            .auth-agree a {
                color: #0ff;
                text-decoration: underline;
            }
            .auth-agree a:hover {
                color: #fff;
            }
            .auth-close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: 1px solid #0ff;
                color: #0ff;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 16px;
            }
            .auth-close-btn:hover {
                background: rgba(0,255,255,0.2);
            }
            .auth-divider {
                margin: 20px 0;
                text-align: center;
                color: #68a;
                font-size: 12px;
            }
            .auth-btn-google {
                background: #fff;
                color: #333;
                border: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .auth-btn-google:hover {
                background: #f5f5f5;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
        </style>
        <div id="auth-overlay">
            <div id="auth-box" style="position:relative;">
                <button class="auth-close-btn" onclick="closeAuthUI()">✕</button>
                <h2>STAR·WALKER</h2>
                <div class="auth-tabs">
                    <div class="auth-tab active" onclick="showLoginTab()">${_t('login')}</div>
                    <div class="auth-tab" onclick="showRegisterTab()">${_t('register')}</div>
                </div>
                <div id="auth-error" class="auth-error"></div>
                
                <input type="text" id="auth-username" class="auth-input" placeholder="${_t('emailAddress')}" maxlength="100">
                <input type="password" id="auth-password" class="auth-input" placeholder="${_t('password')}" maxlength="30">
                
                <div id="register-fields">
                    <input type="password" id="auth-password2" class="auth-input" placeholder="${_t('passwordConfirm')}" maxlength="30">
                    <input type="text" id="auth-nickname" class="auth-input" placeholder="${_t('nickname')} ${_t('nicknameDesc')}" maxlength="15">
                    <input type="email" id="auth-email" class="auth-input" placeholder="${_t('email')} ${_t('emailRequired')}" maxlength="100" required>
                    <div style="font-size: 11px; color: #8ab; margin-bottom: 10px;">
                        ${_t('emailVerifyNote')}
                    </div>
                    <div class="auth-agree">
                        <label>
                            <input type="checkbox" id="auth-privacy-agree">
                            <span><a href="privacy.html" target="_blank">${_t('privacyPolicy')}</a>${_t('agreeToTerms')}</span>
                        </label>
                    </div>
                    <div class="auth-agree">
                        <label>
                            <input type="checkbox" id="auth-terms-agree">
                            <span><a href="terms.html" target="_blank">${_t('termsOfService')}</a>${_t('agreeToTerms')}</span>
                        </label>
                    </div>
                </div>
                
                <button id="auth-submit-btn" class="auth-btn auth-btn-primary" onclick="submitAuth()">${_t('login')}</button>

                <div class="auth-divider">─── OR ───</div>
                <button class="auth-btn auth-btn-google" onclick="googleLogin()">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                         style="width:18px; height:18px;">
                    Continue with Google
                </button>

                <button class="auth-btn auth-btn-guest" onclick="guestLogin()">${_t('guestStart')}</button>
            </div>
        </div>
    `;
    
    // 이미 존재하면 제거 후 다시 추가
    const existingUI = document.getElementById('auth-ui');
    if (existingUI) {
        existingUI.remove();
    }
    
    document.body.appendChild(authUI);
    
    // ★★★ 오버레이 표시 ★★★
    setTimeout(() => {
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }, 50);
    
    // 엔터키 로그인
    document.getElementById('auth-password').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isRegisterMode) submitAuth();
    });
}

let isRegisterMode = false;

function showLoginTab() {
    isRegisterMode = false;
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.querySelectorAll('.auth-tab')[1].classList.remove('active');
    document.getElementById('register-fields').style.display = 'none';
    document.getElementById('auth-submit-btn').textContent = t('login');
    document.getElementById('auth-error').textContent = '';
}

function showRegisterTab() {
    isRegisterMode = true;
    document.querySelectorAll('.auth-tab')[0].classList.remove('active');
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
    document.getElementById('register-fields').style.display = 'block';
    document.getElementById('auth-submit-btn').textContent = t('register');
    document.getElementById('auth-error').textContent = '';
}

function submitAuth() {
    var username = document.getElementById('auth-username').value.trim();
    var password = document.getElementById('auth-password').value;
    var errorEl = document.getElementById('auth-error');
    
    if (!username || !password) {
        errorEl.textContent = t('enterEmailPassword');
        return;
    }
    
    if (isRegisterMode) {
        // 회원가입
        var password2 = document.getElementById('auth-password2').value;
        var nickname = document.getElementById('auth-nickname').value.trim();
        var email = document.getElementById('auth-email').value.trim();
        var privacyAgree = document.getElementById('auth-privacy-agree').checked;
        var termsAgree = document.getElementById('auth-terms-agree').checked;
        
        if (password !== password2) {
            errorEl.textContent = t('passwordsNotMatch');
            return;
        }
        if (!nickname) {
            errorEl.textContent = t('enterNickname');
            return;
        }
        // 이메일 필수 체크
        if (!email) {
            errorEl.textContent = t('enterEmailRequired');
            return;
        }
        if (!email.includes('@') || !email.includes('.')) {
            errorEl.textContent = t('invalidEmailFormat');
            return;
        }
        if (!privacyAgree) {
            errorEl.textContent = t('agreePrivacy');
            return;
        }
        if (!termsAgree) {
            errorEl.textContent = t('agreeTerms');
            return;
        }
        
        if (!supabase) {
            errorEl.textContent = t('connectingServer');
            return;
        }
        
        console.log('📝 Registration attempt:', email, nickname);
        
        // 인증 대기용 정보 저장
        window.pendingVerification = {
            email: email,
            password: password,
            username: username,
            nickname: nickname
        };
        
        // Supabase 회원가입
        supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    nickname: nickname
                }
            }
        }).then(function(result) {
            console.log('📝 Registration result:', result);
            
            if (result.error) {
                console.error('❌ Registration error:', result.error);
                if (result.error.message.includes('already registered')) {
                    errorEl.textContent = t('emailAlreadyRegistered');
                } else if (result.error.message.includes('valid email')) {
                    errorEl.textContent = t('enterValidEmail');
                } else {
                    errorEl.textContent = result.error.message;
                }
            } else {
                console.log('✅ Registration request success');
                
                // 이메일 인증이 필요한지 확인
                if (result.data.user && !result.data.session) {
                    // 이메일 인증 필요
                    console.log('📧 Email verification required');
                    showEmailVerifyPanel(email);
                } else if (result.data.session) {
                    // 인증 없이 바로 로그인됨 (이메일 확인 비활성화된 경우)
                    console.log('✅ Logged in directly');
                    processLogin(result.data.user, username, nickname);
                } else {
                    // 회원가입 성공, 로그인 화면으로
                    errorEl.style.color = '#0f0';
                    errorEl.textContent = t('registrationComplete');
                    showLoginTab();
                    document.getElementById('auth-username').value = email;
                    document.getElementById('auth-password').value = '';
                }
            }
        }).catch(function(e) {
            console.error('❌ Registration catch:', e);
            errorEl.textContent = t('serverConnectionFailed') + e.message;
        });
    } else {
        // 로그인
        if (!supabase) {
            errorEl.textContent = t('connectingServer');
            return;
        }
        
        // 이메일 형식 체크
        var loginEmail = username;
        if (!loginEmail.includes('@')) {
            errorEl.textContent = t('enterEmailExample');
            return;
        }
        
        console.log('🔐 Login attempt:', loginEmail);
        
        supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password
        }).then(function(result) {
            console.log('🔐 Login result:', result);
            
            if (result.error) {
                console.error('❌ Login error:', result.error);
                
                // 에러 메시지 분기
                if (result.error.message.includes('Email not confirmed')) {
                    errorEl.style.color = '#fa0';
                    errorEl.innerHTML = t('emailVerificationRequired');
                    
                    // 인증 대기 정보 저장
                    window.pendingVerification = {
                        email: loginEmail,
                        password: password,
                        username: loginEmail.split('@')[0],
                        nickname: loginEmail.split('@')[0]
                    };
                } else if (result.error.message.includes('Invalid login')) {
                    errorEl.textContent = t('invalidEmailOrPassword');
                } else {
                    errorEl.textContent = t('loginFailed') + result.error.message;
                }
                return;
            }
            
            var user = result.data.user;
            console.log('✅ 인증 성공, 사용자:', user.id);
            
            // 기본 사용자 정보 설정 (profiles 테이블 없어도 동작)
            mpUser = {
                id: user.id,
                username: username,
                nickname: username,
                email: user.email,
                coins: 1000,
                currentShip: 'shuttle',
                unlockedShips: ['shuttle']
            };
            mpUserId = user.id;
            mpSessionToken = generateSessionToken();  // ★★★ 중복 접속 감지용 ★★★
            mpNickname = username;

            // window 객체에도 설정
            window.mpUser = mpUser;
            window.mpUserId = mpUserId;
            window.mpNickname = mpNickname;
            window.currentUser = mpUser.username;
            
            // 프로필 정보 가져오기 시도 (실패해도 계속 진행)
            supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(function(profileResult) {
                    console.log('📋 프로필 조회 결과:', profileResult);
                    
                    if (profileResult.data) {
                        var profile = profileResult.data;
                        mpUser.username = profile.username || username;
                        mpUser.nickname = profile.nickname || username;
                        mpUser.coins = profile.coins || 1000;
                        mpUser.exp = profile.exp || 0;
                        mpUser.avatar_url = profile.avatar_url || null;
                        mpUser.currentShip = profile.current_ship || 'shuttle';
                        mpUser.unlockedShips = profile.unlocked_ships || ['shuttle'];
                        mpNickname = mpUser.nickname;
                        
                        window.mpUser = mpUser;
                        window.mpNickname = mpNickname;
                    }
                    
                    finishLogin();
                })
                .catch(function(e) {
                    console.warn('⚠️ 프로필 조회 실패 (무시하고 진행):', e);
                    finishLogin();
                });
            
            function finishLogin() {
                // UI 업데이트
                if (typeof updateUserUI === 'function') {
                    updateUserUI();
                }
                
                console.log('✅ Supabase 로그인 성공:', mpUser.nickname);
                
                // 로그인 UI 닫기
                document.getElementById('auth-overlay').style.display = 'none';
                
                // 멀티플레이어 UI 준비
                if (!document.getElementById('multiplayer-ui')) {
                    createMultiplayerUI();
                }
                var mpUI = document.getElementById('multiplayer-ui');
                if (mpUI) mpUI.style.display = 'none';
                console.log('멀티플레이어 로그인 완료');
                
                // ★★★ 저장된 우주선 위치 확인 ★★★
                if (typeof checkSavedShipOnLogin === 'function') {
                    checkSavedShipOnLogin();
                }
            }
        }).catch(function(e) {
            console.error('❌ 로그인 catch:', e);
            errorEl.textContent = 'Server connection failed: ' + e.message;
        });
    }
}

// 이메일 인증 대기 화면 표시
function showEmailVerifyPanel(email) {
    // 폼 숨기기
    document.getElementById('auth-username').style.display = 'none';
    document.getElementById('auth-password').style.display = 'none';
    document.getElementById('register-fields').style.display = 'none';
    document.getElementById('auth-submit-btn').style.display = 'none';
    document.querySelector('.auth-btn-guest').style.display = 'none';
    document.querySelector('.auth-tabs').style.display = 'none';
    document.getElementById('auth-error').style.display = 'none';
    
    // 인증 대기 화면 표시
    document.getElementById('email-verify-panel').style.display = 'block';
    document.getElementById('verify-email-display').textContent = email + ' 으로 인증 메일을 보냈습니다';
}

// 로그인 화면으로 돌아가기
function backToLogin() {
    // 폼 다시 표시
    document.getElementById('auth-username').style.display = 'block';
    document.getElementById('auth-password').style.display = 'block';
    document.getElementById('auth-submit-btn').style.display = 'block';
    document.querySelector('.auth-btn-guest').style.display = 'block';
    document.querySelector('.auth-tabs').style.display = 'flex';
    document.getElementById('auth-error').style.display = 'block';
    
    // 인증 대기 화면 숨기기
    document.getElementById('email-verify-panel').style.display = 'none';
    
    // 로그인 탭으로
    showLoginTab();
    
    // 이메일로 아이디 필드 채우기
    if (window.pendingVerification && window.pendingVerification.email) {
        document.getElementById('auth-username').value = window.pendingVerification.email;
    }
}

// 이메일 인증 확인 후 로그인 시도
function checkEmailVerified() {
    var statusEl = document.getElementById('verify-status');
    
    if (!window.pendingVerification) {
        statusEl.style.color = '#f55';
        statusEl.textContent = t('noAuthInfo');
        return;
    }
    
    statusEl.style.color = '#0ff';
    statusEl.textContent = t('verifying');
    
    var email = window.pendingVerification.email;
    var password = window.pendingVerification.password;
    
    // 로그인 시도
    supabase.auth.signInWithPassword({
        email: email,
        password: password
    }).then(function(result) {
        console.log('🔐 인증 확인 로그인 결과:', result);
        
        if (result.error) {
            if (result.error.message.includes('Email not confirmed')) {
                statusEl.style.color = '#f55';
                statusEl.textContent = t('emailPending');
            } else {
                statusEl.style.color = '#f55';
                statusEl.textContent = t('loginFailedMsg') + result.error.message;
            }
        } else {
            statusEl.style.color = '#0f0';
            statusEl.textContent = t('verified');
            
            // 로그인 처리
            var user = result.data.user;
            var pending = window.pendingVerification;
            processLogin(user, pending.username, pending.nickname);
        }
    }).catch(function(e) {
        statusEl.style.color = '#f55';
        statusEl.textContent = t('serverError') + e.message;
    });
}

// 인증 메일 재발송
function resendVerificationEmail() {
    var statusEl = document.getElementById('verify-status');
    
    if (!window.pendingVerification || !window.pendingVerification.email) {
        statusEl.style.color = '#f55';
        statusEl.textContent = t('emailNotFound');
        return;
    }
    
    statusEl.style.color = '#0ff';
    statusEl.textContent = t('sendingEmail');
    
    supabase.auth.resend({
        type: 'signup',
        email: window.pendingVerification.email
    }).then(function(result) {
        console.log('📨 재발송 결과:', result);
        
        if (result.error) {
            statusEl.style.color = '#f55';
            statusEl.textContent = t('resendFailed') + result.error.message;
        } else {
            statusEl.style.color = '#0f0';
            statusEl.textContent = t('resendSuccess');
        }
    }).catch(function(e) {
        statusEl.style.color = '#f55';
        statusEl.textContent = t('serverError') + e.message;
    });
}

// 로그인 처리 공통 함수
function processLogin(user, username, nickname) {
    // 프로필 조회 및 설정
    mpUser = {
        id: user.id,
        username: username || user.email,
        nickname: nickname || username || user.email.split('@')[0],
        email: user.email,
        coins: 1000,
        currentShip: 'shuttle',
        unlockedShips: ['shuttle']
    };
    mpUserId = user.id;
    mpSessionToken = generateSessionToken();  // ★★★ 중복 접속 감지용 ★★★
    mpNickname = mpUser.nickname;

    window.mpUser = mpUser;
    window.mpUserId = mpUserId;
    window.mpNickname = mpNickname;
    window.currentUser = mpUser.username;

    // 프로필 조회 시도
    supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(function(profileResult) {
            if (profileResult.data) {
                var profile = profileResult.data;
                mpUser.username = profile.username || mpUser.username;
                mpUser.nickname = profile.nickname || mpUser.nickname;
                mpUser.coins = profile.coins || 1000;
                mpUser.currentShip = profile.current_ship || 'shuttle';
                mpUser.unlockedShips = profile.unlocked_ships || ['shuttle'];
                mpNickname = mpUser.nickname;
                
                window.mpUser = mpUser;
                window.mpNickname = mpNickname;
            }
            completeLogin();
        })
        .catch(function(e) {
            console.warn('프로필 조회 실패:', e);
            completeLogin();
        });
    
    function completeLogin() {
        if (typeof updateUserUI === 'function') {
            updateUserUI();
        }
        
        console.log('✅ 로그인 성공:', mpUser.nickname);
        
        document.getElementById('auth-overlay').style.display = 'none';
        
        if (!document.getElementById('multiplayer-ui')) {
            createMultiplayerUI();
        }
        var mpUI = document.getElementById('multiplayer-ui');
        if (mpUI) mpUI.style.display = 'none';
        
        window.pendingVerification = null;
    }
}

// ★★★ Google 로그인 ★★★
async function googleLogin() {
    const errorEl = document.getElementById('auth-error');

    if (!supabase) {
        if (errorEl) errorEl.textContent = 'Server connection failed...';
        return;
    }

    try {
        // ★ redirectTo를 Site URL과 정확히 일치시킴
        const siteUrl = 'https://star-strider-seven.vercel.app';

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: siteUrl
            }
        });

        if (error) {
            console.error('Google OAuth error:', error);
            if (errorEl) errorEl.textContent = 'Google login failed: ' + error.message;
        }
        // 성공 시 Google 로그인 페이지로 리디렉션됨
    } catch (e) {
        console.error('Google login exception:', e);
        if (errorEl) errorEl.textContent = 'Google login error: ' + e.message;
    }
}
window.googleLogin = googleLogin;

function guestLogin() {
    // ★★★ UUID 형식으로 생성 (테이블이 uuid 타입) ★★★
    mpUserId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
    mpSessionToken = generateSessionToken();  // ★★★ 중복 접속 감지용 ★★★
    mpNickname = '탐험가' + Math.floor(Math.random() * 9999);
    mpUser = null;

    // ★ window 객체에도 설정
    window.mpUserId = mpUserId;
    window.mpNickname = mpNickname;
    window.mpUser = null;
    
    document.getElementById('auth-overlay').style.display = 'none';
    
    // ★ UI 업데이트 (게스트 로그인 상태 반영)
    if (typeof updateUserUI === 'function') {
        updateUserUI();
    }
    
    // 멀티플레이어 UI 준비 (게임 모드 선택 후 시작됨)
    if (!document.getElementById('multiplayer-ui')) {
        createMultiplayerUI();
    }
    const mpUI = document.getElementById('multiplayer-ui');
    if (mpUI) mpUI.style.display = 'none';
    console.log('게스트 로그인 완료 (게임 모드 선택 대기 중)');
}

function logout() {
    var doLogout = function() {
        localStorage.removeItem('solar_user');
        mpUser = null;
        mpUserId = null;
        mpSessionToken = null;
        window.mpUser = null;
        window.mpUserId = null;
        window.currentUser = null;
        location.reload();
    };
    
    if (supabase) {
        supabase.auth.signOut().then(doLogout).catch(doLogout);
    } else {
        doLogout();
    }
}

// ============ 멀티플레이어 UI ============
function createMultiplayerUI() {
    const mpUI = document.createElement('div');
    mpUI.id = 'multiplayer-ui';
    mpUI.innerHTML = `
        <style>
            #multiplayer-ui {
                position: fixed;
                top: 60px;
                right: 10px;
                z-index: 10000;
                font-family: 'Orbitron', sans-serif;
            }
            #mp-toggle {
                background: rgba(0, 20, 40, 0.9);
                border: 1px solid #0ff;
                color: #0ff;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                display: block;
                margin-bottom: 5px;
            }
            #mp-toggle:hover {
                background: rgba(0, 100, 150, 0.9);
            }
            #mp-panel {
                background: rgba(0, 20, 40, 0.9);
                border: 1px solid #0ff;
                border-radius: 10px;
                padding: 15px;
                color: #0ff;
                width: 250px;
                max-height: 60vh;
                overflow-y: auto;
                display: block;
            }
            #mp-panel.hidden {
                display: none;
            }
            #mp-user-info {
                font-size: 14px;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid #234;
            }
            #mp-online {
                font-size: 12px;
                margin-bottom: 10px;
                color: #0f0;
            }
            #mp-chat-container {
                max-height: 150px;
                overflow-y: auto;
                font-size: 11px;
                background: rgba(0, 0, 0, 0.5);
                padding: 5px;
                border-radius: 5px;
                margin-bottom: 5px;
            }
            #mp-chat-container::-webkit-scrollbar { width: 5px; }
            #mp-chat-container::-webkit-scrollbar-thumb { background: #0ff; border-radius: 5px; }
            .mp-chat-msg { margin: 3px 0; word-break: break-word; display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px; }
            .mp-chat-msg .nick { color: #ff0; }
            .mp-chat-msg .msg-text { flex: 1; }
            .mp-chat-msg .msg-time { color: #666; font-size: 8px; margin-left: auto; white-space: nowrap; }
            #mp-chat-input {
                width: calc(100% - 50px);
                padding: 5px;
                background: rgba(0, 50, 80, 0.8);
                border: 1px solid #0ff;
                border-radius: 3px;
                color: #fff;
                font-size: 11px;
            }
            #mp-chat-send {
                width: 45px;
                padding: 5px;
                background: #0ff;
                border: none;
                border-radius: 3px;
                color: #000;
                cursor: pointer;
                font-size: 11px;
            }
            #mp-logout {
                font-size: 10px;
                color: #f88;
                cursor: pointer;
                margin-left: 10px;
            }
            .mp-player-label {
                color: #0ff;
                font-size: 10px;
                background: rgba(0, 0, 0, 0.7);
                padding: 2px 5px;
                border-radius: 3px;
            }
        </style>
        <button id="mp-toggle">💬 채팅</button>
        <div id="mp-panel">
            <div id="mp-user-info">
                👤 <span id="mp-nickname-display">${mpNickname}</span>
                ${mpUser ? '' : ' (게스트)'}
            </div>
            <div id="mp-online"><span data-i18n="playersOnline">🟢 접속자</span>: 1<span data-i18n="playersCount">명</span></div>
            <div id="mp-chat-container"></div>
            <div>
                <input type="text" id="mp-chat-input" placeholder="채팅..." data-placeholder-i18n="chatTab" maxlength="100">
                <button id="mp-chat-send" onclick="sendChat()" data-i18n="send">전송</button>
            </div>
        </div>
    `;
    document.body.appendChild(mpUI);
    
    // 토글 버튼 이벤트
    document.getElementById('mp-toggle').addEventListener('click', toggleMpPanel);
    
    document.getElementById('mp-chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });
    
    // 드래그 시스템에 등록
    if (window.draggableUISystem && window.draggableUISystem.initialized) {
        const el = document.getElementById('multiplayer-ui');
        if (el) {
            el.classList.add('draggable-ui');
            el.dataset.draggable = 'true';
            window.draggableUISystem.elements.push(el);
            window.draggableUISystem.attachEvents(el);
            console.log('드래그 등록: multiplayer-ui');
        }
    }
}

let mpPanelVisible = true;
function toggleMpPanel() {
    mpPanelVisible = !mpPanelVisible;
    const panel = document.getElementById('mp-panel');
    const btn = document.getElementById('mp-toggle');
    if (panel) {
        panel.classList.toggle('hidden', !mpPanelVisible);
    }
    if (btn) {
        btn.textContent = mpPanelVisible ? '💬 채팅' : '💬 채팅 ▶';
    }
}

// ============ 서버 통신 ============

function mpSendMyPosition(forceUpdate = false) {
    var ship = window.playerShip;
    if (!ship || !ship.mesh) return;
    if (!supabase) return;
    if (!mpUserId) return;

    var pos = ship.mesh.position;
    var rot = ship.mesh.rotation;

    // ★★★ 델타 압축: 위치/회전 변경 확인 ★★★
    var posChanged = Math.abs(pos.x - mpLastSentPosition.x) > MP_POSITION_THRESHOLD ||
                     Math.abs(pos.y - mpLastSentPosition.y) > MP_POSITION_THRESHOLD ||
                     Math.abs(pos.z - mpLastSentPosition.z) > MP_POSITION_THRESHOLD;

    var rotChanged = Math.abs(rot.x - mpLastSentRotation.x) > MP_ROTATION_THRESHOLD ||
                     Math.abs(rot.y - mpLastSentRotation.y) > MP_ROTATION_THRESHOLD ||
                     Math.abs(rot.z - mpLastSentRotation.z) > MP_ROTATION_THRESHOLD;

    // 5초마다 강제 업데이트 (하트비트)
    mpForceUpdateCounter++;
    var heartbeat = mpForceUpdateCounter >= 50; // 100ms * 50 = 5초

    // 변경 없고 강제 업데이트도 아니면 스킵
    if (!posChanged && !rotChanged && !heartbeat && !forceUpdate) {
        return;
    }

    if (heartbeat) mpForceUpdateCounter = 0;

    // 마지막 상태 저장
    mpLastSentPosition = { x: pos.x, y: pos.y, z: pos.z };
    mpLastSentRotation = { x: rot.x, y: rot.y, z: rot.z };
    mpLastSentTime = Date.now();

    var shipType = 'shuttle';
    if (typeof SHIP_TYPES !== 'undefined' && window.selectedShipIndex !== undefined) {
        shipType = SHIP_TYPES[window.selectedShipIndex] ? SHIP_TYPES[window.selectedShipIndex].id : 'shuttle';
    }

    // 우주선 색상 가져오기
    var shipColor = '#00aaff';
    if (typeof SHIP_TYPES !== 'undefined' && window.selectedShipIndex !== undefined) {
        var shipData = SHIP_TYPES[window.selectedShipIndex];
        if (shipData && shipData.color) {
            // ★ hex 숫자를 올바른 hex 문자열로 변환
            shipColor = '#' + shipData.color.toString(16).padStart(6, '0');
        }
    }

    // 상태 결정
    var status = 'flying';
    if (window.autopilot && window.autopilot.engaged) {
        status = 'autopilot';
    } else if (ship.speed < 1) {
        status = 'idle';
    }

    // ★★★ 위치 데이터 ★★★
    var data = {
        user_id: mpUserId,
        nickname: mpNickname,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rot_x: rot.x,
        rot_y: rot.y,
        rot_z: rot.z,
        ship_type: shipType,
        ship_color: shipColor,
        status: status,
        current_body: window.focusedBody ? window.focusedBody.name : null
    };

    // ★★★ user_id가 PRIMARY KEY면 onConflict 불필요 ★★★
    supabase
        .from('player_positions')
        .upsert(data)
        .then(function(result) {
            if (result.error) {
                console.log('MP 위치 전송 에러:', result.error.message);
            }
        })
        .catch(function(e) {
            console.log('MP 위치 전송 실패:', e);
        });
}

function mpGetOtherPlayers() {
    if (!supabase) {
        console.log('⚠️ mpGetOtherPlayers: supabase 없음');
        return;
    }
    if (!mpUserId) {
        console.log('⚠️ mpGetOtherPlayers: mpUserId 없음');
        return;
    }

    // ★★★ 원래 user_id로 자기 자신 제외 ★★★
    supabase
        .from('player_positions')
        .select('*')
        .neq('user_id', mpUserId)
        .then(function(result) {
            var players = result.data;
            var error = result.error;

            console.log('📡 player_positions 조회 결과:', {
                players: players ? players.length : 0,
                error: error,
                myUserId: mpUserId
            });

            if (error) {
                console.log('MP 플레이어 조회 에러:', error.message);
                return;
            }

            // 플레이어가 없어도 updateOtherPlayers 호출 (기존 플레이어 제거용)
            var formattedPlayers = (players || []).map(function(p) {
                console.log('   - 플레이어 발견:', p.user_id, p.nickname, 'x:', p.x, 'y:', p.y, 'z:', p.z);
                return {
                    user_id: p.user_id,
                    nickname: p.nickname || '익명',
                    pos_x: p.x || 0,
                    pos_y: p.y || 0,
                    pos_z: p.z || 0,
                    rot_x: p.rot_x || 0,
                    rot_y: p.rot_y || 0,
                    rot_z: p.rot_z || 0,
                    ship_type: p.ship_type || 'shuttle',
                    ship_color: p.ship_color || '#00aaff',
                    status: p.status || 'flying',
                    current_location: p.current_body
                };
            });

            console.log('📡 다른 플레이어:', formattedPlayers.length, '명');
            updateOtherPlayers(formattedPlayers);

            var onlineEl = document.getElementById('mp-online');
            if (onlineEl) {
                onlineEl.textContent = t('playersOnline') + ': ' + (formattedPlayers.length + 1) + t('playersCount');
            }
        })
        .catch(function(e) {
            console.log('MP 플레이어 조회 실패:', e);
        });
}

function updateOtherPlayers(players) {
    const activeIds = new Set();

    players.forEach(player => {
        activeIds.add(player.user_id);

        // ★★★ 기존 메시 버전 체크 - 없으면 강제 재생성 ★★★
        const existing = mpOtherPlayers[player.user_id];
        if (existing && !existing._v2) {
            // 구버전 메시 제거
            console.log('🔄 구버전 메시 제거:', player.user_id);
            if (window.scene) window.scene.remove(existing.mesh);
            delete mpOtherPlayers[player.user_id];
        }

        if (!mpOtherPlayers[player.user_id]) {
            // 새 플레이어 생성
            createOtherPlayerShip(player);
        } else {
            // ★★★ 백업 스타일: 직접 lerp (단순하고 확실) ★★★
            const ship = mpOtherPlayers[player.user_id];
            ship.mesh.position.lerp(
                new THREE.Vector3(
                    parseFloat(player.pos_x),
                    parseFloat(player.pos_y),
                    parseFloat(player.pos_z)
                ), 0.3
            );
            ship.mesh.rotation.set(
                parseFloat(player.rot_x),
                parseFloat(player.rot_y),
                parseFloat(player.rot_z)
            );
            if (ship.label) {
                ship.label.element.textContent = player.nickname;
            }
        }
    });

    Object.keys(mpOtherPlayers).forEach(id => {
        if (!activeIds.has(id)) {
            removeOtherPlayer(id);
        }
    });
}

// ★★★ 백업 호환용 빈 함수 (animate에서 호출됨) ★★★
function mpInterpolateOtherPlayers(deltaTime) {
    // 위치 업데이트는 updateOtherPlayers에서 직접 처리
}
window.mpInterpolateOtherPlayers = mpInterpolateOtherPlayers;

function createOtherPlayerShip(player) {
    console.log('🚀 다른 플레이어 우주선 생성:', player.nickname, 'pos:', player.pos_x, player.pos_y, player.pos_z);

    if (!window.scene) {
        console.error('❌ scene 없음');
        return;
    }

    const shipGroup = new THREE.Group();
    shipGroup.position.set(
        parseFloat(player.pos_x) || 0,
        parseFloat(player.pos_y) || 0,
        parseFloat(player.pos_z) || 0
    );

    // ★★★ 다른 플레이어는 내 우주선보다 뒤에 렌더링 ★★★
    shipGroup.renderOrder = -100;

    // ★★★ 플레이어 우주선 색상 결정 ★★★
    const shipTypeId = player.ship_type || 'shuttle';
    const shipType = window.SHIP_TYPES
        ? window.SHIP_TYPES.find(s => s.id === shipTypeId) : null;

    // 우선순위: player.ship_color > shipType.color > 기본값
    let shipColorHex = 0x4fc3f7; // 기본 하늘색
    if (player.ship_color) {
        // ship_color가 문자열이면 파싱
        if (typeof player.ship_color === 'string') {
            shipColorHex = parseInt(player.ship_color.replace('#', ''), 16);
        } else {
            shipColorHex = player.ship_color;
        }
    } else if (shipType && shipType.color) {
        if (typeof shipType.color === 'string') {
            shipColorHex = parseInt(shipType.color.replace('#', ''), 16);
        } else {
            shipColorHex = shipType.color;
        }
    }
    const shipColor = new THREE.Color(shipColorHex);

    // ★★★ 백업 스타일: 기본 형태 먼저 추가 ★★★
    const geometry = new THREE.ConeGeometry(5, 15, 8);  // 0.5→5, 1.5→15 (10배 증가)
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
        color: shipColor,
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        depthTest: true
    });
    const defaultMesh = new THREE.Mesh(geometry, material);
    shipGroup.add(defaultMesh);

    // ★★★ GLB 모델 로드 시도 ★★★
    console.log('🔍 모델 로드 체크:', {
        hasShipType: !!shipType,
        shipTypeId: shipType?.id,
        modelUrl: shipType?.model,
        hasGLTFLoader: !!window.GLTFLoader
    });

    if (shipType && shipType.model && window.GLTFLoader) {
        const loader = new window.GLTFLoader();

        // ★ Draco 압축 모델 지원
        if (window.DRACOLoader) {
            const dracoLoader = new window.DRACOLoader();
            dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
            loader.setDRACOLoader(dracoLoader);
        }

        console.log('📥 GLB 로드 시작:', shipType.model);

        loader.load(shipType.model, (gltf) => {
            const model = gltf.scene;
            model.scale.setScalar(0.4);  // 0.04→0.4 (10배 증가)
            model.rotation.y = Math.PI;

            // 플레이어 우주선 색상으로 틴트
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone();
                    child.material.emissive = shipColor;
                    child.material.emissiveIntensity = 0.3;
                }
            });

            // 기본 형태 제거
            shipGroup.remove(defaultMesh);
            shipGroup.add(model);
            console.log('✅ 다른 플레이어 모델 로드 완료:', player.nickname);
        }, (progress) => {
            // 로딩 진행률
            if (progress.total > 0) {
                console.log('📊 로딩:', Math.round(progress.loaded / progress.total * 100) + '%');
            }
        }, (err) => {
            console.error('❌ 다른 플레이어 모델 로드 실패:', err.message || err);
            console.error('   URL:', shipType.model);
        });
    } else {
        console.warn('⚠️ 모델 로드 건너뜀:', {
            reason: !shipType ? 'shipType 없음' : !shipType.model ? 'model URL 없음' : 'GLTFLoader 없음'
        });
    }

    window.scene.add(shipGroup);

    // ★★★ 닉네임 라벨 ★★★
    let label = null;
    if (window.CSS2DObject) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'mp-player-label';
        labelDiv.textContent = player.nickname || 'Player';
        // 우주선 색상을 CSS hex로 변환
        const labelColorHex = '#' + shipColor.getHexString();
        labelDiv.style.cssText = `color:${labelColorHex}; font-size:12px; font-family:Orbitron,sans-serif; text-shadow:0 0 5px ${labelColorHex}; background:rgba(0,0,0,0.5); padding:2px 6px; border-radius:3px;`;
        label = new window.CSS2DObject(labelDiv);
        label.position.set(0, 20, 0);  // 2→20 (10배 증가)
        shipGroup.add(label);
    }

    mpOtherPlayers[player.user_id] = { mesh: shipGroup, label: label, _v2: true };
    console.log('✅ 다른 플레이어 생성 완료:', player.nickname, '위치:', shipGroup.position.x.toFixed(2), shipGroup.position.y.toFixed(2), shipGroup.position.z.toFixed(2));
}

// ★★★ GLB 없을 때 기본 형태 생성 ★★★
function addFallbackGeometry(group, shipType, sizeScale) {
    const color = shipType ? shipType.color : 0x00ffff;

    // 본체 (콘)
    const bodyGeo = new THREE.ConeGeometry(0.3, 1.0, 8);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.setScalar(sizeScale);
    group.add(body);

    // 글로우
    const glowGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);
}

function removeOtherPlayer(userId) {
    const player = mpOtherPlayers[userId];
    if (player) {
        if (window.scene) {
            window.scene.remove(player.mesh);
        }
        delete mpOtherPlayers[userId];
    }
}

// ============ 채팅 ============

function sendChat() {
    var input = document.getElementById('mp-chat-input');
    var message = input.value.trim();
    if (!message || !supabase) return;
    
    var isGuest = mpUserId && mpUserId.indexOf('guest_') === 0;
    
    supabase
        .from('chat_messages')
        .insert({
            user_id: isGuest ? null : mpUserId,
            nickname: mpNickname,
            message: message,
            message_type: 'chat'
        })
        .then(function() {
            input.value = '';
        })
        .catch(function(e) {
            console.log('채팅 전송 실패:', e);
        });
}

// 통합 채팅에서 호출하는 전역 함수
window.sendMultiChat = async function(message) {
    if (!message || !mpUserId || !supabase) return;
    
    var isGuest = mpUserId && mpUserId.indexOf('guest_') === 0;
    
    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                user_id: isGuest ? null : mpUserId,
                nickname: mpNickname,
                message: message,
                message_type: 'chat'
            })
            .select();
        
        if (error) {
            console.log('채팅 전송 실패:', error);
        }
    } catch (e) {
        console.log('채팅 전송 오류:', e);
    }
};

function getChat() {
    if (!supabase) return;
    
    supabase
        .from('chat_messages')
        .select('*')
        .gt('id', mpChatLastId)
        .order('id', { ascending: true })
        .limit(50)
        .then(function(result) {
            var messages = result.data;
            var error = result.error;
            
            if (!error && messages && messages.length > 0) {
                var container = document.getElementById('mp-chat-container');
                
                messages.forEach(function(msg) {
                    var div = document.createElement('div');
                    div.className = 'mp-chat-msg';
                    
                    // 시간 포맷팅
                    var timeStr = '';
                    if (msg.created_at) {
                        var date = new Date(msg.created_at);
                        var month = String(date.getMonth() + 1).padStart(2, '0');
                        var day = String(date.getDate()).padStart(2, '0');
                        var hours = String(date.getHours()).padStart(2, '0');
                        var minutes = String(date.getMinutes()).padStart(2, '0');
                        var seconds = String(date.getSeconds()).padStart(2, '0');
                        timeStr = month + '/' + day + ' ' + hours + ':' + minutes + ':' + seconds;
                    }
                    
                    div.innerHTML = '<span class="nick">' + msg.nickname + ':</span> <span class="msg-text">' + msg.message + '</span> <span class="msg-time">' + timeStr + '</span>';
                    container.appendChild(div);
                    mpChatLastId = Math.max(mpChatLastId, parseInt(msg.id));
                    
                    // 통합 채팅에도 표시
                    if (typeof unifiedChatSystem !== 'undefined') {
                        unifiedChatSystem.addMultiMessage(msg.nickname, msg.message, timeStr);
                    }
                });
                
                container.scrollTop = container.scrollHeight;
            }
        })
        .catch(function(e) {
            console.log('채팅 조회 실패:', e);
        });
}

// ============ 초기화 ============

function startMultiplayer() {
    // UI가 없으면 생성
    if (!document.getElementById('multiplayer-ui')) {
        createMultiplayerUI();
    }

    // UI 표시
    const mpUI = document.getElementById('multiplayer-ui');
    if (mpUI) mpUI.style.display = 'block';

    // 이미 시작된 경우 중복 방지
    if (window.mpStarted) {
        console.log('멀티플레이어 이미 실행 중');
        return;
    }

    // 서버에서 방문 기록 불러오기
    if (typeof loadVisitedStations === 'function') {
        loadVisitedStations().then(() => {
            console.log('방문 기록 로드 완료');
        });
    }

    // ★★★ 최적화된 인터벌 설정 ★★★
    // 100ms마다 체크하지만 델타 압축으로 변경 시에만 전송
    mpIntervals.push(setInterval(mpSendMyPosition, MP_UPDATE_INTERVAL));
    // 500ms마다 다른 플레이어 조회 (Realtime 백업)
    mpIntervals.push(setInterval(mpGetOtherPlayers, MP_SYNC_INTERVAL));
    // 1.5초마다 채팅 조회
    mpIntervals.push(setInterval(getChat, MP_CHAT_INTERVAL));

    // ★★★ Supabase Realtime 구독 (WebSocket) ★★★
    setupRealtimeSubscription();

    // 초기 위치 강제 전송
    setTimeout(() => mpSendMyPosition(true), 500);

    window.mpStarted = true;
    console.log('🚀 멀티플레이어 시작! ID:', mpUserId);
    console.log('📡 동기화 설정: 위치전송=' + MP_UPDATE_INTERVAL + 'ms, 조회=' + MP_SYNC_INTERVAL + 'ms');

    // UI 업데이트 (로그인 상태 반영)
    if (typeof updateUserUI === 'function') {
        updateUserUI();
    }
}

// ★★★ Supabase Realtime 구독 설정 ★★★
function setupRealtimeSubscription() {
    if (!supabase || mpRealtimeChannel) return;

    try {
        mpRealtimeChannel = supabase
            .channel('player_positions_realtime')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'player_positions'
            }, (payload) => {
                // INSERT 또는 UPDATE 이벤트 처리
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const p = payload.new;
                    if (p.user_id !== mpUserId) {  // ★★★ 자기 자신 제외 ★★★
                        // ★★★ 테이블 구조에 맞게 수정 ★★★
                        const formattedPlayer = {
                            user_id: p.user_id,
                            nickname: p.nickname || '익명',
                            pos_x: p.x || 0,
                            pos_y: p.y || 0,
                            pos_z: p.z || 0,
                            rot_x: p.rot_x || 0,
                            rot_y: p.rot_y || 0,
                            rot_z: p.rot_z || 0,
                            ship_type: p.ship_type || 'shuttle',
                            ship_color: p.ship_color || '#00aaff',
                            status: p.status || 'flying',
                            current_location: p.current_body
                        };

                        if (mpOtherPlayers[p.user_id]) {
                            // 기존 플레이어 업데이트
                            const ship = mpOtherPlayers[p.user_id];
                            ship.targetPosition = new THREE.Vector3(p.x, p.y, p.z);
                            ship.targetRotation = new THREE.Euler(p.rot_x, p.rot_y, p.rot_z);
                            ship.status = p.status || 'flying';
                            // 레이블 업데이트
                            if (ship.label) {
                                const statusIcon = p.status === 'autopilot' ? '🚀' : '';
                                ship.label.element.textContent = statusIcon + (p.nickname || '익명');
                            }
                        } else {
                            // 새 플레이어 생성
                            createOtherPlayerShip(formattedPlayer);
                        }
                    }
                } else if (payload.eventType === 'DELETE') {
                    // 플레이어 퇴장
                    removeOtherPlayer(payload.old.user_id);
                }
            })
            .subscribe((status) => {
                console.log('📡 Realtime 상태:', status);
            });

        console.log('✅ Supabase Realtime 구독 시작');
    } catch (e) {
        console.log('⚠️ Realtime 구독 실패, 폴링 모드로 동작:', e);
    }
}

window.addEventListener('load', () => {
    setTimeout(() => {
        // 저장된 로그인 정보만 로드 (인증 UI는 멀티 모드 선택 시 표시)
        loadSavedLogin();
        console.log('로그인 정보 체크 완료');
    }, 2000);
});

window.addEventListener('beforeunload', function() {
    // ★★★ user_id로 플레이어 위치 삭제 ★★★
    if (supabase && mpUserId) {
        // REST API로 직접 DELETE 요청 (sendBeacon 호환)
        navigator.sendBeacon(
            SUPABASE_URL + '/rest/v1/player_positions?user_id=eq.' + encodeURIComponent(mpUserId),
            ''
        );
    }

    // 실시간 구독 해제
    if (mpRealtimeChannel && supabase) {
        supabase.removeChannel(mpRealtimeChannel);
    }
});
