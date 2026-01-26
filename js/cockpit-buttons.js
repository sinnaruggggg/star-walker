    // ★★★ 조종석 통일 버튼 초기화 ★★★
    (function() {
        // 설정 버튼
        var settingsBtn = document.getElementById('ui-settings-btn');
        var panel = document.getElementById('ui-settings-panel');
        if (settingsBtn) {
            settingsBtn.onclick = function(e) {
                e.stopPropagation();
                if (panel) {
                    panel.classList.toggle('open');
                }
            };
        }

        // 라디오 버튼
        var radioBtn = document.getElementById('radio-btn-unified');
        if (radioBtn) {
            radioBtn.onclick = function(e) {
                e.stopPropagation();
                var radioPanel = document.getElementById('cockpit-radio');
                if (radioPanel) {
                    radioPanel.classList.toggle('collapsed');
                    // 패널 열림 시 버튼 활성화 표시
                    if (!radioPanel.classList.contains('collapsed')) {
                        radioBtn.classList.add('active');
                    } else {
                        radioBtn.classList.remove('active');
                    }
                }
            };
        }

        // 광고 보상 버튼
        var adBtn = document.getElementById('ad-btn-unified');
        if (adBtn) {
            adBtn.onclick = function(e) {
                e.stopPropagation();
                var adModal = document.getElementById('ad-modal-menu');
                if (adModal) {
                    adModal.style.display = adModal.style.display === 'flex' ? 'none' : 'flex';
                }
            };
        }

        // SSIL 미션 버튼
        var ssilBtn = document.getElementById('ssil-btn-unified');
        if (ssilBtn) {
            ssilBtn.onclick = function(e) {
                e.stopPropagation();
                if (typeof openMissionPanel === 'function') {
                    openMissionPanel();
                } else {
                    var ssilPanel = document.getElementById('ssil-mission-panel');
                    if (ssilPanel) {
                        ssilPanel.classList.toggle('open');
                    }
                }
            };
        }
    })();
