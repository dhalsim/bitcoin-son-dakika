#!/usr/bin/env node

// Test script to verify SSG data fetching works
async function testSSGDataFetch() {
  console.log('Testing SSG data fetch...');
  
  try {
    // Import the SSG data function
    const { fetchSSGData } = await import('../src/lib/ssg-data.ts');
    
    console.log('Starting fetch...');
    const startTime = Date.now();
    
    const ssgData = await fetchSSGData();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('\n=== SSG Data Fetch Results ===');
    console.log(`Duration: ${duration}ms`);
    console.log(`News items: ${ssgData.news.length}`);
    console.log(`Articles: ${ssgData.articles.length}`);
    console.log(`Last updated: ${new Date(ssgData.lastUpdated).toLocaleString()}`);
    
    if (ssgData.news.length > 0) {
      console.log('\n=== Sample News Item ===');
      const sampleNews = ssgData.news[0];
      console.log(`Title: ${sampleNews.title}`);
      console.log(`Category: ${sampleNews.category || 'N/A'}`);
      console.log(`Published: ${new Date(sampleNews.publishedAt * 1000).toLocaleString()}`);
      console.log(`Content length: ${sampleNews.content.length} chars`);
    }
    
    if (ssgData.articles.length > 0) {
      console.log('\n=== Sample Article ===');
      const sampleArticle = ssgData.articles[0];
      console.log(`Title: ${sampleArticle.title}`);
      console.log(`Category: ${sampleArticle.category || 'N/A'}`);
      console.log(`Published: ${new Date(sampleArticle.publishedAt * 1000).toLocaleString()}`);
      console.log(`Content length: ${sampleArticle.content.length} chars`);
    }
    
    console.log('\n✅ SSG data fetch completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing SSG data fetch:', error);
    process.exit(1);
  }
}

// Run the test
testSSGDataFetch(); 