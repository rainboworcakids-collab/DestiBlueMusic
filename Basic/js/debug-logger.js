// ===============================================
// debug-logger-v2.js - Modular Debug Log System
// ===============================================
// เวอร์ชัน: 2.0.0
// วันที่: กุมาพันธ์ 2026
// ปรับปรุง: รองรับการแยก log ตาม module, filter และ export แยก module
// ===============================================

class DebugLogger {
    constructor(options = {}) {
        this.version = '2.0.0';

        this.options = {
            containerId: 'debugLogContainer',
            logAreaId: 'debugLog',
            toggleBtnId: 'toggleDebugBtn',
            clearBtnId: 'clearLogBtn',
            timeDisplayId: 'currentTime',
            countDisplayId: 'logCount',
            maxLogs: 1000,
            autoOpen: false,
            enableConsoleOverride: true,
            ...options
        };

        this.logCount = 0;
        this.logs = [];
        this.modules = new Set();          // เก็บชื่อ modules ที่เจอ
        this.currentTypeFilter = 'all';
        this.currentModuleFilter = 'all';
        this.isInitialized = false;

        // Icon mapping
        this.typeIcons = {
            info: '🔵',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            debug: '🐛',
            system: '⚙️'
        };

        // Color mapping
        this.typeColors = {
            info: 'text-blue-400',
            success: 'text-green-400',
            warning: 'text-yellow-400',
            error: 'text-red-400',
            debug: 'text-purple-400',
            system: 'text-gray-400'
        };

        // Override console methods ทันที
        if (this.options.enableConsoleOverride) {
            this._overrideConsoleMethods();
        }

        console.log(`🔧 DebugLogger v${this.version}: instance created, console override active (module-aware)`);
    }

    async init() {
        if (this.isInitialized) {
            console.warn('DebugLogger ถูก initialize ไปแล้ว');
            return;
        }

        try {
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            if (!this._getElement(this.options.containerId)) {
                this._createDebugContainer();
            }

            this._setupEventListeners();

            if (this.options.autoOpen) {
                this.show();
            }

            this._setupTimeUpdater();

            this.isInitialized = true;

            // แสดง logs ที่ค้างอยู่ทั้งหมด
            this._flushPendingLogs();

            this.log(`DebugLogger initialized successfully v${this.version}`, 'system');
            
        } catch (error) {
            console.error('DebugLogger initialization failed:', error);
        }
    }

    /**
     * บันทึกข้อความลง log (รับ module โดยตรง หรือ extract จากข้อความ)
     * @param {string} message 
     * @param {string} type 
     * @param {string|null} module  (ถ้าไม่ระบุ จะ extract จาก message)
     * @returns {string} log id
     */
    log(message, type = 'info', module = null) {
        // Extract module และ cleaned message ถ้าจำเป็น
        let finalMessage = message;
        let finalModule = module;

        if (!finalModule) {
            const extracted = this._extractModuleFromMessage(message);
            finalModule = extracted.module;
            finalMessage = extracted.message;   // เอาส่วน prefix ออก
        }

        // เก็บ module name
        this.modules.add(finalModule);

        const timestamp = new Date().toLocaleTimeString('th-TH', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const logEntry = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            timestamp,
            message: finalMessage,
            type,
            module: finalModule,
            icon: this.typeIcons[type] || '📝',
            color: this.typeColors[type] || 'text-gray-400'
        };

        // บันทึก logs
        this.logs.push(logEntry);
        this.logCount++;

        if (this.logs.length > this.options.maxLogs) {
            this.logs.shift();
        }

        // ถ้า initialized แล้ว และ log นี้ตรงกับ filter ปัจจุบัน -> แสดงทันที
        if (this.isInitialized) {
            if (this._matchesCurrentFilters(logEntry)) {
                this._appendLogToUI(logEntry);
            }
            this._updateCounter();
            this._updateModuleDropdown();   // เพิ่ม module ใหม่ใน dropdown
        }

        return logEntry.id;
    }

    /**
     * สร้าง logger object สำหรับ module เฉพาะ (fluent interface)
     * @param {string} moduleName 
     * @returns {Object} { log, info, success, warning, error, debug }
     */
    module(moduleName) {
        return {
            log: (msg, type = 'info') => this.log(msg, type, moduleName),
            info: (msg) => this.log(msg, 'info', moduleName),
            success: (msg) => this.log(msg, 'success', moduleName),
            warning: (msg) => this.log(msg, 'warning', moduleName),
            error: (msg) => this.log(msg, 'error', moduleName),
            debug: (msg) => this.log(msg, 'debug', moduleName)
        };
    }

    // ========== METHODS เดิม (คงไว้) ==========
    show() {
        const container = this._getElement(this.options.containerId);
        if (container) {
            container.classList.remove('hidden');
            this.log('Debug log opened', 'system');
        }
    }

    hide() {
        const container = this._getElement(this.options.containerId);
        if (container) {
            container.classList.add('hidden');
            this.log('Debug log closed', 'system');
        }
    }

    toggle() {
        const container = this._getElement(this.options.containerId);
        if (container) {
            container.classList.contains('hidden') ? this.show() : this.hide();
        }
    }

    clear() {
        const logArea = this._getElement(this.options.logAreaId);
        if (logArea) {
            logArea.innerHTML = '';
            this.logs = [];
            this.logCount = 0;
            this.modules.clear();
            this._updateCounter();
            this._updateModuleDropdown();
            this.log('Log cleared', 'system');
        }
    }

    getAllLogs() {
        return [...this.logs];
    }

    filterByType(type) {
        return this.logs.filter(log => log.type === type);
    }

    filterByModule(module) {
        return this.logs.filter(log => log.module === module);
    }

    downloadAsJSON() {
        const data = {
            logs: this.logs,
            totalLogs: this.logCount,
            exportedAt: new Date().toISOString()
        };

        this._downloadJSON(data, `debug-logs-${new Date().toISOString().split('T')[0]}.json`);
        this.log('Logs downloaded as JSON', 'system');
    }

    downloadByModule(moduleName) {
        const filtered = this.logs.filter(log => log.module === moduleName);
        const data = {
            module: moduleName,
            totalLogs: filtered.length,
            logs: filtered,
            exportedAt: new Date().toISOString()
        };
        this._downloadJSON(data, `debug-${moduleName}-${new Date().toISOString().split('T')[0]}.json`);
        this.log(`Logs for module "${moduleName}" downloaded`, 'system');
    }

    exportAsText(moduleFilter = null) {
        const logsToExport = moduleFilter ? this.filterByModule(moduleFilter) : this.logs;
        let text = '=== DEBUG LOGS ===\n';
        text += `Exported: ${new Date().toLocaleString('th-TH')}\n`;
        text += `Total logs: ${logsToExport.length}\n\n`;

        logsToExport.forEach(log => {
            text += `[${log.timestamp}] [${log.module}] ${log.icon} ${log.type.toUpperCase()}: ${log.message}\n`;
        });

        return text;
    }

    getModuleList() {
        return [...this.modules];
    }

    // ========== FILTER METHODS ==========
    setTypeFilter(type) {
        this.currentTypeFilter = type;
        this._refreshDisplay();
    }

    setModuleFilter(module) {
        this.currentModuleFilter = module;
        this._refreshDisplay();
    }

    // ========== PRIVATE METHODS ==========
    _extractModuleFromMessage(message) {
        const match = message.match(/^\[(.*?)\]\s*(.*)/s);  // s flag เพื่อจับ newline
        if (match) {
            return { module: match[1], message: match[2] };
        }
        return { module: 'core', message };
    }

    _matchesCurrentFilters(logEntry) {
        const typeOk = this.currentTypeFilter === 'all' || logEntry.type === this.currentTypeFilter;
        const moduleOk = this.currentModuleFilter === 'all' || logEntry.module === this.currentModuleFilter;
        return typeOk && moduleOk;
    }

    _refreshDisplay() {
        const logArea = this._getElement(this.options.logAreaId);
        if (!logArea) return;
        logArea.innerHTML = '';

        const filtered = this.logs.filter(entry => this._matchesCurrentFilters(entry));
        filtered.forEach(entry => this._appendLogToUI(entry));
    }

    _appendLogToUI(logEntry) {
        const logArea = this._getElement(this.options.logAreaId);
        if (!logArea) return;

        const logElement = document.createElement('div');
        logElement.className = `log-entry p-2 border-b border-gray-800 last:border-b-0 ${logEntry.color}`;
        logElement.innerHTML = `
            <div class="flex items-start">
                <span class="mr-2 flex-shrink-0">${logEntry.icon}</span>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-400">${logEntry.timestamp}</span>
                        <div class="flex space-x-1">
                            <span class="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">${logEntry.type}</span>
                            <span class="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">${logEntry.module}</span>
                        </div>
                    </div>
                    <div class="mt-1 break-words">${this._escapeHtml(logEntry.message)}</div>
                </div>
            </div>
        `;

        logArea.appendChild(logElement);
        logArea.scrollTop = logArea.scrollHeight;
    }

    _updateCounter() {
        const countDisplay = this._getElement(this.options.countDisplayId);
        if (countDisplay) {
            countDisplay.textContent = this.logCount;
            const errorCount = this.filterByType('error').length;
            if (errorCount > 0) {
                countDisplay.classList.remove('bg-blue-100', 'text-blue-800');
                countDisplay.classList.add('bg-red-100', 'text-red-800');
            } else {
                countDisplay.classList.remove('bg-red-100', 'text-red-800');
                countDisplay.classList.add('bg-blue-100', 'text-blue-800');
            }
        }
    }

    _updateModuleDropdown() {
        const select = document.getElementById('moduleFilterSelect');
        if (!select) return;

        const currentModules = this.getModuleList();
        const selectedValue = select.value;

        // เก็บ options เดิมไว้ (รวม All)
        let html = '<option value="all">All</option>';
        currentModules.forEach(mod => {
            html += `<option value="${mod}" ${mod === selectedValue ? 'selected' : ''}>${mod}</option>`;
        });
        select.innerHTML = html;
    }

    _flushPendingLogs() {
        const logArea = this._getElement(this.options.logAreaId);
        if (!logArea) return;

        logArea.innerHTML = '';

        // กรอง logs ตาม filter ปัจจุบัน
        const filtered = this.logs.filter(entry => this._matchesCurrentFilters(entry));
        filtered.forEach(log => this._appendLogToUI(log));
        this._updateCounter();
        this._updateModuleDropdown();
    }

    _overrideConsoleMethods() {
        const original = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug
        };

        console.log = (...args) => {
            original.log(...args);
            const joined = this._joinArgs(args);
            const { module, message } = this._extractModuleFromMessage(joined);
            this.log(message, 'debug', module);
        };

        console.info = (...args) => {
            original.info(...args);
            const joined = this._joinArgs(args);
            const { module, message } = this._extractModuleFromMessage(joined);
            this.log(message, 'info', module);
        };

        console.warn = (...args) => {
            original.warn(...args);
            const joined = this._joinArgs(args);
            const { module, message } = this._extractModuleFromMessage(joined);
            this.log(message, 'warning', module);
        };

        console.error = (...args) => {
            original.error(...args);
            const joined = this._joinArgs(args);
            const { module, message } = this._extractModuleFromMessage(joined);
            this.log(message, 'error', module);
        };

        console.debug = (...args) => {
            original.debug(...args);
            const joined = this._joinArgs(args);
            const { module, message } = this._extractModuleFromMessage(joined);
            this.log(message, 'debug', module);
        };

        window.originalConsole = original;
    }

    _joinArgs(args) {
        return args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
    }

    _createDebugContainer() {
        const container = document.createElement('div');
        container.id = this.options.containerId;
        container.className = 'fixed bottom-4 right-4 w-96 max-w-full bg-white rounded-lg shadow-xl border border-gray-300 z-50';
        container.innerHTML = `
            <div class="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                <div class="flex items-center">
                    <h3 class="text-lg font-semibold text-gray-700">
                        <i class="fas fa-terminal mr-2"></i>Debug Console v2
                    </h3>
                    <span class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full" id="${this.options.countDisplayId}">0</span>
                </div>
                <div class="flex space-x-2">
                    <button id="minimizeBtn" class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                        <i class="fas fa-window-minimize"></i>
                    </button>
                    <button id="clearLogBtn" class="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                        <i class="fas fa-trash mr-1"></i>Clear
                    </button>
                </div>
            </div>
            
            <div class="p-3 bg-gray-900 text-gray-100">
                <div class="flex justify-between items-center mb-2">
                    <div class="text-sm">
                        <span>Time: <span id="${this.options.timeDisplayId}">00:00:00</span></span>
                    </div>
                    <div class="flex space-x-1">
                        <button id="exportJSONBtn" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700" title="Export as JSON">
                            <i class="fas fa-download mr-1"></i>JSON
                        </button>
                        <button id="exportTextBtn" class="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" title="Export as Text">
                            <i class="fas fa-file-text mr-1"></i>TXT
                        </button>
                    </div>
                </div>
                
                <div id="${this.options.logAreaId}" class="debug-log-area h-64 overflow-y-auto font-mono text-sm">
                    <!-- Logs will appear here -->
                </div>
            </div>
            
            <div class="p-2 bg-gray-50 border-t border-gray-200 rounded-b-lg flex flex-col space-y-2">
                <div class="flex flex-wrap gap-1">
                    <button class="filter-type-btn px-2 py-1 text-xs rounded bg-blue-500 text-white" data-type="all">All</button>
                    <button class="filter-type-btn px-2 py-1 text-xs rounded bg-blue-100 text-blue-700" data-type="info">Info</button>
                    <button class="filter-type-btn px-2 py-1 text-xs rounded bg-green-100 text-green-700" data-type="success">Success</button>
                    <button class="filter-type-btn px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700" data-type="warning">Warning</button>
                    <button class="filter-type-btn px-2 py-1 text-xs rounded bg-red-100 text-red-700" data-type="error">Error</button>
                    <button class="filter-type-btn px-2 py-1 text-xs rounded bg-purple-100 text-purple-700" data-type="debug">Debug</button>
                </div>
                <div class="flex items-center space-x-2">
                    <label class="text-xs text-gray-700">Module:</label>
                    <select id="moduleFilterSelect" class="text-xs p-1 border rounded flex-1">
                        <option value="all">All</option>
                    </select>
                    <button id="exportModuleBtn" class="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700" title="Export selected module">
                        <i class="fas fa-download mr-1"></i>Export Module
                    </button>
                </div>
                <div class="flex justify-end">
                    <button id="closeDebugBtn" class="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                        <i class="fas fa-times mr-1"></i>Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        this._createToggleButton();
    }

    _createToggleButton() {
        if (this._getElement(this.options.toggleBtnId)) return;
        const toggleBtn = document.createElement('button');
        toggleBtn.id = this.options.toggleBtnId;
        toggleBtn.className = 'fixed bottom-4 left-4 px-3 py-2 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-900 z-40 flex items-center';
        toggleBtn.innerHTML = '<i class="fas fa-terminal mr-2"></i>Debug v2';
        document.body.appendChild(toggleBtn);
    }

    _setupEventListeners() {
        const toggleBtn = this._getElement(this.options.toggleBtnId);
        if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());

        const clearBtn = this._getElement(this.options.clearBtnId);
        if (clearBtn) clearBtn.addEventListener('click', () => this.clear());

        const closeBtn = document.getElementById('closeDebugBtn');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hide());

        const minimizeBtn = document.getElementById('minimizeBtn');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                const logArea = this._getElement(this.options.logAreaId);
                if (logArea) {
                    logArea.classList.toggle('h-64');
                    logArea.classList.toggle('h-32');
                }
            });
        }

        const exportJSONBtn = document.getElementById('exportJSONBtn');
        if (exportJSONBtn) exportJSONBtn.addEventListener('click', () => this.downloadAsJSON());

        const exportTextBtn = document.getElementById('exportTextBtn');
        if (exportTextBtn) {
            exportTextBtn.addEventListener('click', () => {
                const text = this.exportAsText();
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        const exportModuleBtn = document.getElementById('exportModuleBtn');
        if (exportModuleBtn) {
            exportModuleBtn.addEventListener('click', () => {
                const select = document.getElementById('moduleFilterSelect');
                const module = select.value;
                if (module === 'all') {
                    alert('Please select a specific module to export.');
                    return;
                }
                this.downloadByModule(module);
            });
        }

        // Type filter buttons
        const typeButtons = document.querySelectorAll('.filter-type-btn');
        typeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.setTypeFilter(type);

                // Update active state
                typeButtons.forEach(b => {
                    if (b.dataset.type === type) {
                        b.classList.add('bg-blue-500', 'text-white');
                        // remove specific color classes
                        b.classList.remove('bg-blue-100', 'text-blue-700', 'bg-green-100', 'text-green-700', 'bg-yellow-100', 'text-yellow-700', 'bg-red-100', 'text-red-700', 'bg-purple-100', 'text-purple-700');
                    } else {
                        b.classList.remove('bg-blue-500', 'text-white');
                        const colorClass = this._getButtonColorClass(b.dataset.type);
                        b.classList.add(colorClass);
                    }
                });
            });
        });

        // Module filter dropdown
        const moduleSelect = document.getElementById('moduleFilterSelect');
        if (moduleSelect) {
            moduleSelect.addEventListener('change', (e) => {
                this.setModuleFilter(e.target.value);
            });
        }
    }

    _setupTimeUpdater() {
        const timeDisplay = this._getElement(this.options.timeDisplayId);
        if (!timeDisplay) return;
        const updateTime = () => {
            const now = new Date();
            timeDisplay.textContent = now.toLocaleTimeString('th-TH', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        };
        updateTime();
        setInterval(updateTime, 1000);
    }

    _getElement(id) {
        return document.getElementById(id);
    }

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    _getButtonColorClass(type) {
        switch(type) {
            case 'info': return 'bg-blue-100 text-blue-700';
            case 'success': return 'bg-green-100 text-green-700';
            case 'warning': return 'bg-yellow-100 text-yellow-700';
            case 'error': return 'bg-red-100 text-red-700';
            case 'debug': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    _downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Convenience methods (without module)
    info(message) { return this.log(message, 'info'); }
    success(message) { return this.log(message, 'success'); }
    warning(message) { return this.log(message, 'warning'); }
    error(message) { return this.log(message, 'error'); }
    debug(message) { return this.log(message, 'debug'); }
}

// สร้าง singleton instance และ attach เข้ากับ window
window.DebugLogger = new DebugLogger();
console.log(`✅ debug-logger-v2.js v${window.DebugLogger.version} loaded (module-aware)`);

// Auto-initialize เมื่อ DOM พร้อม
document.addEventListener('DOMContentLoaded', () => {
    window.DebugLogger.init();
});