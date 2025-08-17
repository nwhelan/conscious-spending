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

            // Populate scenario list
            this.populateScenarioList();
            
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

        // Scenario management buttons
        this.setupScenarioManagementListeners();
        
        // Projections functionality
        this.setupProjectionsListeners();
        
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
            // Person 1 inputs
            'person1Salary', 'person1Bonus', 'person1Other', 'person1PayFreq',
            'person1_401k', 'person1Health', 'person1HSA', 'person1Other401k',
            // Person 2 inputs
            'person2Salary', 'person2Bonus', 'person2Other', 'person2PayFreq',
            'person2_401k', 'person2Health', 'person2HSA', 'person2Other401k'
        ];
        
        incomeInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.handleIncomeChange());
                input.addEventListener('change', () => this.handleIncomeChange());
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                    this.saveCurrentScenario();
                });
            }
        });

        // Set up expense form listeners
        this.setupExpenseFormListeners();
    }

    /**
     * Set up expense form listeners
     */
    setupExpenseFormListeners() {
        const expenseInputs = [
            // Fixed Costs
            'rent', 'utilities', 'insurance',
            'carPayment1', 'carPayment2', 'carInsurance', 'gasAndMaintenance',
            'groceries', 'cellPhone', 'internet',
            'studentLoan1', 'studentLoan2',
            // Investments
            'additionalRetirement', 'brokerage', 'rothIRA',
            // Savings
            'emergency', 'vacation', 'houseDownPayment', 'carReplacement',
            // Guilt-Free
            'dining', 'entertainment', 'hobbies', 'personalShopping',
            'subscriptions', 'gifts', 'miscellaneous'
        ];

        const assignmentSelects = [
            // Fixed Costs
            'rentAssigned', 'utilitiesAssigned', 'insuranceAssigned',
            'carPayment1Assigned', 'carPayment2Assigned', 'carInsuranceAssigned', 'gasAndMaintenanceAssigned',
            'groceriesAssigned', 'cellPhoneAssigned', 'internetAssigned',
            'studentLoan1Assigned', 'studentLoan2Assigned',
            // Investments
            'additionalRetirementAssigned', 'brokerageAssigned', 'rothIRAAssigned',
            // Savings
            'emergencyAssigned', 'vacationAssigned', 'houseDownPaymentAssigned', 'carReplacementAssigned',
            // Guilt-Free
            'diningAssigned', 'entertainmentAssigned', 'hobbiesAssigned', 'personalShoppingAssigned',
            'subscriptionsAssigned', 'giftsAssigned', 'miscellaneousAssigned'
        ];
        
        [...expenseInputs, ...assignmentSelects].forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.handleExpenseChange());
                input.addEventListener('change', () => this.handleExpenseChange());
                input.addEventListener('blur', () => {
                    this.validateInput(input);
                    this.saveCurrentScenario();
                });
            }
        });

        // Expense action buttons
        const resetBtn = document.getElementById('resetExpensesBtn');
        const optimizeBtn = document.getElementById('optimizeExpensesBtn');
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetExpensesToDefaults());
        }
        
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => this.optimizeExpensesForRamit());
        }
    }

    /**
     * Set up projections functionality listeners
     */
    setupProjectionsListeners() {
        // What-if analysis sliders
        const whatIfSliders = [
            'salaryIncrease', 'bonusChange', 'expenseReduction', 'investmentIncrease'
        ];
        
        whatIfSliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const display = document.getElementById(sliderId + 'Value');
            
            if (slider && display) {
                slider.addEventListener('input', (e) => {
                    display.textContent = e.target.value + '%';
                    this.updateWhatIfAnalysis();
                });
            }
        });

        // Goal management
        const addGoalBtn = document.getElementById('addGoalBtn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => this.addFinancialGoal());
        }

        // Retirement calculator inputs
        const retirementInputs = [
            'currentAge', 'retirementAge', 'currentSavings', 'monthlyContribution',
            'employerMatch', 'annualReturn', 'retirementGoal'
        ];
        
        retirementInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.updateRetirementCalculation());
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
        this.setInputValue('person1PayFreq', person1.payFrequency);
        this.setInputValue('person1_401k', person1.preTexDeductions?.retirement401k);
        this.setInputValue('person1Health', person1.preTexDeductions?.healthInsurance);
        this.setInputValue('person1HSA', person1.preTexDeductions?.hsa);
        this.setInputValue('person1Other401k', person1.preTexDeductions?.other || 0);
        
        // Load person 2 income data
        const person2 = scenario.income.person2;
        this.setInputValue('person2Salary', person2.salary);
        this.setInputValue('person2Bonus', person2.bonus);
        this.setInputValue('person2Other', person2.otherIncome);
        this.setInputValue('person2PayFreq', person2.payFrequency);
        this.setInputValue('person2_401k', person2.preTexDeductions?.retirement401k);
        this.setInputValue('person2Health', person2.preTexDeductions?.healthInsurance);
        this.setInputValue('person2HSA', person2.preTexDeductions?.hsa);
        this.setInputValue('person2Other401k', person2.preTexDeductions?.other || 0);

        // Load expense data
        this.loadExpenseData(scenario.expenses);
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
            currentScenario.income.person1.payFrequency = this.getInputValue('person1PayFreq', 'biweekly');
            
            if (!currentScenario.income.person1.preTexDeductions) {
                currentScenario.income.person1.preTexDeductions = {};
            }
            currentScenario.income.person1.preTexDeductions.retirement401k = this.getInputValue('person1_401k', 0);
            currentScenario.income.person1.preTexDeductions.healthInsurance = this.getInputValue('person1Health', 0);
            currentScenario.income.person1.preTexDeductions.hsa = this.getInputValue('person1HSA', 0);
            currentScenario.income.person1.preTexDeductions.other = this.getInputValue('person1Other401k', 0);
        }
        
        // Update person 2 data
        if (currentScenario.income.person2) {
            currentScenario.income.person2.salary = this.getInputValue('person2Salary', 0);
            currentScenario.income.person2.bonus = this.getInputValue('person2Bonus', 0);
            currentScenario.income.person2.otherIncome = this.getInputValue('person2Other', 0);
            currentScenario.income.person2.payFrequency = this.getInputValue('person2PayFreq', 'monthly');
            
            if (!currentScenario.income.person2.preTexDeductions) {
                currentScenario.income.person2.preTexDeductions = {};
            }
            currentScenario.income.person2.preTexDeductions.retirement401k = this.getInputValue('person2_401k', 0);
            currentScenario.income.person2.preTexDeductions.healthInsurance = this.getInputValue('person2Health', 0);
            currentScenario.income.person2.preTexDeductions.hsa = this.getInputValue('person2HSA', 0);
            currentScenario.income.person2.preTexDeductions.other = this.getInputValue('person2Other401k', 0);
        }
        
        // Update expense data
        this.updateExpenseDataFromForm(currentScenario);
        
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
            
            // Update all UI components
            this.updateIncomeDisplays(calculations);
            this.updateExpenseSummaries();
            this.updateDashboardStats(calculations);
            this.updateRamitBreakdownDisplay(calculations);
            this.updateProjectionSummary();
            
            // Update visualizations
            this.visualization.updateCharts(calculations, this.currentView);
            
        } catch (error) {
            console.error('Error updating calculations:', error);
            this.showError('Error calculating financial data. Please check your inputs.');
        }
    }

    /**
     * Update income displays with calculated values
     */
    updateIncomeDisplays(calculations) {
        if (!calculations) return;

        // Update person 1 displays
        if (calculations.person1) {
            this.updateElement('person1GrossIncome', this.formatCurrency(calculations.person1.gross));
            this.updateElement('person1NetIncome', this.formatCurrency(calculations.person1.netAnnual));
        }

        // Update person 2 displays
        if (calculations.person2) {
            this.updateElement('person2GrossIncome', this.formatCurrency(calculations.person2.gross));
            this.updateElement('person2NetIncome', this.formatCurrency(calculations.person2.netAnnual));
        }

        // Update household summary
        if (calculations.household) {
            this.updateElement('totalGrossIncome', this.formatCurrency(calculations.household.grossIncome));
            this.updateElement('totalPreTaxDeductions', this.formatCurrency(
                (calculations.person1.preTexDeductions || 0) + (calculations.person2.preTexDeductions || 0)
            ));
            this.updateElement('totalFederalTax', this.formatCurrency(
                (calculations.person1.federalTax || 0) + (calculations.person2.federalTax || 0)
            ));
            this.updateElement('totalStateTax', this.formatCurrency(
                (calculations.person1.stateTax || 0) + (calculations.person2.stateTax || 0)
            ));
            this.updateElement('totalFICA', this.formatCurrency(
                (calculations.person1.fica?.total || 0) + (calculations.person2.fica?.total || 0)
            ));
            this.updateElement('totalNetIncome', this.formatCurrency(calculations.household.netIncome));
            this.updateElement('effectiveTaxRate', calculations.household.effectiveRate.toFixed(1) + '%');
        }
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats(calculations) {
        if (!calculations || !calculations.summary) return;

        const summary = calculations.summary;
        
        this.updateElement('monthlyNetIncome', this.formatCurrency(summary.monthlyNetIncome));
        this.updateElement('monthlyExpenses', this.formatCurrency(summary.monthlyExpenses));
        this.updateElement('monthlySurplus', this.formatCurrency(summary.monthlySurplus));
        this.updateElement('savingsRate', summary.savingsRate.toFixed(1) + '%');

        // Update color coding based on values
        this.updateStatElementColor('monthlySurplus', summary.monthlySurplus);
        this.updateStatElementColor('savingsRate', summary.savingsRate, true);
    }

    /**
     * Update Ramit breakdown display
     */
    updateRamitBreakdownDisplay(calculations) {
        if (!calculations || !calculations.ramitBreakdown) return;

        const ramit = calculations.ramitBreakdown;
        
        // Update the dashboard Ramit bars
        this.updateCategoryBar('fixedCosts', ramit.fixedCosts);
        this.updateCategoryBar('investments', ramit.investments);
        this.updateCategoryBar('savings', ramit.savings);
        this.updateCategoryBar('guiltFreeSpending', ramit.guiltFreeSpending);
    }

    /**
     * Update category bar (from visualization component)
     */
    updateCategoryBar(categoryName, categoryData) {
        const bar = document.getElementById(`${categoryName}Bar`);
        const value = document.getElementById(`${categoryName}Value`);
        
        if (bar && value && categoryData) {
            const percentage = Math.min(categoryData.percentage || 0, 100);
            bar.style.width = `${percentage}%`;
            value.textContent = `${percentage.toFixed(1)}%`;
            
            // Color coding based on target ranges
            if (this.isWithinTarget(categoryData)) {
                bar.style.backgroundColor = 'var(--primary-green)';
            } else if (percentage > (categoryData.target?.max || 100)) {
                bar.style.backgroundColor = 'var(--primary-red)';
            } else {
                bar.style.backgroundColor = 'var(--primary-yellow)';
            }
        }
    }

    /**
     * Check if category is within target range
     */
    isWithinTarget(categoryData) {
        if (!categoryData.target) return true;
        const percentage = categoryData.percentage || 0;
        return percentage >= categoryData.target.min && percentage <= categoryData.target.max;
    }

    /**
     * Update stat element with color coding
     */
    updateStatElementColor(elementId, value, isPercentage = false) {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Remove existing color classes
        element.classList.remove('positive', 'negative', 'neutral');

        if (isPercentage) {
            // For savings rate
            if (value >= 20) element.classList.add('positive');
            else if (value >= 10) element.classList.add('neutral');
            else element.classList.add('negative');
        } else {
            // For surplus
            if (value >= 0) element.classList.add('positive');
            else element.classList.add('negative');
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
     * Setup scenario management listeners
     */
    setupScenarioManagementListeners() {
        // Export scenario button
        const exportBtn = document.getElementById('exportScenarioBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCurrentScenario());
        }

        // Import scenario button
        const importBtn = document.getElementById('importScenarioBtn');
        const importInput = document.getElementById('importFileInput');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', (e) => this.handleScenarioImport(e));
        }

        // Create scenario button
        const createBtn = document.getElementById('createScenarioBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateScenarioModal());
        }

        // Modal event listeners
        this.setupModalListeners();
    }

    /**
     * Setup modal event listeners
     */
    setupModalListeners() {
        // Create scenario modal
        const createModal = document.getElementById('createScenarioModal');
        const closeCreateBtn = document.getElementById('closeCreateModal');
        const cancelCreateBtn = document.getElementById('cancelCreateBtn');
        const createForm = document.getElementById('createScenarioForm');

        if (closeCreateBtn) closeCreateBtn.addEventListener('click', () => this.hideModal('createScenarioModal'));
        if (cancelCreateBtn) cancelCreateBtn.addEventListener('click', () => this.hideModal('createScenarioModal'));
        if (createForm) createForm.addEventListener('submit', (e) => this.handleCreateScenario(e));

        // Settings modal
        const settingsModal = document.getElementById('settingsModal');
        const closeSettingsBtn = document.getElementById('closeSettingsModal');
        const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');

        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => this.hideModal('settingsModal'));
        if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', () => this.hideModal('settingsModal'));
        if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', () => this.handleSaveSettings());

        // Close modals when clicking outside
        [createModal, settingsModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideModal(modal.id);
                    }
                });
            }
        });
    }

    /**
     * Export current scenario
     */
    exportCurrentScenario() {
        // Validate inputs before export
        if (!this.validateAllInputs()) {
            this.showError('Please fix validation errors before exporting');
            return;
        }

        try {
            const scenarioName = this.scenarioManager.currentScenario;
            this.scenarioManager.exportScenario(scenarioName);
            this.showSuccess(`Scenario "${scenarioName}" exported successfully`);
        } catch (error) {
            this.showError('Failed to export scenario: ' + error.message);
        }
    }

    /**
     * Handle scenario import
     */
    async handleScenarioImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const scenarios = await this.storage.importScenarios(file);
            this.scenarioManager.loadAllScenarios();
            this.populateScenarioSelector();
            this.populateScenarioList();
            this.showSuccess(`Imported ${scenarios.length} scenario(s) successfully`);
        } catch (error) {
            this.showError('Failed to import scenario: ' + error.message);
        }

        // Reset file input
        event.target.value = '';
    }

    /**
     * Show create scenario modal
     */
    showCreateScenarioModal() {
        // Populate base scenario options
        const baseSelect = document.getElementById('baseScenario');
        if (baseSelect) {
            baseSelect.innerHTML = '';
            this.scenarioManager.getScenarioNames().forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = this.scenarioManager.getScenarioMetadata(name)?.name || name;
                baseSelect.appendChild(option);
            });
        }

        this.showModal('createScenarioModal');
    }

    /**
     * Handle create scenario form submission
     */
    handleCreateScenario(event) {
        event.preventDefault();
        
        const name = document.getElementById('newScenarioName').value.trim();
        const description = document.getElementById('newScenarioDescription').value.trim();
        const baseScenario = document.getElementById('baseScenario').value;

        if (!name) {
            this.showError('Please enter a scenario name');
            return;
        }

        try {
            const success = this.scenarioManager.createNewScenario(name, description, baseScenario);
            if (success) {
                this.hideModal('createScenarioModal');
                this.populateScenarioSelector();
                this.populateScenarioList();
                this.scenarioManager.setCurrentScenario(name);
                this.showSuccess(`Created scenario "${name}" successfully`);
                
                // Clear form
                document.getElementById('createScenarioForm').reset();
            }
        } catch (error) {
            this.showError('Failed to create scenario: ' + error.message);
        }
    }

    /**
     * Populate scenario list in scenarios tab
     */
    populateScenarioList() {
        const scenarioList = document.getElementById('scenarioList');
        if (!scenarioList) return;

        scenarioList.innerHTML = '';

        this.scenarioManager.getScenarioNames().forEach(scenarioName => {
            const metadata = this.scenarioManager.getScenarioMetadata(scenarioName);
            const scenarioItem = document.createElement('div');
            scenarioItem.className = 'scenario-item';
            
            scenarioItem.innerHTML = `
                <h4>${metadata.name}</h4>
                <p>${metadata.description}</p>
                <div class="scenario-actions">
                    <button class="btn-small" onclick="app.editScenario('${scenarioName}')">Edit</button>
                    <button class="btn-small" onclick="app.duplicateScenario('${scenarioName}')">Duplicate</button>
                    ${scenarioName !== 'baseline' ? `<button class="btn-small" onclick="app.deleteScenario('${scenarioName}')">Delete</button>` : ''}
                </div>
            `;
            
            scenarioList.appendChild(scenarioItem);
        });
    }

    /**
     * Edit scenario (switch to it)
     */
    editScenario(scenarioName) {
        this.scenarioManager.setCurrentScenario(scenarioName);
        this.setTab('income'); // Switch to income tab for editing
        this.showSuccess(`Now editing scenario: ${scenarioName}`);
    }

    /**
     * Duplicate scenario
     */
    duplicateScenario(scenarioName) {
        const newName = prompt(`Enter name for duplicate of "${scenarioName}":`);
        if (!newName || newName.trim() === '') return;

        try {
            this.scenarioManager.duplicateScenario(scenarioName, newName.trim());
            this.populateScenarioSelector();
            this.populateScenarioList();
            this.showSuccess(`Duplicated scenario as "${newName}"`);
        } catch (error) {
            this.showError('Failed to duplicate scenario: ' + error.message);
        }
    }

    /**
     * Delete scenario
     */
    deleteScenario(scenarioName) {
        if (confirm(`Are you sure you want to delete scenario "${scenarioName}"? This cannot be undone.`)) {
            try {
                this.scenarioManager.deleteScenario(scenarioName);
                this.populateScenarioSelector();
                this.populateScenarioList();
                this.showSuccess(`Deleted scenario "${scenarioName}"`);
            } catch (error) {
                this.showError('Failed to delete scenario: ' + error.message);
            }
        }
    }

    /**
     * Show modal
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.classList.add('fade-in');
        }
    }

    /**
     * Hide modal
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('fade-in');
        }
    }

    /**
     * Show settings modal
     */
    showSettings() {
        // Load current settings
        const settings = this.storage.loadSettings();
        
        this.setInputValue('settingsState', settings.defaultState || 'CA');
        this.setInputValue('settingsFilingStatus', settings.defaultFilingStatus || 'marriedFilingJointly');
        this.setInputValue('settingsTheme', settings.theme || 'light');
        this.setInputValue('settingsDefaultView', settings.defaultView || 'combined');
        
        const autoSaveCheckbox = document.getElementById('settingsAutoSave');
        if (autoSaveCheckbox) {
            autoSaveCheckbox.checked = settings.autoSave !== false;
        }

        this.showModal('settingsModal');
    }

    /**
     * Handle save settings
     */
    handleSaveSettings() {
        const settings = {
            defaultState: this.getInputValue('settingsState', 'CA'),
            defaultFilingStatus: this.getInputValue('settingsFilingStatus', 'marriedFilingJointly'),
            theme: this.getInputValue('settingsTheme', 'light'),
            defaultView: this.getInputValue('settingsDefaultView', 'combined'),
            autoSave: document.getElementById('settingsAutoSave')?.checked !== false,
            showTooltips: true,
            currency: 'USD'
        };

        this.storage.saveSettings(settings);
        this.hideModal('settingsModal');
        this.showSuccess('Settings saved successfully');

        // Apply theme if changed
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
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
     * Load expense data into forms
     */
    loadExpenseData(expenses) {
        if (!expenses || !expenses.ramitCategories) return;

        const categories = expenses.ramitCategories;
        
        // Helper function to load category items
        const loadCategory = (category, mapping) => {
            if (!category) return;
            
            Object.keys(category).forEach(subcategoryKey => {
                const subcategory = category[subcategoryKey];
                if (subcategory && typeof subcategory === 'object') {
                    Object.keys(subcategory).forEach(itemKey => {
                        const item = subcategory[itemKey];
                        if (item && item.amount !== undefined) {
                            const mappedKey = mapping[itemKey] || itemKey;
                            this.setInputValue(mappedKey, item.amount);
                            this.setInputValue(mappedKey + 'Assigned', item.assignedTo || 'shared');
                        }
                    });
                }
            });
        };

        // Load each category with field mappings
        const fixedCostsMapping = {
            rent: 'rent',
            utilities: 'utilities',
            rentersInsurance: 'insurance',
            carPayment1: 'carPayment1',
            carPayment2: 'carPayment2',
            carInsurance: 'carInsurance',
            gasAndMaintenance: 'gasAndMaintenance',
            groceries: 'groceries',
            cellPhone: 'cellPhone',
            internet: 'internet',
            studentLoan1: 'studentLoan1',
            studentLoan2: 'studentLoan2'
        };

        loadCategory(categories.fixedCosts, fixedCostsMapping);
        
        // Load investments
        if (categories.investments) {
            this.setInputValue('additionalRetirement', categories.investments.retirement?.amount || 0);
            this.setInputValue('additionalRetirementAssigned', categories.investments.retirement?.assignedTo || 'shared');
            this.setInputValue('brokerage', categories.investments.brokerage?.amount || 0);
            this.setInputValue('brokerageAssigned', categories.investments.brokerage?.assignedTo || 'shared');
            this.setInputValue('rothIRA', categories.investments.rothIRA?.amount || 0);
            this.setInputValue('rothIRAAssigned', categories.investments.rothIRA?.assignedTo || 'shared');
        }

        // Load savings
        if (categories.savings) {
            this.setInputValue('emergency', categories.savings.emergency?.amount || 0);
            this.setInputValue('emergencyAssigned', categories.savings.emergency?.assignedTo || 'shared');
            this.setInputValue('vacation', categories.savings.vacation?.amount || 0);
            this.setInputValue('vacationAssigned', categories.savings.vacation?.assignedTo || 'shared');
            this.setInputValue('houseDownPayment', categories.savings.houseDownPayment?.amount || 0);
            this.setInputValue('houseDownPaymentAssigned', categories.savings.houseDownPayment?.assignedTo || 'shared');
            this.setInputValue('carReplacement', categories.savings.carReplacement?.amount || 0);
            this.setInputValue('carReplacementAssigned', categories.savings.carReplacement?.assignedTo || 'shared');
        }

        // Load guilt-free spending
        if (categories.guiltFreeSpending) {
            this.setInputValue('dining', categories.guiltFreeSpending.dining?.amount || 0);
            this.setInputValue('diningAssigned', categories.guiltFreeSpending.dining?.assignedTo || 'shared');
            this.setInputValue('entertainment', categories.guiltFreeSpending.entertainment?.amount || 0);
            this.setInputValue('entertainmentAssigned', categories.guiltFreeSpending.entertainment?.assignedTo || 'shared');
            this.setInputValue('hobbies', categories.guiltFreeSpending.hobbies?.amount || 0);
            this.setInputValue('hobbiesAssigned', categories.guiltFreeSpending.hobbies?.assignedTo || 'person1');
            this.setInputValue('personalShopping', categories.guiltFreeSpending.personalShopping?.amount || 0);
            this.setInputValue('personalShoppingAssigned', categories.guiltFreeSpending.personalShopping?.assignedTo || 'person2');
            this.setInputValue('subscriptions', categories.guiltFreeSpending.subscriptions?.amount || 0);
            this.setInputValue('subscriptionsAssigned', categories.guiltFreeSpending.subscriptions?.assignedTo || 'shared');
            this.setInputValue('gifts', categories.guiltFreeSpending.gifts?.amount || 0);
            this.setInputValue('giftsAssigned', categories.guiltFreeSpending.gifts?.assignedTo || 'shared');
            this.setInputValue('miscellaneous', categories.guiltFreeSpending.miscellaneous?.amount || 0);
            this.setInputValue('miscellaneousAssigned', categories.guiltFreeSpending.miscellaneous?.assignedTo || 'shared');
        }
    }

    /**
     * Handle expense form changes
     */
    handleExpenseChange() {
        if (!this.isInitialized) return;
        
        // Debounce the calculation update
        clearTimeout(this.expenseChangeTimeout);
        this.expenseChangeTimeout = setTimeout(() => {
            this.updateScenarioFromForm();
            this.updateCalculations();
            this.updateExpenseSummaries();
        }, 300);
    }

    /**
     * Update expense data from form
     */
    updateExpenseDataFromForm(scenario) {
        if (!scenario.expenses) scenario.expenses = { ramitCategories: {} };
        
        const categories = scenario.expenses.ramitCategories;
        
        // Helper function to update category
        const updateExpenseItem = (categoryPath, itemKey, inputId, assignedId) => {
            const pathParts = categoryPath.split('.');
            let category = categories;
            
            // Navigate to the correct category
            pathParts.forEach(part => {
                if (!category[part]) category[part] = {};
                category = category[part];
            });
            
            if (!category[itemKey]) category[itemKey] = {};
            category[itemKey].amount = this.getInputValue(inputId, 0);
            category[itemKey].assignedTo = this.getInputValue(assignedId, 'shared');
        };

        // Update fixed costs
        updateExpenseItem('fixedCosts.housing', 'rent', 'rent', 'rentAssigned');
        updateExpenseItem('fixedCosts.housing', 'utilities', 'utilities', 'utilitiesAssigned');
        updateExpenseItem('fixedCosts.housing', 'rentersInsurance', 'insurance', 'insuranceAssigned');
        
        updateExpenseItem('fixedCosts.transportation', 'carPayment1', 'carPayment1', 'carPayment1Assigned');
        updateExpenseItem('fixedCosts.transportation', 'carPayment2', 'carPayment2', 'carPayment2Assigned');
        updateExpenseItem('fixedCosts.transportation', 'carInsurance', 'carInsurance', 'carInsuranceAssigned');
        updateExpenseItem('fixedCosts.transportation', 'gasAndMaintenance', 'gasAndMaintenance', 'gasAndMaintenanceAssigned');
        
        updateExpenseItem('fixedCosts.essentials', 'groceries', 'groceries', 'groceriesAssigned');
        updateExpenseItem('fixedCosts.essentials', 'cellPhone', 'cellPhone', 'cellPhoneAssigned');
        updateExpenseItem('fixedCosts.essentials', 'internet', 'internet', 'internetAssigned');
        
        updateExpenseItem('fixedCosts.debt', 'studentLoan1', 'studentLoan1', 'studentLoan1Assigned');
        updateExpenseItem('fixedCosts.debt', 'studentLoan2', 'studentLoan2', 'studentLoan2Assigned');

        // Update investments
        updateExpenseItem('investments', 'retirement', 'additionalRetirement', 'additionalRetirementAssigned');
        updateExpenseItem('investments', 'brokerage', 'brokerage', 'brokerageAssigned');
        updateExpenseItem('investments', 'rothIRA', 'rothIRA', 'rothIRAAssigned');

        // Update savings
        updateExpenseItem('savings', 'emergency', 'emergency', 'emergencyAssigned');
        updateExpenseItem('savings', 'vacation', 'vacation', 'vacationAssigned');
        updateExpenseItem('savings', 'houseDownPayment', 'houseDownPayment', 'houseDownPaymentAssigned');
        updateExpenseItem('savings', 'carReplacement', 'carReplacement', 'carReplacementAssigned');

        // Update guilt-free spending
        updateExpenseItem('guiltFreeSpending', 'dining', 'dining', 'diningAssigned');
        updateExpenseItem('guiltFreeSpending', 'entertainment', 'entertainment', 'entertainmentAssigned');
        updateExpenseItem('guiltFreeSpending', 'hobbies', 'hobbies', 'hobbiesAssigned');
        updateExpenseItem('guiltFreeSpending', 'personalShopping', 'personalShopping', 'personalShoppingAssigned');
        updateExpenseItem('guiltFreeSpending', 'subscriptions', 'subscriptions', 'subscriptionsAssigned');
        updateExpenseItem('guiltFreeSpending', 'gifts', 'gifts', 'giftsAssigned');
        updateExpenseItem('guiltFreeSpending', 'miscellaneous', 'miscellaneous', 'miscellaneousAssigned');
    }

    /**
     * Update expense summaries in real-time
     */
    updateExpenseSummaries() {
        const calculations = this.calculator.calculations;
        if (!calculations) return;

        const ramitBreakdown = calculations.ramitBreakdown;
        if (!ramitBreakdown) return;

        // Update category totals and percentages
        this.updateElement('fixedCostsTotal', this.formatCurrency(ramitBreakdown.fixedCosts.amount));
        this.updateElement('fixedCostsPercentage', ramitBreakdown.fixedCosts.percentage.toFixed(1) + '%');
        
        this.updateElement('investmentsTotal', this.formatCurrency(ramitBreakdown.investments.amount));
        this.updateElement('investmentsPercentage', ramitBreakdown.investments.percentage.toFixed(1) + '%');
        
        this.updateElement('savingsTotal', this.formatCurrency(ramitBreakdown.savings.amount));
        this.updateElement('savingsPercentage', ramitBreakdown.savings.percentage.toFixed(1) + '%');
        
        this.updateElement('guiltFreeTotal', this.formatCurrency(ramitBreakdown.guiltFreeSpending.amount));
        this.updateElement('guiltFreePercentage', ramitBreakdown.guiltFreeSpending.percentage.toFixed(1) + '%');

        // Update summary totals
        const totalExpenses = calculations.expenses.total;
        this.updateElement('totalMonthlyExpenses', this.formatCurrency(totalExpenses));
        this.updateElement('fixedCostsSummary', this.formatCurrency(ramitBreakdown.fixedCosts.amount));
        this.updateElement('investmentsSummary', this.formatCurrency(ramitBreakdown.investments.amount));
        this.updateElement('savingsSummary', this.formatCurrency(ramitBreakdown.savings.amount));
        this.updateElement('guiltFreeSummary', this.formatCurrency(ramitBreakdown.guiltFreeSpending.amount));
    }

    /**
     * Reset expenses to defaults
     */
    resetExpensesToDefaults() {
        if (confirm('Reset all expenses to default values? This will overwrite your current expense settings.')) {
            const baselineScenario = this.scenarioManager.scenarios.baseline;
            if (baselineScenario) {
                this.loadExpenseData(baselineScenario.expenses);
                this.handleExpenseChange();
            }
        }
    }

    /**
     * Optimize expenses for Ramit's plan
     */
    optimizeExpensesForRamit() {
        const calculations = this.calculator.calculations;
        if (!calculations) return;

        const monthlyNet = calculations.household.monthlyNetIncome;
        const targetFixed = monthlyNet * 0.55; // 55% target for fixed costs
        const targetInvestments = monthlyNet * 0.10; // 10% for investments
        const targetSavings = monthlyNet * 0.075; // 7.5% for savings
        const targetGuiltFree = monthlyNet * 0.275; // 27.5% for guilt-free

        if (confirm(`Optimize expenses for Ramit's Conscious Spending Plan?
        
Target allocations based on your ${this.formatCurrency(monthlyNet)} monthly net income:
• Fixed Costs: ${this.formatCurrency(targetFixed)} (55%)
• Investments: ${this.formatCurrency(targetInvestments)} (10%)
• Savings: ${this.formatCurrency(targetSavings)} (7.5%)
• Guilt-Free: ${this.formatCurrency(targetGuiltFree)} (27.5%)

This will adjust your current expense amounts.`)) {
            
            // This is a simplified optimization - in a real app you'd want more sophisticated logic
            this.showSuccess('Expense optimization feature coming soon! For now, manually adjust your expenses to match the target percentages.');
        }
    }

    /**
     * Update element safely
     */
    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Format currency utility
     */
    formatCurrency(amount, precision = 0) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: precision,
            maximumFractionDigits: precision
        }).format(amount);
    }

    /**
     * Validate form input
     */
    validateInput(input) {
        if (!input) return true;

        const value = input.value;
        const fieldName = input.id;
        let isValid = true;
        let errorMessage = '';

        // Clear previous error state
        this.clearInputError(input);

        // Skip validation for select elements
        if (input.tagName === 'SELECT') return true;

        // Number validation for numeric inputs
        if (input.type === 'number' || input.dataset.type === 'currency') {
            const numValue = parseFloat(value);
            
            if (value !== '' && (isNaN(numValue) || numValue < 0)) {
                isValid = false;
                errorMessage = 'Please enter a valid positive number';
            }
            
            // Specific range validations
            if (fieldName.includes('PayFreq') && numValue > 52) {
                isValid = false;
                errorMessage = 'Pay frequency cannot exceed 52 (weekly)';
            }
            
            if (fieldName.includes('401k') && numValue > 70000) {
                isValid = false;
                errorMessage = '401k contribution exceeds annual limit';
            }
            
            if (fieldName.includes('HSA') && numValue > 4300) {
                isValid = false;
                errorMessage = 'HSA contribution exceeds annual limit';
            }
        }

        // Age validation for retirement calculator
        if (fieldName === 'currentAge' || fieldName === 'retirementAge') {
            const age = parseInt(value);
            if (age < 18 || age > 100) {
                isValid = false;
                errorMessage = 'Please enter a valid age between 18 and 100';
            }
        }

        if (fieldName === 'retirementAge') {
            const currentAge = parseInt(document.getElementById('currentAge')?.value || 0);
            const retirementAge = parseInt(value);
            if (retirementAge <= currentAge) {
                isValid = false;
                errorMessage = 'Retirement age must be greater than current age';
            }
        }

        // Return validation for return rate inputs
        if (fieldName === 'annualReturn') {
            const returnRate = parseFloat(value);
            if (returnRate < 0 || returnRate > 30) {
                isValid = false;
                errorMessage = 'Annual return should be between 0% and 30%';
            }
        }

        if (!isValid) {
            this.showInputError(input, errorMessage);
            return false;
        }

        return true;
    }

    /**
     * Show input validation error
     */
    showInputError(input, message) {
        input.classList.add('error');
        
        // Remove existing error message
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    /**
     * Clear input validation error
     */
    clearInputError(input) {
        input.classList.remove('error');
        const errorMessage = input.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    /**
     * Validate all form inputs
     */
    validateAllInputs() {
        const inputs = document.querySelectorAll('input[type="number"], input[data-type="currency"]');
        let allValid = true;
        
        inputs.forEach(input => {
            if (!this.validateInput(input)) {
                allValid = false;
            }
        });
        
        return allValid;
    }

    /**
     * Update what-if analysis calculations
     */
    updateWhatIfAnalysis() {
        const currentScenario = this.scenarioManager.getCurrentScenario();
        if (!currentScenario) return;

        // Get slider values
        const salaryIncrease = parseInt(document.getElementById('salaryIncrease')?.value || 0);
        const bonusChange = parseInt(document.getElementById('bonusChange')?.value || 0);
        const expenseReduction = parseInt(document.getElementById('expenseReduction')?.value || 0);
        const investmentIncrease = parseInt(document.getElementById('investmentIncrease')?.value || 0);

        // Calculate what-if scenario
        const baseCalculations = this.calculator.setScenario(currentScenario);
        const baseNetIncome = baseCalculations.household.netIncome;
        const baseExpenses = baseCalculations.expenses.total;
        const baseSurplus = baseNetIncome - baseExpenses;

        // Apply changes
        const newNetIncome = baseNetIncome * (1 + salaryIncrease / 100);
        const newExpenses = baseExpenses * (1 - expenseReduction / 100);
        const newSurplus = newNetIncome - newExpenses;

        // Update display
        this.updateElement('whatIfBefore', this.formatCurrency(baseSurplus));
        this.updateElement('whatIfAfter', this.formatCurrency(newSurplus));
        this.updateElement('whatIfDifference', this.formatCurrency(newSurplus - baseSurplus));
    }

    /**
     * Add a new financial goal
     */
    addFinancialGoal() {
        const goalName = prompt('Enter goal name:');
        const goalAmount = parseFloat(prompt('Enter target amount:'));
        const timeframe = parseInt(prompt('Enter timeframe (months):'));

        if (goalName && goalAmount && timeframe) {
            const goal = {
                name: goalName,
                targetAmount: goalAmount,
                currentAmount: 0,
                timeframe: timeframe,
                monthlyTarget: goalAmount / timeframe
            };

            // Add to current scenario (this would need proper storage implementation)
            console.log('Added goal:', goal);
            this.updateProjectionSummary();
        }
    }

    /**
     * Update retirement calculation
     */
    updateRetirementCalculation() {
        const currentAge = parseInt(document.getElementById('currentAge')?.value || 30);
        const retirementAge = parseInt(document.getElementById('retirementAge')?.value || 65);
        const currentSavings = parseFloat(document.getElementById('currentSavings')?.value || 0);
        const monthlyContribution = parseFloat(document.getElementById('monthlyContribution')?.value || 0);
        const annualReturn = parseFloat(document.getElementById('annualReturn')?.value || 7) / 100;
        const retirementGoal = parseFloat(document.getElementById('retirementGoal')?.value || 1000000);

        const yearsToRetirement = retirementAge - currentAge;
        const monthlyReturn = annualReturn / 12;
        const totalMonths = yearsToRetirement * 12;

        // Future value calculation
        const futureValueCurrentSavings = currentSavings * Math.pow(1 + annualReturn, yearsToRetirement);
        const futureValueContributions = monthlyContribution * 
            ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
        
        const totalProjected = futureValueCurrentSavings + futureValueContributions;

        // Update display
        this.updateElement('retirementProjection', this.formatCurrency(totalProjected));
        this.updateElement('retirementStatus', 
            totalProjected >= retirementGoal ? 'On Track' : 'Need More');
        
        const monthlyNeeded = Math.max(0, 
            ((retirementGoal - futureValueCurrentSavings) * monthlyReturn) / 
            (Math.pow(1 + monthlyReturn, totalMonths) - 1)
        );
        this.updateElement('monthlyNeeded', this.formatCurrency(monthlyNeeded));
    }

    /**
     * Update projection summary with current data
     */
    updateProjectionSummary() {
        const calculations = this.calculator.calculations;
        if (!calculations) return;

        const monthlyNet = calculations.household.monthlyNetIncome;
        const monthlyExpenses = calculations.expenses.total;
        const monthlySurplus = monthlyNet - monthlyExpenses;

        // Update 12-month projections
        this.updateElement('projectedIncome', this.formatCurrency(monthlyNet * 12));
        this.updateElement('projectedExpenses', this.formatCurrency(monthlyExpenses * 12));
        this.updateElement('projectedSurplus', this.formatCurrency(monthlySurplus * 12));
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