import { tool } from 'ai';
import { z } from 'zod';
import { Vercel } from '@vercel/sdk';


const vercel = new Vercel({ bearerToken: process.env.AI_GATEWAY_API_KEY });

export const vercelTools = {
  deployTool:tool({
  description: 'Crea un nuovo deploy dinamico su Vercel per un repository Git.',
  inputSchema: z.object({
    projectName: z.string().describe('Il nome del progetto su Vercel'),
    branch: z.string().default('main').describe('Il branch Git da buildare'),
    organiz: z.string().describe('Nome org su Vercel'),
    nomeRepo: z.string().describe('Nome repo su Vercel')
  }),
  execute: async ({ projectName, branch,organiz ,nomeRepo}) => {
    
    const deployResponse = await vercel.deployments.createDeployment({
      requestBody: {
        name: projectName,
        target: 'production',
        gitSource: {
          type: 'github',
          repo: nomeRepo,
          org: organiz,
          ref: branch,
        },
      },
    });

    return { 
      status: 'initiated', 
      deploymentId: deployResponse.id
    };
  },
})
}