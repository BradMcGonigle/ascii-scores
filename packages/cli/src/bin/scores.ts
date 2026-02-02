#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "../app.js";

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
ASCII Scores CLI - Real-time sports scores in your terminal

Usage:
  scores              Open the interactive TUI
  scores --help       Show this help message
  scores --version    Show version number

Navigation:
  1-8        Quick select a league
  ↑/↓ or j/k Navigate list
  Enter      Open selected league
  b          Go back
  q          Quit

Supported leagues:
  NHL, NFL, NBA, MLB, MLS, EPL, NCAAM, NCAAW
`);
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  console.log("ascii-scores-cli v0.1.0");
  process.exit(0);
}

// Render the Ink app
render(React.createElement(App));
