import { Redis } from '@upstash/redis';
import { NextApiRequest, NextApiResponse } from 'next';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = redisUrl && redisToken && 
  !redisUrl.includes('YOUR_') && !redisToken.includes('YOUR_');

const redis = isRedisConfigured ? new Redis({
  url: redisUrl as string,
  token: redisToken as string,
}) : null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (!redis) {
      return res.status(200).json({ status: 'Somewhere in the world' });
    }

    try {
      const currentStatus = await redis.get('current_status');
      return res.status(200).json({ 
        status: currentStatus || 'Somewhere in the world' 
      });
    } catch (error) {
      console.error('Redis error:', error);
      return res.status(200).json({ status: 'Somewhere in the world' });
    }
  }

  if (req.method === 'POST') {
    const { status, secret_token } = req.body;

    if (secret_token !== process.env.STATUS_SECRET) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!redis) {
      return res.status(503).json({ message: 'Redis not configured' });
    }

    try {
      await redis.set('current_status', status);
      await res.revalidate('/');
      return res.status(200).json({ 
        message: 'Status updated and revalidated successfully',
        status 
      });
    } catch (error) {
      console.error('Error updating status or revalidating:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
