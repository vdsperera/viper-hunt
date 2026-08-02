/**
 * ui/HudController.js
 * Encapsulates HUD polling loop, wanted roster rendering, attack selector HUD, and score breakdown modal.
 */
import { domRefs } from './DomRefs.js';

export class HudController {
    constructor() {
        this.hudInterval = null;
        this.prevTargetSignature = '';
    }

    /**
     * Render the bottom HUD attack selection bar with risk badges
     * @param {Object} attackManager 
     */
    renderAttackSelectorHud(attackManager) {
        if (!attackManager || !domRefs.attackButtonsContainer) return;

        const attacks = attackManager.getAllAttacks();
        const activeAttack = attackManager.getActiveAttack();

        domRefs.attackButtonsContainer.innerHTML = attacks.map(att => {
            const isActive = activeAttack && activeAttack.id === att.id;
            const usesText = att.initialUses === -1 ? '∞' : `${att.currentUses}/${att.initialUses}`;
            const riskClass = att.policeDelta < 0 ? 'safe-risk' : att.policeDelta > 0 || att.crimeBossDelta > 0 ? 'danger-risk' : 'neutral-risk';
            const riskTagText = att.policeDelta < 0 ? 'HEAT REDUCER' : att.crimeBossDelta > 0 ? '+1 BOSS & POLICE' : att.policeDelta > 0 ? '+1 POLICE PATROL' : 'NEUTRAL RISK';

            return `
                <button class="cyber-btn attack-btn ${isActive ? 'active' : ''}" data-key="${att.key}" style="border-color: ${att.color}">
                    <div class="attack-btn-top">
                        <span class="attack-key">[${att.key}]</span>
                        <span class="attack-icon">${att.icon}</span>
                        <span class="attack-name">${att.name}</span>
                        <span class="attack-mult">${att.multiplier}x</span>
                        <span class="attack-uses">(${usesText})</span>
                    </div>
                    <div class="attack-risk-tag ${riskClass}">
                        <span>${riskTagText}</span>
                    </div>
                </button>
            `;
        }).join('');

        domRefs.attackButtonsContainer.querySelectorAll('.attack-btn').forEach(btn => {
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

    /**
     * Render active wanted targets roster at bottom of screen
     * @param {Map|Array} activeTargets 
     */
    renderWantedRoster(activeTargets) {
        if (!domRefs.wantedTargetsContainer) return;
        const records = Array.from(activeTargets.values());

        if (records.length === 0) {
            domRefs.wantedTargetsContainer.innerHTML = '<div class="no-targets-badge">ALL TARGETS NEUTRALIZED / NO ACTIVE TARGETS</div>';
            return;
        }

        domRefs.wantedTargetsContainer.innerHTML = records.map(r => `
            <div class="wanted-target-card">
                <div class="wanted-card-header">
                    <span class="wanted-id">ID: ${r.ID}</span>
                    <span class="wanted-bounty">$${r.Computed_Value}</span>
                </div>
                <div class="wanted-card-name">${r.Name}</div>
                <div class="wanted-card-crime">${r.Primary_Crime}</div>
                <div class="wanted-card-status">STATUS: ${r.Threat_Level.toUpperCase()}</div>
            </div>
        `).join('');
    }

    /**
     * Start the real-time HUD polling loop
     * @param {Object} scoreManager 
     * @param {Object} gridState 
     * @param {string} selectedMode 
     */
    startHudPolling(scoreManager, gridState, selectedMode) {
        this.stopHudPolling();

        this.hudInterval = setInterval(() => {
            if (domRefs.hudScore && scoreManager) {
                domRefs.hudScore.innerText = scoreManager.getSessionScore();
            }

            if (selectedMode === 'mode1' && domRefs.wantedTargetsContainer && gridState && gridState.activeTargets) {
                const activeTargets = gridState.activeTargets;
                const records = Array.from(activeTargets.values());
                const sig = records.map(r => `${r.ID}-${r.Name}-${r.Computed_Value}`).join('|');
                if (sig !== this.prevTargetSignature) {
                    this.prevTargetSignature = sig;
                    this.renderWantedRoster(activeTargets);
                }
            }
        }, 200);
    }

    /**
     * Stop real-time HUD polling
     */
    stopHudPolling() {
        if (this.hudInterval) {
            clearInterval(this.hudInterval);
            this.hudInterval = null;
        }
    }

    /**
     * Render the post-game dossier & score breakdown modal
     */
    renderScoreBreakdown(breakdown, capturedCriminals, selectedMode, gameRules) {
        const container = domRefs.scoreBreakdownContainer;
        if (!container || !breakdown) return;

        const summary = breakdown.summary || { totalTargetValueSum: 0, totalTargetScore: 0, totalTimeBonus: 0, finalScore: 0 };
        const completed = breakdown.completedLevels || [];
        const partial = breakdown.partialLevel;

        let rowsHtml = completed.map(lvl => `
            <tr>
                <td>Level ${lvl.levelIndex}</td>
                <td>${lvl.capturedCount} targets</td>
                <td>${lvl.rawTargetSum} pts (+${lvl.targetScore})</td>
                <td>+${lvl.timeBonus}</td>
                <td><strong>${lvl.levelTotalScore}</strong></td>
            </tr>
        `).join('');

        if (partial) {
            rowsHtml += `
                <tr class="partial-row">
                    <td>Level ${partial.levelIndex} (Incomplete)</td>
                    <td>${partial.capturedCount} targets</td>
                    <td>${partial.rawTargetSum} pts (+${partial.targetScore})</td>
                    <td>+${partial.timeBonus}</td>
                    <td><strong>${partial.levelTotalScore}</strong></td>
                </tr>
            `;
        }

        // Slideshow Dossiers & Story
        let slideshowHtml = '';
        if (Array.isArray(capturedCriminals) && capturedCriminals.length > 0) {
            const slides = capturedCriminals.map((c, idx) => `
                <div class="slideshow-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                    <div class="slide-header">
                        <span class="slide-badge">TARGET ${idx + 1} OF ${capturedCriminals.length}</span>
                        <span class="slide-attack-badge" style="border-color: ${c.color}; color: ${c.color}">
                            ${c.attackIcon} ${c.attackName.toUpperCase()} (${c.attackMultiplier}x)
                        </span>
                    </div>
                    <div class="slide-target-info">
                        <div class="slide-name">${c.name}</div>
                        <div class="slide-crime">${c.primaryCrime}</div>
                    </div>
                    <div class="slide-confession-box">
                        <div class="confession-title">🔒 TACTICAL RECORD & AI NARRATIVE</div>
                        <div class="confession-text">"${c.confession}"</div>
                    </div>
                </div>
            `).join('');

            const dots = capturedCriminals.map((_, idx) => `
                <span class="slide-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
            `).join('');

            slideshowHtml = `
                <div class="slideshow-container">
                    <div class="slideshow-slides-wrapper">
                        ${slides}
                    </div>
                    <div class="slideshow-controls">
                        <button id="slideshow-prev-btn" class="cyber-btn secondary slide-nav-btn"><span>◀ PREV</span></button>
                        <div class="slideshow-dots-wrapper">${dots}</div>
                        <button id="slideshow-pause-btn" class="cyber-btn secondary slide-nav-btn"><span>⏸ PAUSE</span></button>
                        <button id="slideshow-next-btn" class="cyber-btn secondary slide-nav-btn"><span>NEXT ▶</span></button>
                    </div>
                </div>
            `;
        }

        // Compact Log
        let compactLogHtml = '';
        if (Array.isArray(capturedCriminals) && capturedCriminals.length > 0) {
            const logCards = capturedCriminals.map((c, idx) => `
                <div class="criminal-log-card">
                    <div class="criminal-log-card-top">
                        <div class="criminal-log-name">#${idx + 1} ${c.name}</div>
                        <div class="criminal-log-attack" style="color: ${c.color}">
                            ${c.attackIcon} ${c.attackName} (${c.attackMultiplier}x)
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
                </div>
            `;
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
                            <span class="stat-value">${riskStats.policeDelta > 0 ? `+${riskStats.policeDelta} Patrols` : riskStats.policeDelta < 0 ? `${riskStats.policeDelta} Patrols` : '0 (Neutral)'}</span>
                        </div>
                        <div class="alignment-stat">
                            <span class="stat-label">Gang Retaliations:</span>
                            <span class="stat-value" style="color: ${riskStats.crimeBossDelta > 0 ? '#ff0055' : '#00ff88'};">${riskStats.crimeBossDelta > 0 ? `+${riskStats.crimeBossDelta} Crime Bosses` : '0 (None)'}</span>
                        </div>
                    </div>
                </div>
            </div>
        ` : '';

        container.innerHTML = `
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

        const topReplayBtn = container.querySelector('#top-replay-btn');
        if (topReplayBtn) {
            topReplayBtn.addEventListener('click', () => {
                window.location.reload();
            });
        }

        // Slideshow Interactivity
        let slideshowTimer = null;
        let currentSlideIndex = 0;
        let isSlideshowPlaying = true;

        const slides = container.querySelectorAll('.slideshow-slide');
        const dots = container.querySelectorAll('.slide-dot');
        const prevBtn = container.querySelector('#slideshow-prev-btn');
        const pauseBtn = container.querySelector('#slideshow-pause-btn');
        const nextBtn = container.querySelector('#slideshow-next-btn');

        if (slides.length > 0) {
            const goToSlide = (index) => {
                slides.forEach(s => s.classList.remove('active'));
                dots.forEach(d => d.classList.remove('active'));

                currentSlideIndex = (index + slides.length) % slides.length;
                slides[currentSlideIndex].classList.add('active');
                if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.add('active');
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

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    goToSlide(currentSlideIndex - 1);
                    if (isSlideshowPlaying) startSlideshow();
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    goToSlide(currentSlideIndex + 1);
                    if (isSlideshowPlaying) startSlideshow();
                });
            }

            if (pauseBtn) {
                pauseBtn.addEventListener('click', () => {
                    if (isSlideshowPlaying) pauseSlideshow();
                    else startSlideshow();
                });
            }

            dots.forEach((dot, idx) => {
                dot.addEventListener('click', () => {
                    goToSlide(idx);
                    if (isSlideshowPlaying) startSlideshow();
                });
            });

            if (slides.length > 1) {
                startSlideshow();
            } else {
                if (pauseBtn) pauseBtn.style.display = 'none';
                if (prevBtn) prevBtn.style.display = 'none';
                if (nextBtn) nextBtn.style.display = 'none';
            }
        }

        // Compact Log toggle listener
        const toggleLogBtn = container.querySelector('#toggle-compact-log-btn');
        const compactLogWrap = container.querySelector('#compact-log-container');
        if (toggleLogBtn && compactLogWrap) {
            toggleLogBtn.addEventListener('click', () => {
                compactLogWrap.classList.toggle('hidden');
                const isHidden = compactLogWrap.classList.contains('hidden');
                toggleLogBtn.querySelector('span').innerText = isHidden
                    ? `📋 EXPLAIN / VIEW COMPACT CAPTURE LOG (${capturedCriminals.length})`
                    : `🙈 HIDE COMPACT CAPTURE LOG`;
            });
        }

        container.classList.remove('hidden');
    }
}
