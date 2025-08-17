/**
 * Main Application Controller
 * Orchestrates all components and handles UI interactions
 */

class ConsciousSpendingApp {
    constructor() {
        // Initialize core components
        this.storage = new StorageManager();
        this.taxCalc = new TaxCalculator();
        this.calculator = new HouseholdCalculator(this.taxCalc);
        this.scenarioManager = new ScenarioManager(this.storage);
        this.visualization = new VisualizationManager();
        
        // Application state
        this.currentView = 'combined';
        this.currentTab = 'dashboard';
        this.isInitialized = false;
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Check localStorage availability
            if (!this.storage.isStorageAvailable()) {
                this.showError('Local storage is not available. Data will not persist.');
            }

            // Set up event listeners
            this.setupEventListeners();
            
            // Load user settings
            this.loadSettings();
            
            // Initialize scenarios and set default
            this.initializeScenarios();
            
            // Initialize visualization
            this.visualization.initializeCharts();
            
            // Calculate and display initial data
            this.updateCalculations();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('Conscious Spending App initialized successfully');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewChange(e));
        });
        
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabChange(e));
        });
        
        // Scenario selector
        const scenarioSelector = document.getElementById('scenarioSelector');
        if (scenarioSelector) {
            scenarioSelector.addEventListener('change', (e) => this.handleScenarioChange(e));
        }
        
        // Income form inputs
        this.setupIncomeFormListeners();
        
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
        
        // Scenario manager callbacks
        this.scenarioManager.on('onScenarioChange', (scenarioName, scenarioData) => {
            this.onScenarioChange(scenarioName, scenarioData);
        });
    }

    /**
     * Set up income form listeners
     */
    setupIncomeFormListeners() {
        const incomeInputs = [
            'person1Salary', 'person1Bonus', 'person1Other',
            'person1_401k', 'person1Health', 'person1HSA'
        ];
        
        incomeInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.handleIncomeChange());
                input.addEventListener('blur', () => this.saveCurrentScenario());
            }
        });
    }

    /**
     * Load user settings
     */
    loadSettings() {
        const settings = this.storage.loadSettings();
        this.currentView = settings.defaultView || 'combined';
        
        // Apply theme
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        
        // Set initial view
        this.setView(this.currentView);
    }

    /**
     * Initialize scenarios
     */
    initializeScenarios() {
        // Load scenarios and populate selector
        this.populateScenarioSelector();
        
        // Set initial scenario
        const initialScenario = this.scenarioManager.getCurrentScenario();
        if (initialScenario) {
            this.loadScenarioData(initialScenario);
        }
    }

    /**
     * Populate scenario selector dropdown
     */
    populateScenarioSelector() {
        const selector = document.getElementById('scenarioSelector');
        if (!selector) return;
        
        // Clear existing options
        selector.innerHTML = '';
        
        // Add scenarios
        const scenarioNames = this.scenarioManager.getScenarioNames();
        scenarioNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = this.scenarioManager.getScenarioMetadata(name)?.name || name;
            selector.appendChild(option);
        });
        
        // Set current scenario
        selector.value = this.scenarioManager.currentScenario;
    }

    /**
     * Handle view change (person1/combined/person2)
     */
    handleViewChange(event) {
        const newView = event.target.dataset.view;
        if (newView && newView !== this.currentView) {
            this.setView(newView);
        }
    }

    /**
     * Set current view
     */
    setView(viewName) {
        this.currentView = viewName;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        // Update calculations and visualizations
        this.updateCalculations();
        
        // Update income form visibility
        this.updateIncomeFormVisibility();
    }

    /**
     * Handle tab change
     */
    handleTabChange(event) {
        const newTab = event.target.dataset.tab;
        if (newTab && newTab !== this.currentTab) {
            this.setTab(newTab);
        }
    }

    /**
     * Set current tab
     */
    setTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab button states
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
        
        // Handle tab-specific logic
        if (tabName === 'dashboard' && this.isInitialized) {
            // Resize charts when dashboard becomes visible
            setTimeout(() => this.visualization.resizeCharts(), 100);
        }
    }

    /**
     * Handle scenario change
     */
    handleScenarioChange(event) {
        const scenarioName = event.target.value;
        if (this.scenarioManager.setCurrentScenario(scenarioName)) {
            const scenario = this.scenarioManager.getCurrentScenario();
            this.loadScenarioData(scenario);
            this.updateCalculations();
        }
    }

    /**
     * Load scenario data into forms
     */
    loadScenarioData(scenario) {
        if (!scenario) return;
        
        // Load person 1 income data
        const person1 = scenario.income.person1;
        this.setInputValue('person1Salary', person1.salary);
        this.setInputValue('person1Bonus', person1.bonus);
        this.setInputValue('person1Other', person1.otherIncome);
        this.setInputValue('person1_401k', person1.preTexDeductions?.retirement401k);
        this.setInputValue('person1Health', person1.preTexDeductions?.healthInsurance);
        this.setInputValue('person1HSA', person1.preTexDeductions?.hsa);
        
        // Load person 2 income data (similar pattern)
        // This would be expanded based on your form structure
    }

    /**
     * Set input value safely
     */
    setInputValue(inputId, value) {
        const input = document.getElementById(inputId);
        if (input && value !== undefined) {
            input.value = value;
        }
    }

    /**
     * Handle income form changes
     */
    handleIncomeChange() {
        if (!this.isInitialized) return;
        
        // Debounce the calculation update
        clearTimeout(this.incomeChangeTimeout);
        this.incomeChangeTimeout = setTimeout(() => {
            this.updateScenarioFromForm();
            this.updateCalculations();
        }, 300);
    }

    /**
     * Update scenario data from form inputs
     */
    updateScenarioFromForm() {
        const currentScenario = this.scenarioManager.getCurrentScenario();
        if (!currentScenario) return;
        
        // Update person 1 data
        if (currentScenario.income.person1) {
            currentScenario.income.person1.salary = this.getInputValue('person1Salary', 0);
            currentScenario.income.person1.bonus = this.getInputValue('person1Bonus', 0);
            currentScenario.income.person1.otherIncome = this.getInputValue('person1Other', 0);
            
            if (!currentScenario.income.person1.preTexDeductions) {
                currentScenario.income.person1.preTexDeductions = {};
            }
            currentScenario.income.person1.preTexDeductions.retirement401k = this.getInputValue('person1_401k', 0);
            currentScenario.income.person1.preTexDeductions.healthInsurance = this.getInputValue('person1Health', 0);
            currentScenario.income.person1.preTexDeductions.hsa = this.getInputValue('person1HSA', 0);
        }
        
        // Save the updated scenario
        this.scenarioManager.saveScenario(this.scenarioManager.currentScenario, currentScenario);
    }

    /**
     * Get input value safely
     */
    getInputValue(inputId, defaultValue = 0) {
        const input = document.getElementById(inputId);
        if (input) {
            const value = parseFloat(input.value) || defaultValue;
            return value;
        }
        return defaultValue;
    }

    /**
     * Update calculations and visualizations
     */
    updateCalculations() {
        const currentScenario = this.scenarioManager.getCurrentScenario();
        if (!currentScenario) return;
        
        try {
            // Calculate scenario
            const calculations = this.calculator.setScenario(currentScenario);
            
            // Update visualizations
            this.visualization.updateCharts(calculations, this.currentView);
            
        } catch (error) {
            console.error('Error updating calculations:', error);
            this.showError('Error calculating financial data. Please check your inputs.');
        }
    }

    /**
     * Update income form visibility based on current view
     */
    updateIncomeFormVisibility() {
        const person1Section = document.getElementById('person1Income');
        const person2Section = document.getElementById('person2Income');
        
        if (person1Section) {
            person1Section.style.display = 
                (this.currentView === 'person1' || this.currentView === 'combined') ? 'block' : 'none';
        }
        
        if (person2Section) {
            person2Section.style.display = 
                (this.currentView === 'person2' || this.currentView === 'combined') ? 'block' : 'none';
        }
    }

    /**
     * Save current scenario
     */
    saveCurrentScenario() {
        const currentScenario = this.scenarioManager.getCurrentScenario();
        if (currentScenario) {
            this.scenarioManager.saveScenario(this.scenarioManager.currentScenario, currentScenario);
        }
    }

    /**
     * Handle scenario change callback
     */
    onScenarioChange(scenarioName, scenarioData) {
        console.log(`Switched to scenario: ${scenarioName}`);
        this.loadScenarioData(scenarioData);
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Debounce resize handler
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.visualization.resizeCharts();
        }, 250);
    }

    /**
     * Show settings modal
     */
    showSettings() {
        // Placeholder for settings modal
        alert('Settings modal not implemented yet');
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error(message);
        // You could implement a toast notification system here
        alert(message);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log(message);
        // You could implement a toast notification system here
    }

    /**
     * Export current scenario
     */
    exportScenario() {
        const scenarioName = this.scenarioManager.currentScenario;
        try {
            this.scenarioManager.exportScenario(scenarioName);
            this.showSuccess(`Scenario "${scenarioName}" exported successfully`);
        } catch (error) {
            this.showError('Failed to export scenario');
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.visualization.destroyCharts();
        this.storage.disableAutoSave();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConsciousSpendingApp();
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsciousSpendingApp;
}