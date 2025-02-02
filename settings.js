document.addEventListener('DOMContentLoaded', function() {
    // Initialize all settings from localStorage
    initializeSettings();

    // Initialize sidebar settings
    if (window.layoutManager) {
        window.layoutManager.initializeFromSettings();
    }

    // Theme buttons
    const themeButtons = document.querySelectorAll('.theme-btn');
    themeButtons.forEach(btn => {
        // Add active class to current theme
        if (btn.dataset.theme === (localStorage.getItem('theme') || 'light')) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            themeButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            setTheme(btn.dataset.theme);
        });
    });

    // Accent color
    const accentColorPicker = document.getElementById('accentColor');
    if (accentColorPicker) {
        const savedColor = localStorage.getItem('accentColor') || '#0984e3';
        accentColorPicker.value = savedColor;
        setAccentColor(savedColor); // Apply saved color on load
        
        accentColorPicker.addEventListener('change', (e) => {
            setAccentColor(e.target.value);
        });
    }

    // Interface settings
    const sidebarPosition = document.querySelector('.settings-select');
    if (sidebarPosition) {
        sidebarPosition.value = localStorage.getItem('sidebarPosition') || 'left';
        sidebarPosition.addEventListener('change', (e) => {
            setSidebarPosition(e.target.value);
        });
    }

    const animationSpeed = document.querySelector('.settings-slider');
    if (animationSpeed) {
        animationSpeed.value = localStorage.getItem('animationSpeed') || '1';
        setAnimationSpeed(animationSpeed.value);
        
        animationSpeed.addEventListener('input', (e) => {
            setAnimationSpeed(e.target.value);
        });
    }

    // Auto-hide sidebar setting
    const autoHideToggle = document.getElementById('autoHideSidebar');
    if (autoHideToggle) {
        autoHideToggle.checked = localStorage.getItem('autoHideSidebar') === 'true';
        autoHideToggle.addEventListener('change', (e) => {
            setAutoHideSidebar(e.target.checked);
        });
    }

    // Save and Reset buttons
    const saveButton = document.querySelector('.save-settings-btn');
    const resetButton = document.querySelector('.reset-settings-btn');
    
    if (saveButton) {
        saveButton.addEventListener('click', saveAllSettings);
    }
    
    if (resetButton) {
        resetButton.addEventListener('click', resetAllSettings);
    }

    // Update color preview
    updateColorPreview(accentColorPicker.value);

    // Reapply sidebar position after a short delay to ensure DOM is ready
    setTimeout(() => {
        const position = localStorage.getItem('sidebarPosition') || 'left';
        setSidebarPosition(position);
    }, 100);
});

function initializeSettings() {
    const settings = {
        theme: localStorage.getItem('theme') || 'light',
        accentColor: localStorage.getItem('accentColor') || '#0984e3',
        sidebarPosition: localStorage.getItem('sidebarPosition') || 'left',
        animationSpeed: localStorage.getItem('animationSpeed') || '1',
        autoHideSidebar: localStorage.getItem('autoHideSidebar') === 'true',
    };

    // Apply initial settings
    setTheme(settings.theme);
    setAccentColor(settings.accentColor);
    setAnimationSpeed(settings.animationSpeed);
    
    // Apply sidebar settings last to ensure proper initialization
    setSidebarPosition(settings.sidebarPosition);
    setAutoHideSidebar(settings.autoHideSidebar);

    // Update form elements to reflect current settings
    const sidebarPosition = document.querySelector('.settings-select');
    if (sidebarPosition) {
        sidebarPosition.value = settings.sidebarPosition;
    }
}

function setTheme(theme) {
    // Add transition class
    document.documentElement.classList.add('theme-transition');
    
    // Apply theme after a small delay to ensure transition is active
    setTimeout(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update button states
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        // Show animation
        showSaveAnimation();
        
        // Remove transition class
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 300);
    }, 50);
}

function setAccentColor(color) {
    const rgb = hexToRgb(color);
    document.documentElement.style.setProperty('--primary-color', color);
    document.documentElement.style.setProperty('--primary-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    
    // Calculate contrast color
    const contrastColor = getContrastColor(rgb.r, rgb.g, rgb.b);
    document.documentElement.style.setProperty('--primary-contrast-color', contrastColor);
    
    // Check if accent color is light and add data attribute to root
    const isLightColor = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 186;
    document.documentElement.setAttribute('data-light-accent', isLightColor);
    
    // Rest of the existing code...
    localStorage.setItem('accentColor', color);
    updateColorPreview(color, contrastColor);
    showSaveAnimation();
}

// Add this new function to calculate contrast color
function getContrastColor(r, g, b) {
    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function setSidebarPosition(position) {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    if (!sidebar || !mainContent) return;

    // Update toggle button position
    if (toggleBtn) {
        toggleBtn.classList.remove('left-position', 'right-position');
        toggleBtn.classList.add(`${position}-position`);
    }

    // Remove any existing animation classes
    sidebar.classList.remove('switching-right', 'switching-left');
    mainContent.classList.remove('switching-right', 'switching-left');

    // Determine animation direction
    const currentPosition = sidebar.classList.contains('right-position') ? 'right' : 'left';
    const isMovingRight = currentPosition === 'left' && position === 'right';
    const isMovingLeft = currentPosition === 'right' && position === 'left';

    // Add appropriate animation class
    if (isMovingRight) {
        sidebar.classList.add('switching-right');
        mainContent.classList.add('switching-right');
    } else if (isMovingLeft) {
        sidebar.classList.add('switching-left');
        mainContent.classList.add('switching-left');
    }

    // Apply position changes after a small delay
    setTimeout(() => {
        // Clear existing classes and styles
        sidebar.classList.remove('right-position', 'left-position');
        mainContent.classList.remove('right-position', 'left-position');

        if (position === 'right') {
            sidebar.classList.add('right-position');
            mainContent.classList.add('right-position');
        }

        // Handle auto-hide state
        const isAutoHide = localStorage.getItem('autoHideSidebar') === 'true';
        if (isAutoHide) {
            sidebar.classList.add('auto-hide');
            mainContent.classList.add('sidebar-auto-hide');
            
            if (position === 'right') {
                sidebar.style.transform = 'translateX(90%)';
            } else {
                sidebar.style.transform = 'translateX(-90%)';
            }
        }

        // Clean up animation classes
        setTimeout(() => {
            sidebar.classList.remove('switching-right', 'switching-left');
            mainContent.classList.remove('switching-right', 'switching-left');
        }, 500);

    }, 50);

    localStorage.setItem('sidebarPosition', position);
}

function setAnimationSpeed(speed) {
    document.documentElement.style.setProperty('--animation-speed', `${speed}s`);
    localStorage.setItem('animationSpeed', speed);
    showSaveAnimation();
}

function setAutoHideSidebar(enabled) {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    if (sidebar && mainContent && toggleBtn) {
        if (enabled) {
            sidebar.classList.add('auto-hide');
            mainContent.classList.add('sidebar-auto-hide');
            toggleBtn.style.display = 'block';
            
            // Add hover events
            sidebar.addEventListener('mouseenter', showSidebar);
            sidebar.addEventListener('mouseleave', hideSidebar);
            
            // Initially hide sidebar
            hideSidebar();
        } else {
            sidebar.classList.remove('auto-hide');
            mainContent.classList.remove('sidebar-auto-hide');
            toggleBtn.style.display = 'none';
            
            // Remove hover events
            sidebar.removeEventListener('mouseenter', showSidebar);
            sidebar.removeEventListener('mouseleave', hideSidebar);
            
            // Reset sidebar position
            sidebar.style.transform = 'translateX(0)';
            mainContent.style.marginLeft = 'var(--sidebar-width)';
        }
    }
    
    localStorage.setItem('autoHideSidebar', enabled);
}

function showSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.transform = 'translateX(0)';
    }
}

function hideSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.style.transform = 'translateX(-90%)';
    }
}

function saveAllSettings() {
    // Settings are already saved in real-time
    showSaveAnimation();
}

function resetAllSettings() {
    if(confirm('Reset all settings to default values?')) {
        const defaultSettings = {
            theme: 'light',
            accentColor: '#0984e3',
            sidebarPosition: 'left',
            animationSpeed: '1',
            autoHideSidebar: false
        };

        // Reset all settings
        setTheme(defaultSettings.theme);
        setAccentColor(defaultSettings.accentColor);
        setSidebarPosition(defaultSettings.sidebarPosition);
        setAnimationSpeed(defaultSettings.animationSpeed);
        setAutoHideSidebar(defaultSettings.autoHideSidebar);

        // Reset HTML form elements
        document.getElementById('accentColor').value = defaultSettings.accentColor;
        document.querySelector('.settings-select').value = defaultSettings.sidebarPosition;
        document.querySelector('.settings-slider').value = defaultSettings.animationSpeed;
        document.getElementById('autoHideSidebar').checked = defaultSettings.autoHideSidebar;
        
        // Reset notification toggles
        document.querySelectorAll('.switch input').forEach(input => {
            input.checked = true;
            const settingName = input.closest('.setting-item').querySelector('label').textContent.toLowerCase().replace(/\s+/g, '_');
            localStorage.setItem(settingName, true);
        });

        showResetAnimation();
    }
}

function showSaveAnimation() {
    const saveButton = document.querySelector('.save-settings-btn');
    saveButton.classList.add('success');
    saveButton.textContent = 'Saved!';
    
    setTimeout(() => {
        saveButton.classList.remove('success');
        saveButton.textContent = 'Save Changes';
    }, 2000);
}

function showResetAnimation() {
    const resetButton = document.querySelector('.reset-settings-btn');
    resetButton.style.pointerEvents = 'none';
    resetButton.style.position = 'relative';
    
    // Add loading state
    resetButton.innerHTML = `
        <span style="opacity: 0.7">Resetting...</span>
    `;
    
    // Show success state after reset
    setTimeout(() => {
        resetButton.innerHTML = `
            <span style="color: var(--success-color)">Settings Reset!</span>
        `;
        
        // Revert to original state
        setTimeout(() => {
            resetButton.innerHTML = `<span>Reset to Defaults</span>`;
            resetButton.style.pointerEvents = 'auto';
        }, 2000);
    }, 1000);
}

function updateColorPreview(color, contrastColor) {
    const preview = document.querySelector('.color-preview');
    if (preview) {
        preview.style.backgroundColor = color;
        preview.style.color = contrastColor || getContrastColor(hexToRgb(color));
        preview.textContent = 'Preview Text';
    }
}
