class LayoutManager {
    constructor() {
        this.isAnimating = false;
        this.sidebarState = localStorage.getItem('sidebarState') === 'collapsed';
        this.autoHideSidebar = localStorage.getItem('autoHideSidebar') === 'true';
        this.init();
    }

    async init() {
        await this.loadComponents();
        this.setupTheme();
        this.setActiveNavItem();
        this.setupSidebar();
        this.initializeFromSettings();
    }

    async loadComponents() {
        try {
            // Load header
            const headerResponse = await fetch('/components/header.html');
            const headerHtml = await headerResponse.text();
            document.querySelector('#header-placeholder').innerHTML = headerHtml;

            // Load sidebar
            const sidebarResponse = await fetch('/components/sidebar.html');
            const sidebarHtml = await sidebarResponse.text();
            document.querySelector('#sidebar-placeholder').innerHTML = sidebarHtml;

        } catch (error) {
            console.error('Error loading components:', error);
        }
    }

    setupTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const savedTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', savedTheme);
            this.updateThemeToggleButton(savedTheme);

            themeToggle.addEventListener('click', () => {
                document.documentElement.classList.add('theme-transition');
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                this.updateThemeToggleButton(newTheme);

                setTimeout(() => {
                    document.documentElement.classList.remove('theme-transition');
                }, 300);
            });
        }
    }

    setActiveNavItem() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
        document.querySelectorAll('.nav-item').forEach(item => {
            const isActive = item.dataset.page === currentPage;
            item.classList.toggle('active', isActive);
            
            // Apply contrast color to active nav item text
            if (isActive) {
                const contrastColor = getComputedStyle(document.documentElement)
                    .getPropertyValue('--primary-contrast-color').trim();
                item.style.color = contrastColor;
            }
        });
    }

    updateThemeToggleButton(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeToggle.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
        }
    }

    initializeFromSettings() {
        // Apply saved settings
        const theme = localStorage.getItem('theme') || 'light';
        const accentColor = localStorage.getItem('accentColor') || '#0984e3';
        const sidebarPosition = localStorage.getItem('sidebarPosition') || 'left';
        const animationSpeed = localStorage.getItem('animationSpeed') || '1';
        const autoHideSidebar = localStorage.getItem('autoHideSidebar') === 'true';

        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);
        
        // Apply accent color
        document.documentElement.style.setProperty('--primary-color', accentColor);
        
        // Apply animation speed
        document.documentElement.style.setProperty('--animation-speed', `${animationSpeed}s`);
        
        // Apply sidebar settings
        this.applySidebarSettings(sidebarPosition, autoHideSidebar);
    }

    applySidebarSettings(position, autoHide) {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const toggleBtn = document.querySelector('.sidebar-toggle');
        
        if (!sidebar || !mainContent || !toggleBtn) return;

        // Reset all positions and classes
        sidebar.classList.remove('right-position', 'auto-hide');
        mainContent.classList.remove('right-position', 'sidebar-auto-hide');
        toggleBtn.style.left = '';
        toggleBtn.style.right = '';

        // Clear any inline styles
        sidebar.style.transform = '';
        sidebar.style.left = '';
        sidebar.style.right = '';
        mainContent.style.marginLeft = '';
        mainContent.style.marginRight = '';

        // Apply position classes
        if (position === 'right') {
            sidebar.classList.add('right-position');
            mainContent.classList.add('right-position');
            toggleBtn.style.left = '-15px';
            toggleBtn.style.right = 'auto';
        } else {
            toggleBtn.style.right = '-15px';
            toggleBtn.style.left = 'auto';
        }

        // Apply auto-hide if enabled
        if (autoHide) {
            sidebar.classList.add('auto-hide');
            mainContent.classList.add('sidebar-auto-hide');
            toggleBtn.style.display = 'block';
            
            // Initial position based on side
            if (position === 'right') {
                sidebar.style.transform = 'translateX(calc(var(--sidebar-width) - 10px))';
            } else {
                sidebar.style.transform = 'translateX(calc(-1 * var(--sidebar-width) + 10px))';
            }
        } else {
            // Ensure sidebar is shown when auto-hide is off
            sidebar.style.transform = 'translateX(0)';
            toggleBtn.style.display = 'none';
        }

        // Store settings
        localStorage.setItem('sidebarPosition', position);
        localStorage.setItem('autoHideSidebar', autoHide);
    }

    setupAutoHideEvents(sidebar) {
        const position = localStorage.getItem('sidebarPosition') || 'left';
        
        const showSidebar = () => {
            sidebar.style.transform = 'translateX(0)';
        };

        const hideSidebar = () => {
            if (position === 'right') {
                sidebar.style.transform = 'translateX(calc(var(--sidebar-width) - 10px))';
            } else {
                sidebar.style.transform = 'translateX(calc(-1 * var(--sidebar-width) + 10px))';
            }
        };

        sidebar.addEventListener('mouseenter', showSidebar);
        sidebar.addEventListener('mouseleave', hideSidebar);

        // Store event listeners for removal
        sidebar._showListener = showSidebar;
        sidebar._hideListener = hideSidebar;

        // Initial state
        requestAnimationFrame(hideSidebar);
    }

    removeAutoHideEvents(sidebar) {
        if (sidebar._showListener) {
            sidebar.removeEventListener('mouseenter', sidebar._showListener);
        }
        if (sidebar._hideListener) {
            sidebar.removeEventListener('mouseleave', sidebar._hideListener);
        }
        sidebar.style.transform = 'translateX(0)';
    }

    setupSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        // Apply initial state
        if (this.sidebarState) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
    }
}

// Function to toggle theme
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    html.setAttribute('data-theme', currentTheme === 'light' ? 'dark' : 'light');
}

// Function to toggle sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
    
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarState', isCollapsed ? 'collapsed' : 'expanded');
}

// Initialize layout when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.layoutManager = new LayoutManager();
});

// Listen for settings changes
window.addEventListener('storage', (event) => {
    if (window.layoutManager && event.key.startsWith('theme') || 
        event.key.startsWith('accent') || 
        event.key.startsWith('sidebar') || 
        event.key.startsWith('animation')) {
        window.layoutManager.initializeFromSettings();
    }
});
