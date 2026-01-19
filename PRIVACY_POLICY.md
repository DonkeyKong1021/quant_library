# Privacy Policy

**Last Updated:** December 2024

## Overview

QuantLib is an open-source quantitative trading library. This privacy policy explains how we handle data when you use QuantLib.

## Data Collection

QuantLib is a **local application** that runs on your machine. We do not collect, store, or transmit any personal data to remote servers.

### Local Data Storage

QuantLib stores data locally on your system:

- **Market Data**: All market data is stored locally in your PostgreSQL database
- **Backtest Results**: All backtest results are stored locally in your database
- **User Preferences**: Preferences (like data source selection) are stored in browser localStorage (React app) or session state (Streamlit app)
- **Recent Symbols**: Recently accessed symbols are stored in browser localStorage (React app only)

### No Remote Data Collection

- QuantLib does not send any data to remote servers
- No analytics or tracking is performed
- No personal information is collected or transmitted
- No cookies are used for tracking purposes
- No third-party analytics services are integrated

## Third-Party Services

QuantLib may fetch market data from third-party sources when you explicitly request it:

- **Yahoo Finance**: Free data source, no account required
- **Alpha Vantage**: Requires API key (you provide your own)
- **Polygon.io**: Requires API key (you provide your own)

These services have their own privacy policies and terms of service. QuantLib does not share any data with these services beyond the API requests necessary to fetch market data. We recommend reviewing each service's privacy policy:

- [Yahoo Finance Privacy Policy](https://policies.yahoo.com/us/en/yahoo/privacy/index.htm)
- [Alpha Vantage Terms](https://www.alphavantage.co/support/#terms-of-use)
- [Polygon.io Privacy Policy](https://polygon.io/privacy)

## Data Security

Since QuantLib runs locally:

- All data remains on your machine
- You are responsible for securing your PostgreSQL database
- You are responsible for securing your API keys
- No data is transmitted to QuantLib developers or servers

## Your Rights and Responsibilities

- You control all data stored locally on your system
- You can delete your database or clear browser storage at any time
- You are responsible for securing your database and API keys
- You are responsible for complying with data source terms of service
- You can export or delete your data at any time

## Browser Storage (React App Only)

The React web application uses browser localStorage to store:

- **Recent Symbols**: List of recently accessed stock symbols (max 10)
- **Data Source Preference**: Your preferred data source selection

This data is stored locally in your browser and is never transmitted to any server. You can clear this data at any time through your browser settings.

## Children's Privacy

QuantLib is not intended for use by children under the age of 13. We do not knowingly collect personal information from children.

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in this document with an updated "Last Updated" date. We encourage you to review this policy periodically.

## Open Source Notice

QuantLib is open-source software. The source code is publicly available and can be audited by anyone. This transparency allows you to verify our privacy claims.

## Contact

For questions about privacy, please open an issue on the [GitHub repository](https://github.com/DonkeyKong1021/quant_library/issues).
