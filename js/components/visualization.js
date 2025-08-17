/**
 * Visualization Components
 * Handles all chart rendering and data visualization using Chart.js
 */

class VisualizationManager {
    constructor() {
        this.charts = {};
        this.currentView = 'combined';
        this.currentData = null;
        
        // Chart color scheme
        this.colors = {
            primary: '#3b82f6',
            green: '#10b981',
            red: '#ef4444',
            purple: '#8b5cf6',
            yellow: '#f59e0b',
            gray: '#6b7280',
            lightGray: '#d1d5db'
        };
        
        // Chart.js default configuration
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
    }

    /**
     * Initialize all charts
     */
    initializeCharts() {
        this.createIncomeChart();
        this.createExpenseChart();
        this.createCashflowChart();
        this.createProjectionChart();
        this.updateRamitBreakdown();
    }

    /**
     * Update all charts with new data
     */
    updateCharts(calculationData, viewMode = 'combined') {
        this.currentData = calculationData;
        this.currentView = viewMode;
        
        this.updateIncomeChart();
        this.updateExpenseChart();
        this.updateCashflowChart();
        this.updateProjectionChart();
        this.updateRamitBreakdown();
        this.updateSummaryStats();
    }

    /**
     * Create income breakdown chart (donut chart)
     */
    createIncomeChart() {
        const ctx = document.getElementById('incomeChart');
        if (!ctx) return;

        this.charts.income = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Take Home Pay', 'Federal Tax', 'State Tax', 'FICA Taxes'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        this.colors.green,
                        this.colors.red,
                        this.colors.purple,
                        this.colors.yellow
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = this.formatCurrency(context.parsed);
                                const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Create expense breakdown chart (horizontal bar chart)
     */
    createExpenseChart() {
        const ctx = document.getElementById('expenseChart');
        if (!ctx) return;

        this.charts.expense = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Fixed Costs', 'Investments', 'Savings', 'Guilt-Free'],
                datasets: [{
                    label: 'Monthly Amount',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        this.colors.red,
                        this.colors.green,
                        this.colors.primary,
                        this.colors.purple
                    ],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${this.formatCurrency(context.parsed.x)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value, 0)
                        }
                    }
                }
            }
        });
    }

    /**
     * Create 12-month cash flow chart (line chart)
     */
    createCashflowChart() {
        const ctx = document.getElementById('cashflowChart');
        if (!ctx) return;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        this.charts.cashflow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Net Income',
                        data: new Array(12).fill(0),
                        borderColor: this.colors.green,
                        backgroundColor: this.colors.green + '20',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: new Array(12).fill(0),
                        borderColor: this.colors.red,
                        backgroundColor: this.colors.red + '20',
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Net Cash Flow',
                        data: new Array(12).fill(0),
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primary + '20',
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value, 0)
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Update income chart with current data
     */
    updateIncomeChart() {
        if (!this.charts.income || !this.currentData) return;

        let incomeData, taxData;
        
        if (this.currentView === 'combined') {
            incomeData = this.currentData.household.netIncome;
            taxData = this.currentData.household.totalTaxes;
        } else {
            const personData = this.currentData[this.currentView];
            incomeData = personData.netAnnual;
            taxData = personData.totalTax;
        }

        // Break down tax data
        const person1 = this.currentData.person1;
        const person2 = this.currentData.person2;
        const federalTax = (person1.federalTax || 0) + (person2.federalTax || 0);
        const stateTax = (person1.stateTax || 0) + (person2.stateTax || 0);
        const ficaTax = (person1.fica.total || 0) + (person2.fica.total || 0);

        if (this.currentView !== 'combined') {
            const personData = this.currentData[this.currentView];
            this.charts.income.data.datasets[0].data = [
                personData.netAnnual,
                personData.federalTax,
                personData.stateTax,
                personData.fica.total
            ];
        } else {
            this.charts.income.data.datasets[0].data = [
                incomeData,
                federalTax,
                stateTax,
                ficaTax
            ];
        }

        this.charts.income.update();
    }

    /**
     * Update expense chart with current data
     */
    updateExpenseChart() {
        if (!this.charts.expense || !this.currentData) return;

        const expenseData = this.currentData.expenses.breakdown;
        
        this.charts.expense.data.datasets[0].data = [
            expenseData.fixedCosts,
            expenseData.investments,
            expenseData.savings,
            expenseData.guiltFreeSpending
        ];

        this.charts.expense.update();
    }

    /**
     * Update cash flow chart with projected data
     */
    updateCashflowChart() {
        if (!this.charts.cashflow || !this.currentData) return;

        const monthlyNet = this.currentData.household.monthlyNetIncome;
        const monthlyExpenses = this.currentData.expenses.total;
        const monthlyCashFlow = monthlyNet - monthlyExpenses;

        // Create 12 months of data (could be enhanced with seasonal variations)
        const netIncomeData = new Array(12).fill(monthlyNet);
        const expenseData = new Array(12).fill(monthlyExpenses);
        const cashFlowData = new Array(12).fill(monthlyCashFlow);

        this.charts.cashflow.data.datasets[0].data = netIncomeData;
        this.charts.cashflow.data.datasets[1].data = expenseData;
        this.charts.cashflow.data.datasets[2].data = cashFlowData;

        this.charts.cashflow.update();
    }

    /**
     * Update Ramit's conscious spending breakdown bars
     */
    updateRamitBreakdown() {
        if (!this.currentData) return;

        const ramitData = this.currentData.ramitBreakdown;
        
        // Update fixed costs bar
        this.updateCategoryBar('fixedCosts', ramitData.fixedCosts);
        this.updateCategoryBar('investments', ramitData.investments);
        this.updateCategoryBar('savings', ramitData.savings);
        this.updateCategoryBar('guiltFreeSpending', ramitData.guiltFreeSpending);
    }

    /**
     * Update individual category bar
     */
    updateCategoryBar(categoryName, categoryData) {
        const bar = document.getElementById(`${categoryName}Bar`);
        const value = document.getElementById(`${categoryName}Value`);
        
        if (bar && value) {
            const percentage = Math.min(categoryData.percentage, 100);
            bar.style.width = `${percentage}%`;
            value.textContent = `${percentage.toFixed(1)}%`;
            
            // Color coding based on target ranges
            if (this.isWithinTarget(categoryData)) {
                bar.style.backgroundColor = this.colors.green;
            } else if (percentage > categoryData.target.max) {
                bar.style.backgroundColor = this.colors.red;
            } else {
                bar.style.backgroundColor = this.colors.yellow;
            }
        }
    }

    /**
     * Check if category is within target range
     */
    isWithinTarget(categoryData) {
        const percentage = categoryData.percentage;
        return percentage >= categoryData.target.min && percentage <= categoryData.target.max;
    }

    /**
     * Update summary statistics
     */
    updateSummaryStats() {
        if (!this.currentData) return;

        const summary = this.currentData.summary;
        
        this.updateStatElement('monthlyNetIncome', summary.monthlyNetIncome);
        this.updateStatElement('monthlyExpenses', summary.monthlyExpenses);
        this.updateStatElement('monthlySurplus', summary.monthlySurplus);
        this.updateStatElement('savingsRate', summary.savingsRate, true);
    }

    /**
     * Update individual stat element
     */
    updateStatElement(elementId, value, isPercentage = false) {
        const element = document.getElementById(elementId);
        if (element) {
            if (isPercentage) {
                element.textContent = `${value.toFixed(1)}%`;
                element.className = `stat-value ${value >= 20 ? 'positive' : value >= 10 ? 'neutral' : 'negative'}`;
            } else {
                element.textContent = this.formatCurrency(value);
                element.className = `stat-value ${value >= 0 ? 'positive' : 'negative'}`;
            }
        }
    }

    /**
     * Create scenario comparison chart
     */
    createScenarioComparisonChart(scenarios) {
        const ctx = document.getElementById('scenarioComparisonChart');
        if (!ctx) return;

        const scenarioNames = Object.keys(scenarios);
        const datasets = [
            {
                label: 'Monthly Net Income',
                data: scenarioNames.map(name => scenarios[name].monthlyNetIncome),
                backgroundColor: this.colors.green + '80',
                borderColor: this.colors.green,
                borderWidth: 2
            },
            {
                label: 'Monthly Expenses',
                data: scenarioNames.map(name => scenarios[name].monthlyExpenses),
                backgroundColor: this.colors.red + '80',
                borderColor: this.colors.red,
                borderWidth: 2
            },
            {
                label: 'Monthly Surplus',
                data: scenarioNames.map(name => scenarios[name].monthlySurplus),
                backgroundColor: this.colors.primary + '80',
                borderColor: this.colors.primary,
                borderWidth: 2
            }
        ];

        if (this.charts.scenarioComparison) {
            this.charts.scenarioComparison.destroy();
        }

        this.charts.scenarioComparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: scenarioNames,
                datasets: datasets
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value, 0)
                        }
                    }
                }
            }
        });
    }

    /**
     * Create projection chart for 12-month financial projection
     */
    createProjectionChart() {
        const ctx = document.getElementById('projectionChart');
        if (!ctx) return;

        this.charts.projection = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [
                    {
                        label: 'Net Income',
                        data: new Array(12).fill(0),
                        backgroundColor: this.colors.green + '20',
                        borderColor: this.colors.green,
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'Total Expenses',
                        data: new Array(12).fill(0),
                        backgroundColor: this.colors.red + '20',
                        borderColor: this.colors.red,
                        borderWidth: 2,
                        fill: false
                    },
                    {
                        label: 'Surplus/Deficit',
                        data: new Array(12).fill(0),
                        backgroundColor: this.colors.primary + '20',
                        borderColor: this.colors.primary,
                        borderWidth: 2,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amount ($)'
                        },
                        ticks: {
                            callback: (value) => this.formatCurrency(value, 0)
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Update projection chart with current data
     */
    updateProjectionChart() {
        if (!this.charts.projection || !this.currentData) return;

        const monthlyNet = this.currentData.household.monthlyNetIncome;
        const monthlyExpenses = this.currentData.expenses.total;
        const monthlySurplus = monthlyNet - monthlyExpenses;

        // Create 12 months of projected data
        const netIncomeData = new Array(12).fill(monthlyNet);
        const expenseData = new Array(12).fill(monthlyExpenses);
        const surplusData = new Array(12).fill(monthlySurplus);

        this.charts.projection.data.datasets[0].data = netIncomeData;
        this.charts.projection.data.datasets[1].data = expenseData;
        this.charts.projection.data.datasets[2].data = surplusData;

        this.charts.projection.update();
    }

    /**
     * Destroy all charts
     */
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }

    /**
     * Resize all charts
     */
    resizeCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.resize === 'function') {
                chart.resize();
            }
        });
    }

    /**
     * Export chart as image
     */
    exportChart(chartName, filename) {
        const chart = this.charts[chartName];
        if (!chart) return false;

        const link = document.createElement('a');
        link.download = filename || `${chartName}-chart.png`;
        link.href = chart.toBase64Image();
        link.click();
        
        return true;
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
     * Animation utilities
     */
    animateValue(element, start, end, duration = 1000) {
        const startTime = performance.now();
        const isPercentage = element.textContent.includes('%');
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * this.easeOutQuart(progress);
            
            if (isPercentage) {
                element.textContent = `${current.toFixed(1)}%`;
            } else {
                element.textContent = this.formatCurrency(current);
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * Easing function
     */
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualizationManager;
} else {
    window.VisualizationManager = VisualizationManager;
}