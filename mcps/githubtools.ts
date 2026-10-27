import { tool } from 'ai';
import { z } from 'zod';
import { Octokit } from '@octokit/rest';

 const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});


export const othertoolsgithub = {
    deleteFileFromGitHub: tool({
            description: 'Elimina definitivamente un file specifico da un repository GitHub.',
            inputSchema: z.object({
              owner: z.string().describe('Il proprietario del repository (username o organizzazione).'),
              repo: z.string().describe('Il nome del repository.'),
              path: z.string().describe('Il percorso del file da eliminare (es. test1.md).'),
              branch: z.string().optional().default('main').describe('La branca da cui eliminare il file.'),
            }),
            execute: async ({ owner, repo, path, branch }) => {
              try {
                // 1. Recupera lo SHA corrente del file (GitHub lo richiede per confermare l'eliminazione)
                const { data: fileData } = await octokit.repos.getContent({
                  owner,
                  repo,
                  path,
                  ref: branch,
                });
    
                if (Array.isArray(fileData) || fileData.type !== 'file') {
                  throw new Error('Il percorso specificato non corrisponde a un file valido.');
                }
    
                // 2. Esegui la cancellazione effettiva passandogli lo SHA trovato
                await octokit.repos.deleteFile({
                  owner,
                  repo,
                  path,
                  message: `chore: delete ${path} via AI Agent`,
                  sha: fileData.sha,
                  branch,
                });
    
                return {
                  success: true,
                  message: `Il file ${path} è stato eliminato con successo.`,
                };
              } catch (error: any) {
                return {
                  success: false,
                  error: error.message || 'Impossibile eliminare il file. Verifica che esista.',
                };
              }
            },
          }),
          listIssues: tool({
            description: 'Recupera la lista delle issue da una specifica repository di GitHub.',
            inputSchema: z.object({
              owner: z.string().describe('Il proprietario della repository o organizzazione GitHub.'),
              repo: z.string().describe('Il nome del repository.'),
              state: z.enum(['open', 'closed', 'all']).optional().default('open').describe('Lo stato delle issue da cercare.'),
            }),
            execute: async ({ owner, repo, state }) => {
              console.log('owner', owner);
              console.log('repo', repo);
              const { data } = await octokit.issues.listForRepo({
                owner,
                repo,
                state,
                per_page: 5,
              });
    
              return data.map(issue => ({
                id: issue.id,
                number: issue.number,
                title: issue.title,
                state: issue.state,
                body: issue.body,
              }));
            },
          }),
    
          // TOOL 2: Creazione di una nuova Issue
          createGitHubIssue: tool({
            description: 'Crea una nuova issue su una repository GitHub.',
            inputSchema: z.object({
              owner: z.string().describe('Il proprietario della repository.'),
              repo: z.string().describe('Il nome del repository.'),
              title: z.string().min(5).describe('Il titolo dell\'issue (almeno 5 caratteri).'),
              body: z.string().describe('La descrizione dettagliata del problema o del task.'),
              labels: z.array(z.string()).optional().describe('Etichette da assegnare all\'issue.'),
            }),
            execute: async ({ owner, repo, title, body, labels }) => {
              const { data } = await octokit.issues.create({
                owner,
                repo,
                title,
                body,
                labels,
              });
    
              return {
                success: true,
                issueNumber: data.number,
                url: data.html_url,
              };
            },
          }),
          closeGitHubIssue: tool({
            description: 'Crea una nuova issue su una repository GitHub.',
            inputSchema: z.object({
              owner: z.string().describe('Il proprietario del repository (username o organizzazione).'),
              repo: z.string().describe('Il nome del repository.'),
              issue_number: z.number().int().positive().describe('Il numero identificativo dell\'issue da chiudere (es. 42).'),
            }),
            execute: async ({ owner, repo, issue_number }) => {
              const { data } = await octokit.issues.update({
                owner,
                repo,
                issue_number,
                state: 'closed',
                state_reason: 'completed',
              });
    
              return {
                success: true,
                issueNumber: data.number,
                url: data.html_url,
              };
            },
          }),
}