
import { ReviewPost, ModerationResult, ModerationConfig } from '../types';

export const moderationService = {
  /**
   * Runs the configured checks on a post.
   * In a real app, this would use the AI service. Here we mock logic.
   */
  evaluatePost: (post: ReviewPost, config: ModerationConfig): ModerationResult => {
    const checks: ModerationResult['checks'] = [];
    let score = 100;

    // 1. Brand Voice Check
    if (config.checkBrandVoice) {
      const hasHype = post.caption.includes('!') || post.caption.includes('✨');
      checks.push({
        id: 'brand_voice',
        label: 'Brand Voice',
        status: hasHype ? 'PASS' : 'WARN',
        message: hasHype ? 'Tone is energetic.' : 'Caption lacks brand energy/emojis.'
      });
      if (!hasHype) score -= 10;
    }

    // 2. Compliance Check
    if (config.checkCompliance) {
      const riskyWords = ['cure', 'medical', 'guaranteed'];
      const hasRisk = riskyWords.some(w => post.caption.toLowerCase().includes(w));
      checks.push({
        id: 'compliance',
        label: 'Compliance',
        status: hasRisk ? 'FAIL' : 'PASS',
        message: hasRisk ? 'Contains risky claims (cure, medical).' : 'No disallowed words found.'
      });
      if (hasRisk) score -= 40;
    }

    // 3. Media Check
    if (config.checkMediaPresence) {
      const hasMedia = post.media && post.media.length > 0;
      checks.push({
        id: 'media',
        label: 'Media Attachment',
        status: hasMedia ? 'PASS' : 'FAIL',
        message: hasMedia ? 'Media attached.' : 'No media found.'
      });
      if (!hasMedia) score -= 30;
    }

    // 4. Hashtag Limit
    if (config.checkHashtagLimit) {
        const count = post.hashtags.length;
        const status = count > 0 && count <= 30 ? 'PASS' : 'WARN';
        checks.push({
            id: 'hashtags',
            label: 'Hashtag Count',
            status: status,
            message: `${count} hashtags used.`
        });
        if (status === 'WARN') score -= 5;
    }

    // Determine Overall Status
    const failCount = checks.filter(c => c.status === 'FAIL').length;
    const warnCount = checks.filter(c => c.status === 'WARN').length;
    
    let overallStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (failCount > 0) overallStatus = 'FAIL';
    else if (warnCount > 0) overallStatus = 'WARN';

    return {
        overallStatus,
        score,
        checks
    };
  }
};
