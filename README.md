# Conscious Spending Planner

A personal finance planning tool built around Ramit Sethi's Conscious Spending Plan principles. Plan your household finances with your partner, compare different scenarios, and visualize your progress toward financial goals.

## Features

- **Dual-Person Financial Planning**: Model income and expenses for both partners individually or combined
- **Ramit's Conscious Spending Framework**: Built around the 4-category system (Fixed Costs, Investments, Savings, Guilt-Free Spending)
- **Scenario Planning**: Create and compare multiple financial scenarios (baseline, optimistic, conservative)
- **Tax Calculations**: Accurate 2025 federal and state tax calculations with standard deductions
- **Interactive Visualizations**: Charts and graphs powered by Chart.js
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Data Persistence**: Saves scenarios locally in your browser
- **Export/Import**: Backup and share scenarios as JSON files

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js for data visualization
- **Storage**: localStorage for data persistence
- **Deployment**: GitHub Pages compatible
- **Tax Engine**: Custom 2025 tax calculation engine

## Project Structure

```
conscious-spending/
├── index.html                 # Main application page
├── css/
│   ├── main.css              # Core styles and responsive layout
│   └── components.css        # Component-specific styles
├── js/
│   ├── core/
│   │   ├── calculator.js     # Income/expense calculation engine
│   │   └── scenario-manager.js # Scenario management
│   ├── components/
│   │   └── visualization.js  # Chart and visualization management
│   ├── utils/
│   │   ├── tax-calculator.js # 2025 tax calculation engine
│   │   └── storage.js        # localStorage management
│   └── main.js               # Main application controller
├── data/
│   ├── scenarios/            # Sample scenario configurations
│   │   ├── baseline.json
│   │   ├── optimistic.json
│   │   └── conservative.json
│   └── templates/
│       └── ramit-conscious-spending.json # Framework template
└── README.md
```

## Getting Started

### Local Development

1. Clone or download this repository
2. Open `index.html` in a modern web browser
3. Start planning your finances!

### GitHub Pages Deployment

1. Fork this repository
2. Go to Settings > Pages
3. Select "Deploy from a branch" and choose `main`
4. Your site will be available at `https://yourusername.github.io/conscious-spending`

## Usage Guide

### 1. Scenario Management

- **Baseline Scenario**: Your current financial situation
- **Optimistic Scenario**: Higher income/better financial outcomes
- **Conservative Scenario**: Lower income/tighter budget planning

Switch between scenarios using the dropdown in the header.

### 2. View Modes

- **Combined View**: See household totals for both partners
- **Individual Views**: Focus on one partner's finances at a time

### 3. Ramit's Conscious Spending Categories

**Fixed Costs (50-60% of take-home pay)**
- Housing: rent, utilities, insurance
- Transportation: car payments, insurance, gas
- Essentials: groceries, phone, internet
- Debt payments: minimum payments on all debts

**Investments (10% of take-home pay)**
- 401(k) contributions (especially employer match)
- IRA contributions
- Taxable brokerage accounts

**Savings (5-10% of take-home pay)**
- Emergency fund (3-6 months expenses)
- Short-term goals: vacation, gifts
- Medium-term goals: house down payment

**Guilt-Free Spending (20-35% of take-home pay)**
- Dining out and entertainment
- Hobbies and personal interests
- Shopping and miscellaneous fun

### 4. Tax Calculations

The tool automatically calculates:
- Federal income tax (2025 brackets)
- State income tax (varies by state)
- FICA taxes (Social Security + Medicare)
- Take-home pay after all deductions

## Customization

### Adding New Scenarios

Create a new JSON file in `data/scenarios/` following the structure of existing scenarios, or use the in-app scenario manager.

### Modifying Tax Calculations

Update `js/utils/tax-calculator.js` to add new states or modify tax rates.

### Styling

Customize the appearance by modifying the CSS custom properties in `css/main.css`:

```css
:root {
    --primary-green: #10b981;
    --primary-red: #ef4444;
    --primary-blue: #3b82f6;
    /* ... more variables */
}
```

## Browser Compatibility

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Data Privacy

All financial data is stored locally in your browser using localStorage. No data is sent to external servers.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this for personal or commercial purposes.

## Acknowledgments

- Based on Ramit Sethi's "I Will Teach You to Be Rich" conscious spending principles
- Tax calculations based on 2025 IRS guidelines
- Built with Chart.js for visualizations

## Support

For questions or issues:
1. Check the browser console for error messages
2. Ensure localStorage is enabled in your browser
3. Try refreshing the page or clearing browser data
4. Open an issue on GitHub for bugs or feature requests