import RainyHomepage from '../components/RainyHomepage';
import { Redis } from '@upstash/redis';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

const isRedisConfigured = redisUrl && redisToken && 
  !redisUrl.includes('YOUR_') && !redisToken.includes('YOUR_');

const redis = isRedisConfigured ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

export async function getStaticProps() {
  const defaultStatus = 'Somewhere in the world';
  
  if (!redis) {
    return {
      props: { status: defaultStatus },
      revalidate: 60,
    };
  }

  try {
    const currentStatus = await redis.get('current_status');
    const status = currentStatus || defaultStatus;
    return {
      props: { status },
      revalidate: 60,
    };
  } catch (error) {
    console.error('Redis error:', error);
    return {
      props: { status: defaultStatus },
      revalidate: 60,
    };
  }
}

export default function Home({ status }) {
  return <RainyHomepage status={status} />;
}