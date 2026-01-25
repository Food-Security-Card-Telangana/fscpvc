# Telangana FSC PVC Card Generator ⚡

A powerful Chrome Extension to extract Food Security Card (FSC) details from the Telangana EPDS portal and generate professional, 2-sided PVC-ready cards.

## Features
- **One-Click Extraction**: Automatically pulls all family details, gas connection info, and member lists from the search page.
- **2-Sided PVC Layout**: Generates perfectly sized (330x210px) Front and Back images for ATM-sized plastic card printing.
- **Lightning View Aesthetics**: Beautiful teal/white design with high-contrast fonts for maximum readability.
- **Unified Template**: Both sides feature identical split-layouts with basic info on the left and members on the right.
- **Smart QR Code**: Encodes family data into a QR code on the back of the card for digital verification.
- **High Resolution**: Exports 6x scale PNG images for professional-grade printing.

## 🚀 Fix QR Code 404 (IMPORTANT)
If your QR code goes to a 404 page, you must enable **GitHub Pages**:
1. Go to your repository on GitHub: `purnappc9/fscPVC`.
2. Click on **Settings** (top tab).
3. Click on **Pages** (in the left sidebar).
4. Under **Build and deployment > Branch**, select `master` and click **Save**.
5. Wait 1-2 minutes for GitHub to deploy the site.

## Installation
1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.

## Usage
1. Visit the [EPDS Telangana Portal](https://epds.telangana.gov.in/).
2. Search for a Ration Card.
3. Once the details are visible, click the **TS Card Generator** icon from your browser extensions.
4. Click **Generate 2-Sided Card**.
5. Preview the result and click **Download Both Sides**.

## Technology
- HTML5 / CSS3 / JavaScript
- [html2canvas](https://html2canvas.hertzen.com/) for image generation.
- Manifest V3

## License
MIT
