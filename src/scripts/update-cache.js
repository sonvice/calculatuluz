import { updateCache } from '../lib/cache';

const run = async () => {
  try {
    await updateCache();
    console.log('Cache updated successfully');
  } catch (error) {
    console.error('Cache update failed:', error);
  }
};

run();