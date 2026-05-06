import * as vscode from 'vscode';
import { PetJudgeSidebarProvider } from './sidebarProvider';

let sidebarProvider: PetJudgeSidebarProvider | undefined;
let isActive = true;

export function activate(context: vscode.ExtensionContext) {
  console.log('Pet Judge is sniffing your code... 🐾');

  sidebarProvider = new PetJudgeSidebarProvider(context.extensionUri);

  // Register sidebar webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'petJudge.sidebarView',
      sidebarProvider
    )
  );

  // Watch for task failures (npm run, build tasks, etc.)
  context.subscriptions.push(
    vscode.tasks.onDidEndTaskProcess(e => {
      if (!isActive) { return; }
      if (e.exitCode !== undefined && e.exitCode !== 0) {
        triggerPoop();
      }
    })
  );

  // Watch terminal exit codes (when a terminal panel is closed)
  context.subscriptions.push(
    vscode.window.onDidCloseTerminal(terminal => {
      if (!isActive) { return; }
      if (
        terminal.exitStatus &&
        terminal.exitStatus.code !== undefined &&
        terminal.exitStatus.code !== 0
      ) {
        triggerPoop();
      }
    })
  );

  // Watch for individual command failures INSIDE the terminal!
  context.subscriptions.push(
    vscode.window.onDidEndTerminalShellExecution(e => {
      if (!isActive) { return; }
      if (e.exitCode !== undefined && e.exitCode !== 0) {
        triggerPoop();
      }
    })
  );

  // Watch for new diagnostic errors (lint / compile errors)
  let lastErrorCount = 0;
  context.subscriptions.push(
    vscode.languages.onDidChangeDiagnostics(() => {
      if (!isActive) { return; }
      const allDiagnostics = vscode.languages.getDiagnostics();
      let errorCount = 0;
      for (const [, diags] of allDiagnostics) {
        errorCount += diags.filter(
          d => d.severity === vscode.DiagnosticSeverity.Error
        ).length;
      }
      // Only trigger when errors newly appear (was 0, now > 0)
      if (errorCount > 0 && lastErrorCount === 0) {
        triggerPoop();
      }
      lastErrorCount = errorCount;
    })
  );

  // Manual test trigger
  context.subscriptions.push(
    vscode.commands.registerCommand('petJudge.triggerPoop', () => {
      triggerPoop();
    })
  );

  // Toggle on/off
  context.subscriptions.push(
    vscode.commands.registerCommand('petJudge.toggleActive', () => {
      isActive = !isActive;
      vscode.window.showInformationMessage(
        isActive ? '🐾 Pet Judge is on duty.' : '💤 Pet Judge is napping.'
      );
    })
  );
}

let lastPoopTime = 0;

function triggerPoop() {
  const now = Date.now();
  if (now - lastPoopTime < 3000) { 
    return; 
  }
  lastPoopTime = now;

  if (sidebarProvider) {
    sidebarProvider.triggerPoopAnimation();
  }
}

export function deactivate() {}
