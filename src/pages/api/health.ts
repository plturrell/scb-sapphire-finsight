import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: 'SCB Sapphire FinSight',
    version: '1.0.0'
  });
}