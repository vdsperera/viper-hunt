import { configManager } from './ConfigManager.js';

export class UIController {
    constructor(app, audioService, firebaseService) {
        this.app = app;
        this.audioService = audioService;
        this.firebaseService = firebaseService;

        // Overlay UI Elements
        this.uiOverlay = document.getElementById('overlay-ui');
        this.uiTitle = document.getElementById('overlay-title');
        this.uiMsg = document.getElementById('overlay-message');
        this.startBtn = document.getElementById('start-btn');

        // Profile UI Elements
        this.profileSection = document.getElementById('profile-section');
        this.newProfileName = document.getElementById('new-profile-name');
        this.createProfileBtn = document.getElementById('create-profile-btn');
        this.profileDropdown = document.getElementById('profile-dropdown');
        this.modeDropdown = document.getElementById('mode-dropdown');

        // HUD Elements
        this.hud = document.getElementById('hud');
        this.hudPlayer = document.getElementById('hud-player');
        this.hudLevel = document.getElementById('hud-level');
        this.hudScore = document.getElementById('hud-score');
        this.dpadControls = document.getElementById('dpad-controls');
        this.hudWeatherLevel = document.getElementById('hud-weather-level');
        this.hudThreatLevel = document.getElementById('hud-threat-level');
        
        // Mode specific HUDs
        this.eqHud = document.getElementById('emotional-question-hud');
        this.wantedRosterHud = document.getElementById('wanted-roster-hud');
        this.wantedTargetsContainer = document.getElementById('wanted-targets-container');
        this.attackSelectorHud = document.getElementById('attack-selector-hud');
        this.attackButtonsContainer = document.getElementById('attack-buttons-container');
        
        // Score breakdown
        this.scoreBreakdownContainer = document.getElementById('score-breakdown-container');
        this.overlayCard = document.querySelector('.overlay-card');

        // Settings Elements
        this.sfxToggleBtn = document.getElementById('sfx-toggle-btn');
        this.bgmToggleBtn = document.getElementById('bgm-toggle-btn');
        this.voiceToggleBtn = document.getElementById('voice-toggle-btn');
        this.sfxVolSlider = document.getElementById('sfx-volume-slider');
        this.bgmVolSlider = document.getElementById('bgm-volume-slider');
        this.bgmTrackSelect = document.getElementById('bgm-track-select');
        this.voiceStyleSelect = document.getElementById('voice-style-select');
        this.renderEngineDropdown = document.getElementById('render-engine-dropdown');
        this.renderModeToggleBtn = document.getElementById('render-mode-toggle-btn');
        
        // State
        this.selectedProfile = '';
        this.selectedMode = this.modeDropdown ? (this.modeDropdown.value || 'mode1') : 'mode1';
        this.hudInterval = null;
        this.prevTargetSignature = '';
        this.prevAttackSignature = '';
    }

    initMainUI() {
        this.bindAudioSettings();
        this.bindProfileSettings();

        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.handleStartClick());
        }

        if (this.renderEngineDropdown) {
            const savedEngineMode = localStorage.getItem('viper_hunt_render_mode') || '2d';
            this.renderEngineDropdown.value = savedEngineMode;
            this.renderEngineDropdown.addEventListener('change', (e) => {
                localStorage.setItem('viper_hunt_render_mode', e.target.value);
            });
        }
    }

    bindAudioSettings() {
        this.syncAudioUi();

        if (this.sfxToggleBtn) {
            this.sfxToggleBtn.addEventListener('click', () => {
                this.audioService.setSfxEnabled(!this.audioService.sfxEnabled);
                this.syncAudioUi();
            });
        }
        if (this.bgmToggleBtn) {
            this.bgmToggleBtn.addEventListener('click', () => {
                this.audioService.setBgmEnabled(!this.audioService.bgmEnabled);
                this.syncAudioUi();
            });
        }
        if (this.voiceToggleBtn) {
            this.voiceToggleBtn.addEventListener('click', () => {
                this.audioService.setVoiceEnabled(!this.audioService.voiceEnabled);
                this.syncAudioUi();
            });
        }
        if (this.bgmTrackSelect) {
            this.bgmTrackSelect.addEventListener('change', (e) => {
                this.audioService.setBgmTrack(e.target.value);
                this.syncAudioUi();
            });
        }
        if (this.voiceStyleSelect) {
            this.voiceStyleSelect.addEventListener('change', (e) => {
                this.audioService.setVoiceStyle(e.target.value);
                this.syncAudioUi();
            });
        }
        if (this.sfxVolSlider) {
            this.sfxVolSlider.addEventListener('input', (e) => {
                this.audioService.setSfxVolume(parseFloat(e.target.value));
            });
        }
        if (this.bgmVolSlider) {
            this.bgmVolSlider.addEventListener('input', (e) => {
                this.audioService.setBgmVolume(parseFloat(e.target.value));
            });
        }
    }

    syncAudioUi() {
        if (this.sfxToggleBtn) {
            this.sfxToggleBtn.classList.toggle('off', !this.audioService.sfxEnabled);
            this.sfxToggleBtn.querySelector('span').innerText = this.audioService.sfxEnabled ? '🔊 SFX: ON' : '🔇 SFX: OFF';
        }
        if (this.bgmToggleBtn) {
            this.bgmToggleBtn.classList.toggle('off', !this.audioService.bgmEnabled);
            this.bgmToggleBtn.querySelector('span').innerText = this.audioService.bgmEnabled ? '🎵 BGM: ON' : '🔇 BGM: OFF';
        }
        if (this.voiceToggleBtn) {
            this.voiceToggleBtn.classList.toggle('off', !this.audioService.voiceEnabled);
            this.voiceToggleBtn.querySelector('span').innerText = this.audioService.voiceEnabled ? '🎙 VOICE: ON' : '🔇 VOICE: OFF';
        }
        if (this.sfxVolSlider) this.sfxVolSlider.value = this.audioService.sfxVolume;
        if (this.bgmVolSlider) this.bgmVolSlider.value = this.audioService.bgmVolume;
        if (this.bgmTrackSelect) this.bgmTrackSelect.value = this.audioService.currentBgmTrack;
        if (this.voiceStyleSelect) this.voiceStyleSelect.value = this.audioService.voiceStyle;
    }

    bindProfileSettings() {
        if (this.createProfileBtn) {
            this.createProfileBtn.addEventListener('click', async () => {
                await this.saveProfile(this.newProfileName.value);
                this.newProfileName.value = '';
            });
        }
        if (this.profileDropdown) {
            this.profileDropdown.addEventListener('change', (e) => {
                this.selectedProfile = e.target.value;
                this.updateStartBtnState();
            });
        }
        if (this.modeDropdown) {
            this.modeDropdown.addEventListener('change', (e) => {
                this.selectedMode = e.target.value;
                this.updateStartBtnState();
            });
        }
    }

    onRegistryLoaded() {
        if (this.uiTitle) this.uiTitle.innerText = "Viper Hunt";
        if (this.uiMsg) this.uiMsg.innerText = "Registry Loaded. Select a profile.";
        if (this.profileSection) this.profileSection.classList.remove('hidden');
    }

    showFatalError(msg) {
        if (this.uiTitle) this.uiTitle.innerText = "Fatal Error";
        if (this.uiMsg) this.uiMsg.innerText = msg;
    }

    updateStartBtnState() {
        if (!this.selectedMode || this.selectedMode === '') {
            this.selectedMode = (this.modeDropdown && this.modeDropdown.value) ? this.modeDropdown.value : 'mode1';
        }
        if (this.startBtn) {
            this.startBtn.disabled = !this.selectedProfile || !this.selectedMode;
        }
    }

    async loadProfiles(autoSelectName = '') {
        if (!this.firebaseService) return;

        this.profileDropdown.disabled = true;
        this.createProfileBtn.disabled = true;

        const profiles = await this.firebaseService.getProfiles();

        this.profileDropdown.innerHTML = '<option value="">-- Select Player --</option>';
        profiles.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.innerText = `${p.name} (High Score: ${p.highScore})`;
            if (autoSelectName && p.name === autoSelectName) {
                opt.selected = true;
            }
            this.profileDropdown.appendChild(opt);
        });

        this.profileDropdown.disabled = false;
        this.createProfileBtn.disabled = false;

        this.selectedProfile = this.profileDropdown.value;
        this.selectedMode = this.modeDropdown ? (this.modeDropdown.value || 'mode1') : 'mode1';
        this.updateStartBtnState();
    }

    async saveProfile(name) {
        if (!name || !name.trim()) return;
        const trimmed = name.trim();
        this.createProfileBtn.disabled = true;
        await this.firebaseService.saveProfile(trimmed);
        await this.loadProfiles(trimmed);
    }

    handleStartClick() {
        // Hide UI
        if (this.uiOverlay) this.uiOverlay.classList.add('hidden');
        if (this.hud) this.hud.classList.remove('hidden');
        if (this.dpadControls) this.dpadControls.classList.remove('hidden');
        if (this.hudPlayer) this.hudPlayer.innerText = this.selectedProfile;

        if (this.eqHud) {
            if (this.selectedMode === 'mode3') {
                this.eqHud.classList.remove('hidden');
            } else {
                this.eqHud.classList.add('hidden');
            }
        }

        if (this.wantedRosterHud) {
            if (this.selectedMode === 'mode1') {
                this.wantedRosterHud.classList.remove('hidden');
            } else {
                this.wantedRosterHud.classList.add('hidden');
            }
        }

        if (this.attackSelectorHud) {
            if (this.selectedMode === 'mode1') {
                this.attackSelectorHud.classList.remove('hidden');
                if (this.hud) this.hud.classList.add('mode1-hud');
            } else {
                this.attackSelectorHud.classList.add('hidden');
                if (this.hud) this.hud.classList.remove('mode1-hud');
            }
        }

        // Start the game via App
        this.app.startGame(this.selectedMode, this.selectedProfile);
    }

    renderEQHUD(question, records) {
        const eqTextElem = document.getElementById('eq-question-text');
        if (eqTextElem) eqTextElem.innerText = question;

        const eqAnswersElem = document.getElementById('eq-answers-container');
        if (eqAnswersElem) {
            let html = '';
            records.forEach(r => {
                html += `
                    <div class="eq-answer-pill">
                        <span class="eq-badge-letter" style="--pill-color: ${r.Color};">${r.Option_Label}</span>
                        <span class="eq-answer-text">${r.Answer_Text}</span>
                        <span class="eq-answer-pts">+${r.Computed_Value}</span>
                    </div>
                `;
            });
            eqAnswersElem.innerHTML = html;
        }
    }

    renderAttackSelectorHud(attackManager) {
        if (!this.attackButtonsContainer || this.selectedMode !== 'mode1') return;
        const attacks = attackManager.getAttackList();
        this.attackButtonsContainer.innerHTML = attacks.map(att => {
            const usesLabel = att.currentUses < 0 ? '∞' : att.currentUses;
            const outOfAmmo = att.currentUses === 0;
            const riskClass = att.policeDelta < 0 ? 'safe-risk' : (att.policeDelta > 0 || att.crimeBossDelta > 0) ? 'danger-risk' : 'neutral-risk';
            const riskBadge = att.riskDescription || 'Standard Operational Risk';
            return `
                <div class="attack-btn ${att.isActive ? 'active' : ''} ${outOfAmmo ? 'out-of-ammo' : ''}" 
                     data-key="${att.key}" 
                     title="${att.name} — ${riskBadge}"
                     style="--att-color: ${att.color}">
                    <div class="attack-btn-top">
                        <span class="attack-key-badge">[${att.key}]</span>
                        <span class="attack-icon">${att.icon}</span>
                        <span class="attack-name">${att.name}</span>
                        <span class="attack-multiplier">${att.multiplier}x</span>
                        <span class="attack-uses">(${usesLabel})</span>
                    </div>
                    <div class="attack-risk-tag ${riskClass}">
                        ${riskBadge}
                    </div>
                </div>
            `;
        }).join('');

        this.attackButtonsContainer.querySelectorAll('.attack-btn').forEach(btn => {
            const handleSelect = (e) => {
                if (e.cancelable && e.type === 'touchstart') e.preventDefault();
                const key = btn.getAttribute('data-key');
                if (attackManager.selectAttack(key)) {
                    this.renderAttackSelectorHud(attackManager);
                }
            };
            btn.addEventListener('click', handleSelect);
            btn.addEventListener('touchstart', handleSelect, { passive: false });
        });
    }

    bindGameInput(inputHandler, attackManager, selectedMode) {
        if (this.dpadControls) inputHandler.bindDpadControls(this.dpadControls);
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) inputHandler.bindTouchSwipe(gameContainer);
        
        inputHandler.onAttackSelect = (key) => {
            if (selectedMode === 'mode1') {
                if (attackManager.selectAttack(key)) {
                    this.renderAttackSelectorHud(attackManager);
                }
            }
        };
        
        if (selectedMode === 'mode1') {
            this.renderAttackSelectorHud(attackManager);
        }
    }

    bindRendererUI(renderer) {
        if (typeof renderer.setMode === 'function') {
            const selectedEngineMode = this.renderEngineDropdown ? this.renderEngineDropdown.value : (localStorage.getItem('viper_hunt_render_mode') || '2d');
            renderer.setMode(selectedEngineMode);

            const updateToggleBtnLabel = (mode) => {
                if (this.renderModeToggleBtn) {
                    this.renderModeToggleBtn.classList.toggle('mode-3d', mode === '3d');
                    this.renderModeToggleBtn.querySelector('span').innerText = mode === '3d' ? '🎲 VIEW: 3D' : '👁️ VIEW: 2D';
                }
                if (this.renderEngineDropdown) {
                    this.renderEngineDropdown.value = mode;
                }
            };

            updateToggleBtnLabel(renderer.getMode());

            renderer.onModeChange = (mode) => {
                localStorage.setItem('viper_hunt_render_mode', mode);
                updateToggleBtnLabel(mode);
            };

            if (this.renderModeToggleBtn) {
                const handleModeToggle = (e) => {
                    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
                    const nextMode = renderer.getMode() === '2d' ? '3d' : '2d';
                    renderer.setMode(nextMode);
                };

                this.renderModeToggleBtn.addEventListener('click', handleModeToggle);
                this.renderModeToggleBtn.addEventListener('touchstart', handleModeToggle, { passive: false });
            }
        }
    }

    updateWeatherBadge(badgeInfo, city) {
        if (this.hudWeatherLevel) {
            this.hudWeatherLevel.innerText = badgeInfo.label;
            this.hudWeatherLevel.style.color = badgeInfo.color;
            if (city) {
                this.hudWeatherLevel.title = `${badgeInfo.desc} (${city})`;
            }
        }
    }

    setOfflineWeatherBadge() {
        if (this.hudWeatherLevel) {
            this.hudWeatherLevel.innerText = 'OFFLINE (ADMIN)';
            this.hudWeatherLevel.style.color = '#888888';
            this.hudWeatherLevel.title = 'Weather System Disabled by Admin Config';
        }
    }

    bindThreatLevel(adaptiveDifficultyService) {
        if (this.hudThreatLevel) {
            this.hudThreatLevel.innerText = adaptiveDifficultyService.currentTier.label;
            this.hudThreatLevel.style.color = adaptiveDifficultyService.currentTier.color;
            adaptiveDifficultyService.onTierChange = (tier) => {
                this.hudThreatLevel.innerText = tier.label;
                this.hudThreatLevel.style.color = tier.color;
            };
        }
    }

    resetLevelHUD() {
        if (this.hudLevel) this.hudLevel.innerText = '1';
    }

    updateLevelHUD(level) {
        if (this.hudLevel) this.hudLevel.innerText = level;
    }

    startGameHUDLoop(gameLoop, scoreManager, selectedMode, gridState, attackManager) {
        this.hudInterval = setInterval(() => {
            if (gameLoop.running) {
                if (this.hudScore) this.hudScore.innerText = scoreManager.getSessionScore();

                if (selectedMode === 'mode1' && this.wantedTargetsContainer) {
                    const activeTargets = gridState.activeTargets;
                    const records = Array.from(activeTargets.values());
                    const sig = records.map(r => `${r.ID}-${r.Name}-${r.Computed_Value}`).join('|');
                    if (sig !== this.prevTargetSignature) {
                        this.prevTargetSignature = sig;
                        if (records.length === 0) {
                            this.wantedTargetsContainer.innerHTML = '<span style="font-size:0.75rem; color:#888; font-family:var(--font-body);">[ ALL TARGETS CAPTURED ]</span>';
                        } else {
                            this.wantedTargetsContainer.innerHTML = records.map(r => `
                                <div class="wanted-card ${r.Interpol_Red_Notice ? 'red-notice' : ''}">
                                    <div class="wanted-avatar-wrap">
                                        <img src="${r.Avatar_Asset_Path}" class="wanted-avatar-img" alt="${r.Name}" onerror="this.src='assets/avatars/placeholder.png'" />
                                    </div>
                                    <div class="wanted-info">
                                        <span class="wanted-name">${r.Name}</span>
                                        <div class="wanted-meta">
                                            <span class="wanted-value">$${r.Computed_Value}</span>
                                            ${r.Interpol_Red_Notice ? '<span class="wanted-badge interpol">INTERPOL</span>' : ''}
                                            ${r.FBI_Most_Wanted ? '<span class="wanted-badge fbi">FBI</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('');
                        }
                    }
                }
                
                if (selectedMode === 'mode1') {
                    const attacks = attackManager.getAttackList();
                    const attackSig = attacks.map(a => `${a.id}-${a.currentUses}-${a.isActive}`).join('|');
                    if (attackSig !== this.prevAttackSignature) {
                        this.prevAttackSignature = attackSig;
                        this.renderAttackSelectorHud(attackManager);
                    }
                }
            }
        }, 100);
    }

    stopGameHUDLoop() {
        if (this.hudInterval) {
            clearInterval(this.hudInterval);
            this.hudInterval = null;
        }
    }

    async handleGameOver(selectedProfile, selectedMode, finalScore, breakdown, isVictory, collisionReason) {
        if (this.dpadControls) this.dpadControls.classList.add('hidden');
        if (this.eqHud) this.eqHud.classList.add('hidden');
        if (this.wantedRosterHud) this.wantedRosterHud.classList.add('hidden');
        if (this.attackSelectorHud) this.attackSelectorHud.classList.add('hidden');

        // Show saving/updating state
        if (this.uiOverlay) this.uiOverlay.classList.remove('hidden');
        if (this.profileSection) this.profileSection.classList.add('hidden');
        if (this.uiTitle) this.uiTitle.innerText = "Saving Score...";
        if (this.uiMsg) this.uiMsg.innerText = "Please wait";
        if (this.startBtn) this.startBtn.disabled = true;

        if (selectedProfile && this.firebaseService) {
            await this.firebaseService.updateHighScore(selectedProfile, finalScore);
        }

        if (isVictory) {
            if (selectedMode === 'mode3') {
                if (this.uiTitle) this.uiTitle.innerText = "SOUL ASCENDED!";
                if (this.uiMsg) this.uiMsg.innerText = `Congratulations, ${selectedProfile}! You answered all questions of the soul and conquered death.`;
            } else {
                if (this.uiTitle) this.uiTitle.innerText = "Victory!";
                if (this.uiMsg) this.uiMsg.innerText = `Congratulations, ${selectedProfile}! You captured all targets.`;
            }
        } else {
            if (selectedMode === 'mode3') {
                if (this.uiTitle) this.uiTitle.innerText = "FATE SEALED";
                if (this.uiMsg) this.uiMsg.innerText = `Sorry mate, you faced death before you found your answers...`;
            } else {
                const cause = collisionReason ? ` (${collisionReason})` : '';
                if (this.uiTitle) this.uiTitle.innerText = "Game Over";
                if (this.uiMsg) this.uiMsg.innerText = `${selectedProfile}'s Tactical Session Concluded${cause}.`;
            }
        }

        this.renderScoreBreakdown(breakdown, selectedMode);

        if (this.startBtn) {
            this.startBtn.innerText = "Play Again";
            this.startBtn.disabled = false;
            this.startBtn.onclick = () => window.location.reload();
        }
    }

    renderScoreBreakdown(breakdown, selectedMode) {
        if (!this.scoreBreakdownContainer || !breakdown) return;

        if (this.overlayCard) this.overlayCard.classList.add('has-breakdown');

        const { levelHistory, partialLevel, summary, capturedCriminals } = breakdown;
        const gameRules = configManager.getAll();

        let rowsHtml = '';
        levelHistory.forEach(lvl => {
            rowsHtml += `
            <tr>
                <td>Lvl ${lvl.level}</td>
                <td>${lvl.targetsCaptured}</td>
                <td>${lvl.capturedSum} <span class="cyan-text">(+${lvl.valueScore})</span></td>
                <td>${lvl.elapsedSeconds}s <span class="gold-text">(+${lvl.timeBonus})</span></td>
                <td class="green-text">${lvl.levelScore}</td>
            </tr>`;
        });

        if (partialLevel) {
            rowsHtml += `
            <tr class="partial-row">
                <td>Lvl ${partialLevel.level}<span class="badge-tag">PARTIAL</span></td>
                <td>${partialLevel.targetsCaptured}</td>
                <td>${partialLevel.capturedSum} <span class="cyan-text">(+${partialLevel.valueScore})</span></td>
                <td>-- <span class="gold-text">(+0)</span></td>
                <td class="green-text">${partialLevel.levelScore}</td>
            </tr>`;
        }

        let slideshowHtml = '';
        let compactLogHtml = '';

        if (Array.isArray(capturedCriminals) && capturedCriminals.length > 0) {
            const slidesHtml = capturedCriminals.map((c, idx) => {
                const actionName = (c.attackName || '').toLowerCase();
                const color = c.attackColor || '#00f0ff';
                const pts = c.finalValue || c.baseValue || 0;

                let narrativeText = '';
                if (actionName.includes('police')) {
                    narrativeText = `Following active field surveillance, the Hunter tracked down <strong>${c.name}</strong> and executed a high-priority apprehension. The fugitive was surrendered to <strong>Police Custody</strong> without further resistance (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                } else if (actionName.includes('cage') || actionName.includes('caging')) {
                    narrativeText = `Pursuing <strong>${c.name}</strong> through volatile territory, the Hunter deployed heavy tactical containment units. The fugitive was cornered and <strong>Brutally Caged</strong> in a high-security lockup (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                } else if (actionName.includes('shot') || actionName.includes('shooting')) {
                    narrativeText = `Engaging <strong>${c.name}</strong> in an armed operational standoff, the Hunter closed in on the target's position. The fugitive was <strong>Shot Down in Action</strong> during the raid (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                } else if (actionName.includes('butcher') || actionName.includes('butchering')) {
                    narrativeText = `Breaching <strong>${c.name}</strong>'s fortified compound, the Hunter executed a relentless tactical strike. The target was <strong>Ruthlessly Butchered</strong> and eliminated (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                } else {
                    narrativeText = `The Hunter tracked down <strong>${c.name}</strong> and successfully completed the capture operation via <strong>${c.attackName || 'Tactical Interception'}</strong> (<span style="color:${color}; font-weight:700;">+${pts} pts</span>).`;
                }

                return `
                <div class="slideshow-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                    <div class="dossier-story-card">
                        <div class="dossier-header-bar">
                            <span class="dossier-id">DOSSIER #${(c.id || `FB-${idx + 1}`).toUpperCase()}</span>
                            <div class="dossier-badge-row">
                                ${c.interpol ? '<span class="wanted-badge interpol">INTERPOL</span>' : ''}
                                ${c.fbi ? '<span class="wanted-badge fbi">FBI</span>' : ''}
                                ${c.conviction ? '<span class="wanted-badge conviction">CONVICTED</span>' : ''}
                            </div>
                        </div>
                        <div class="dossier-main-row">
                            <div class="dossier-portrait-box">
                                <img src="${c.avatar}" class="dossier-portrait-img" alt="${c.name}" onerror="this.src='assets/avatars/placeholder.png'" />
                                <div class="dossier-bounty-tag">BOUNTY $${c.baseValue}</div>
                            </div>
                            <div class="dossier-text-details">
                                <h4 class="dossier-target-name">${c.name}</h4>
                                <div class="dossier-narrative-box incident-box">
                                    <div class="dossier-box-label">📋 CRIMINAL INCIDENT RECORD</div>
                                    <div class="dossier-box-content">${c.incident || 'Known High-Priority Fugitive Case'}</div>
                                </div>
                                <div class="dossier-narrative-box hunt-box" style="--action-color: ${c.attackColor}">
                                    <div class="dossier-box-label" style="color: ${c.attackColor}">⚡ OPERATIONAL HUNT NARRATIVE (WHAT HUNTER DID)</div>
                                    <div class="dossier-box-content">
                                        ${narrativeText}
                                    </div>
                                </div>
                                <div class="dossier-narrative-box confession-box">
                                    <div class="dossier-box-label" style="color: #ff0077">🎙️ CRIMINAL CONFESSION / LAST WORDS (AI DYNAMIC)</div>
                                    <div class="dossier-box-content confession-text">${c.confession || '"My reign in the shadows is over. The Hunter wins this session."'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');

            const dotsHtml = capturedCriminals.map((_, idx) => `
                <span class="slide-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
            `).join('');

            slideshowHtml = `
                <div class="hunt-slideshow-section">
                    <div class="slideshow-header-bar">
                        <div class="slideshow-title">
                            <span class="pulse-icon">🎬</span>
                            <span>OPERATIONAL HUNT NARRATIVE SLIDESHOW</span>
                        </div>
                        <div class="slideshow-controls">
                            <button id="slideshow-prev-btn" class="cyber-btn nav-btn" title="Previous Slide"><span>⏮ PREV</span></button>
                            <button id="slideshow-pause-btn" class="cyber-btn pause-btn" title="Pause / Play Slideshow"><span>⏸ PAUSE</span></button>
                            <button id="slideshow-next-btn" class="cyber-btn nav-btn" title="Next Slide"><span>NEXT ⏭</span></button>
                        </div>
                    </div>
                    <div class="slideshow-viewport">
                        ${slidesHtml}
                    </div>
                    <div class="slideshow-footer-bar">
                        <div id="slideshow-dots" class="slideshow-dots-row">
                            ${dotsHtml}
                        </div>
                        <div id="slideshow-counter" class="slideshow-counter-tag">DOSSIER 1 OF ${capturedCriminals.length}</div>
                    </div>
                </div>`;

            if (gameRules && gameRules.showCriminalPunishmentLog === true) {
                const logCards = capturedCriminals.map(c => `
                    <div class="criminal-log-card">
                        <div class="criminal-log-avatar-wrap">
                            <img src="${c.avatar}" class="criminal-log-avatar" alt="${c.name}" onerror="this.src='assets/avatars/placeholder.png'" />
                        </div>
                        <div class="criminal-log-info">
                            <div class="criminal-log-name">${c.name}</div>
                            <div class="criminal-log-action" style="--action-color: ${c.attackColor}">
                                <span class="action-icon">${c.attackIcon}</span>
                                <span class="action-text">${c.attackName}</span>
                            </div>
                        </div>
                        <div class="criminal-log-payout">
                            <span class="payout-score">+${c.finalValue} pts</span>
                            <span class="payout-base">Base: $${c.baseValue}</span>
                        </div>
                    </div>
                `).join('');

                compactLogHtml = `
                    <div class="log-toggle-wrap">
                        <button id="toggle-compact-log-btn" class="cyber-btn secondary log-toggle-btn">
                            <span>📋 EXPLAIN / VIEW COMPACT CAPTURE LOG (${capturedCriminals.length})</span>
                        </button>
                    </div>
                    <div id="compact-log-container" class="criminal-log-section hidden">
                        <div class="criminal-log-title">
                            <span>CRIMINAL PUNISHMENT & CAPTURE LOG</span>
                        </div>
                        <div class="criminal-log-grid">
                            ${logCards}
                        </div>
                    </div>`;
            }
        } else if (selectedMode === 'mode1' && gameRules && gameRules.showCriminalPunishmentLog === true) {
            compactLogHtml = `
                <div class="criminal-log-section">
                    <div class="criminal-log-title">
                        <span>CRIMINAL PUNISHMENT & CAPTURE LOG</span>
                    </div>
                    <div class="no-captures-badge">[ NO TARGETS CAPTURED THIS SESSION ]</div>
                </div>`;
        }

        const alignment = breakdown.alignment || {};
        const persona = alignment.persona || { title: 'Unrated Operative', description: 'No tactical captures completed.', color: '#888888', brutalityLabel: 'None' };
        const netScore = alignment.netScore || 0;
        const riskStats = alignment.riskStats || { policeDelta: 0, crimeBossDelta: 0 };

        const alignmentCardHtml = selectedMode === 'mode1' ? `
            <div class="alignment-evaluation-card" style="--persona-color: ${persona.color}">
                <div class="alignment-card-header">
                    <div class="alignment-title-wrap">
                        <span class="alignment-icon">⚖️</span>
                        <span class="alignment-label">TACTICAL MORALITY & ALIGNMENT EVALUATION</span>
                    </div>
                    <div class="alignment-persona-badge" style="background-color: ${persona.color}22; border-color: ${persona.color}; color: ${persona.color};">
                        ${persona.title.toUpperCase()}
                    </div>
                </div>
                <div class="alignment-card-body">
                    <p class="alignment-desc">${persona.description}</p>
                    <div class="alignment-stats-row">
                        <div class="alignment-stat">
                            <span class="stat-label">Net Alignment Score:</span>
                            <span class="stat-value" style="color: ${netScore >= 0 ? '#00f0ff' : '#ff0055'};">${netScore > 0 ? '+' : ''}${netScore}</span>
                        </div>
                        <div class="alignment-stat">
                            <span class="stat-label">Brutality Level:</span>
                            <span class="stat-value" style="color: ${persona.color};">${persona.brutalityLabel}</span>
                        </div>
                        <div class="alignment-stat">
                            <span class="stat-label">Police Heat Alteration:</span>
                            <span class="stat-value">${riskStats.policeDelta > 0 ? \`+\${riskStats.policeDelta} Patrols\` : riskStats.policeDelta < 0 ? \`\${riskStats.policeDelta} Patrols\` : '0 (Neutral)'}</span>
                        </div>
                        <div class="alignment-stat">
                            <span class="stat-label">Gang Retaliations:</span>
                            <span class="stat-value" style="color: ${riskStats.crimeBossDelta > 0 ? '#ff0055' : '#00ff88'};">${riskStats.crimeBossDelta > 0 ? \`+\${riskStats.crimeBossDelta} Crime Bosses\` : '0 (None)'}</span>
                        </div>
                    </div>
                </div>
            </div>` : '';

        this.scoreBreakdownContainer.innerHTML = `
            <div class="top-replay-header">
                <button id="top-replay-btn" class="cyber-btn primary top-replay-btn">
                    <span>🔄 PLAY AGAIN</span>
                </button>
            </div>
            ${slideshowHtml}
            ${alignmentCardHtml}
            ${compactLogHtml}
            <div class="score-formula-badge">
                <div class="formula-title">SCORE CALCULATION FORMULA</div>
                <div class="formula-desc">Target Values × 60% + Remaining Time Bonus × 40%</div>
            </div>
            <div class="breakdown-table-wrapper">
                <table class="cyber-breakdown-table">
                    <thead>
                        <tr>
                            <th>LEVEL</th>
                            <th>TARGETS</th>
                            <th>TARGET VAL (60%)</th>
                            <th>TIME BONUS (40%)</th>
                            <th>SCORE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="5">No level activity recorded</td></tr>'}
                    </tbody>
                </table>
            </div>
            <div class="score-summary-card">
                <div class="summary-row">
                    <span>Total Target Value Points:</span>
                    <strong class="cyan-text">${summary.totalTargetValueSum} pts (${summary.totalTargetScore} score)</strong>
                </div>
                <div class="summary-row">
                    <span>Total Level Time Bonus:</span>
                    <strong class="pink-text">+${summary.totalTimeBonus} score</strong>
                </div>
                <div class="summary-row highlight">
                    <span>FINAL CALCULATED SCORE:</span>
                    <strong class="green-text">${summary.finalScore}</strong>
                </div>
            </div>
        `;

        const topReplayBtn = this.scoreBreakdownContainer.querySelector('#top-replay-btn');
        if (topReplayBtn) {
            topReplayBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }

        this.setupSlideshow(capturedCriminals);

        const toggleLogBtn = this.scoreBreakdownContainer.querySelector('#toggle-compact-log-btn');
        const compactLogWrap = this.scoreBreakdownContainer.querySelector('#compact-log-container');
        if (toggleLogBtn && compactLogWrap) {
            toggleLogBtn.addEventListener('click', () => {
                compactLogWrap.classList.toggle('hidden');
                const isHidden = compactLogWrap.classList.contains('hidden');
                toggleLogBtn.querySelector('span').innerText = isHidden
                    ? `📋 EXPLAIN / VIEW COMPACT CAPTURE LOG (${capturedCriminals.length})`
                    : `🙈 HIDE COMPACT CAPTURE LOG`;
            });
        }

        this.scoreBreakdownContainer.classList.remove('hidden');
    }

    setupSlideshow(capturedCriminals) {
        if (!capturedCriminals || capturedCriminals.length === 0) return;
        
        let slideshowTimer = null;
        let currentSlideIndex = 0;
        let isSlideshowPlaying = true;

        const slides = this.scoreBreakdownContainer.querySelectorAll('.slideshow-slide');
        const dots = this.scoreBreakdownContainer.querySelectorAll('.slide-dot');
        const counterTag = this.scoreBreakdownContainer.querySelector('#slideshow-counter');
        const prevBtn = this.scoreBreakdownContainer.querySelector('#slideshow-prev-btn');
        const pauseBtn = this.scoreBreakdownContainer.querySelector('#slideshow-pause-btn');
        const nextBtn = this.scoreBreakdownContainer.querySelector('#slideshow-next-btn');

        if (slides.length > 0) {
            const goToSlide = (index) => {
                slides.forEach(s => s.classList.remove('active'));
                dots.forEach(d => d.classList.remove('active'));

                currentSlideIndex = (index + slides.length) % slides.length;
                slides[currentSlideIndex].classList.add('active');
                if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.add('active');
                if (counterTag) counterTag.innerText = `DOSSIER ${currentSlideIndex + 1} OF ${slides.length}`;
            };

            const startSlideshow = () => {
                if (slideshowTimer) clearInterval(slideshowTimer);
                isSlideshowPlaying = true;
                if (pauseBtn) pauseBtn.innerHTML = '<span>⏸ PAUSE</span>';
                slideshowTimer = setInterval(() => {
                    goToSlide(currentSlideIndex + 1);
                }, 4000);
            };

            const pauseSlideshow = () => {
                if (slideshowTimer) clearInterval(slideshowTimer);
                slideshowTimer = null;
                isSlideshowPlaying = false;
                if (pauseBtn) pauseBtn.innerHTML = '<span>▶ PLAY</span>';
            };

            if (prevBtn) prevBtn.addEventListener('click', () => { goToSlide(currentSlideIndex - 1); if (isSlideshowPlaying) startSlideshow(); });
            if (nextBtn) nextBtn.addEventListener('click', () => { goToSlide(currentSlideIndex + 1); if (isSlideshowPlaying) startSlideshow(); });
            if (pauseBtn) pauseBtn.addEventListener('click', () => isSlideshowPlaying ? pauseSlideshow() : startSlideshow());
            dots.forEach((dot, idx) => {
                dot.addEventListener('click', () => { goToSlide(idx); if (isSlideshowPlaying) startSlideshow(); });
            });

            if (slides.length > 1) {
                startSlideshow();
            } else {
                if (pauseBtn) pauseBtn.style.display = 'none';
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }
        }
    }
}
