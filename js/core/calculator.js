/**
 * Household Calculator
 * Core calculation engine for income, expenses, and financial planning
 */

class HouseholdCalculator {
    constructor(taxCalculator) {
        this.taxCalc = taxCalculator;
        this.currentScenario = null;
        this.calculations = {};
    }

    /**
     * Set current scenario for calculations
     */
    setScenario(scenario) {
        this.currentScenario = scenario;
        this.calculations = this.calculateScenario(scenario);
        return this.calculations;
    }

    /**
     * Calculate comprehensive scenario metrics
     */
    calculateScenario(scenario) {
        if (!scenario) return null;

        const person1Calc = this.calculatePersonIncome(scenario.income.person1, scenario);
        const person2Calc = this.calculatePersonIncome(scenario.income.person2, scenario);
        const householdExpenses = this.calculateHouseholdExpenses(scenario.expenses);
        const ramitBreakdown = this.calculateRamitBreakdown(scenario.expenses, person1Calc.netAnnual + person2Calc.netAnnual);
        
        return {
            person1: person1Calc,
            person2: person2Calc,
            household: {
                grossIncome: person1Calc.gross + person2Calc.gross,
                netIncome: person1Calc.netAnnual + person2Calc.netAnnual,
                monthlyNetIncome: (person1Calc.netAnnual + person2Calc.netAnnual) / 12,
                totalTaxes: person1Calc.totalTax + person2Calc.totalTax,
                effectiveRate: ((person1Calc.totalTax + person2Calc.totalTax) / (person1Calc.gross + person2Calc.gross)) * 100
            },
            expenses: householdExpenses,
            ramitBreakdown,
            summary: this.calculateSummaryMetrics(person1Calc, person2Calc, householdExpenses)
        };
    }

    /**
     * Calculate individual person's take-home pay
     */
    calculatePersonIncome(person, scenario) {
        if (!person) return this.getEmptyPersonCalculation();

        // Calculate gross income
        const grossIncome = (person.salary || 0) + (person.bonus || 0) + (person.otherIncome || 0);
        
        // Calculate pre-tax deductions
        const preTexDeductions = person.preTexDeductions ? 
            Object.values(person.preTexDeductions).reduce((sum, amount) => sum + (amount || 0), 0) : 0;

        // Use tax calculator for comprehensive tax calculation
        const taxResult = this.taxCalc.calculateAllTaxes(
            grossIncome,
            preTexDeductions,
            scenario.household.filingStatus,
            scenario.household.location.state
        );

        return {
            name: person.name || 'Unknown',
            gross: grossIncome,
            preTexDeductions,
            federalTax: taxResult.federalTax,
            stateTax: taxResult.stateTax,
            fica: taxResult.fica,
            totalTax: taxResult.totalTax,
            netAnnual: taxResult.netIncome,
            monthlyNet: taxResult.netIncome / 12,
            effectiveRate: taxResult.effectiveRate,
            marginalRate: taxResult.marginalRate,
            biweeklyNet: this.calculateBiweeklyPay(taxResult.netIncome, person.payFrequency)
        };
    }

    /**
     * Calculate biweekly pay based on pay frequency
     */
    calculateBiweeklyPay(annualNet, payFrequency) {
        switch (payFrequency) {
            case 'weekly':
                return annualNet / 52;
            case 'biweekly':
                return annualNet / 26;
            case 'semimonthly':
                return annualNet / 24;
            case 'monthly':
                return annualNet / 12;
            default:
                return annualNet / 26; // Default to biweekly
        }
    }

    /**
     * Calculate household expenses
     */
    calculateHouseholdExpenses(expenses) {
        const categories = expenses.ramitCategories;
        const breakdown = {
            fixedCosts: this.calculateCategoryTotal(categories.fixedCosts),
            investments: this.calculateCategoryTotal(categories.investments),
            savings: this.calculateCategoryTotal(categories.savings),
            guiltFreeSpending: this.calculateCategoryTotal(categories.guiltFreeSpending)
        };

        const total = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);

        return {
            breakdown,
            total,
            monthly: total,
            annual: total * 12
        };
    }

    /**
     * Calculate category total with person filtering
     */
    calculateCategoryTotal(category, person = null) {
        let total = 0;
        
        const processItem = (item) => {
            if (item.amount) {
                if (!person) {
                    // Calculate total for all
                    total += item.amount;
                } else if (item.assignedTo === person) {
                    // Calculate for specific person
                    total += item.amount;
                } else if (item.assignedTo === 'shared' && person) {
                    // Split shared expenses for person view
                    total += item.amount / 2;
                }
            }
        };

        const traverseCategory = (cat) => {
            for (const key in cat) {
                if (cat[key] && typeof cat[key] === 'object') {
                    if (cat[key].amount !== undefined) {
                        processItem(cat[key]);
                    } else {
                        traverseCategory(cat[key]);
                    }
                }
            }
        };

        traverseCategory(category);
        return total;
    }

    /**
     * Calculate Ramit's conscious spending breakdown
     */
    calculateRamitBreakdown(expenses, netIncome) {
        const categories = expenses.ramitCategories;
        const monthlyNet = netIncome / 12;
        
        const fixedCosts = this.calculateCategoryTotal(categories.fixedCosts);
        const investments = this.calculateCategoryTotal(categories.investments);
        const savings = this.calculateCategoryTotal(categories.savings);
        const guiltFree = this.calculateCategoryTotal(categories.guiltFreeSpending);
        
        return {
            fixedCosts: {
                amount: fixedCosts,
                percentage: monthlyNet > 0 ? (fixedCosts / monthlyNet) * 100 : 0,
                target: { min: 50, max: 60 }
            },
            investments: {
                amount: investments,
                percentage: monthlyNet > 0 ? (investments / monthlyNet) * 100 : 0,
                target: { min: 10, max: 10 }
            },
            savings: {
                amount: savings,
                percentage: monthlyNet > 0 ? (savings / monthlyNet) * 100 : 0,
                target: { min: 5, max: 10 }
            },
            guiltFreeSpending: {
                amount: guiltFree,
                percentage: monthlyNet > 0 ? (guiltFree / monthlyNet) * 100 : 0,
                target: { min: 20, max: 35 }
            }
        };
    }

    /**
     * Calculate summary metrics
     */
    calculateSummaryMetrics(person1Calc, person2Calc, householdExpenses) {
        const totalNetIncome = person1Calc.netAnnual + person2Calc.netAnnual;
        const monthlyNetIncome = totalNetIncome / 12;
        const monthlyExpenses = householdExpenses.total;
        const monthlySurplus = monthlyNetIncome - monthlyExpenses;
        const annualSurplus = monthlySurplus * 12;
        
        return {
            monthlyNetIncome,
            monthlyExpenses,
            monthlySurplus,
            annualSurplus,
            savingsRate: monthlyNetIncome > 0 ? (monthlySurplus / monthlyNetIncome) * 100 : 0,
            monthsOfExpenses: monthlySurplus > 0 ? Math.floor(monthlyNetIncome / monthlyExpenses) : 0,
            emergencyFundRatio: this.calculateEmergencyFundRatio(householdExpenses),
            debtToIncomeRatio: 0 // Placeholder - would need debt data
        };
    }

    /**
     * Calculate emergency fund metrics
     */
    calculateEmergencyFundRatio(expenses) {
        // Placeholder for emergency fund calculation
        // Would need current savings data
        const monthlyExpenses = expenses.total;
        const recommendedEmergencyFund = monthlyExpenses * 6; // 6 months of expenses
        
        return {
            recommended: recommendedEmergencyFund,
            current: 15000, // Placeholder - would come from savings data
            ratio: 15000 / recommendedEmergencyFund,
            monthsCovered: 15000 / monthlyExpenses
        };
    }

    /**
     * Calculate what-if scenarios
     */
    calculateWhatIf(baseScenario, changes) {
        // Create a copy of the scenario with changes applied
        const modifiedScenario = this.applyChanges(baseScenario, changes);
        return this.calculateScenario(modifiedScenario);
    }

    /**
     * Apply changes to scenario
     */
    applyChanges(scenario, changes) {
        const modified = JSON.parse(JSON.stringify(scenario)); // Deep copy
        
        // Apply income changes
        if (changes.income) {
            for (const person in changes.income) {
                if (modified.income[person]) {
                    Object.assign(modified.income[person], changes.income[person]);
                }
            }
        }
        
        // Apply expense changes
        if (changes.expenses) {
            this.deepMerge(modified.expenses, changes.expenses);
        }
        
        return modified;
    }

    /**
     * Calculate person-specific view
     */
    calculatePersonView(person) {
        if (!this.calculations) return null;
        
        const personCalc = this.calculations[person];
        if (!personCalc) return null;
        
        // Calculate person-specific expenses
        const personExpenses = {
            fixedCosts: this.calculateCategoryTotal(this.currentScenario.expenses.ramitCategories.fixedCosts, person),
            investments: this.calculateCategoryTotal(this.currentScenario.expenses.ramitCategories.investments, person),
            savings: this.calculateCategoryTotal(this.currentScenario.expenses.ramitCategories.savings, person),
            guiltFreeSpending: this.calculateCategoryTotal(this.currentScenario.expenses.ramitCategories.guiltFreeSpending, person)
        };
        
        const totalPersonExpenses = Object.values(personExpenses).reduce((sum, amount) => sum + amount, 0);
        const personSurplus = personCalc.monthlyNet - totalPersonExpenses;
        
        return {
            income: personCalc,
            expenses: personExpenses,
            totalExpenses: totalPersonExpenses,
            surplus: personSurplus,
            ramitBreakdown: this.calculatePersonRamitBreakdown(personExpenses, personCalc.monthlyNet)
        };
    }

    /**
     * Calculate Ramit breakdown for individual person
     */
    calculatePersonRamitBreakdown(expenses, monthlyNet) {
        return {
            fixedCosts: {
                amount: expenses.fixedCosts,
                percentage: monthlyNet > 0 ? (expenses.fixedCosts / monthlyNet) * 100 : 0
            },
            investments: {
                amount: expenses.investments,
                percentage: monthlyNet > 0 ? (expenses.investments / monthlyNet) * 100 : 0
            },
            savings: {
                amount: expenses.savings,
                percentage: monthlyNet > 0 ? (expenses.savings / monthlyNet) * 100 : 0
            },
            guiltFreeSpending: {
                amount: expenses.guiltFreeSpending,
                percentage: monthlyNet > 0 ? (expenses.guiltFreeSpending / monthlyNet) * 100 : 0
            }
        };
    }

    /**
     * Get empty person calculation structure
     */
    getEmptyPersonCalculation() {
        return {
            name: '',
            gross: 0,
            preTexDeductions: 0,
            federalTax: 0,
            stateTax: 0,
            fica: { total: 0 },
            totalTax: 0,
            netAnnual: 0,
            monthlyNet: 0,
            effectiveRate: 0,
            marginalRate: 0,
            biweeklyNet: 0
        };
    }

    /**
     * Format currency
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
     * Format percentage
     */
    formatPercentage(percentage, precision = 1) {
        return `${percentage.toFixed(precision)}%`;
    }

    /**
     * Deep merge utility
     */
    deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    this.deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HouseholdCalculator;
} else {
    window.HouseholdCalculator = HouseholdCalculator;
}