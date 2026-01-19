# Privacy Policy

**Last Updated:** December 2024

## Overview

QuantLib is an open-source quantitative trading library. This privacy policy explains how we handle data when you use QuantLib.

## Data Collection

QuantLib is a **local application** that runs on your machine. We do not collect, store, or transmit any personal data.

### Local Data Storage

- **Market Data**: All market data is stored locally in your PostgreSQL database
- **Backtest Results**: All backtest results are stored locally in your database
- **User Preferences**: Preferences (like data source selection) are stored in browser localStorage (React app) or session state (Streamlit app)

### No Remote Data Collection

- QuantLib does not send any data to remote servers
- No analytics or tracking is performed
- No personal information is collected or transmitted

## Third-Party Services

QuantLib may fetch market data from third-party sources:

- **Yahoo Finance**: Free data source, no account required
- **Alpha Vantage**: Requires API key (you provide your own)
- **Polygon.io**: Requires API key (you provide your own)

These services have their own privacy policies and terms of service. QuantLib does not share any data with these services beyond the API requests necessary to fetch market data.

## Your Responsibilities

- You are responsible for securing your database and API keys
- You are responsible for complying with data source terms of service
- You control all data stored locally on your system

## Changes to This Policy

We may update this privacy policy from time to time. Changes will be reflected in this document with an updated "Last Updated" date.

## Contact

For questions about privacy, please open an issue on the [GitHub repository](https://github.com/DonkeyKong1021/quant_library/issues).
