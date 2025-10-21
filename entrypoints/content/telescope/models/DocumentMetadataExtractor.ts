/**
 * Extract meaningful metadata from document when Readability parsing fails
 */
export function extractDocumentMetadata(doc: Document): string {
  const metadata: string[] = [];

  metadata.push('Information extracted from webpage:');

  // Title
  const title = doc.title?.trim();
  if (title) {
    metadata.push(`Title: ${title}`);
  }

  // Meta description
  const description = doc
    .querySelector('meta[name="description"]')
    ?.getAttribute('content')
    ?.trim();
  if (description) {
    metadata.push(`Description: ${description}`);
  }

  // Meta keywords
  const keywords = doc
    .querySelector('meta[name="keywords"]')
    ?.getAttribute('content')
    ?.trim();
  if (keywords) {
    metadata.push(`Keywords: ${keywords}`);
  }

  // Open Graph title
  const ogTitle = doc
    .querySelector('meta[property="og:title"]')
    ?.getAttribute('content')
    ?.trim();
  if (ogTitle && ogTitle !== title) {
    metadata.push(`OG Title: ${ogTitle}`);
  }

  // Open Graph description
  const ogDescription = doc
    .querySelector('meta[property="og:description"]')
    ?.getAttribute('content')
    ?.trim();
  if (ogDescription && ogDescription !== description) {
    metadata.push(`OG Description: ${ogDescription}`);
  }

  // Twitter Card title
  const twitterTitle = doc
    .querySelector('meta[name="twitter:title"]')
    ?.getAttribute('content')
    ?.trim();
  if (twitterTitle && twitterTitle !== title && twitterTitle !== ogTitle) {
    metadata.push(`Twitter Title: ${twitterTitle}`);
  }

  // Twitter Card description
  const twitterDescription = doc
    .querySelector('meta[name="twitter:description"]')
    ?.getAttribute('content')
    ?.trim();
  if (
    twitterDescription &&
    twitterDescription !== description &&
    twitterDescription !== ogDescription
  ) {
    metadata.push(`Twitter Description: ${twitterDescription}`);
  }

  // Article headline (h1)
  const headline = doc.querySelector('h1')?.textContent?.trim();
  if (headline && headline !== title) {
    metadata.push(`Headline: ${headline}`);
  }

  // First paragraph or lead text
  const leadText = doc.querySelector('p')?.textContent?.trim();
  if (leadText && leadText.length > 20) {
    const truncatedLead =
      leadText.length > 200 ? leadText.substring(0, 200) + '...' : leadText;
    metadata.push(`Lead: ${truncatedLead}`);
  }

  // Author information
  const author =
    doc.querySelector('meta[name="author"]')?.getAttribute('content')?.trim() ||
    doc.querySelector('[rel="author"]')?.textContent?.trim() ||
    doc.querySelector('.author')?.textContent?.trim();
  if (author) {
    metadata.push(`Author: ${author}`);
  }

  // Publication date
  const pubDate =
    doc
      .querySelector('meta[name="article:published_time"]')
      ?.getAttribute('content')
      ?.trim() ||
    doc
      .querySelector('meta[property="article:published_time"]')
      ?.getAttribute('content')
      ?.trim() ||
    doc.querySelector('time[datetime]')?.getAttribute('datetime')?.trim();
  if (pubDate) {
    metadata.push(`Published: ${pubDate}`);
  }

  // Category/Tags
  const category =
    doc
      .querySelector('meta[name="article:section"]')
      ?.getAttribute('content')
      ?.trim() ||
    doc.querySelector('.category')?.textContent?.trim() ||
    doc.querySelector('.tag')?.textContent?.trim();
  if (category) {
    metadata.push(`Category: ${category}`);
  }

  return metadata.join('\n');
}
