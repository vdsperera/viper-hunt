/**
 * Renderer
 * High-performance, cyberpunk visual renderer for Viper Hunt.
 * Supports rounded glowing snake segments, particle FX, pulsing target auras, and floating score popups.
 */
export class Renderer {
    /**
     * @param {string} canvasId
     * @param {number} cellSize - Pixel size of each grid cell
     */
    constructor(canvasId, cellSize = 32) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) throw new Error(`Renderer validation failed: Canvas element '${canvasId}' not found.`);
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) throw new Error("Renderer failed to acquire 2D context.");

        this.cellSize = cellSize;
        this.imageCache = new Map();
        
        // Visual FX Systems
        this.particles = [];
        this.floatingTexts = [];
        this.prevTargetKeys = new Set();
        this.pulseAngle = 0;
    }

    /**
     * Main Render Loop
     * @param {Object} gridState
     */
    renderFrame(gridState) {
        if (!gridState || typeof gridState !== 'object') {
            throw new Error("Renderer.renderFrame requires a valid state object.");
        }
        if (!gridState.activeTargets || !gridState.hunter) {
            throw new TypeError("Renderer.renderFrame: malformed state object. 'activeTargets' and 'hunter' properties are required.");
        }

        this.pulseAngle = (this.pulseAngle + 0.05) % (Math.PI * 2);

        // 1. Detect Target Collections & Emit Particle Bursts
        this._checkTargetEaten(gridState.activeTargets);
        
        // 2. Clear & Draw Cyber Background
        this._drawCyberGrid();

        // 3. Draw Targets with Aura & Badges
        if (gridState.activeTargets) {
            for (const [coordKey, record] of gridState.activeTargets.entries()) {
                const [x, y] = coordKey.split(',').map(Number);
                this._drawTarget(x, y, record, gridState.playMode);
            }
        }

        // 4. Draw Hunter (Snake) with Neon Glow & Direction Eyes
        if (gridState.hunter) {
            this._drawHunter(gridState.hunter);
        }

        // 5. Update & Draw FX (Particles & Floating Score Texts)
        this._updateAndDrawParticles();
        this._updateAndDrawFloatingTexts();
    }

    /**
     * Draws the cyberpunk grid with glowing intersection dots and subtle lines.
     */
    _drawCyberGrid() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const size = this.cellSize;

        // Dark background
        this.ctx.fillStyle = '#060911';
        if (this.ctx.fillRect) this.ctx.fillRect(0, 0, width, height);

        // Subtle grid lines
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.035)';
        this.ctx.lineWidth = 1;

        if (this.ctx.beginPath) {
            this.ctx.beginPath();
            for (let x = 0; x <= width; x += size) {
                this.ctx.moveTo?.(x, 0);
                this.ctx.lineTo?.(x, height);
            }
            for (let y = 0; y <= height; y += size) {
                this.ctx.moveTo?.(0, y);
                this.ctx.lineTo?.(width, y);
            }
            this.ctx.stroke?.();
        }

        // Intersection dots
        if (this.ctx.beginPath && this.ctx.arc) {
            this.ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
            for (let x = 0; x <= width; x += size * 2) {
                for (let y = 0; y <= height; y += size * 2) {
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                    this.ctx.fill?.();
                }
            }
        }
    }

    /**
     * Renders Hunter Entity (Snake Head & Body)
     */
    _drawHunter(hunter) {
        const cs = this.cellSize;
        const body = hunter.BodySegments || [];
        const head = hunter.HeadCoordinate;
        const totalSegments = body.length + 1;

        // Draw body segments (Tail to Head)
        this.ctx.save?.();
        for (let i = body.length - 1; i >= 0; i--) {
            const seg = body[i];
            const px = seg.x * cs;
            const py = seg.y * cs;

            // Segment Gradient
            if (this.ctx.createLinearGradient) {
                const grad = this.ctx.createLinearGradient(px, py, px + cs, py + cs);
                grad.addColorStop(0, '#00ff88');
                grad.addColorStop(1, '#00b8ff');
                this.ctx.fillStyle = grad;
            } else {
                this.ctx.fillStyle = '#00ff88';
            }

            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = 'rgba(0, 255, 136, 0.4)';

            const margin = 2;
            const size = cs - margin * 2;
            if (this.ctx.beginPath) {
                this.ctx.beginPath();
                if (this.ctx.roundRect) {
                    this.ctx.roundRect(px + margin, py + margin, size, size, 6);
                } else if (this.ctx.rect) {
                    this.ctx.rect(px + margin, py + margin, size, size);
                }
                this.ctx.fill?.();
            } else if (this.ctx.fillRect) {
                this.ctx.fillRect(px + margin, py + margin, size, size);
            }
        }
        this.ctx.restore?.();

        // Draw Snake Head
        const hx = head.x * cs;
        const hy = head.y * cs;

        this.ctx.save?.();
        this.ctx.fillStyle = '#00ff88';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = '#00ff88';

        const headMargin = 1;
        const headSize = cs - headMargin * 2;
        if (this.ctx.beginPath) {
            this.ctx.beginPath();
            if (this.ctx.roundRect) {
                this.ctx.roundRect(hx + headMargin, hy + headMargin, headSize, headSize, 8);
            } else if (this.ctx.rect) {
                this.ctx.rect(hx + headMargin, hy + headMargin, headSize, headSize);
            }
            this.ctx.fill?.();
        } else if (this.ctx.fillRect) {
            this.ctx.fillRect(hx + headMargin, hy + headMargin, headSize, headSize);
        }

        // Draw Directional Eyes
        const dir = hunter.Direction || hunter.CurrentDirection || 'RIGHT';
        this._drawSnakeEyes(hx, hy, cs, dir);
        this.ctx.restore?.();
    }

    /**
     * Draws glowing directional eyes on the Snake Head
     */
    _drawSnakeEyes(hx, hy, cs, dir) {
        if (!this.ctx.beginPath || !this.ctx.arc) return;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = '#00f0ff';

        let eye1X = 0, eye1Y = 0, eye2X = 0, eye2Y = 0;
        const offset = 8;
        const radius = 3;

        switch (dir) {
            case 'UP':
                eye1X = hx + offset; eye1Y = hy + offset;
                eye2X = hx + cs - offset; eye2Y = hy + offset;
                break;
            case 'DOWN':
                eye1X = hx + offset; eye1Y = hy + cs - offset;
                eye2X = hx + cs - offset; eye2Y = hy + cs - offset;
                break;
            case 'LEFT':
                eye1X = hx + offset; eye1Y = hy + offset;
                eye2X = hx + offset; eye2Y = hy + cs - offset;
                break;
            case 'RIGHT':
            default:
                eye1X = hx + cs - offset; eye1Y = hy + offset;
                eye2X = hx + cs - offset; eye2Y = hy + cs - offset;
                break;
        }

        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, radius, 0, Math.PI * 2);
        this.ctx.arc(eye2X, eye2Y, radius, 0, Math.PI * 2);
        this.ctx.fill?.();
    }

    /**
     * Draws Target with Pulsing Aura, Avatar Frame, and Badge
     */
    _drawTarget(x, y, record, playMode = 'mode1') {
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        const cs = this.cellSize;
        const centerX = px + cs / 2;
        const centerY = py + cs / 2;

        // Determine growth tier & colors
        const val = record.Computed_Value || 10;
        let tier = (record.Growth_Tier || '').toLowerCase();
        if (!tier) {
            if (val >= 90) tier = 'elite';
            else if (val >= 70) tier = 'high';
            else if (val >= 40) tier = 'medium';
            else tier = 'low';
        }

        let auraColor = 'rgba(0, 240, 255, 0.6)';
        let badgeBg = 'rgba(0, 240, 255, 0.2)';
        
        if (tier === 'low') {
            auraColor = 'rgba(205, 127, 50, 0.7)'; // Bronze
        } else if (tier === 'medium') {
            auraColor = 'rgba(192, 192, 192, 0.8)'; // Silver
        } else if (tier === 'high') {
            auraColor = 'rgba(255, 215, 0, 0.9)'; // Gold
            badgeBg = 'rgba(255, 215, 0, 0.3)';
        } else if (tier === 'elite') {
            auraColor = 'rgba(0, 240, 255, 1.0)'; // Diamond Cyan
            badgeBg = 'rgba(0, 240, 255, 0.4)';
        }

        // 1. Draw Pulsing Radial Glow
        if (this.ctx.save && this.ctx.createRadialGradient && this.ctx.beginPath && this.ctx.arc) {
            this.ctx.save();
            const pulseRadius = (cs / 2) + Math.sin(this.pulseAngle * 2) * 2;
            const radialGrad = this.ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, pulseRadius + 6);
            radialGrad.addColorStop(0, auraColor);
            radialGrad.addColorStop(1, 'transparent');
            this.ctx.fillStyle = radialGrad;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, pulseRadius + 6, 0, Math.PI * 2);
            this.ctx.fill?.();
            this.ctx.restore();
        }

        // 2. Treasure Vault Mode (Mode 2) - Instant Visual Legibility
        if (playMode === 'mode2') {
            this.ctx.save?.();
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = auraColor;

            if (tier === 'low') {
                // Bronze Coin (Circle)
                this.ctx.fillStyle = '#cd7f32';
                this.ctx.strokeStyle = '#ffe4b5';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, cs * 0.35, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
            } else if (tier === 'medium') {
                // Silver Bar (Rounded Rect)
                this.ctx.fillStyle = '#c0c0c0';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                const w = cs * 0.7;
                const h = cs * 0.4;
                this.ctx.beginPath();
                this.ctx.roundRect ? this.ctx.roundRect(centerX - w / 2, centerY - h / 2, w, h, 3) : this.ctx.rect(centerX - w / 2, centerY - h / 2, w, h);
                this.ctx.fill();
                this.ctx.stroke();
            } else if (tier === 'high') {
                // Gold Bar (Trapezoid / Chamfered Gold Bar)
                this.ctx.fillStyle = '#ffd700';
                this.ctx.strokeStyle = '#fff8dc';
                this.ctx.lineWidth = 2;
                const w = cs * 0.7;
                const h = cs * 0.45;
                this.ctx.beginPath();
                this.ctx.roundRect ? this.ctx.roundRect(centerX - w / 2, centerY - h / 2, w, h, 4) : this.ctx.rect(centerX - w / 2, centerY - h / 2, w, h);
                this.ctx.fill();
                this.ctx.stroke();
            } else {
                // Diamond (Rotated Diamond Shape)
                this.ctx.fillStyle = '#00f0ff';
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                const r = cs * 0.4;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY - r);
                this.ctx.lineTo(centerX + r, centerY);
                this.ctx.lineTo(centerX, centerY + r);
                this.ctx.lineTo(centerX - r, centerY);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
            this.ctx.restore?.();
            return;
        }

        // 3. Criminal Bounty Mode (Mode 1) - Avatar & Text
        let img = this.imageCache.get(record.ID);
        if (!img) {
            img = new Image();
            img.src = record.Avatar_Asset_Path;
            img.onload = () => { img.loaded = true; };
            img.onerror = () => { img.failed = true; };
            this.imageCache.set(record.ID, img);
        }

        this.ctx.save?.();
        const margin = 2;
        const size = cs - margin * 2;

        if (img.complete && img.loaded && !img.failed) {
            if (this.ctx.beginPath && this.ctx.clip) {
                this.ctx.beginPath();
                if (this.ctx.roundRect) {
                    this.ctx.roundRect(px + margin, py + margin, size, size, 6);
                } else if (this.ctx.rect) {
                    this.ctx.rect(px + margin, py + margin, size, size);
                }
                this.ctx.clip();
            }
            this.ctx.drawImage?.(img, px + margin, py + margin, size, size);
        } else {
            // Sleek fallback target icon
            this.ctx.fillStyle = badgeBg;
            this.ctx.strokeStyle = auraColor;
            this.ctx.lineWidth = 2;
            if (this.ctx.beginPath) {
                this.ctx.beginPath();
                if (this.ctx.roundRect) {
                    this.ctx.roundRect(px + margin, py + margin, size, size, 6);
                } else if (this.ctx.rect) {
                    this.ctx.rect(px + margin, py + margin, size, size);
                }
                this.ctx.fill?.();
                this.ctx.stroke?.();
            } else if (this.ctx.fillRect) {
                this.ctx.fillRect(px + margin, py + margin, size, size);
            }
        }
        this.ctx.restore?.();

        // Value Tag Overlay (Criminal Mode only)
        this.ctx.save?.();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '700 11px Rajdhani';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = '#000000';
        
        const text = `$${record.Computed_Value}`;
        if (this.ctx.fillText) {
            this.ctx.fillText(text, px + 2, py + cs - 4);
        }
        this.ctx.restore?.();
    }

    /**
     * Detects eaten targets to trigger spark emissions & score text
     */
    _checkTargetEaten(activeTargets) {
        const currentKeys = new Set(activeTargets.keys());
        
        for (const key of this.prevTargetKeys) {
            if (!currentKeys.has(key)) {
                // Target was eaten! Emit sparks & floating score popup
                const [x, y] = key.split(',').map(Number);
                this.emitSparks(x * this.cellSize + this.cellSize / 2, y * this.cellSize + this.cellSize / 2, '#00ff88', 16);
                this.addFloatingText(x * this.cellSize + this.cellSize / 2, y * this.cellSize, '+SCORE', '#00ff88');
            }
        }
        
        this.prevTargetKeys = currentKeys;
    }

    /**
     * Emits spark particle burst at pixel coordinates
     */
    emitSparks(px, py, color = '#00ff88', count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4;
            this.particles.push({
                x: px,
                y: py,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 2.5,
                color: Math.random() > 0.4 ? color : '#00f0ff',
                alpha: 1.0,
                decay: 0.03 + Math.random() * 0.02
            });
        }
    }

    /**
     * Spawns floating score text at pixel coordinates
     */
    addFloatingText(px, py, text, color = '#00ff88') {
        this.floatingTexts.push({
            x: px,
            y: py,
            text,
            color,
            alpha: 1.0,
            vy: -1.2
        });
    }

    _updateAndDrawParticles() {
        if (this.particles.length === 0) return;

        this.ctx.save?.();
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = p.color;

            if (this.ctx.beginPath && this.ctx.arc) {
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fill?.();
            }
        }
        this.ctx.restore?.();
    }

    _updateAndDrawFloatingTexts() {
        if (this.floatingTexts.length === 0) return;

        this.ctx.save?.();
        this.ctx.font = '800 14px Orbitron';
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= 0.025;

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }

            this.ctx.globalAlpha = ft.alpha;
            this.ctx.fillStyle = ft.color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = ft.color;
            this.ctx.textAlign = 'center';
            if (this.ctx.fillText) {
                this.ctx.fillText(ft.text, ft.x, ft.y);
            }
        }
        this.ctx.restore?.();
    }
}
