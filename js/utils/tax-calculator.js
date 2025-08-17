/**
 * Tax Calculator Utility - 2025 Tax Rates
 * Handles federal and state tax calculations with current brackets
 */

class TaxCalculator {
    constructor() {
        // 2025 Federal Tax Brackets (single filing status)
        this.federalBrackets = {
            single: [
                { min: 0, max: 11550, rate: 0.10 },
                { min: 11550, max: 46650, rate: 0.12 },
                { min: 46650, max: 100525, rate: 0.22 },
                { min: 100525, max: 191950, rate: 0.24 },
                { min: 191950, max: 243725, rate: 0.32 },
                { min: 243725, max: 609350, rate: 0.35 },
                { min: 609350, max: Infinity, rate: 0.37 }
            ],
            marriedFilingJointly: [
                { min: 0, max: 23100, rate: 0.10 },
                { min: 23100, max: 93300, rate: 0.12 },
                { min: 93300, max: 201050, rate: 0.22 },
                { min: 201050, max: 383900, rate: 0.24 },
                { min: 383900, max: 487450, rate: 0.32 },
                { min: 487450, max: 731200, rate: 0.35 },
                { min: 731200, max: Infinity, rate: 0.37 }
            ],
            marriedFilingSeparately: [
                { min: 0, max: 11550, rate: 0.10 },
                { min: 11550, max: 46650, rate: 0.12 },
                { min: 46650, max: 100525, rate: 0.22 },
                { min: 100525, max: 191950, rate: 0.24 },
                { min: 191950, max: 243725, rate: 0.32 },
                { min: 243725, max: 365600, rate: 0.35 },
                { min: 365600, max: Infinity, rate: 0.37 }
            ],
            headOfHousehold: [
                { min: 0, max: 16550, rate: 0.10 },
                { min: 16550, max: 63100, rate: 0.12 },
                { min: 63100, max: 100500, rate: 0.22 },
                { min: 100500, max: 191950, rate: 0.24 },
                { min: 191950, max: 243700, rate: 0.32 },
                { min: 243700, max: 609350, rate: 0.35 },
                { min: 609350, max: Infinity, rate: 0.37 }
            ]
        };

        // 2025 Standard Deductions
        this.standardDeductions = {
            single: 15000,
            marriedFilingJointly: 30000,
            marriedFilingSeparately: 15000,
            headOfHousehold: 22500
        };

        // 2025 FICA Tax Rates
        this.ficaRates = {
            socialSecurity: 0.062,
            medicare: 0.0145,
            additionalMedicare: 0.009, // Additional 0.9% on wages over $200k
            socialSecurityWageBase: 176100 // 2025 wage base limit
        };

        // State tax rates (simplified - some states have more complex calculations)
        this.stateTaxRates = {
            // No income tax states
            'AK': { type: 'none' },
            'FL': { type: 'none' },
            'NV': { type: 'none' },
            'NH': { type: 'none' }, // Eliminated interest/dividends tax in 2025
            'SD': { type: 'none' },
            'TN': { type: 'none' },
            'TX': { type: 'none' },
            'WA': { type: 'none' },
            'WY': { type: 'none' },
            
            // Flat rate states (examples)
            'CO': { type: 'flat', rate: 0.044 },
            'IL': { type: 'flat', rate: 0.0495 },
            'IN': { type: 'flat', rate: 0.030 }, // Reduced from 3.05% in 2025
            'IA': { type: 'flat', rate: 0.038 }, // New flat rate in 2025
            'KY': { type: 'flat', rate: 0.045 },
            'MI': { type: 'flat', rate: 0.0425 },
            'NC': { type: 'flat', rate: 0.045 },
            'PA': { type: 'flat', rate: 0.0307 },
            'UT': { type: 'flat', rate: 0.0485 },
            
            // Progressive states (simplified brackets - actual calculations may be more complex)
            'CA': {
                type: 'progressive',
                brackets: [
                    { min: 0, max: 10099, rate: 0.01 },
                    { min: 10099, max: 23942, rate: 0.02 },
                    { min: 23942, max: 37788, rate: 0.04 },
                    { min: 37788, max: 52455, rate: 0.06 },
                    { min: 52455, max: 66295, rate: 0.08 },
                    { min: 66295, max: 338639, rate: 0.093 },
                    { min: 338639, max: 406364, rate: 0.103 },
                    { min: 406364, max: 677278, rate: 0.113 },
                    { min: 677278, max: Infinity, rate: 0.123 }
                ]
            },
            'NY': {
                type: 'progressive',
                brackets: [
                    { min: 0, max: 8500, rate: 0.04 },
                    { min: 8500, max: 11700, rate: 0.045 },
                    { min: 11700, max: 13900, rate: 0.0525 },
                    { min: 13900, max: 80650, rate: 0.0585 },
                    { min: 80650, max: 215400, rate: 0.0625 },
                    { min: 215400, max: 1077550, rate: 0.0685 },
                    { min: 1077550, max: 5000000, rate: 0.0965 },
                    { min: 5000000, max: 25000000, rate: 0.103 },
                    { min: 25000000, max: Infinity, rate: 0.109 }
                ]
            }
        };
    }

    /**
     * Calculate federal income tax using progressive brackets
     */
    calculateFederalTax(taxableIncome, filingStatus = 'single') {
        const brackets = this.federalBrackets[filingStatus];
        if (!brackets) {
            throw new Error(`Invalid filing status: ${filingStatus}`);
        }

        let tax = 0;
        for (const bracket of brackets) {
            if (taxableIncome > bracket.min) {
                const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
                tax += taxableInBracket * bracket.rate;
            }
        }

        return Math.round(tax * 100) / 100;
    }

    /**
     * Calculate state income tax
     */
    calculateStateTax(taxableIncome, state) {
        const stateInfo = this.stateTaxRates[state];
        if (!stateInfo) {
            // Default to 5% if state not found
            return taxableIncome * 0.05;
        }

        switch (stateInfo.type) {
            case 'none':
                return 0;
            
            case 'flat':
                return taxableIncome * stateInfo.rate;
            
            case 'progressive':
                let tax = 0;
                for (const bracket of stateInfo.brackets) {
                    if (taxableIncome > bracket.min) {
                        const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
                        tax += taxableInBracket * bracket.rate;
                    }
                }
                return Math.round(tax * 100) / 100;
            
            default:
                return 0;
        }
    }

    /**
     * Calculate FICA taxes (Social Security + Medicare)
     */
    calculateFICA(grossWages) {
        // Social Security tax (6.2% up to wage base)
        const socialSecurityWages = Math.min(grossWages, this.ficaRates.socialSecurityWageBase);
        const socialSecurityTax = socialSecurityWages * this.ficaRates.socialSecurity;

        // Medicare tax (1.45% on all wages)
        const medicareTax = grossWages * this.ficaRates.medicare;

        // Additional Medicare tax (0.9% on wages over $200k)
        const additionalMedicareTax = grossWages > 200000 
            ? (grossWages - 200000) * this.ficaRates.additionalMedicare 
            : 0;

        return {
            socialSecurity: Math.round(socialSecurityTax * 100) / 100,
            medicare: Math.round(medicareTax * 100) / 100,
            additionalMedicare: Math.round(additionalMedicareTax * 100) / 100,
            total: Math.round((socialSecurityTax + medicareTax + additionalMedicareTax) * 100) / 100
        };
    }

    /**
     * Get standard deduction for filing status
     */
    getStandardDeduction(filingStatus) {
        return this.standardDeductions[filingStatus] || this.standardDeductions.single;
    }

    /**
     * Calculate effective tax rate
     */
    calculateEffectiveRate(totalTax, grossIncome) {
        return grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
    }

    /**
     * Calculate marginal tax rate (federal + state)
     */
    calculateMarginalRate(taxableIncome, filingStatus, state) {
        // Find federal marginal rate
        const federalBrackets = this.federalBrackets[filingStatus];
        let federalMarginalRate = 0;
        for (const bracket of federalBrackets) {
            if (taxableIncome > bracket.min) {
                federalMarginalRate = bracket.rate;
            }
        }

        // Find state marginal rate
        let stateMarginalRate = 0;
        const stateInfo = this.stateTaxRates[state];
        if (stateInfo) {
            switch (stateInfo.type) {
                case 'flat':
                    stateMarginalRate = stateInfo.rate;
                    break;
                case 'progressive':
                    for (const bracket of stateInfo.brackets) {
                        if (taxableIncome > bracket.min) {
                            stateMarginalRate = bracket.rate;
                        }
                    }
                    break;
            }
        }

        return (federalMarginalRate + stateMarginalRate) * 100;
    }

    /**
     * Comprehensive tax calculation
     */
    calculateAllTaxes(grossIncome, preTexDeductions, filingStatus, state) {
        // Calculate taxable income
        const standardDeduction = this.getStandardDeduction(filingStatus);
        const taxableIncome = Math.max(0, grossIncome - preTexDeductions - standardDeduction);

        // Calculate taxes
        const federalTax = this.calculateFederalTax(taxableIncome, filingStatus);
        const stateTax = this.calculateStateTax(taxableIncome, state);
        const fica = this.calculateFICA(grossIncome - preTexDeductions);

        const totalTax = federalTax + stateTax + fica.total;
        const netIncome = grossIncome - preTexDeductions - totalTax;

        return {
            grossIncome,
            preTexDeductions,
            standardDeduction,
            taxableIncome,
            federalTax,
            stateTax,
            fica,
            totalTax,
            netIncome,
            effectiveRate: this.calculateEffectiveRate(totalTax, grossIncome),
            marginalRate: this.calculateMarginalRate(taxableIncome, filingStatus, state)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaxCalculator;
} else {
    window.TaxCalculator = TaxCalculator;
}