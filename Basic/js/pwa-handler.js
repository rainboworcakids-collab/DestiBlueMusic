// pwa-handler.js - เวอร์ชัน 2.0 (แก้ไขตามกฎข้อ 0 และ Data Integrity)
console.log('📱 PWA Handler Module version 2.0 - โหลดสำเร็จ');

class PWAHandler {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.installBanner = document.getElementById('installBanner');
        this.installButton = document.getElementById('installButton');
        this.dismissButton = document.getElementById('dismissBanner');
        
        this.initialize();
    }
    
    initialize() {
        this.setupEventListeners();
        this.checkInstallStatus();
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.onDOMLoaded());
        } else {
            this.onDOMLoaded();
        }
    }
    
    onDOMLoaded() {
        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.install());
        }
        if (this.dismissButton) {
            this.dismissButton.addEventListener('click', () => this.hideBanner());
        }
        
        const installPWAButton = document.getElementById('installPWAButton');
        if (installPWAButton) {
            installPWAButton.addEventListener('click', () => this.install());
        }
    }
    
    setupEventListeners() {
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 ระบบพร้อมสำหรับการติดตั้ง (beforeinstallprompt captured)');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showBanner();
            
            const installPWAButton = document.getElementById('installPWAButton');
            if (installPWAButton) {
                installPWAButton.classList.remove('hidden');
            }
        });
        
        window.addEventListener('appinstalled', (e) => {
            console.log('🎉 ติดตั้ง PWA สำเร็จแล้ว');
            this.isInstalled = true;
            this.deferredPrompt = null;
            this.hideBanner();
            
            const installPWAButton = document.getElementById('installPWAButton');
            if (installPWAButton) {
                installPWAButton.classList.add('hidden');
            }
            
            // อัปเดต state ผ่าน AppMain แทนการเขียน localStorage โดยตรง
            if (window.AppMain && typeof window.AppMain.setState === 'function') {
                window.AppMain.setState('pwa.installed', true);
                window.AppMain.setState('pwa.installDate', new Date().toISOString());
            } else {
                console.warn('AppMain not available, cannot persist PWA state');
            }
            
            this.showToast('ติดตั้งแอปสำเร็จ! คุณสามารถเข้าใช้งานได้จากหน้าจอหลัก', 'success');
        });
        
        window.addEventListener('appuninstalled', () => {
            console.log('🗑️ ผู้ใช้ลบแอปออกแล้ว');
            if (window.AppMain && typeof window.AppMain.setState === 'function') {
                window.AppMain.setState('pwa.installed', false);
                window.AppMain.setState('pwa.installDate', null);
            }
            this.isInstalled = false;
        });
    }
    
    async install() {
        console.log('📱 กำลังเริ่มกระบวนการติดตั้ง...');

        if (!this.deferredPrompt) {
            console.warn('⚠️ ไม่พบข้อมูลการติดตั้ง');
            this.showToast('ระบบยังไม่พร้อมติดตั้ง หรือคุณติดตั้งไปแล้ว', 'error');
            return { success: false, message: 'No prompt available' };
        }

        try {
            this.showToast('กำลังเตรียมการติดตั้ง...', 'info');
            await this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`👤 ผลการตัดสินใจของผู้ใช้: ${outcome}`);

            if (outcome === 'accepted') {
                console.log('✅ ผู้ใช้ตกลงติดตั้ง');
                // appinstalled event จะจัดการต่อ
            } else {
                console.log('❌ ผู้ใช้ปฏิเสธการติดตั้ง');
                this.showToast('คุณได้ปฏิเสธการติดตั้งแอป', 'warning');
            }

            this.deferredPrompt = null;
            return { success: outcome === 'accepted' };

        } catch (error) {
            console.error('❌ เกิดข้อผิดพลาดระหว่างติดตั้ง:', error);
            this.showToast('เกิดข้อผิดพลาดในการติดตั้ง', 'error');
            return { success: false, error };
        }
    }
    
    showBanner() {
        if (this.installBanner) {
            this.installBanner.classList.add('show');
            setTimeout(() => {
                this.installBanner.classList.remove('hidden');
            }, 10);
        }
    }
    
    hideBanner() {
        if (this.installBanner) {
            this.installBanner.classList.remove('show');
            setTimeout(() => {
                this.installBanner.classList.add('hidden');
            }, 300);
        }
    }
    
    checkInstallStatus() {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        // อ่านค่าจาก AppMain หากมี
        let storedInstalled = false;
        if (window.AppMain && typeof window.AppMain.getState === 'function') {
            storedInstalled = window.AppMain.getState('pwa.installed') === true;
        }
        
        this.isInstalled = isStandalone || storedInstalled;
        
        if (this.isInstalled) {
            console.log('📱 แอปถูกติดตั้งแล้ว');
            this.hideBanner();
            
            const installPWAButton = document.getElementById('installPWAButton');
            if (installPWAButton) {
                installPWAButton.classList.add('hidden');
            }
        }
    }
    
    showToast(message, type = 'info') {
        // ใช้ EventBus หรือ dispatchEvent ให้ form-ui.js จัดการแสดงผล
        const event = new CustomEvent('showToast', { 
            detail: { message, type } 
        });
        window.dispatchEvent(event);
        
        // Fallback เผื่อไม่มีใครรับ event
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    getStatus() {
        return {
            hasDeferredPrompt: !!this.deferredPrompt,
            isInstalled: this.isInstalled,
            displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
            canInstall: !!this.deferredPrompt && !this.isInstalled
        };
    }
}

// สร้าง Instance และส่งออกไปที่ Window
window.PWAHandler = new PWAHandler();

// ฟังก์ชัน global สำหรับเรียกจาก HTML
window.handleAppInstall = function() {
    if (window.PWAHandler) {
        window.PWAHandler.install();
    } else {
        // ส่ง event แทนการใช้ alert
        window.dispatchEvent(new CustomEvent('showToast', { 
            detail: { message: 'ระบบติดตั้งยังไม่พร้อม กรุณารอสักครู่...', type: 'warning' } 
        }));
    }
};

console.log('✅ PWA Handler (v2.0) พร้อมใช้งานแล้ว');