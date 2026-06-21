import { ref } from 'vue';
import http from '../api/http';

export function useApplyQueue() {
  const queueing = ref('');

  async function addToQueue(job, source = 'user') {
    queueing.value = job.jobId;
    try {
      await http.post('/approvals/queue', {
        jobId: job.jobId,
        title: job.title,
        company: job.company,
        url: job.url,
        matchPct: job.personalMatchPct ?? job.matchPct ?? 0,
        atsType: job.atsType,
        source,
      });
      return true;
    } finally {
      queueing.value = '';
    }
  }

  return { queueing, addToQueue };
}
