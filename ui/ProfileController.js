/**
 * ui/ProfileController.js
 * Manages player profile callsign selection, dropdown populating, and mode selection state.
 */
import { domRefs } from './DomRefs.js';

export class ProfileController {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.selectedProfile = '';
        this.selectedMode = domRefs.modeDropdown ? (domRefs.modeDropdown.value || 'mode1') : 'mode1';
        this._bindEvents();
    }

    _bindEvents() {
        if (domRefs.profileDropdown) {
            domRefs.profileDropdown.addEventListener('change', (e) => {
                this.selectedProfile = e.target.value;
                this.updateStartBtnState();
            });
        }

        if (domRefs.modeDropdown) {
            domRefs.modeDropdown.addEventListener('change', (e) => {
                this.selectedMode = e.target.value;
                this.updateStartBtnState();
            });
        }

        if (domRefs.createProfileBtn) {
            domRefs.createProfileBtn.addEventListener('click', async () => {
                if (domRefs.newProfileName) {
                    await this.saveProfile(domRefs.newProfileName.value);
                    domRefs.newProfileName.value = '';
                }
            });
        }
    }

    updateStartBtnState() {
        if (!this.selectedMode || this.selectedMode === '') {
            this.selectedMode = (domRefs.modeDropdown && domRefs.modeDropdown.value) ? domRefs.modeDropdown.value : 'mode1';
        }
        if (domRefs.startBtn) {
            domRefs.startBtn.disabled = !this.selectedProfile || !this.selectedMode;
        }
    }

    async loadProfiles(autoSelectName = '') {
        if (!this.firebaseService) return;

        if (domRefs.profileDropdown) domRefs.profileDropdown.disabled = true;
        if (domRefs.createProfileBtn) domRefs.createProfileBtn.disabled = true;

        const profiles = await this.firebaseService.getProfiles();

        if (domRefs.profileDropdown) {
            domRefs.profileDropdown.innerHTML = '<option value="">-- Select Player --</option>';
            profiles.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.name;
                opt.innerText = `${p.name} (High Score: ${p.highScore})`;
                if (autoSelectName && p.name === autoSelectName) {
                    opt.selected = true;
                }
                domRefs.profileDropdown.appendChild(opt);
            });
            domRefs.profileDropdown.disabled = false;
            this.selectedProfile = domRefs.profileDropdown.value;
        }

        if (domRefs.createProfileBtn) domRefs.createProfileBtn.disabled = false;

        this.selectedMode = domRefs.modeDropdown ? (domRefs.modeDropdown.value || 'mode1') : 'mode1';
        this.updateStartBtnState();
    }

    async saveProfile(name) {
        if (!name || !name.trim() || !this.firebaseService) return;
        const trimmed = name.trim();
        if (domRefs.createProfileBtn) domRefs.createProfileBtn.disabled = true;
        await this.firebaseService.saveProfile(trimmed);
        await this.loadProfiles(trimmed);
    }
}
