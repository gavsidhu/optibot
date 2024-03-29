/**
 * Import necessary modules
 */
import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';
import { Octokit } from '@octokit/rest';
import { decrypt, encrypt } from './utils/security';
import { getKey, processFile } from './utils/helpers';

/**
 * Activate extension
 * @param {vscode.ExtensionContext} context - Extension context object
 */
export function activate(context: vscode.ExtensionContext) {
  /**
   * Register command for refactoring text
   * @param {string} optibot.refactor - Command name
   * @param {Function} async () - Async function to handle command execution
   */
  let disposableRefactor = vscode.commands.registerCommand(
    'optibot.refactor',
    async () => {
      /**
       * Authenticate user for GitHub
       * @param {string} github - Authentication provider
       * @param {string[]} user:email - Scopes required for authentication
       * @param {Object} { createIfNone: true } - Options for authentication
       */
      const session = await vscode.authentication.getSession(
        'github',
        ['user:email'],
        {
          createIfNone: true,
        }
      );

      /**
       * Create new Octokit object for GitHub API calls
       * @param {string} session.accessToken - Access token for GitHub API
       */
      const octokit = new Octokit({
        auth: session.accessToken,
      });

      /**
       * Get authenticated user's information
       */
      const user = await octokit.users.getAuthenticated();

      /**
       * Show error message if user is not authenticated
       * @param {string} Not signed in - Error message displayed
       */
      if (!session) {
        vscode.window.showErrorMessage('Not signed in');
        return;
      }

      /**
       * Execute code block if user is authenticated
       */
      if (session) {
        /**
         * Create status bar spinner for loading feedback
         * @param {string} sync~spin - Icon for spinner
         * @param {vscode.StatusBarAlignment} Left - Alignment of spinner
         */
        const spinner = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Left
        );
        spinner.text = '$(sync~spin) Refactoring...';
        spinner.show();
        // Get the current text editor
        const editor = vscode.window.activeTextEditor;

        /**
         * Show error message if no text is selected in the editor
         * @param {string} No text selected - Error message displayed
         */
        if (!editor || editor.selection.isEmpty) {
          vscode.window.showErrorMessage('No text selected');
          return;
        }

        // Get the selected text in the editor
        const selection = editor?.selection;
        const selectedText = editor?.document.getText(selection);

        try {
          /**
           * Send HTTP POST request to a local server for refactoring selected text
           * @param {string} 'api/optibot/refactor' - URL for HTTP request
           * @param {Object} {selectedText, email: user.data.email} - Request data
           * @param {Object} headers - Request headers
           * @param {string} "Content-Type": "application/json" - Request Content-Type
           */

          const key = await getKey(user.data.email as string);
          const encryptedText = encrypt(selectedText, key);

          const response = await axios.post(
            `https://www.optibot.io/api/optibot/refactor`,
            {
              selectedText: encryptedText,
              email: user.data.email,
            },
            {
              headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
              },
            }
          );

          /**
           * Dispose spinner if response is successful
           */
          if (response.statusText === 'OK') {
            spinner.dispose();
          }

          const code = decrypt(response.data.content, key);

          /**
           * Create WorkspaceEdit object and replace selected text with refactored text
           * @param {vscode.Uri} editor?.document.uri - URI of active text editor
           * @param {vscode.Range} editor?.selection - Range of selected text
           * @param {string} response.data.content - Refactored text received in response
           */
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            editor?.document.uri as vscode.Uri,
            editor?.selection as vscode.Range,
            code
          );
          await vscode.workspace.applyEdit(edit);

          /**
           * Show information message as feedback for API request success
           * @param {string} API request successful - Success message displayed
           */
          const success = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left
          );
          success.show();
          setTimeout(() => {
            success.dispose();
          }, 2500);
        } catch (error) {
          /**
           * Display error message in console
           * @param {AxiosError} error - Error object received from Axios request
           */
          spinner.dispose();
          if (axios.isAxiosError(error) && 'response' in error) {
            const axiosError = error as AxiosError;
            vscode.window.showErrorMessage(
              `Error: ${axiosError.response?.data}`
            );
          } else if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof error.response === 'object' &&
            error.response !== null &&
            'data' in error.response &&
            typeof error.response.data === 'object' &&
            error.response.data !== null
          ) {
            vscode.window.showErrorMessage(`Error: ${error.response.data}`);
          } else {
            vscode.window.showErrorMessage(`Error: ${error}`);
          }
        }
      }
    }
  );

  /**
   * Register command for documenting code
   * @param {string} optibot.document - Command name
   * @param {Function} async () - Async function to handle command execution
   */
  let disposable = vscode.commands.registerCommand(
    'optibot.document',
    async () => {
      /**
       * Authenticate user for GitHub
       * @param {string} github - Authentication provider
       * @param {string[]} user:email - Scopes required for authentication
       * @param {Object} { createIfNone: true } - Options for authentication
       */
      const session = await vscode.authentication.getSession(
        'github',
        ['user:email'],
        {
          createIfNone: true,
        }
      );

      /**
       * Create new Octokit object for GitHub API calls
       * @param {string} session.accessToken - Access token for GitHub API
       */
      const octokit = new Octokit({
        auth: session.accessToken,
      });

      /**
       * Get authenticated user's information
       */
      const user = await octokit.users.getAuthenticated();

      /**
       * Show error message if user is not authenticated
       * @param {string} You need to sign in to use Optibot - Error message displayed
       */
      if (!session) {
        vscode.window.showInformationMessage(
          'You need to sign in to use Optibot'
        );
        return;
      }

      /**
       * Execute code block if user is authenticated
       */
      if (session) {
        /**
         * Create status bar spinner for loading feedback
         * @param {string} sync~spin - Icon for spinner
         * @param {vscode.StatusBarAlignment} Left - Alignment of spinner
         */
        const spinner = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Left
        );
        spinner.text = '$(sync~spin) Documenting...';
        spinner.show();
        // Get the current text editor
        const editor = vscode.window.activeTextEditor;

        /**
         * Show error message if no text is selected in the editor
         * @param {string} No text selected - Error message displayed
         */
        if (!editor || editor.selection.isEmpty) {
          vscode.window.showErrorMessage('No text selected');
          return;
        }

        // Get the selected text in the editor
        const selection = editor?.selection;
        const selectedText = editor?.document.getText(selection);

        try {
          /**
           * Send HTTP POST request to a local server for documenting selected code
           * @param {string} 'api/optibot/document' - URL for HTTP request
           * @param {Object} {selectedText, email: user.data.email} - Request data
           * @param {Object} headers - Request headers
           * @param {string} "Content-Type": "application/json" - Request Content-Type
           */

          const key = await getKey(user.data.email as string);

          const encryptedText = encrypt(selectedText, key);

          const response = await axios.post(
            `https://www.optibot.io/api/optibot/document`,
            {
              selectedText: encryptedText,
              email: user.data.email,
            },
            {
              headers: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'Content-Type': 'application/json',
              },
            }
          );

          /**
           * Dispose spinner if response is successful
           */
          if (response.statusText === 'OK') {
            spinner.dispose();
          }
          const code = decrypt(response.data.content, key);

          /**
           * Create WorkspaceEdit object and replace selected code with documented code
           * @param {vscode.Uri} editor?.document.uri - URI of active text editor
           * @param {vscode.Range} editor?.selection - Range of selected text
           * @param {string} response.data.content - Documented code received in response
           */
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            editor?.document.uri as vscode.Uri,
            editor?.selection as vscode.Range,
            code
          );
          await vscode.workspace.applyEdit(edit);

          /**
           * Show information message as feedback for API request success
           * @param {string} Refactor successful - Success message displayed
           */
          const success = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left
          );
          success.show();
          setTimeout(() => {
            success.dispose();
          }, 2500);
        } catch (error) {
          console.log(error);
          /**
           * Display error message in console
           * @param {AxiosError} error - Error object received from Axios request
           */
          spinner.dispose();
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            vscode.window.showErrorMessage(
              `Error: ${axiosError.response?.data}`
            );
          } else if (
            typeof error === 'object' &&
            error !== null &&
            'response' in error &&
            typeof error.response === 'object' &&
            error.response !== null &&
            'data' in error.response &&
            typeof error.response.data === 'object' &&
            error.response.data !== null &&
            'message' in error.response.data
          ) {
            vscode.window.showErrorMessage(
              `Error: ${error.response.data.message}`
            );
          } else {
            vscode.window.showErrorMessage(`Error: ${error}`);
          }
        }
      }
    }
  );

  let createDocsDisposable = vscode.commands.registerCommand(
    'optibot.generateDocs',
    async () => {

      
     
    }
  );

  /**
   * Push disposables to context
   */
  context.subscriptions.push(disposable);
  context.subscriptions.push(disposableRefactor);
  context.subscriptions.push(createDocsDisposable);
}

/**
 * Deactivate extension
 */
export function deactivate() {}
