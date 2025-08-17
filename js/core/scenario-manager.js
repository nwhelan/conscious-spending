/**
 * Scenario Manager
 * Handles scenario creation, management, and switching
 */

class ScenarioManager {
    constructor(storageManager) {
        this.storage = storageManager;
        this.currentScenario = null;
        this.scenarios = {};
        this.callbacks = {
            onScenarioChange: [],
            onScenarioSave: [],
            onScenarioDelete: []
        };
        
        this.loadAllScenarios();
    }

    /**
     * Load all scenarios from storage
     */
    loadAllScenarios() {
        this.scenarios = this.storage.getAllScenarios();
        
        // If no scenarios exist, create default ones
        if (Object.keys(this.scenarios).length === 0) {
            this.createDefaultScenarios();
        }
        
        // Set current scenario to baseline if none selected
        if (!this.currentScenario && this.scenarios.baseline) {
            this.currentScenario = 'baseline';
        }
    }

    /**
     * Create default scenarios
     */
    createDefaultScenarios() {
        const defaultScenarios = {
            baseline: this.createBaselineScenario(),
            optimistic: this.createOptimisticScenario(),
            conservative: this.createConservativeScenario()
        };

        for (const [name, scenario] of Object.entries(defaultScenarios)) {
            this.saveScenario(name, scenario);
        }
    }

    /**
     * Create baseline scenario
     */
    createBaselineScenario() {
        return {
            metadata: {
                name: "Baseline 2025",
                description: "Current income and spending patterns",
                created: new Date().toISOString(),
                lastModified: new Date().toISOString()
            },
            household: {
                location: {
                    state: "CA",
                    locality: "San Francisco"
                },
                filingStatus: "marriedFilingJointly",
                members: ["person1", "person2"]
            },
            income: {
                person1: {
                    name: "Partner 1",
                    salary: 120000,
                    bonus: 15000,
                    otherIncome: 2000,
                    payFrequency: "biweekly",
                    preTexDeductions: {
                        retirement401k: 18000,
                        healthInsurance: 3600,
                        hsa: 4300
                    }
                },
                person2: {
                    name: "Partner 2",
                    salary: 85000,
                    bonus: 5000,
                    otherIncome: 0,
                    payFrequency: "monthly",
                    preTexDeductions: {
                        retirement401k: 12000,
                        healthInsurance: 0,
                        hsa: 0
                    }
                }
            },
            expenses: {
                ramitCategories: {
                    fixedCosts: {
                        housing: {
                            rent: { amount: 3500, assignedTo: "shared" },
                            utilities: { amount: 200, assignedTo: "shared" },
                            insurance: { amount: 150, assignedTo: "person1" }
                        },
                        transportation: {
                            carPayment: { amount: 450, assignedTo: "person2" },
                            carInsurance: { amount: 120, assignedTo: "person2" },
                            gasAndMaintenance: { amount: 300, assignedTo: "shared" }
                        },
                        essentials: {
                            groceries: { amount: 800, assignedTo: "shared" },
                            cellPhone: { amount: 120, assignedTo: "shared" },
                            internet: { amount: 80, assignedTo: "shared" }
                        }
                    },
                    investments: {
                        retirement: { amount: 1000, assignedTo: "shared" },
                        brokerage: { amount: 500, assignedTo: "shared" }
                    },
                    savings: {
                        emergency: { amount: 800, assignedTo: "shared" },
                        vacation: { amount: 400, assignedTo: "shared" },
                        houseDownPayment: { amount: 1000, assignedTo: "shared" }
                    },
                    guiltFreeSpending: {
                        dining: { amount: 800, assignedTo: "shared" },
                        entertainment: { amount: 300, assignedTo: "shared" },
                        hobbies: { amount: 200, assignedTo: "person1" },
                        personalShopping: { amount: 200, assignedTo: "person2" },
                        subscriptions: { amount: 150, assignedTo: "shared" }
                    }
                }
            }
        };
    }

    /**
     * Create optimistic scenario
     */
    createOptimisticScenario() {
        const baseline = this.createBaselineScenario();
        
        // Increase incomes by 20%
        baseline.income.person1.salary = 144000;
        baseline.income.person1.bonus = 20000;
        baseline.income.person2.salary = 102000;
        baseline.income.person2.bonus = 8000;
        
        // Increase retirement contributions
        baseline.income.person1.preTexDeductions.retirement401k = 23500;
        baseline.income.person2.preTexDeductions.retirement401k = 15000;
        
        // Increase investments and savings
        baseline.expenses.ramitCategories.investments.retirement.amount = 1500;
        baseline.expenses.ramitCategories.investments.brokerage.amount = 800;
        baseline.expenses.ramitCategories.savings.emergency.amount = 1000;
        baseline.expenses.ramitCategories.savings.houseDownPayment.amount = 1500;
        
        baseline.metadata.name = "Optimistic";
        baseline.metadata.description = "Higher income growth with increased savings";
        
        return baseline;
    }

    /**
     * Create conservative scenario
     */
    createConservativeScenario() {
        const baseline = this.createBaselineScenario();
        
        // Decrease incomes by 15%
        baseline.income.person1.salary = 102000;
        baseline.income.person1.bonus = 8000;
        baseline.income.person2.salary = 72250;
        baseline.income.person2.bonus = 2000;
        
        // Reduce expenses
        baseline.expenses.ramitCategories.fixedCosts.housing.rent.amount = 3000;
        baseline.expenses.ramitCategories.guiltFreeSpending.dining.amount = 600;
        baseline.expenses.ramitCategories.guiltFreeSpending.entertainment.amount = 200;
        baseline.expenses.ramitCategories.savings.vacation.amount = 200;
        
        baseline.metadata.name = "Conservative";
        baseline.metadata.description = "Reduced income with tighter spending";
        
        return baseline;
    }

    /**
     * Get current scenario
     */
    getCurrentScenario() {
        return this.scenarios[this.currentScenario];
    }

    /**
     * Set current scenario
     */
    setCurrentScenario(scenarioName) {
        if (this.scenarios[scenarioName]) {
            this.currentScenario = scenarioName;
            this.triggerCallbacks('onScenarioChange', scenarioName, this.scenarios[scenarioName]);
            return true;
        }
        return false;
    }

    /**
     * Save scenario
     */
    saveScenario(scenarioName, scenarioData) {
        // Update timestamp
        if (scenarioData.metadata) {
            scenarioData.metadata.lastModified = new Date().toISOString();
        }

        // Save to memory
        this.scenarios[scenarioName] = scenarioData;
        
        // Save to storage
        const saved = this.storage.saveScenario(scenarioName, scenarioData);
        
        if (saved) {
            this.triggerCallbacks('onScenarioSave', scenarioName, scenarioData);
        }
        
        return saved;
    }

    /**
     * Create new scenario
     */
    createNewScenario(name, description, baseScenario = 'baseline') {
        if (this.scenarios[name]) {
            throw new Error('Scenario with this name already exists');
        }

        const baseData = this.scenarios[baseScenario] || this.createBaselineScenario();
        const newScenario = JSON.parse(JSON.stringify(baseData)); // Deep copy
        
        newScenario.metadata.name = name;
        newScenario.metadata.description = description;
        newScenario.metadata.created = new Date().toISOString();
        newScenario.metadata.lastModified = new Date().toISOString();

        return this.saveScenario(name, newScenario);
    }

    /**
     * Duplicate scenario
     */
    duplicateScenario(scenarioName, newName) {
        if (!this.scenarios[scenarioName]) {
            throw new Error('Source scenario does not exist');
        }
        
        if (this.scenarios[newName]) {
            throw new Error('Scenario with new name already exists');
        }

        const sourceScenario = JSON.parse(JSON.stringify(this.scenarios[scenarioName]));
        sourceScenario.metadata.name = newName;
        sourceScenario.metadata.description = `Copy of ${sourceScenario.metadata.description}`;
        sourceScenario.metadata.created = new Date().toISOString();
        sourceScenario.metadata.lastModified = new Date().toISOString();

        return this.saveScenario(newName, sourceScenario);
    }

    /**
     * Delete scenario
     */
    deleteScenario(scenarioName) {
        if (scenarioName === 'baseline') {
            throw new Error('Cannot delete baseline scenario');
        }
        
        if (!this.scenarios[scenarioName]) {
            throw new Error('Scenario does not exist');
        }

        // Remove from memory
        delete this.scenarios[scenarioName];
        
        // Remove from storage
        const deleted = this.storage.deleteScenario(scenarioName);
        
        if (deleted) {
            // If we deleted the current scenario, switch to baseline
            if (this.currentScenario === scenarioName) {
                this.setCurrentScenario('baseline');
            }
            
            this.triggerCallbacks('onScenarioDelete', scenarioName);
        }
        
        return deleted;
    }

    /**
     * Get all scenario names
     */
    getScenarioNames() {
        return Object.keys(this.scenarios);
    }

    /**
     * Get scenario metadata
     */
    getScenarioMetadata(scenarioName) {
        return this.scenarios[scenarioName]?.metadata || null;
    }

    /**
     * Update scenario data
     */
    updateScenario(scenarioName, updatedData) {
        if (!this.scenarios[scenarioName]) {
            throw new Error('Scenario does not exist');
        }

        // Merge updated data with existing scenario
        const currentScenario = this.scenarios[scenarioName];
        const mergedScenario = this.deepMerge(currentScenario, updatedData);
        
        return this.saveScenario(scenarioName, mergedScenario);
    }

    /**
     * Compare scenarios
     */
    compareScenarios(scenario1, scenario2) {
        const calc1 = this.calculateScenarioMetrics(this.scenarios[scenario1]);
        const calc2 = this.calculateScenarioMetrics(this.scenarios[scenario2]);
        
        return {
            scenario1: { name: scenario1, metrics: calc1 },
            scenario2: { name: scenario2, metrics: calc2 },
            differences: {
                netIncome: calc2.totalNetIncome - calc1.totalNetIncome,
                expenses: calc2.totalExpenses - calc1.totalExpenses,
                surplus: calc2.monthlySurplus - calc1.monthlySurplus,
                savingsRate: calc2.savingsRate - calc1.savingsRate
            }
        };
    }

    /**
     * Calculate key metrics for a scenario
     */
    calculateScenarioMetrics(scenario) {
        // This would integrate with the calculator
        // For now, return placeholder calculations
        const person1Income = scenario.income.person1.salary + scenario.income.person1.bonus;
        const person2Income = scenario.income.person2.salary + scenario.income.person2.bonus;
        const totalGrossIncome = person1Income + person2Income;
        
        // Calculate total expenses
        const expenses = scenario.expenses.ramitCategories;
        let totalExpenses = 0;
        
        Object.values(expenses).forEach(category => {
            Object.values(category).forEach(item => {
                if (item.amount) {
                    totalExpenses += item.amount;
                }
            });
        });
        
        return {
            totalGrossIncome,
            totalNetIncome: totalGrossIncome * 0.75, // Rough estimate
            totalExpenses,
            monthlySurplus: (totalGrossIncome * 0.75) - totalExpenses,
            savingsRate: ((totalGrossIncome * 0.75 - totalExpenses) / (totalGrossIncome * 0.75)) * 100
        };
    }

    /**
     * Export scenario
     */
    exportScenario(scenarioName) {
        if (!this.scenarios[scenarioName]) {
            throw new Error('Scenario does not exist');
        }

        const scenario = this.scenarios[scenarioName];
        const dataStr = JSON.stringify(scenario, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${scenarioName}-scenario.json`;
        link.click();
        
        return true;
    }

    /**
     * Register callback
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Trigger callbacks
     */
    triggerCallbacks(event, ...args) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(...args));
        }
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, source) {
        const result = JSON.parse(JSON.stringify(target));
        
        function merge(obj1, obj2) {
            for (const key in obj2) {
                if (obj2.hasOwnProperty(key)) {
                    if (typeof obj2[key] === 'object' && obj2[key] !== null && !Array.isArray(obj2[key])) {
                        obj1[key] = obj1[key] || {};
                        merge(obj1[key], obj2[key]);
                    } else {
                        obj1[key] = obj2[key];
                    }
                }
            }
        }
        
        merge(result, source);
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScenarioManager;
} else {
    window.ScenarioManager = ScenarioManager;
}