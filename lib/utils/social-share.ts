export interface ShareOptions {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  via?: string; // Twitter handle
}

export class SocialShare {
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }

  static shareToTwitter(options: ShareOptions): void {
    const params = new URLSearchParams();
    params.append('url', options.url);
    params.append('text', options.title);
    
    if (options.description) {
      params.append('text', `${options.title}\n${options.description}`);
    }
    
    if (options.hashtags && options.hashtags.length > 0) {
      params.append('hashtags', options.hashtags.join(','));
    }
    
    if (options.via) {
      params.append('via', options.via);
    }

    const shareUrl = `https://twitter.com/intent/tweet?${params.toString()}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  static shareToFacebook(options: ShareOptions): void {
    const params = new URLSearchParams();
    params.append('u', options.url);
    
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  static shareToWhatsApp(options: ShareOptions): void {
    const text = options.description 
      ? `${options.title}\n${options.description}\n${options.url}`
      : `${options.title}\n${options.url}`;
    
    const params = new URLSearchParams();
    params.append('text', text);
    
    const shareUrl = `https://wa.me/?${params.toString()}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  static shareToLinkedIn(options: ShareOptions): void {
    const params = new URLSearchParams();
    params.append('url', options.url);
    params.append('title', options.title);
    
    if (options.description) {
      params.append('summary', options.description);
    }
    
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  static shareViaEmail(options: ShareOptions): void {
    const subject = encodeURIComponent(options.title);
    const body = encodeURIComponent(
      options.description 
        ? `${options.description}\n\n${options.url}`
        : options.url
    );
    
    const shareUrl = `mailto:?subject=${subject}&body=${body}`;
    window.open(shareUrl);
  }

  static async shareViaNativeAPI(options: ShareOptions): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title,
          text: options.description,
          url: options.url,
        });
        return true;
      } catch (error) {
        console.error('Native sharing failed:', error);
        return false;
      }
    }
    return false;
  }

  static canUseNativeShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  static generateShareText(destination: string, duration: string, highlights?: string[]): string {
    let text = `🌟 Check out my travel guide for ${destination}! `;
    
    if (duration) {
      text += `Perfect for a ${duration} trip. `;
    }
    
    if (highlights && highlights.length > 0) {
      text += `\n\nHighlights:\n${highlights.map(h => `• ${h}`).join('\n')}`;
    }
    
    text += '\n\nCreated with Scout Travel ✈️';
    
    return text;
  }
}